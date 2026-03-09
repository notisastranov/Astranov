# Developer Guide: Adding a New Country

Follow these steps to activate a new jurisdiction in Astranov.

## 1. Database Configuration
Add the country to the `countries` table:
```sql
INSERT INTO countries (code, name, currency, tax_regime, default_tax_rate)
VALUES ('UK', 'United Kingdom', 'GBP', 'VAT', 20.00);
```

## 2. Create Country Module
In `src/services/finance/countries/`, create `uk.ts`:
```typescript
export const UKModule = {
  countryCode: 'UK',
  currency: 'GBP',
  legalWording: {
    invoiceFooter: "VAT Registration No: GB 123 4567 89",
    selfBilling: "The VAT shown is your output tax due to HMRC."
  },
  // ... other config
};
```

## 3. Localization
Add translations for the new country's language in `/src/locales/`.

## 4. Reporting Integration
If the country requires real-time reporting (like myDATA), implement the `ReportingProvider` interface:
```typescript
class HMRCReportingProvider implements ReportingProvider {
  async send(invoice: Invoice): Promise<string> {
    // Call HMRC MTD API
  }
}
```

## 5. Testing
-   Run `TaxEngine` unit tests with the new country code.
-   Generate a sample PDF and verify legal wording with the local accounting partner.
