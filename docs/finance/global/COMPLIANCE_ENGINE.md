# Global Compliance Engine

The Compliance Engine monitors the platform's operations for regulatory risks.

## 1. Permanent Establishment (PE) Risk
-   **Rule**: Monitor the volume of transactions and physical presence in a country.
-   **Trigger**: If GMV > €1M or > 10,000 transactions in a country, alert the Tax team to evaluate PE risk.

## 2. Tax Nexus Detection
-   **Rule**: Track Sales Tax thresholds in US states.
-   **Action**: Automatically enable Sales Tax collection when a state's threshold is crossed.

## 3. Marketplace Facilitator Obligations
-   **Rule**: Identify countries where the platform is legally required to collect and remit tax for providers (e.g., UK VAT on e-commerce).
-   **Action**: Switch the Tax Engine to "Facilitator Mode" for that country.

## 4. Consumer Law Monitor
-   **Rule**: Track local refund requirements (e.g., 14-day cooling-off period in EU).
-   **Action**: Update the `RefundPolicy` module for users in that jurisdiction.
