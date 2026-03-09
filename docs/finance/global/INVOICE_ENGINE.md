# Global Invoice Engine Design

The Invoice Engine generates legally compliant documents in PDF and JSON formats.

## 1. Template Hierarchy
1.  **Global Base**: Shared layout (Logo, Table, Totals).
2.  **Country Overlay**: Adds mandatory local fields (e.g., "Tax ID", "Fiscal Representative").
3.  **Language Pack**: Translates all static text.

## 2. Numbering Strategy
-   **Series**: Each country + document type has a unique series (e.g., `UK-INV-2024`).
-   **Sequence**: Atomic counters in the database ensure no gaps in numbering, as required by most tax authorities.

## 3. Compliance Notes
The engine automatically appends legal wording based on the transaction type:
-   *Self-Billing*: "This invoice was issued by the platform on behalf of the provider."
-   *Reverse Charge*: "Recipient is liable for VAT under the reverse charge mechanism."
-   *Exempt*: "Exempt from VAT under Article X of local law."

## 4. Digital Signatures & QR Codes
-   **QR Codes**: Generated for countries requiring real-time verification (e.g., Greece, Portugal, Saudi Arabia).
-   **Digital Signatures**: Applied using the platform's private key for PDF integrity.
