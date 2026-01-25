import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

// For Vercel build/prerender to handle self-signed certificates
if (process.env.NODE_ENV === 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const connectionString = process.env.POSTGRES_PRISMA_URL_NO_SSL || process.env.DATABASE_URL;

const isLocal = connectionString?.includes('localhost') || connectionString?.includes('127.0.0.1');

// Path to the certificate
const certPath = path.join(process.cwd(), 'src/certificates/prod-ca-2021.crt');
const hasCert = fs.existsSync(certPath);

const pool = new pg.Pool({ 
  connectionString,
  max: 10, // Limit pool size for serverless
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: isLocal ? false : {
    rejectUnauthorized: hasCert ? true : false,
    ca: hasCert ? fs.readFileSync(certPath).toString() : undefined,
  }
});

const adapter = new PrismaPg(pool);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;


