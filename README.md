# AI Menu Generator SaaS

A complete AI-powered menu generator built with Next.js 15, Tailwind CSS, Shadcn/ui, and PostgreSQL. Create stunning restaurant menus in seconds - either generate from scratch or upload existing menus for AI-powered transformation.

## Features

- 🤖 **AI-Powered Generation**: Create complete menus using GPT-4o-mini
- 📤 **Upload & Transform**: Upload PDF/images, extract text with OCR, and AI-refine
- 🎨 **Multiple Styles**: Modern, Vintage, and Minimal themes
- 🌍 **Multi-language**: English, Chinese, and Spanish support
- 📱 **QR Code Generation**: Share menus via QR codes
- 📄 **PDF Export**: Download professional PDF menus
- 💳 **Subscription**: Stripe integration for $9/month unlimited plan
- 🔐 **Authentication**: Google OAuth via NextAuth.js

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, Shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM
- **AI**: OpenAI GPT-4o-mini
- **OCR**: Tesseract.js (client-side)
- **Auth**: NextAuth.js v5
- **Payments**: Stripe
- **Other**: React Hook Form, Zod, TanStack Query, jsPDF, qrcode.react

## Getting Started

### Prerequisites

- Node.js 18+
- Docker (for PostgreSQL)
- OpenAI API key
- Google OAuth credentials
- Stripe account (for payments)

### 1. Clone and Install

```bash
git clone <repo>
cd ai-menu-generator
npm install
```

### 2. Set up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/menu_generator?schema=public"

# NextAuth
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"

# Google OAuth
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# OpenAI
OPENAI_API_KEY="sk-your-openai-api-key"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID="price_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Start PostgreSQL

```bash
docker-compose up -d
```

### 4. Initialize Database

```bash
npm run db:push
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/           # Protected routes
│   │   ├── dashboard/         # User dashboard
│   │   └── menu/
│   │       ├── new/           # Create menu (Generate/Upload)
│   │       └── [id]/edit/     # Edit menu
│   ├── api/
│   │   ├── auth/              # NextAuth
│   │   ├── menu/              # Menu CRUD
│   │   ├── stripe/            # Stripe checkout
│   │   ├── upload-refresh/    # OCR + AI processing
│   │   └── webhooks/          # Stripe webhooks
│   ├── auth/signin/           # Sign in page
│   ├── m/[id]/                # Public menu view
│   └── page.tsx               # Landing page
├── components/
│   ├── layout/                # Navbar, UserNav
│   ├── menu/                  # Menu-specific components
│   └── ui/                    # Shadcn components
├── hooks/
│   └── use-toast.ts
├── i18n/
│   ├── messages/              # EN, ZH, ES translations
│   └── request.ts
├── lib/
│   ├── auth.ts                # NextAuth config
│   ├── openai.ts              # AI generation
│   ├── prisma.ts              # Database client
│   ├── stripe.ts              # Stripe utilities
│   └── utils.ts
└── types/
    └── index.ts
```

## Key Features Explained

### Menu Generation
1. User enters restaurant name, type, language, and optional ingredients
2. AI generates 12-15 dishes with names, descriptions, prices, and categories
3. Menu is saved to database and user redirected to editor

### Upload & Transform
1. User uploads PDF/image of existing menu
2. Tesseract.js extracts text via OCR (client-side)
3. AI parses and refines the extracted text
4. Creates improved descriptions, standardizes prices, categorizes dishes
5. Translates to selected language if needed

### Style Templates
- **Modern**: Clean, contemporary design with orange accents
- **Vintage**: Warm amber tones with serif typography
- **Minimal**: Ultra-simple with lots of whitespace

### Export Options
- **PDF Download**: Professional menu PDF
- **QR Code**: Shareable QR linking to public menu page
- **Embed Code**: iframe code for website embedding

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/menu` | GET | List user's menus |
| `/api/menu/generate` | POST | Generate new menu with AI |
| `/api/menu/[id]` | GET/PUT/DELETE | Single menu operations |
| `/api/upload-refresh` | POST | Process uploaded menu |
| `/api/stripe/checkout` | POST | Create Stripe checkout |
| `/api/webhooks/stripe` | POST | Stripe webhook handler |

## Stripe Setup

1. Create a product and price in Stripe Dashboard
2. Set up webhook endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Enable events: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.*`
4. Add credentials to `.env`

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Database (Recommended: Supabase or Neon)

Update `DATABASE_URL` to your production PostgreSQL URL.

## License

MIT
