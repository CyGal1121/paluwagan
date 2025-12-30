# Pinoy Paluwagan

A mobile-first paluwagan (ROSCA - Rotating Savings and Credit Association) management app for Filipino users. This app helps groups manage their savings circles with transparency, trust, and simplicity.

## Features

- **Authentication**: Email magic link or email/password authentication via Supabase Auth
- **Profile Management**: Set up your profile with name and photo
- **Group Creation**: Create paluwagan groups with customizable rules
- **Invite System**: Share tokenized invite links with expiration
- **Member Management**: Approve, freeze, or remove members (organizer)
- **Cycle Management**: Auto-generated cycles based on group settings
- **Contribution Tracking**: Submit contributions with proof images
- **Payout Tracking**: Mark payouts sent and confirm receipt
- **Ledger & Audit Log**: Full transparency of all transactions and changes
- **Notifications**: In-app notification center for alerts
- **Alerts**: Due soon, overdue, and payout upcoming notifications

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui + Radix UI primitives
- **Backend**: Supabase (Auth, Postgres, Storage)
- **Deployment**: Netlify

## Prerequisites

- Node.js 18+
- pnpm 9+
- Supabase account
- Netlify account (for deployment)

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd pinoy-paluwagan
pnpm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready

### 3. Run Database Migrations

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run each migration file in order:
   - `supabase/migrations/00001_initial_schema.sql`
   - `supabase/migrations/00002_rls_policies.sql`
   - `supabase/migrations/00003_storage_policies.sql`

### 4. Configure Environment Variables

1. Copy the example env file:
```bash
cp .env.example .env.local
```

2. Get your Supabase credentials from **Project Settings > API**:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your anon/public key

3. Update `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Configure Supabase Auth

1. Go to **Authentication > URL Configuration**
2. Add `http://localhost:3000` to **Site URL**
3. Add `http://localhost:3000/auth/callback` to **Redirect URLs**

### 6. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploy to Netlify

### 1. Install Netlify CLI

```bash
npm install -g netlify-cli
```

### 2. Build and Deploy

```bash
netlify login
netlify init
netlify deploy --prod
```

### 3. Configure Environment Variables on Netlify

1. Go to your Netlify site dashboard
2. Navigate to **Site settings > Environment variables**
3. Add the same environment variables from `.env.local`
4. Update `NEXT_PUBLIC_APP_URL` to your Netlify URL

### 4. Update Supabase Auth Settings

1. Add your Netlify URL to **Site URL** in Supabase Auth settings
2. Add `https://your-site.netlify.app/auth/callback` to **Redirect URLs**

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (login, onboarding)
│   ├── (protected)/       # Protected pages (home, groups)
│   ├── auth/              # Auth callback route
│   └── invites/           # Public invite pages
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── actions/          # Server actions
│   ├── supabase/         # Supabase client helpers
│   ├── utils/            # Utility functions
│   └── validations/      # Zod schemas
└── types/                # TypeScript types
```

## Database Schema

### Tables

- **users**: Profile data (linked to auth.users)
- **groups**: Group configuration and settings
- **group_members**: Membership with roles and payout positions
- **invites**: Tokenized invite links
- **cycles**: Generated payment cycles
- **contributions**: Member contributions per cycle
- **payouts**: Payout records per cycle
- **audit_logs**: Immutable audit trail
- **notifications**: In-app notifications

### Key RLS Policies

- Only group members can view group data
- Only organizers can approve/manage members
- Only organizers can confirm contributions
- Recipients can confirm their payouts
- All state changes create audit log entries

## Assumptions

1. **MVP is non-custodial**: The app does not collect or hold money. Members transfer funds directly to each other.

2. **Default approval required**: New members require organizer approval by default (configurable in group rules).

3. **Payout order methods**:
   - **Fixed**: Order set by join date/position
   - **Lottery**: Random assignment when group starts
   - **Organizer Assigned**: Organizer sets positions manually

4. **Late detection**: Contributions are marked as late if the due date passes and status is not `paid_confirmed`. The `is_late` boolean is stored in the contributions table.

5. **Cycle generation**: Cycles are pre-generated when the group starts, based on the number of members.

6. **Storage**: Proof images are stored in Supabase Storage with a 5MB limit per file.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting and tests: `pnpm lint && pnpm test`
5. Submit a pull request

## License

MIT
