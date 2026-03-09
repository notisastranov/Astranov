-- Astranov Financial Database Schema
-- Optimized for Double-Entry Ledger and Greek Compliance

-- 1. Legal Profiles (Tax Data)
CREATE TABLE legal_profiles (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50) NOT NULL, -- AFM in Greece
    tax_office VARCHAR(255), -- DOY
    legal_name VARCHAR(255) NOT NULL,
    legal_address TEXT NOT NULL,
    is_vat_exempt BOOLEAN DEFAULT FALSE,
    vat_exemption_reason TEXT,
    self_billing_agreed BOOLEAN DEFAULT FALSE,
    self_billing_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Wallet Ledger (Double Entry)
CREATE TABLE wallet_ledger (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(255) NOT NULL,
    account_code VARCHAR(20) NOT NULL, -- e.g. '50.00', '73.00'
    debit DECIMAL(15, 2) DEFAULT 0.00,
    credit DECIMAL(15, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'EUR',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (transaction_id),
    INDEX (account_code)
);

-- 3. Transactions (High Level Events)
CREATE TABLE financial_transactions (
    id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255),
    user_id VARCHAR(255),
    type ENUM('payment', 'payout', 'commission', 'usage_fee', 'refund', 'chargeback', 'adjustment'),
    status ENUM('pending', 'completed', 'failed', 'reversed'),
    amount DECIMAL(15, 2) NOT NULL,
    fee_amount DECIMAL(15, 2) DEFAULT 0.00,
    net_amount DECIMAL(15, 2) NOT NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Invoices (Compliance Documents)
CREATE TABLE invoices (
    id VARCHAR(255) PRIMARY KEY,
    doc_series VARCHAR(20) NOT NULL, -- e.g. 'INV-A'
    doc_number INT NOT NULL,
    doc_type ENUM('invoice', 'receipt', 'credit_note', 'self_billed'),
    issuer_id VARCHAR(255) NOT NULL, -- Platform or Provider ID
    recipient_id VARCHAR(255) NOT NULL,
    transaction_id VARCHAR(255),
    total_net DECIMAL(15, 2) NOT NULL,
    total_vat DECIMAL(15, 2) NOT NULL,
    total_gross DECIMAL(15, 2) NOT NULL,
    vat_rate DECIMAL(5, 2) DEFAULT 24.00,
    mydata_mark VARCHAR(255), -- myDATA MARK
    mydata_uid VARCHAR(255), -- myDATA UID
    legal_notes TEXT,
    is_cancelled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(doc_series, doc_number)
);

-- 5. Invoice Lines
CREATE TABLE invoice_lines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_id VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) DEFAULT 1.00,
    unit_price DECIMAL(15, 2) NOT NULL,
    net_amount DECIMAL(15, 2) NOT NULL,
    vat_amount DECIMAL(15, 2) NOT NULL,
    vat_category INT DEFAULT 1, -- myDATA VAT Category
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- 6. Settlements (Monthly Payouts)
CREATE TABLE settlements (
    id VARCHAR(255) PRIMARY KEY,
    provider_id VARCHAR(255) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    status ENUM('draft', 'approved', 'paid', 'failed'),
    payout_reference VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
