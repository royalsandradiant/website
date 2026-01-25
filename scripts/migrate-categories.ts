/**
 * One-off migration script to:
 * 1. Create Category records from legacy categoryDefinitions
 * 2. Migrate Product.category/subcategory strings to Product.categoryId
 * 
 * Run with: bun run scripts/migrate-categories.ts
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const connectionString = process.env.POSTGRES_PRISMA_URL_NO_SSL || process.env.DATABASE_URL;

const pool = new pg.Pool({ 
  connectionString,
  max: 10,
  ssl: false, // Simplified for migration script
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

// Legacy category definitions (matches src/app/lib/constants.ts)
const categoryDefinitions: Record<string, { description: string; subcategories: string[] }> = {
  dresses: {
    description: 'Embrace the elegance of traditional Indian dresses, inspired by centuries-old craftsmanship and vibrant cultural motifs. Perfect for weddings, festivals like Diwali, and everyday grace, our collection celebrates the artistry of sarees, lehengas, and more.',
    subcategories: ['Sarees', 'Lehengas', 'Salwar Kameez', 'Anarkali Suits', 'Kurtis', 'Gowns'],
  },
  necklaces: {
    description: 'Discover the royal allure of Indian necklaces, handcrafted with intricate details from Mughal-era designs to temple-inspired motifs. These pieces, often worn during auspicious occasions like weddings, blend gold, gems, and symbolism for timeless beauty.',
    subcategories: ['Mangalsutra', 'Kundan', 'Polki', 'Temple Jewelry', 'Rani Haar', 'Pearl Sets'],
  },
  bracelets: {
    description: 'Adorn your wrists with the rhythmic charm of Indian bracelets, drawing from bridal traditions and folk artistry. From sturdy Kadas symbolizing strength to delicate Choodas for celebrations, each piece echoes the vibrancy of Indian heritage.',
    subcategories: ['Kada', 'Chooda', 'Glass Bangles', 'Metal Bangles', 'Charm Bracelets', 'Beaded'],
  },
  earrings: {
    description: 'Sparkle with the intricate elegance of Indian earrings, influenced by ancient Rajasthani and South Indian styles. Jhumkas swaying to festive dances or subtle studs for daily poise—these designs capture the soul of Indian adornment.',
    subcategories: ['Jhumkas', 'Chandbalis', 'Kundans', 'Studs', 'Hoops', 'Dangles'],
  },
};

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  console.log('Starting category migration...\n');

  // Map to track category slugPath -> id for product assignment
  const categoryMap = new Map<string, string>();

  // Step 1: Create parent categories and subcategories
  let sortOrder = 0;
  for (const [key, def] of Object.entries(categoryDefinitions)) {
    const parentSlug = key; // already lowercase
    const parentName = key.charAt(0).toUpperCase() + key.slice(1);
    
    // Create parent category
    const parent = await prisma.category.upsert({
      where: { slugPath: parentSlug },
      update: {
        name: parentName,
        description: def.description,
        sortOrder: sortOrder++,
      },
      create: {
        name: parentName,
        slug: parentSlug,
        slugPath: parentSlug,
        description: def.description,
        isVisible: true,
        sortOrder: sortOrder - 1,
      },
    });
    
    categoryMap.set(parentSlug, parent.id);
    console.log(`Created/Updated parent category: ${parentName} (${parent.id})`);

    // Create subcategories
    let subSortOrder = 0;
    for (const subName of def.subcategories) {
      const subSlug = slugify(subName);
      const subSlugPath = `${parentSlug}/${subSlug}`;
      
      const sub = await prisma.category.upsert({
        where: { slugPath: subSlugPath },
        update: {
          name: subName,
          sortOrder: subSortOrder++,
        },
        create: {
          name: subName,
          slug: subSlug,
          slugPath: subSlugPath,
          parentId: parent.id,
          isVisible: true,
          sortOrder: subSortOrder - 1,
        },
      });
      
      categoryMap.set(subSlugPath, sub.id);
      console.log(`  Created/Updated subcategory: ${subName} (${sub.id})`);
    }
  }

  console.log('\nCategory structure created. Total categories:', categoryMap.size);

  // Step 2: Migrate products
  const products = await prisma.product.findMany();
  console.log(`\nMigrating ${products.length} products...`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const product of products) {
    // Skip if already migrated
    if (product.categoryId) {
      console.log(`  Skipping product ${product.id} - already has categoryId`);
      skippedCount++;
      continue;
    }

    // Read from legacy string fields
    const legacyCat = product.category;
    const legacySub = product.subcategory;
    
    if (!legacyCat) {
      console.log(`  Skipping product ${product.id} - no category`);
      skippedCount++;
      continue;
    }

    const normalizedCat = legacyCat.toLowerCase();
    
    // Try to find subcategory match first, then fall back to parent
    let targetCategoryId: string | null = null;
    
    if (legacySub) {
      const subSlug = slugify(legacySub);
      const subPath = `${normalizedCat}/${subSlug}`;
      targetCategoryId = categoryMap.get(subPath) || null;
    }
    
    // Fall back to parent category if no subcategory match
    if (!targetCategoryId) {
      targetCategoryId = categoryMap.get(normalizedCat) || null;
    }

    if (targetCategoryId) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          categoryId: targetCategoryId,
        },
      });
      migratedCount++;
      console.log(`  Migrated: ${product.name} -> categoryId: ${targetCategoryId}`);
    } else {
      console.log(`  WARNING: No category match for product ${product.id} (${legacyCat}/${legacySub})`);
      skippedCount++;
    }
  }

  console.log(`\nMigration complete!`);
  console.log(`  Migrated: ${migratedCount}`);
  console.log(`  Skipped: ${skippedCount}`);
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
