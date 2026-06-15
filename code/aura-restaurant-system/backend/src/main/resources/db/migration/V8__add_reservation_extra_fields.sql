-- V8__add_reservation_extra_fields.sql
-- (ඔයාගේ last migration number + 1 දාන්න)

ALTER TABLE reservation
    ADD COLUMN IF NOT EXISTS phone     VARCHAR(20),
    ADD COLUMN IF NOT EXISTS occasion  VARCHAR(50) DEFAULT 'OTHER',
    ADD COLUMN IF NOT EXISTS note      TEXT,
    ADD COLUMN IF NOT EXISTS confirmed BOOLEAN NOT NULL DEFAULT FALSE;