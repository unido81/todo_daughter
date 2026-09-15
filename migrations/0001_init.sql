-- Initial schema for todo_daughter

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('homework','supplies','exam','event','other')),
  repeat_type TEXT NOT NULL CHECK (repeat_type IN ('once','daily','weekly','monthly')),
  repeat_config TEXT NOT NULL DEFAULT '{}',
  start_date TEXT NOT NULL,
  end_date TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  memo TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks(active);

CREATE TABLE IF NOT EXISTS task_completions (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  occurrence_date TEXT NOT NULL,
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  points_awarded INTEGER NOT NULL DEFAULT 0,
  UNIQUE(task_id, occurrence_date)
);

CREATE INDEX IF NOT EXISTS idx_completions_date ON task_completions(occurrence_date);

CREATE TABLE IF NOT EXISTS rewards (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  cost_points INTEGER NOT NULL,
  icon TEXT NOT NULL DEFAULT '🎁',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS redemptions (
  id TEXT PRIMARY KEY,
  reward_id TEXT NOT NULL REFERENCES rewards(id),
  reward_title TEXT NOT NULL,
  points_spent INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','fulfilled','rejected')),
  redeemed_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_redemptions_status ON redemptions(status);
