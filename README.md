# Pehnava Vibe - Jewelry & Fashion Store

A modern e-commerce platform for jewelry and traditional Indian fashion, built with Next.js 16, featuring a beautiful UI, admin dashboard, and secure authentication.

## ✨ Features

- **Shop** - Browse products by category (Dresses, Necklaces, Bracelets, Earrings)
- **Shopping Cart** - Add items, adjust quantities, persistent cart state
- **Checkout** - PayPal integration for secure payments
- **Admin Dashboard** - Manage products, view orders, bulk upload
- **Authentication** - Secure login with NextAuth.js credentials provider
- **Responsive Design** - Beautiful UI that works on all devices

## 🛠 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (via Prisma ORM)
- **Authentication:** NextAuth.js v5
- **Styling:** Tailwind CSS v4
- **Animations:** Motion (Framer Motion)
- **Payments:** PayPal
- **Deployment:** Vercel

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- PostgreSQL database (local or hosted like [Supabase](https://supabase.com/), [Neon](https://neon.tech/))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd jewelerystoreapp
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Database
   POSTGRES_PRISMA_URL="postgresql://user:password@host:port/database?sslmode=require&pgbouncer=true"
   
   # Authentication (generate with: openssl rand -base64 32)
   AUTH_SECRET="your-secret-key-here"
   
   # PayPal (optional, for checkout)
   NEXT_PUBLIC_PAYPAL_CLIENT_ID="your-paypal-client-id"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   bunx prisma generate
   
   # Push schema to database
   bunx prisma db push
   
   # Seed admin user
   bun run db:seed
   ```

5. **Run the development server**
   ```bash
   bun run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## 👤 User Management

### Default Admin Account

After running the seed, you can log in with:
- **Email:** `admin@jewelrystore.com`
- **Password:** `adminpassword123`

### Managing Users

**List all users:**
```bash
bun run db:user:list
```

**Create a new user:**
```bash
bun run db:user create <email> <password> [name] [role]

# Example:
bun run db:user create manager@store.com SecurePass123 "Store Manager" ADMIN
```

**Change a user's password:**
```bash
bun run db:user update <email> --password <new-password>

# Example:
bun run db:user update admin@jewelrystore.com --password MyNewSecurePassword
```

**Update user details:**
```bash
bun run db:user update <email> --name "New Name"
bun run db:user update <email> --role ADMIN
```

**Delete a user:**
```bash
bun run db:user delete <email>
```

### Configuring Users via Seed File

You can also edit `prisma/seed.ts` to configure users:

```typescript
const users = [
  {
    email: 'admin@jewelrystore.com',
    password: 'your-secure-password',
    name: 'Admin User',
    role: 'ADMIN',
  },
  {
    email: 'manager@store.com',
    password: 'another-password',
    name: 'Store Manager',
    role: 'ADMIN',
  },
]
```

Then run `bun run db:seed` to apply changes.

## 🔐 Admin Panel

Access the admin panel at `/admin` after logging in at `/login`.

**Features:**
- View and manage all products
- Create new products with image upload
- Bulk upload products
- View and manage orders
- Edit product details (price, stock, sale status)

## 🌐 Deploying to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com) and import your repository
2. Configure the project settings

### 3. Set Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables, add:

| Variable | Description |
|----------|-------------|
| `POSTGRES_PRISMA_URL` | Your PostgreSQL connection string |
| `AUTH_SECRET` | Random secret for NextAuth (generate with `openssl rand -base64 32`) |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | PayPal Client ID (optional) |

### 4. Deploy

Vercel will automatically build and deploy. The build process will:
1. Seed the database with admin user
2. Generate Prisma client
3. Build the Next.js application

## 📁 Project Structure

```
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # User seeding script
├── scripts/
│   └── manage-user.ts     # User management CLI
├── src/
│   ├── app/
│   │   ├── (shop)/        # Public shop pages
│   │   ├── admin/         # Admin dashboard
│   │   ├── api/           # API routes
│   │   ├── login/         # Login page
│   │   └── lib/           # Utilities & actions
│   ├── ui/                # UI components
│   ├── auth.ts            # NextAuth configuration
│   ├── auth.config.ts     # Auth callbacks & settings
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
| `bun run db:seed` | Seed database with users |
| `bun run db:user` | User management CLI |
| `bun run db:user:list` | List all users |

## 🔒 Security Notes

- The `prisma/seed.ts` file is in `.gitignore` to protect credentials
- Always use strong passwords in production
- Generate a unique `AUTH_SECRET` for each environment
- Never commit `.env` files to version control

## 📝 License

MIT
