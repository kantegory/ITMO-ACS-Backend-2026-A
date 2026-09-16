CREATE TABLE rental_contracts (
    id UUID PRIMARY KEY,
    booking_id UUID NOT NULL UNIQUE,
    property_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    landlord_id UUID NOT NULL,
    contract_number VARCHAR(40) NOT NULL UNIQUE,
    monthly_rent DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_contracts_tenant ON rental_contracts(tenant_id, created_at);
CREATE INDEX idx_contracts_landlord ON rental_contracts(landlord_id, created_at);

CREATE TABLE payments (
    id UUID PRIMARY KEY,
    contract_id UUID NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_payment_contract FOREIGN KEY (contract_id) REFERENCES rental_contracts(id)
);
