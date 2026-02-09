/**
 * One-off migration script to convert Blob-hosted JPG/PNG image URLs to WebP.
 *
 * - Keeps original files in Blob storage.
 * - Uploads converted WebP files and updates Prisma URL fields.
 *
 * Usage:
 *   bun run scripts/migrate-images-to-webp.ts --dry-run
 *   bun run scripts/migrate-images-to-webp.ts --limit 50
 *   bun run scripts/migrate-images-to-webp.ts --dry-run --limit=25
 */

import "dotenv/config";
import { put } from "@vercel/blob";
import {
  buildWebpFileName,
  convertBufferToWebp,
  WEBP_CONTENT_TYPE,
} from "../src/app/lib/image-upload";
import { prisma } from "../src/app/lib/prisma";

type ModelName = "Category" | "Product" | "HeroImage" | "ProductVariant";
type SingleField = "imageUrl" | "sizeChartUrl";

type ImageReference = {
  model: ModelName;
  id: string;
  field: SingleField | "images";
  url: string;
  index?: number;
};

type SinglePatch = {
  model: ModelName;
  id: string;
  field: SingleField;
  url: string;
};

type ArrayPatch = {
  model: "Product" | "ProductVariant";
  id: string;
  urls: string[];
};

type CliOptions = {
  dryRun: boolean;
  limit?: number;
};

type CollectionResult = {
  references: ImageReference[];
  productImagesById: Map<string, string[]>;
  variantImagesById: Map<string, string[]>;
};

const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";
const MIGRATABLE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);

function parseLimit(raw: string): number {
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(
      `Invalid --limit value: "${raw}". Expected a positive integer.`,
    );
  }
  return value;
}

function parseArgs(argv: string[]): CliOptions {
  let dryRun = false;
  let limit: number | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (arg === "--limit") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error("Missing value for --limit.");
      }
      limit = parseLimit(value);
      i += 1;
      continue;
    }

    if (arg.startsWith("--limit=")) {
      limit = parseLimit(arg.split("=")[1] ?? "");
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return { dryRun, limit };
}

function isBlobJpgOrPng(url: string): boolean {
  try {
    const parsed = new URL(url);
    const isBlobHost = parsed.hostname.endsWith(BLOB_HOST_SUFFIX);
    if (!isBlobHost) return false;

    const pathname = parsed.pathname.toLowerCase();
    const extension = pathname.slice(pathname.lastIndexOf("."));
    return MIGRATABLE_EXTENSIONS.has(extension);
  } catch {
    return false;
  }
}

function getBlobPathParts(url: string): {
  folder?: string;
  originalFileName: string;
} {
  const parsed = new URL(url);
  const decodedPath = decodeURIComponent(parsed.pathname).replace(/^\/+/, "");
  const segments = decodedPath.split("/").filter(Boolean);
  const originalFileName = segments.pop() || "image.jpg";
  const folder = segments.length > 0 ? segments.join("/") : undefined;

  return { folder, originalFileName };
}

function buildMigratedFileName(sourceUrl: string): string {
  const { folder, originalFileName } = getBlobPathParts(sourceUrl);
  return buildWebpFileName(originalFileName, { folder });
}

async function collectReferences(): Promise<CollectionResult> {
  const [categories, products, heroImages, variants] = await Promise.all([
    prisma.category.findMany({
      select: { id: true, imageUrl: true },
    }),
    prisma.product.findMany({
      select: { id: true, images: true, sizeChartUrl: true },
    }),
    prisma.heroImage.findMany({
      select: { id: true, imageUrl: true },
    }),
    prisma.productVariant.findMany({
      select: { id: true, imageUrl: true, images: true },
    }),
  ]);

  const references: ImageReference[] = [];
  const productImagesById = new Map<string, string[]>();
  const variantImagesById = new Map<string, string[]>();

  for (const category of categories) {
    if (category.imageUrl) {
      references.push({
        model: "Category",
        id: category.id,
        field: "imageUrl",
        url: category.imageUrl,
      });
    }
  }

  for (const product of products) {
    if (product.sizeChartUrl) {
      references.push({
        model: "Product",
        id: product.id,
        field: "sizeChartUrl",
        url: product.sizeChartUrl,
      });
    }

    productImagesById.set(product.id, [...product.images]);
    product.images.forEach((url, index) => {
      references.push({
        model: "Product",
        id: product.id,
        field: "images",
        url,
        index,
      });
    });
  }

  for (const heroImage of heroImages) {
    references.push({
      model: "HeroImage",
      id: heroImage.id,
      field: "imageUrl",
      url: heroImage.imageUrl,
    });
  }

  for (const variant of variants) {
    if (variant.imageUrl) {
      references.push({
        model: "ProductVariant",
        id: variant.id,
        field: "imageUrl",
        url: variant.imageUrl,
      });
    }

    variantImagesById.set(variant.id, [...variant.images]);
    variant.images.forEach((url, index) => {
      references.push({
        model: "ProductVariant",
        id: variant.id,
        field: "images",
        url,
        index,
      });
    });
  }

  return {
    references: references.filter((reference) => isBlobJpgOrPng(reference.url)),
    productImagesById,
    variantImagesById,
  };
}

