# GCash Integration Plan for Pinoy Paluwagan

## Executive Summary

This document outlines the implementation plan for integrating GCash payments into the Pinoy Paluwagan app. GCash does not offer direct public API access - integration must be done through third-party payment gateways.

## Research Findings

### Key Insight
GCash does not provide direct public API documentation. All GCash integrations must go through licensed payment gateway providers.

### Recommended Payment Gateway: PayMongo

**Why PayMongo?**
- 🇵🇭 Philippine-based company (local support)
- ✅ BSP-regulated (Bangko Sentral ng Pilipinas)
- 💰 No setup or monthly fees (pay per transaction only)
- 📱 Supports GCash, Maya, GrabPay, Cards, QR Ph
- 🔐 PCI DSS Level 1 compliant + SOC 2 Type 2
- 📚 Well-documented REST API
- 🧪 Sandbox environment for testing

**Pricing:**
- GCash/eWallets: ~2.5% per transaction
- Cards: 3.5% + ₱15 per transaction
- +1% for cards issued outside Philippines

### Alternative Options

| Provider | Pros | Cons |
|----------|------|------|
| **Xendit** | Single API for all eWallets, good docs | May require higher volume |
| **2C2P** | Enterprise-grade, multi-country | Complex setup, enterprise pricing |
| **HitPay** | Simple integration | Limited customization |
| **DragonPay** | Philippine specialist | Older technology |

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Pinoy Paluwagan App                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│  │ Contribution │     │   Payout     │     │   Cash-in    │   │
│  │   Payment    │     │  Transfer    │     │   (Future)   │   │
│  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘   │
│         │                    │                    │            │
│         └────────────────────┼────────────────────┘            │
│                              │                                 │
│                    ┌─────────▼─────────┐                       │
│                    │  Payment Service  │                       │
│                    │  (Server Action)  │                       │
│                    └─────────┬─────────┘                       │
│                              │                                 │
└──────────────────────────────┼─────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   PayMongo API      │
                    │  (Payment Gateway)  │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
        ┌─────▼─────┐    ┌─────▼─────┐    ┌─────▼─────┐
        │   GCash   │    │   Maya    │    │  GrabPay  │
        └───────────┘    └───────────┘    └───────────┘
```

## PayMongo API Workflow

### 1. Payment Intent Flow (Recommended)

```typescript
// Step 1: Create Payment Intent
const paymentIntent = await fetch('https://api.paymongo.com/v1/payment_intents', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${btoa(PAYMONGO_SECRET_KEY + ':')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    data: {
      attributes: {
        amount: 50000, // ₱500.00 in centavos
        currency: 'PHP',
        payment_method_allowed: ['gcash', 'paymaya', 'grab_pay'],
        description: 'Paluwagan Contribution - Group ABC Cycle 3',
        metadata: {
          group_id: 'uuid',
          cycle_id: 'uuid',
          user_id: 'uuid',
        },
      },
    },
  }),
});

// Step 2: Attach Payment Method (GCash)
const attachedIntent = await fetch(
  `https://api.paymongo.com/v1/payment_intents/${intentId}/attach`,
  {
    method: 'POST',
    headers: { ... },
    body: JSON.stringify({
      data: {
        attributes: {
          payment_method: 'gcash',
          return_url: 'https://yourapp.com/payments/callback',
        },
      },
    }),
  }
);

// Step 3: Redirect user to GCash checkout URL
// User approves payment in GCash app

// Step 4: Handle webhook callback
// PayMongo sends payment.paid event to your webhook endpoint
```

### 2. Source Flow (Alternative for simple payments)

```typescript
// Create a GCash source
const source = await fetch('https://api.paymongo.com/v1/sources', {
  method: 'POST',
  headers: { ... },
  body: JSON.stringify({
    data: {
      attributes: {
        amount: 50000,
        currency: 'PHP',
        type: 'gcash',
        redirect: {
          success: 'https://yourapp.com/payments/success',
          failed: 'https://yourapp.com/payments/failed',
        },
      },
    },
  }),
});

// Redirect user to source.attributes.redirect.checkout_url
```

## Database Schema Changes

```sql
-- New table for payment transactions
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to paluwagan entities
  contribution_id UUID REFERENCES contributions(id),
  payout_id UUID REFERENCES payouts(id),

  -- PayMongo references
  paymongo_intent_id TEXT,
  paymongo_source_id TEXT,
  paymongo_payment_id TEXT,

  -- Transaction details
  amount INTEGER NOT NULL, -- in centavos
  currency TEXT DEFAULT 'PHP',
  payment_method TEXT, -- 'gcash', 'paymaya', 'grab_pay', 'card'

  -- Status tracking
  status TEXT DEFAULT 'pending', -- pending, processing, succeeded, failed, refunded

  -- Metadata
  metadata JSONB DEFAULT '{}',
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Add payment_transaction_id to contributions
ALTER TABLE contributions
ADD COLUMN payment_transaction_id UUID REFERENCES payment_transactions(id);

-- Add payment_transaction_id to payouts
ALTER TABLE payouts
ADD COLUMN payment_transaction_id UUID REFERENCES payment_transactions(id);

