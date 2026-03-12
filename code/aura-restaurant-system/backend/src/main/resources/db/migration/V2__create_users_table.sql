-- V2__create_users_table.sql
-- Week 1 · B2: Auth module
-- Creates the STAFF table matching the project ER diagram

CREATE TABLE IF NOT EXISTS staff (
    staff_id      BIGSERIAL    PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    role          VARCHAR(20)  NOT NULL
                  CHECK (role IN ('ADMIN', 'STAFF', 'KITCHEN')),
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password      VARCHAR(255) NOT NULL,      -- BCrypt hash, never plaintext
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,   -- soft delete support
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Fast lookup on login (called on every request)
CREATE INDEX IF NOT EXISTS idx_staff_username ON staff(username);

-- ── Seed Data ──────────────────────────────────────────────────────────────
-- Default admin account for first-time setup.
-- Password: Admin@1234
-- CHANGE THIS immediately after first login!
INSERT INTO staff (name, role, username, password)
VALUES (
    'System Admin',
    'ADMIN',
    'admin',
    '$2a$12$tFzPNgF7y3X6FI3cLY7TgOmMv2CbPl3H7Kn6sKm9sBzRzaVHnMiWK'
)
ON CONFLICT (username) DO NOTHING;