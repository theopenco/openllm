## Auto Top-Up Credits Feature

This PR implements an auto top-up credits functionality that automatically charges users when their credit balance falls below a configurable threshold.

### Changes Made

#### Database Schema

- Added auto top-up columns to `organization` table:
  - `autoTopUpEnabled` (boolean, default false)
  - `autoTopUpThreshold` (decimal, default "10")
  - `autoTopUpAmount` (decimal, default "10")
- Created new `lock` table with columns: `id`, `createdAt`, `updatedAt`, `key` (unique)

#### API Endpoints

- `GET /payments/auto-topup-settings` - Retrieve current auto top-up settings
- `POST /payments/auto-topup-settings` - Update auto top-up configuration

#### UI Components

- Added `AutoTopUpSettings` component to billing settings page
- Form validation: threshold minimum $5, amount minimum $10
- Requires default payment method to enable auto top-up
- Visual warnings when payment methods are missing

#### Worker Logic

- Enhanced existing worker in `apps/gateway/src/worker.ts`
- Auto top-up checks run every 60 seconds
- Database lock mechanism prevents duplicate charges (10-minute lock duration)
- Integrates with existing Stripe payment flow using saved payment methods

### Features

- **Configurable Threshold**: Default $10, minimum $5 - triggers auto top-up when credits fall below this amount
- **Configurable Amount**: Minimum $10 - amount to add when auto top-up triggers
- **Payment Method Validation**: Requires default payment method before enabling
- **Duplicate Prevention**: Database lock ensures auto top-up runs only once every 10 minutes
- **Stripe Integration**: Uses existing payment infrastructure for seamless credit purchases

### Testing

- ✅ UI component renders correctly in billing settings
- ✅ Form validation works for minimum values
- ✅ Payment method requirements enforced
- ✅ Database schema changes applied via `pnpm sync`
- ✅ Lint checks pass

### Screenshots

![Auto Top-Up Settings UI](/home/ubuntu/repos/llmgateway/auto-topup-ui.png)

---

**Link to Devin run**: https://app.devin.ai/sessions/a929a6bb8e6d412a8d4ed5f8c8e9cfdd  
**Requested by**: Luca (contact@luca-steeb.com)