-- For payout disbursements (sending money to members)
CREATE TABLE payout_disbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id UUID REFERENCES payouts(id) NOT NULL,

  -- Recipient details
  recipient_user_id UUID REFERENCES users(id) NOT NULL,
  recipient_gcash_number TEXT NOT NULL, -- GCash mobile number

  -- Disbursement details
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'PHP',

  -- Status
  status TEXT DEFAULT 'pending', -- pending, processing, sent, failed

  -- PayMongo reference (for future payout API)
  external_reference TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,

  CONSTRAINT fk_payout FOREIGN KEY (payout_id) REFERENCES payouts(id)
);
```

## Implementation Phases

### Phase 1: Accept GCash Payments for Contributions (MVP)

**Goal:** Members can pay their contributions via GCash

**Tasks:**
1. Set up PayMongo account and get API keys
2. Create payment service module (`src/lib/services/paymongo.ts`)
3. Add database migration for payment_transactions table
4. Create payment flow UI components:
   - Payment method selector
   - GCash payment button
   - Payment status page
5. Implement webhook handler for payment confirmations
6. Update contribution status automatically on successful payment
7. Add payment receipts/history view

**Files to Create/Modify:**
```
src/
├── lib/
│   ├── services/
│   │   └── paymongo.ts          # PayMongo API client
│   └── actions/
│       └── payment.ts           # Server actions for payments
├── app/
│   ├── api/
│   │   └── webhooks/
│   │       └── paymongo/
│   │           └── route.ts     # Webhook handler
│   └── (protected)/
│       └── payments/
│           ├── page.tsx         # Payment history
│           ├── [id]/
│           │   └── page.tsx     # Payment details
│           └── callback/
│               └── page.tsx     # Return from GCash
└── components/
    ├── payment-method-selector.tsx
    ├── gcash-pay-button.tsx
    └── payment-status.tsx
```

**Estimated Effort:** 3-5 days

### Phase 2: Payment History & Receipts

**Goal:** Full payment tracking and receipt generation

**Tasks:**
1. Create payment history page
2. Generate PDF receipts
3. Email payment confirmations
4. Payment analytics for organizers

**Estimated Effort:** 2-3 days

### Phase 3: Payout Disbursements (Advanced)

**Goal:** Organizers can send payouts directly to members' GCash

**Note:** This requires PayMongo Payout API or direct GCash partnership

**Tasks:**
1. Research PayMongo Payout API availability
2. Collect and verify member GCash numbers
3. Implement disbursement workflow
4. Add disbursement tracking and notifications

**Estimated Effort:** 5-7 days

### Phase 4: QR Ph Integration (Optional)

**Goal:** Support InstaPay/PESONet via QR Ph

**Tasks:**
1. Integrate PayMongo QR Ph API
2. Generate payment QR codes
3. Handle QR Ph webhooks

**Estimated Effort:** 2-3 days

## Environment Variables

```env
# PayMongo API Keys
PAYMONGO_SECRET_KEY=sk_test_xxx
PAYMONGO_PUBLIC_KEY=pk_test_xxx

# Webhook Secret (for verifying webhook signatures)
PAYMONGO_WEBHOOK_SECRET=whsk_xxx

# Payment Settings
NEXT_PUBLIC_PAYMENT_ENABLED=true
NEXT_PUBLIC_SUPPORTED_PAYMENT_METHODS=gcash,paymaya,grab_pay
```

## Security Considerations

1. **API Keys:** Store in environment variables, never expose secret key to client
2. **Webhook Verification:** Always verify PayMongo webhook signatures
3. **Idempotency:** Use idempotency keys to prevent duplicate payments
4. **Amount Validation:** Validate amounts server-side before creating payment intents
5. **Metadata:** Store reference IDs in metadata for reconciliation
6. **Audit Logging:** Log all payment events to audit_logs table

## Testing Strategy

### Sandbox Testing
- Use PayMongo test mode (test API keys)
- Test card: 4343 4343 4343 4345
- GCash test: Authenticate with any 6-digit OTP

### Test Scenarios
1. Successful payment flow
2. Failed/cancelled payment
3. Webhook delivery failures and retries
4. Duplicate payment prevention
5. Refund processing

## API Reference

### PayMongo Documentation
- Main Docs: https://developers.paymongo.com/docs/introduction
- API Reference: https://developers.paymongo.com/reference
- GCash Guide: https://developers.paymongo.com/docs/gcash

### Alternative: Xendit
- Docs: https://docs.xendit.co/ewallet
- API Reference: https://developers.xendit.co/api-reference/

## Decision Summary

| Aspect | Recommendation |
|--------|----------------|
| Payment Gateway | PayMongo (primary), Xendit (backup) |
| Initial Phase | GCash contributions only |
| Implementation | Payment Intent flow |
| Timeline | Phase 1 in 3-5 days |

## Next Steps

1. ✅ Create PayMongo account at https://dashboard.paymongo.com
2. ✅ Get sandbox API keys
3. 🔄 Implement Phase 1 (GCash for contributions)
4. ⏳ Test with sandbox
5. ⏳ Apply for production access
6. ⏳ Go live with GCash payments

---

*Document created: December 2024*
*Last updated: December 2024*
