# Developer Implementation Guide - Financial System

## 1. Event-Driven Architecture
The financial system should react to domain events:
- `ORDER_COMPLETED` -> Trigger commission extraction & invoice generation.
- `PAYMENT_RECEIVED` -> Update clearing account ledger.
- `SETTLEMENT_DUE` -> Generate settlement statement & initiate bank transfer.

## 2. State Machine: Invoice Lifecycle
1. `DRAFT`: Data gathered, totals calculated.
2. `PENDING_MYDATA`: Sent to IAPR API.
3. `ISSUED`: MARK/UID received, PDF generated, emailed to user.
4. `CANCELLED`: Credit note issued, myDATA updated.

## 3. Idempotency Strategy
- Every financial request must include an `idempotency_key` (e.g., `order_id + event_type`).
- Database unique constraints on `transaction_id` in the ledger table prevent double-counting.

## 4. API Endpoints (Internal)
- `POST /api/finance/ledger/entry`: Low-level double-entry recording.
- `POST /api/finance/invoices/generate`: Trigger doc creation.
- `GET /api/finance/wallets/:id/balance`: Real-time balance calculation from ledger.

## 5. Security & Audit
- **No Deletes**: The `wallet_ledger` table must be append-only. Corrections require a new entry with reversed values.
- **Service Account**: Use Cloud Run's default service account with `roles/cloudsql.client` and `roles/secretmanager.secretAccessor` for DB and API keys.
- **Audit Logs**: Every change to `legal_profiles` must be logged with the user's IP and timestamp.

## 6. myDATA Integration Flow
1. Construct XML/JSON payload per IAPR specs.
2. Sign with Platform's API Key.
3. POST to `https://mydatapi.gsis.gr/api/SendInvoices`.
4. Store `mark` and `visual_url` in the `invoices` table.
