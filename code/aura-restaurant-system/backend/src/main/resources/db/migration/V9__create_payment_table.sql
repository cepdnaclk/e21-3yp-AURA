CREATE TABLE IF NOT EXISTS payment (
    payment_id   SERIAL PRIMARY KEY,
    order_id     INTEGER NOT NULL REFERENCES orders(order_id),
    amount       NUMERIC(10,2) NOT NULL,
    payment_method  VARCHAR(20) NOT NULL,
    payment_status  VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    transaction_id  VARCHAR(100),
    payment_time    TIMESTAMP
);