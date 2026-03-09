# Astranov Financial & Accounting Playbook
## Greece Compliance Framework (Law 4308/2014 & myDATA)

This document defines the financial architecture for Astranov, a multi-model digital platform operating in Greece.

---

## 1. Business Models & Tax Treatment

### Model 1: Marketplace Intermediation (Agent)
*   **Role**: Intermediary (Agent).
*   **Revenue**: 3% Commission on the gross transaction value.
*   **Funds Flow**: Customer pays 100% -> Platform holds 100% (Liability) -> Platform extracts 3% (Revenue) -> Platform owes 97% to Provider (Liability).
*   **VAT**: 24% on the 3% commission. The 97% is "out of scope" for the platform's VAT but subject to the provider's VAT.
*   **Self-Billing**: Platform issues the invoice (Provider -> Customer) on behalf of the provider.

### Model 2: Brokerage Service (Principal)
*   **Role**: Service Provider (Principal).
*   **Revenue**: 3% Brokerage Fee.
*   **VAT**: 24% on the full fee.
*   **Invoicing**: Direct invoice from Platform to Customer.

### Model 3: Platform Usage Fee (Digital Service)
*   **Role**: Service Provider (Principal).
*   **Revenue**: Fixed fee (e.g., €0.30) per post.
*   **VAT**: 24% (Standard rate for digital services).
*   **Invoicing**: Direct Retail Receipt (B2C) or Service Invoice (B2B).

---

## 2. Chart of Accounts (Simplified Greek Standard)

| Account Code | Account Name | Type | Description |
| :--- | :--- | :--- | :--- |
| **38.00** | Cash / Bank | Asset | Platform's operational funds |
| **38.03** | Payment Processor Clearing | Asset | Funds in transit (Stripe/Viva) |
| **50.00** | Providers Payable | Liability | Funds owed to providers (97%) |
| **53.00** | Customer Wallet Balances | Liability | Unspent customer deposits |
| **54.00** | VAT Payable (Output) | Liability | 24% on platform revenue |
| **73.00** | Commission Revenue (Model 1) | Revenue | The 3% fee |
| **73.01** | Brokerage Revenue (Model 2) | Revenue | The 3% fee |
| **73.02** | Usage Fee Revenue (Model 3) | Revenue | The €0.30 fee |

---

## 3. Journal Entries Catalog

### Event: Payment Capture (Model 1 - €100 Transaction)
1.  **Debit** 38.03 (Clearing) €100.00
2.  **Credit** 50.00 (Providers Payable) €97.00
3.  **Credit** 73.00 (Commission Revenue) €2.42
4.  **Credit** 54.00 (VAT 24%) €0.58

### Event: Monthly Settlement Payout (€970 to Provider)
1.  **Debit** 50.00 (Providers Payable) €970.00
2.  **Credit** 38.00 (Bank) €970.00

### Event: Refund (Model 1 - €100)
1.  **Debit** 50.00 (Providers Payable) €97.00
2.  **Debit** 73.00 (Revenue) €2.42
3.  **Debit** 54.00 (VAT) €0.58
4.  **Credit** 38.03 (Clearing/Bank) €100.00

---

## 4. myDATA Mapping Table

| Document Type | myDATA Doc Type | Classification | VAT Category |
| :--- | :--- | :--- | :--- |
| **Self-Billed Invoice** | 1.1 (Invoice) | E3_561_001 | Cat 1 (24%) |
| **Commission Invoice** | 2.1 (Service Invoice) | E3_561_003 | Cat 1 (24%) |
| **Usage Fee Receipt** | 11.1 (Retail Receipt) | E3_561_003 | Cat 1 (24%) |
| **Credit Note** | 5.2 (Credit Note) | Relevant Revenue | Cat 1 (24%) |

---

## 5. Compliance Checklist

- [ ] **Self-Billing Agreement**: Digital acceptance by provider stored in DB.
- [ ] **Sequential Numbering**: Separate series for each document type.
- [ ] **myDATA Real-time**: Transmission within 24h of issuance.
- [ ] **Audit Trail**: Immutable logs for every wallet movement.
- [ ] **VAT Validation**: VIES check for EU B2B transactions.
