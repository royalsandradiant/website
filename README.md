# Royals and Radiant - Jewelry & Fashion Store

A modern e-commerce platform for jewelry and traditional Indian fashion, built with Next.js 16, featuring a beautiful UI, admin dashboard, and secure authentication.

## ✨ Features

- **Shop** - Browse products by category with a multi-level category system.
- **Shopping Cart** - Add items, adjust quantities, persistent cart state.
- **Combos** - Special discounts when buying multiple items together.
- **Checkout** - Stripe integration for secure payments.
- **Admin Dashboard** - Manage products, categories, view orders, and bulk upload products.
- **Authentication** - Secure login with BetterAuth.
- **Responsive Design** - Beautiful UI that works on all devices, built with Tailwind CSS and Motion.

## 🛠 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (via Prisma ORM)
- **Authentication:** BetterAuth
- **Styling:** Tailwind CSS v4
- **Animations:** Motion (Framer Motion)
- **Payments:** Stripe
- **Deployment:** Vercel

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- PostgreSQL database (local or hosted like [Supabase](https://supabase.com/), [Neon](https://neon.tech/))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd royalsandradiant
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
   
   # BetterAuth (generate with: openssl rand -base64 32)
   BETTER_AUTH_SECRET="your-secret-key-here"
   BETTER_AUTH_URL="http://localhost:3000"
   
   # Stripe
   STRIPE_SECRET_KEY="your-stripe-secret-key"
   STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"

   # Vercel Blob (for image uploads)
   BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   bunx prisma generate
   
   # Push schema to database
   bunx prisma db push
   ```

5. **Run the development server**
   ```bash
   bun run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## 👤 User Management

### Managing Users

**List all users:**
```bash
bun run db:user:list
```

**Create a new user:**
```bash
bun run scripts/manage-user.ts create <email> <password> [name]

# Example:
bun run scripts/manage-user.ts create admin@royalsandradiant.com SecurePass123 "Admin User"
```

**Update user details:**
```bash
bun run scripts/manage-user.ts update <email> --password <new-password>
bun run scripts/manage-user.ts update <email> --name "New Name"
```

**Delete a user:**
```bash
bun run scripts/manage-user.ts delete <email>
```

## 🔐 Admin Panel

Access the admin panel at `/admin` after logging in at `/login`.

**Features:**
- View and manage all products
- Manage multi-level categories
- Create new products with image upload (via Vercel Blob)
- Bulk upload products
- View and manage orders
- Configure combo discounts

## 📁 Project Structure

```
├── prisma/
│   ├── schema.prisma      # Database schema
├── scripts/
│   ├── manage-user.ts     # User management CLI
│   └── migrate-categories.ts # Category migration script
├── src/
│   ├── app/
│   │   ├── (shop)/        # Public shop pages
│   │   ├── admin/         # Admin dashboard
│   │   ├── api/           # API routes (Auth, Stripe, etc.)
│   │   ├── login/         # Login page
│   │   └── lib/           # Utilities, actions & context
│   ├── ui/                # UI components
│   ├── lib/               # Auth configuration (BetterAuth)
│   └── middleware.ts      # Route protection
└── public/                # Static assets
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run lint` | Run Biome linter |
| `bun run format` | Format code with Biome |
| `bun run db:user:list` | List all users |

## 📝 License

MIT
