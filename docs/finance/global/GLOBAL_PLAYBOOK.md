# Astranov Global Financial Architecture
## Multi-Country Compliance & Fintech Framework

This document outlines the architecture for Astranov's global expansion, moving from a single-country (Greece) model to a pluggable, multi-jurisdictional system.

---

## 1. Global Entity Model (The 3 Levels)

The system supports three operational levels per country:

| Level | Mode | Characteristics | Tax Treatment |
| :--- | :--- | :--- | :--- |
| **Level 1** | Cross-Border | No local presence. Served from HQ entity. | Reverse charge (B2B), OSS (B2C EU). |
| **Level 2** | Tax Registered | Local VAT/GST registration. No local company. | Local tax collection & reporting. |
| **Level 3** | Local Entity | Full subsidiary with local bank accounts. | Full local accounting & compliance. |

---

## 2. Country Module Specification

Each country is defined by a `CountryModule` object:

```typescript
interface CountryModule {
  countryCode: string; // ISO 3166-1 alpha-2
  currency: string;    // ISO 4217
  taxRegime: 'VAT' | 'GST' | 'SALES_TAX' | 'NONE';
  defaultTaxRate: number;
  invoiceSeriesFormat: string;
  legalWording: Record<string, string>; // Localized legal snippets
  reportingIntegrations: string[];      // e.g., ['myDATA', 'SAF-T']
  roundingPrecision: number;
  isMarketplaceFacilitator: boolean;    // Does platform collect tax for providers?
}
```

---

## 3. Global Accounting Engine

### Multi-Currency Ledger
The ledger records transactions in two currencies:
1.  **Transaction Currency**: The currency the user paid in.
2.  **Base Currency**: The functional currency of the legal entity (e.g., EUR).

### Multi-Entity Consolidation
Each transaction is tagged with an `entity_id`.
-   **Internal Transfers**: Recorded as inter-company loans if crossing entities.
-   **Commission Extraction**: Recognized in the entity that owns the contract with the provider.

---

## 4. Tax Engine Logic

The Tax Engine calculates tax based on:
-   **Origin**: Location of the Platform Entity.
-   **Destination**: Location of the Customer.
-   **Supply Type**: Digital Service vs. Intermediation vs. Goods.
-   **User Status**: B2B (Tax ID provided) vs. B2C.

### Ruleset Example:
-   *If Destination == EU and User == B2C*: Apply Destination VAT.
-   *If Destination == EU and User == B2B*: Reverse Charge (0% VAT).
-   *If Destination == US*: Apply Sales Tax based on Nexus.

---

## 5. Invoice Engine

Invoices are generated using a **Template + Localization** approach.
-   **Base Template**: Structure (Header, Items, Totals).
-   **Country Overlay**: Adds specific fields (e.g., "AFM" for Greece, "CIF" for Spain, "VAT Reg No" for UK).
-   **Language Overlay**: Translates labels.

---

## 6. Country Activation Workflow

1.  **Threshold Monitoring**: Track GMV (Gross Merchandise Volume) per country.
2.  **Nexus Alert**: Notify Legal/Tax team when GMV reaches 70% of registration threshold.
3.  **Module Deployment**: Activate `CountryModule` in production.
4.  **Tax Registration**: Update `legal_profiles` for the platform entity in that country.
5.  **Local Payouts**: Enable local currency settlements.
