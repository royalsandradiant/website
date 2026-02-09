import { randomUUID } from "node:crypto";
import path from "node:path";
import sharp from "sharp";

export const WEBP_CONTENT_TYPE = "image/webp";
export const DEFAULT_WEBP_QUALITY = 82;
export const SUPPORTED_IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
]);
export const SUPPORTED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const INVALID_IMAGE_TYPE_MESSAGE =
  "Only JPG, PNG, or WebP images are supported.";
const EMPTY_IMAGE_MESSAGE = "Image file is empty.";

type UploadableImage = Pick<File, "name" | "type" | "size" | "arrayBuffer">;

export class ImageUploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageUploadValidationError";
  }
}

function getExtension(fileName: string): string {
  return path.extname(fileName).toLowerCase();
}

function sanitizeBaseName(fileName: string): string {
  const withoutExt = path.basename(fileName, getExtension(fileName));
  const sanitized = withoutExt
    .trim()
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return sanitized || "image";
}

function normalizeFolder(folder?: string): string {
  if (!folder) return "";
  return folder.replace(/^\/+|\/+$/g, "");
}

export function isSupportedImageFile(
  file: Pick<File, "name" | "type">,
): boolean {
  const normalizedType = file.type.toLowerCase();
  if (normalizedType && SUPPORTED_IMAGE_MIME_TYPES.has(normalizedType)) {
    return true;
  }
  return SUPPORTED_IMAGE_EXTENSIONS.has(getExtension(file.name));
}

export function buildWebpFileName(
  originalName: string,
  options: { folder?: string; id?: string } = {},
): string {
  const id = options.id ?? randomUUID();
  const baseName = sanitizeBaseName(originalName);
  const folder = normalizeFolder(options.folder);
  const fileName = `${id}-${baseName}.webp`;

  return folder ? `${folder}/${fileName}` : fileName;
}

export async function convertBufferToWebp(
  inputBuffer: Buffer,
  quality = DEFAULT_WEBP_QUALITY,
): Promise<Buffer> {
  return sharp(inputBuffer, { failOn: "none" })
    .rotate()
    .webp({ quality })
    .toBuffer();
}

export async function prepareWebpUploadFromFile(
  file: UploadableImage,
  options: { folder?: string; quality?: number; id?: string } = {},
): Promise<{ fileName: string; buffer: Buffer; contentType: "image/webp" }> {
  if (file.size === 0) {
    throw new ImageUploadValidationError(EMPTY_IMAGE_MESSAGE);
  }

  if (!isSupportedImageFile(file)) {
    throw new ImageUploadValidationError(INVALID_IMAGE_TYPE_MESSAGE);
  }

  const sourceBuffer = Buffer.from(await file.arrayBuffer());
  const convertedBuffer = await convertBufferToWebp(
    sourceBuffer,
    options.quality ?? DEFAULT_WEBP_QUALITY,
  );

  return {
    fileName: buildWebpFileName(file.name, {
      folder: options.folder,
      id: options.id,
    }),
    buffer: convertedBuffer,
    contentType: WEBP_CONTENT_TYPE,
  };
}
