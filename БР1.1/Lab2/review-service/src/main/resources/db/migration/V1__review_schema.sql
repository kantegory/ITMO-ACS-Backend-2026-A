CREATE TABLE reviews (
    id UUID PRIMARY KEY,
    contract_id UUID NOT NULL,
    author_id UUID NOT NULL,
    rating INTEGER NOT NULL,
    comment VARCHAR(4000) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT ck_review_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT uq_review_author_contract UNIQUE (contract_id, author_id)
);

CREATE INDEX idx_reviews_contract ON reviews(contract_id);
