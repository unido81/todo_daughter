-- 알림장에는 "체크할 할일"이 아니라 읽고 알아두면 되는 전달사항(차조심, 재료 제공 안내 등)이
-- 섞여 있다. 이걸 '기타'에 뭉뚱그리면 딸 화면에서 할일과 구분이 안 되므로 notice 분류를 추가한다.
-- SQLite는 CHECK 제약을 ALTER 로 바꿀 수 없어 tasks 테이블을 다시 만든다.
--
-- 주의: task_completions.task_id 는 ON DELETE CASCADE 라서 DROP TABLE tasks 를 하면
-- 완료 기록(=딸의 포인트 내역)이 전부 지워진다. FK 가 없는 임시 테이블에 백업해두고
-- 테이블 교체가 끝난 뒤 되돌려 넣는다.

CREATE TABLE completions_backup_0003 AS SELECT * FROM task_completions;

CREATE TABLE tasks_new (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('homework','supplies','exam','event','notice','other')),
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

INSERT INTO tasks_new (id, title, category, repeat_type, repeat_config, start_date, end_date, points, memo, source, active, created_at)
  SELECT id, title, category, repeat_type, repeat_config, start_date, end_date, points, memo, source, active, created_at FROM tasks;

DROP TABLE tasks;

ALTER TABLE tasks_new RENAME TO tasks;

CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks(active);

DELETE FROM task_completions;

INSERT INTO task_completions (id, task_id, occurrence_date, completed_at, points_awarded)
  SELECT id, task_id, occurrence_date, completed_at, points_awarded FROM completions_backup_0003;

DROP TABLE completions_backup_0003;