async function migrateUrlToWebp(sourceUrl: string): Promise<string> {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Fetch failed (${response.status}) for ${sourceUrl}`);
  }

  const sourceBuffer = Buffer.from(await response.arrayBuffer());
  const webpBuffer = await convertBufferToWebp(sourceBuffer);
  const fileName = buildMigratedFileName(sourceUrl);
  const blob = await put(fileName, webpBuffer, {
    access: "public",
    contentType: WEBP_CONTENT_TYPE,
  });

  return blob.url;
}

async function applySinglePatch(patch: SinglePatch): Promise<void> {
  switch (patch.model) {
    case "Category":
      await prisma.category.update({
        where: { id: patch.id },
        data: { imageUrl: patch.url },
      });
      return;
    case "Product":
      await prisma.product.update({
        where: { id: patch.id },
        data: { sizeChartUrl: patch.url },
      });
      return;
    case "HeroImage":
      await prisma.heroImage.update({
        where: { id: patch.id },
        data: { imageUrl: patch.url },
      });
      return;
    case "ProductVariant":
      await prisma.productVariant.update({
        where: { id: patch.id },
        data: { imageUrl: patch.url },
      });
      return;
    default:
      return;
  }
}

async function applyArrayPatch(patch: ArrayPatch): Promise<void> {
  if (patch.model === "Product") {
    await prisma.product.update({
      where: { id: patch.id },
      data: { images: patch.urls },
    });
    return;
  }

  await prisma.productVariant.update({
    where: { id: patch.id },
    data: { images: patch.urls },
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const startedAt = Date.now();

  console.log("Starting WebP migration...");
  console.log(`Mode: ${options.dryRun ? "DRY RUN" : "WRITE"}`);
  if (options.limit) {
    console.log(`Limit: ${options.limit} reference(s)`);
  }

  const { references, productImagesById, variantImagesById } =
    await collectReferences();
  const targetReferences = options.limit
    ? references.slice(0, options.limit)
    : references;
  const uniqueSourceUrlCount = new Set(targetReferences.map((ref) => ref.url))
    .size;

  console.log(`Found ${references.length} migratable reference(s).`);
  console.log(
    `Processing ${targetReferences.length} reference(s) (${uniqueSourceUrlCount} unique URL(s)).`,
  );

  if (targetReferences.length === 0) {
    console.log("No Blob-hosted JPG/PNG references found. Nothing to do.");
    return;
  }

  const convertedUrlCache = new Map<string, string>();
  const singlePatches = new Map<string, SinglePatch>();
  const arrayPatches = new Map<string, ArrayPatch>();
  const failures: Array<{ reference: ImageReference; error: string }> = [];

  let uploadedUniqueCount = 0;
  let reusedFromCacheCount = 0;

  for (const reference of targetReferences) {
    try {
      let migratedUrl = convertedUrlCache.get(reference.url);
      if (!migratedUrl) {
        if (options.dryRun) {
          migratedUrl = `[dry-run] ${buildMigratedFileName(reference.url)}`;
        } else {
          migratedUrl = await migrateUrlToWebp(reference.url);
        }

        convertedUrlCache.set(reference.url, migratedUrl);
        uploadedUniqueCount += 1;
      } else {
        reusedFromCacheCount += 1;
      }

      if (reference.field === "images") {
        const patchKey = `${reference.model}:${reference.id}:images`;
        const existingPatch = arrayPatches.get(patchKey);
        const baseUrls =
          reference.model === "Product"
            ? (productImagesById.get(reference.id) ?? [])
            : (variantImagesById.get(reference.id) ?? []);

        const patch =
          existingPatch ??
          ({
            model: reference.model,
            id: reference.id,
            urls: [...baseUrls],
          } as ArrayPatch);

        if (typeof reference.index !== "number") {
          throw new Error("Missing array index for image reference.");
        }

        patch.urls[reference.index] = migratedUrl;
        arrayPatches.set(patchKey, patch);
      } else {
        const patchKey = `${reference.model}:${reference.id}:${reference.field}`;
        singlePatches.set(patchKey, {
          model: reference.model,
          id: reference.id,
          field: reference.field,
          url: migratedUrl,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      failures.push({
        reference,
        error: message,
      });
    }
  }

  const recordPatchCount = singlePatches.size + arrayPatches.size;

  if (options.dryRun) {
    console.log("");
    console.log("Dry run summary:");
    console.log(`- References inspected: ${targetReferences.length}`);
    console.log(`- Unique source URLs to convert: ${uploadedUniqueCount}`);
    console.log(`- Cache reuses: ${reusedFromCacheCount}`);
    console.log(`- Records that would be updated: ${recordPatchCount}`);
    console.log(`- Failures: ${failures.length}`);
  } else {
    let recordsUpdated = 0;

    for (const patch of singlePatches.values()) {
      await applySinglePatch(patch);
      recordsUpdated += 1;
    }

    for (const patch of arrayPatches.values()) {
      await applyArrayPatch(patch);
      recordsUpdated += 1;
    }

    console.log("");
    console.log("Write summary:");
    console.log(`- References inspected: ${targetReferences.length}`);
    console.log(`- Unique source URLs converted: ${uploadedUniqueCount}`);
    console.log(`- Cache reuses: ${reusedFromCacheCount}`);
    console.log(`- Records updated: ${recordsUpdated}`);
    console.log(`- Failures: ${failures.length}`);
  }

  if (failures.length > 0) {
    console.log("");
    console.log("Failed references:");
    failures.slice(0, 20).forEach((failure, index) => {
      const { reference, error } = failure;
      console.log(
        `${index + 1}. ${reference.model}.${reference.field} (${reference.id}) -> ${reference.url}`,
      );
      console.log(`   ${error}`);
    });

    if (failures.length > 20) {
      console.log(`...and ${failures.length - 20} more failure(s).`);
    }

    if (!options.dryRun) {
      process.exitCode = 1;
    }
  }

  const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(2);
  console.log("");
  console.log(`Done in ${elapsedSeconds}s.`);
}

main()
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Migration failed:", message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
