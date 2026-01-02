# Pinoy Paluwagan - Project Guide

## Overview

**Pinoy Paluwagan** - A web app for managing Filipino rotating savings circles (paluwagan). Organizers create branches, invite members, track contributions, and manage payouts transparently.

**Key Terms:** Paluwagan (savings circle), Branch (a paluwagan group with 10 slots), Organizer (manages branch), Member (participates), Cycle (contribution period), Category (type: Cash, Food, Gold, etc.)

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Database/Auth/Storage:** Supabase
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod
- **Package Manager:** pnpm

## MCP Servers & Plugins

Configured in `.mcp.json`:

| Server | Purpose |
|--------|---------|
| `supabase` | Database queries, auth management, storage operations |
| `playwright` | Browser automation, UI testing, screenshots |
| `context7` | Library documentation lookup |

## Project Structure

```
src/
├── app/
│   ├── (auth)/             # Login, Onboarding (public)
│   ├── (protected)/        # Home, Groups, Profile (authenticated)
│   ├── auth/callback/      # Supabase auth callback
│   └── invites/[token]/    # Invite link handling
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── categories/         # Category tabs, selector, icon
│   └── verification/       # ID upload form, status badge
├── lib/
│   ├── supabase/           # Supabase clients
│   └── actions/            # Server actions (group, category, user)
└── types/database.ts       # TypeScript types
```

## Key Files

| File | Purpose |
|------|---------|
| `BRAND.md` | Colors, typography, component patterns |
| `globals.css` | CSS variables, base styles |
| `types/database.ts` | Database TypeScript types, constants |
| `supabase/migrations/` | Database schema |

## Database Tables

**Core:** `users` → `group_members` → `groups` → `cycles` → `contributions` / `payouts`

**New:** `categories`, `branch_fees`

**Support:** `invites`, `audit_logs`, `notifications`

## Branch Features

- **Fixed 10 Slots** - Each branch has exactly 10 member slots
- **Categories** - Cash, Food, Gold, Appliances, Gadgets (+ custom)
- **Fees** - Setup: ₱99 (one-time), Monthly: ₱100 (tracked only)
- **Verification** - Photo + ID required before creating/joining branches

## Auth Flow

1. Signup (select Organizer/Member role) → 2. Onboarding (enter name) → 3. Home
4. Optional: Verify identity (upload photo + ID) → Create/Join branches

## Commands

```bash
pnpm dev      # Start dev server
pnpm build    # Production build
pnpm lint     # Run linter
pnpm test     # Run tests
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## User Roles

- **Organizer:** Create branches, invite members, confirm payments, assign payout order, verify members
- **Member:** Join via invite, submit payment proofs, receive payouts

## Key Constants

```typescript
// From types/database.ts
export const BRANCH_FEES = {
  SETUP: 99,    // PHP one-time
  MONTHLY: 100, // PHP per month
} as const;

export const BRANCH_SLOTS = 10;
```

## Coding Patterns

```tsx
// Client component
"use client";
import { createClient } from "@/lib/supabase/client";

// Server component (default)
import { createClient } from "@/lib/supabase/server";

// Server actions
import { createGroup } from "@/lib/actions/group";
import { getCategories } from "@/lib/actions/category";
import { uploadIdPhoto } from "@/lib/actions/user";

// Toast notifications
import { toast } from "sonner";
toast.success("Done!");
```

## Pending Features

- [ ] Calendar view (grid + timeline)
- [ ] Fee tracking page
- [ ] Real-time notifications
- [ ] Payment integration
- [ ] Group chat
- [ ] Export reports
- [ ] Dark mode
- [ ] PWA support
