-- =============================================================================
-- Reference schema for the AI Study Simulation application.
--
-- This migration mirrors the JPA entities under com.studylibrary.app.entity and
-- exists as a reference / starting point for a production rollout. Flyway is
-- NOT enabled by default (see spring.flyway.enabled: false in application.yml) -
-- in local/dev the schema is instead auto-managed via
-- spring.jpa.hibernate.ddl-auto: update.
--
-- To move to production: review this file against the live schema, enable
-- spring.flyway.enabled, and switch spring.jpa.hibernate.ddl-auto to `validate`.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username    VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL,
    password    VARCHAR(255) NOT NULL,
    streak      INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL,
    duration_minutes  INTEGER NOT NULL,
    completed         BOOLEAN NOT NULL DEFAULT FALSE,
    session_type      VARCHAR(20) NOT NULL CHECK (session_type IN ('WORK', 'SHORT_BREAK', 'LONG_BREAK')),
    started_at        TIMESTAMP,
    completed_at      TIMESTAMP,
    CONSTRAINT fk_pomodoro_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_id ON pomodoro_sessions (user_id);

CREATE TABLE IF NOT EXISTS study_notes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL,
    title       VARCHAR(500) NOT NULL,
    content     TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP,
    CONSTRAINT fk_study_notes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_study_notes_user_id ON study_notes (user_id);

CREATE TABLE IF NOT EXISTS flashcards (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL,
    question    TEXT NOT NULL,
    answer      TEXT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT fk_flashcards_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards (user_id);

CREATE TABLE IF NOT EXISTS analytics_snapshots (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL,
    date                DATE NOT NULL,
    focus_minutes       INTEGER NOT NULL DEFAULT 0,
    completed_sessions  INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT fk_analytics_snapshots_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_analytics_snapshots_user_date UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_user_id ON analytics_snapshots (user_id);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL,
    token       VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMP NOT NULL,
    used        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_password_reset_tokens_token UNIQUE (token)
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens (user_id);
