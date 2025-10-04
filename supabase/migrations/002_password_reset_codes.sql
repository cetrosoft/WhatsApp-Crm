-- Migration: Password Reset Codes Table
-- Purpose: Store verification codes for password reset flow
-- Created: 2025-10-03

-- Create password_reset_codes table
CREATE TABLE IF NOT EXISTS password_reset_codes (
    email TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_email ON password_reset_codes(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_expires_at ON password_reset_codes(expires_at);

-- Add comment
COMMENT ON TABLE password_reset_codes IS 'Stores verification codes for password reset flow';

-- Clean up expired codes automatically (optional - run manually or via cron)
-- DELETE FROM password_reset_codes WHERE expires_at < NOW();
