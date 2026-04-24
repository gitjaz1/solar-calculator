CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  contact_name    TEXT NOT NULL,
  company_name    TEXT NOT NULL,
  company_address TEXT,
  vat_number      TEXT,
  telephone       TEXT,
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT,
  google_id       TEXT UNIQUE,
  is_admin        BOOLEAN DEFAULT FALSE,
  consented_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id                   SERIAL PRIMARY KEY,
  user_id              INT REFERENCES users(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  reference            TEXT,
  country              TEXT NOT NULL,
  panel_thickness      INT  NOT NULL,
  panel_length         INT,
  consequence_class    TEXT NOT NULL,
  design_working_life  TEXT NOT NULL,
  basic_wind_velocity  INT  NOT NULL,
  terrain_category     TEXT NOT NULL,
  tile_thickness       INT  NOT NULL,
  zones                JSONB NOT NULL DEFAULT '[]',
  calc_result          JSONB,
  offer_ref            TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jobs (
  id              TEXT PRIMARY KEY,
  queue           TEXT NOT NULL DEFAULT 'offer-generation',
  status          TEXT NOT NULL DEFAULT 'queued',
  progress        INT  NOT NULL DEFAULT 0,
  payload_meta    JSONB,
  user_email      TEXT,
  offer_ref       TEXT,
  pdf_path        TEXT,
  duration_ms     INT,
  error_message   TEXT,
  queued_at       TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS offers (
  id            SERIAL PRIMARY KEY,
  project_id    INT REFERENCES projects(id),
  offer_ref     TEXT NOT NULL,
  email_sent_to TEXT NOT NULL,
  sent_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id         SERIAL PRIMARY KEY,
  user_id    INT REFERENCES users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  ip         TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS http_metrics (
  id         SERIAL PRIMARY KEY,
  route      TEXT NOT NULL,
  method     TEXT NOT NULL,
  status_class TEXT NOT NULL,
  count      INT  NOT NULL DEFAULT 1,
  bucket_ts  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user    ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status      ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_user_email  ON jobs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_log_user   ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_ts     ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_http_metrics_ts  ON http_metrics(bucket_ts);