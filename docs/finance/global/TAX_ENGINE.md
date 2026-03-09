# Global Tax Engine Design

The Astranov Tax Engine is a stateless service that calculates tax liabilities based on transaction metadata.

## 1. Input Parameters
- `transaction_type`: `SERVICE`, `COMMISSION`, `GOODS`.
- `issuer_profile`: Legal profile of the seller.
- `recipient_profile`: Legal profile of the buyer.
- `amount_net`: The net amount before tax.

## 2. Calculation Logic
1.  **Identify Jurisdiction**: Determine the "Place of Supply" based on local laws.
2.  **Determine Taxability**: Is the item exempt? (e.g., certain educational services).
3.  **Check Reverse Charge**: If B2B and cross-border EU, set VAT to 0% and flag as Reverse Charge.
4.  **Apply Rate**: Fetch the current rate for the jurisdiction from the `countries` table.
5.  **Marketplace Facilitator Check**: If the platform is a "Marketplace Facilitator" in that country, calculate tax on the *total* transaction, not just the commission.

## 3. Output
```json
{
  "net_amount": 100.00,
  "tax_amount": 24.00,
  "gross_amount": 124.00,
  "tax_rate": 0.24,
  "tax_type": "VAT",
  "is_reverse_charge": false,
  "legal_note": "VAT 24% applied per Greek Law 2859/2000"
}
```
