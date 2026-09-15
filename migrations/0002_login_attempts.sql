-- Brute-force protection for the (short, 4-digit) role passwords.
CREATE TABLE IF NOT EXISTS login_attempts (
  role TEXT PRIMARY KEY,
  fail_count INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
