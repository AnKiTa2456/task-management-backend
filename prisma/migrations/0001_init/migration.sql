-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║  TaskFlow — Initial PostgreSQL Migration                                  ║
-- ║  Auto-generated reference. Run via: prisma migrate dev --name init        ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

-- ─────────────────────────────────────────────────────────────────────────────
-- ENUMS
-- PostgreSQL stores enums as first-class types, not VARCHAR CHECK constraints.
-- This gives strict type safety and is more performant on large tables.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE "Role"               AS ENUM ('OWNER','ADMIN','MEMBER','VIEWER');
CREATE TYPE "TaskStatus"         AS ENUM ('BACKLOG','TODO','IN_PROGRESS','IN_REVIEW','BLOCKED','DONE','CANCELLED');
CREATE TYPE "Priority"           AS ENUM ('LOW','MEDIUM','HIGH','URGENT');
CREATE TYPE "AttachmentType"     AS ENUM ('IMAGE','DOCUMENT','SPREADSHEET','VIDEO','ARCHIVE','OTHER');
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD','READ','ARCHIVED');
CREATE TYPE "ActivityType"       AS ENUM (
  'TASK_CREATED','TASK_UPDATED','TASK_MOVED','TASK_STATUS_CHANGED',
  'TASK_PRIORITY_CHANGED','TASK_ASSIGNED','TASK_UNASSIGNED',
  'TASK_DUE_DATE_SET','TASK_DUE_DATE_REMOVED','TASK_COMPLETED',
  'TASK_REOPENED','TASK_DELETED','TASK_RESTORED',
  'COMMENT_ADDED','COMMENT_EDITED','COMMENT_DELETED',
  'ATTACHMENT_UPLOADED','ATTACHMENT_DELETED',
  'BOARD_CREATED','BOARD_UPDATED','BOARD_ARCHIVED',
  'COLUMN_ADDED','COLUMN_RENAMED','COLUMN_DELETED',
  'MEMBER_ADDED','MEMBER_REMOVED','MEMBER_ROLE_CHANGED',
  'LABEL_ADDED_TO_TASK','LABEL_REMOVED_FROM_TASK'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "users" (
  "id"                  TEXT          NOT NULL,
  "email"               VARCHAR(254)  NOT NULL,
  "name"                VARCHAR(120)  NOT NULL,
  "passwordHash"        TEXT          NOT NULL,
  "avatarUrl"           TEXT,
  "bio"                 VARCHAR(500),
  "timezone"            VARCHAR(60)   NOT NULL DEFAULT 'UTC',
  "isActive"            BOOLEAN       NOT NULL DEFAULT TRUE,
  "isEmailVerified"     BOOLEAN       NOT NULL DEFAULT FALSE,
  "emailVerifyToken"    TEXT          UNIQUE,
  "passwordResetToken"  TEXT          UNIQUE,
  "passwordResetExpiry" TIMESTAMPTZ,
  "lastLoginAt"         TIMESTAMPTZ,
  "createdAt"           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updatedAt"           TIMESTAMPTZ   NOT NULL,

  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key"        ON "users"("email");
CREATE        INDEX "users_isActive_idx"     ON "users"("isActive");
CREATE        INDEX "users_createdAt_idx"    ON "users"("createdAt" DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- REFRESH TOKENS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "refresh_tokens" (
  "id"         TEXT        NOT NULL,
  "token"      TEXT        NOT NULL UNIQUE,
  "deviceInfo" VARCHAR(255),
  "ipAddress"  VARCHAR(45),
  "expiresAt"  TIMESTAMPTZ NOT NULL,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "userId"     TEXT        NOT NULL,

  CONSTRAINT "refresh_tokens_pkey"      PRIMARY KEY ("id"),
  CONSTRAINT "refresh_tokens_userId_fk" FOREIGN KEY ("userId")
    REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "refresh_tokens_userId_idx"    ON "refresh_tokens"("userId");
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- ─────────────────────────────────────────────────────────────────────────────
-- TEAMS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "teams" (
  "id"          TEXT        NOT NULL,
  "name"        VARCHAR(80) NOT NULL,
  "slug"        VARCHAR(80) NOT NULL UNIQUE,
  "description" VARCHAR(500),
  "avatarUrl"   TEXT,
  "isPersonal"  BOOLEAN     NOT NULL DEFAULT FALSE,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL,

  CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "teams_createdAt_idx" ON "teams"("createdAt" DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- TEAM MEMBERS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "team_members" (
  "id"       TEXT        NOT NULL,
  "role"     "Role"      NOT NULL DEFAULT 'MEMBER',
  "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "userId"   TEXT        NOT NULL,
  "teamId"   TEXT        NOT NULL,

  CONSTRAINT "team_members_pkey"      PRIMARY KEY ("id"),
  CONSTRAINT "team_members_userId_fk" FOREIGN KEY ("userId")
    REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "team_members_teamId_fk" FOREIGN KEY ("teamId")
    REFERENCES "teams"("id") ON DELETE CASCADE,
  CONSTRAINT "team_members_userId_teamId_unique" UNIQUE ("userId", "teamId")
);

CREATE INDEX "team_members_teamId_role_idx" ON "team_members"("teamId", "role");

-- ─────────────────────────────────────────────────────────────────────────────
-- BOARDS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "boards" (
  "id"          TEXT         NOT NULL,
  "name"        VARCHAR(100) NOT NULL,
  "description" VARCHAR(500),
  "background"  VARCHAR(100),
  "isPrivate"   BOOLEAN      NOT NULL DEFAULT FALSE,
  "isArchived"  BOOLEAN      NOT NULL DEFAULT FALSE,
  "archivedAt"  TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ  NOT NULL,
  "ownerId"     TEXT         NOT NULL,
  "teamId"      TEXT,

  CONSTRAINT "boards_pkey"      PRIMARY KEY ("id"),
  CONSTRAINT "boards_ownerId_fk" FOREIGN KEY ("ownerId")
    REFERENCES "users"("id"),
  CONSTRAINT "boards_teamId_fk"  FOREIGN KEY ("teamId")
    REFERENCES "teams"("id")
);

CREATE INDEX "boards_ownerId_idx"              ON "boards"("ownerId");
CREATE INDEX "boards_teamId_idx"               ON "boards"("teamId");
CREATE INDEX "boards_isArchived_updatedAt_idx" ON "boards"("isArchived", "updatedAt" DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- COLUMNS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "columns" (
  "id"        TEXT        NOT NULL,
  "name"      VARCHAR(60) NOT NULL,
  "position"  INTEGER     NOT NULL,
  "color"     VARCHAR(7),
  "taskLimit" INTEGER,
  "isDefault" BOOLEAN     NOT NULL DEFAULT FALSE,
  "boardId"   TEXT        NOT NULL,

  CONSTRAINT "columns_pkey"      PRIMARY KEY ("id"),
  CONSTRAINT "columns_boardId_fk" FOREIGN KEY ("boardId")
    REFERENCES "boards"("id") ON DELETE CASCADE,
  CONSTRAINT "columns_taskLimit_positive" CHECK ("taskLimit" IS NULL OR "taskLimit" > 0)
);

CREATE INDEX "columns_boardId_position_idx" ON "columns"("boardId", "position");

-- ─────────────────────────────────────────────────────────────────────────────
-- TASKS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "tasks" (
  "id"          TEXT          NOT NULL,
  "title"       VARCHAR(255)  NOT NULL,
  "description" TEXT,
  "status"      "TaskStatus"  NOT NULL DEFAULT 'TODO',
  "priority"    "Priority"    NOT NULL DEFAULT 'MEDIUM',
  "position"    INTEGER       NOT NULL DEFAULT 0,
  "dueDate"     TIMESTAMPTZ,
  "startDate"   TIMESTAMPTZ,
  "completedAt" TIMESTAMPTZ,
  "storyPoints" INTEGER,
  "deletedAt"   TIMESTAMPTZ,                         -- soft delete
  "createdAt"   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ   NOT NULL,
  "columnId"    TEXT          NOT NULL,
  "creatorId"   TEXT          NOT NULL,
  "assigneeId"  TEXT,

  CONSTRAINT "tasks_pkey"        PRIMARY KEY ("id"),
  CONSTRAINT "tasks_columnId_fk"  FOREIGN KEY ("columnId")
    REFERENCES "columns"("id") ON DELETE CASCADE,
  CONSTRAINT "tasks_creatorId_fk" FOREIGN KEY ("creatorId")
    REFERENCES "users"("id"),
  CONSTRAINT "tasks_assigneeId_fk" FOREIGN KEY ("assigneeId")
    REFERENCES "users"("id"),
  CONSTRAINT "tasks_storyPoints_range" CHECK ("storyPoints" IS NULL OR "storyPoints" >= 0),
  CONSTRAINT "tasks_position_non_negative" CHECK ("position" >= 0)
);

-- Individual indexes
CREATE INDEX "tasks_columnId_position_idx"   ON "tasks"("columnId", "position");
CREATE INDEX "tasks_assigneeId_status_idx"   ON "tasks"("assigneeId", "status");
CREATE INDEX "tasks_assigneeId_dueDate_idx"  ON "tasks"("assigneeId", "dueDate");
CREATE INDEX "tasks_status_idx"              ON "tasks"("status");
CREATE INDEX "tasks_priority_idx"            ON "tasks"("priority");
CREATE INDEX "tasks_dueDate_idx"             ON "tasks"("dueDate");
CREATE INDEX "tasks_deletedAt_idx"           ON "tasks"("deletedAt");
CREATE INDEX "tasks_creatorId_idx"           ON "tasks"("creatorId");

-- Composite: board filtering by status + priority
CREATE INDEX "tasks_columnId_status_priority_idx"
  ON "tasks"("columnId", "status", "priority");

-- Partial index: active (non-deleted) tasks only — used by most queries
CREATE INDEX "tasks_active_idx"
  ON "tasks"("columnId", "status")
  WHERE "deletedAt" IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- TASK WATCHERS  (many-to-many)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "task_watchers" (
  "id"        TEXT        NOT NULL,
  "watchedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "userId"    TEXT        NOT NULL,
  "taskId"    TEXT        NOT NULL,

  CONSTRAINT "task_watchers_pkey"      PRIMARY KEY ("id"),
  CONSTRAINT "task_watchers_userId_fk" FOREIGN KEY ("userId")
    REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "task_watchers_taskId_fk" FOREIGN KEY ("taskId")
    REFERENCES "tasks"("id") ON DELETE CASCADE,
  CONSTRAINT "task_watchers_userId_taskId_unique" UNIQUE ("userId", "taskId")
);

-- ─────────────────────────────────────────────────────────────────────────────
-- COMMENTS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "comments" (
  "id"        TEXT        NOT NULL,
  "content"   TEXT        NOT NULL,
  "isEdited"  BOOLEAN     NOT NULL DEFAULT FALSE,
  "deletedAt" TIMESTAMPTZ,
  "parentId"  TEXT,                                  -- threading
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL,
  "taskId"    TEXT        NOT NULL,
  "authorId"  TEXT        NOT NULL,

  CONSTRAINT "comments_pkey"      PRIMARY KEY ("id"),
  CONSTRAINT "comments_taskId_fk"   FOREIGN KEY ("taskId")
    REFERENCES "tasks"("id") ON DELETE CASCADE,
  CONSTRAINT "comments_authorId_fk" FOREIGN KEY ("authorId")
    REFERENCES "users"("id"),
  CONSTRAINT "comments_parentId_fk" FOREIGN KEY ("parentId")
    REFERENCES "comments"("id"),
  CONSTRAINT "comments_no_self_reply" CHECK ("parentId" != "id")
);

CREATE INDEX "comments_taskId_createdAt_idx" ON "comments"("taskId", "createdAt");
CREATE INDEX "comments_authorId_idx"         ON "comments"("authorId");
CREATE INDEX "comments_parentId_idx"         ON "comments"("parentId");
CREATE INDEX "comments_deletedAt_idx"        ON "comments"("deletedAt");

-- ─────────────────────────────────────────────────────────────────────────────
-- TASK ATTACHMENTS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "task_attachments" (
  "id"           TEXT             NOT NULL,
  "filename"     VARCHAR(255)     NOT NULL,
  "storageKey"   TEXT             NOT NULL UNIQUE,
  "mimeType"     VARCHAR(127)     NOT NULL,
  "sizeBytes"    INTEGER          NOT NULL,
  "type"         "AttachmentType" NOT NULL DEFAULT 'OTHER',
  "thumbnailKey" TEXT,
  "width"        INTEGER,
  "height"       INTEGER,
  "deletedAt"    TIMESTAMPTZ,
  "createdAt"    TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  "taskId"       TEXT             NOT NULL,
  "uploaderId"   TEXT             NOT NULL,

  CONSTRAINT "task_attachments_pkey"        PRIMARY KEY ("id"),
  CONSTRAINT "task_attachments_taskId_fk"   FOREIGN KEY ("taskId")
    REFERENCES "tasks"("id") ON DELETE CASCADE,
  CONSTRAINT "task_attachments_uploaderId_fk" FOREIGN KEY ("uploaderId")
    REFERENCES "users"("id"),
  CONSTRAINT "task_attachments_sizeBytes_positive" CHECK ("sizeBytes" > 0),
  CONSTRAINT "task_attachments_dimensions_pair"
    CHECK (("width" IS NULL) = ("height" IS NULL))  -- both set or both null
);

CREATE INDEX "task_attachments_taskId_idx"    ON "task_attachments"("taskId");
CREATE INDEX "task_attachments_uploaderId_idx" ON "task_attachments"("uploaderId");
CREATE INDEX "task_attachments_type_idx"      ON "task_attachments"("type");
CREATE INDEX "task_attachments_deletedAt_idx" ON "task_attachments"("deletedAt");

-- ─────────────────────────────────────────────────────────────────────────────
-- LABELS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "labels" (
  "id"        TEXT        NOT NULL,
  "name"      VARCHAR(40) NOT NULL,
  "color"     VARCHAR(7)  NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "boardId"   TEXT        NOT NULL,

  CONSTRAINT "labels_pkey"              PRIMARY KEY ("id"),
  CONSTRAINT "labels_boardId_fk"        FOREIGN KEY ("boardId")
    REFERENCES "boards"("id") ON DELETE CASCADE,
  CONSTRAINT "labels_boardId_name_unique" UNIQUE ("boardId", "name"),
  CONSTRAINT "labels_color_format"      CHECK ("color" ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE INDEX "labels_boardId_idx" ON "labels"("boardId");

-- ─────────────────────────────────────────────────────────────────────────────
-- TASK ↔ LABEL  (implicit many-to-many join table, managed by Prisma)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "_TaskLabels" (
  "A" TEXT NOT NULL,   -- labelId
  "B" TEXT NOT NULL,   -- taskId

  CONSTRAINT "_TaskLabels_A_fk" FOREIGN KEY ("A") REFERENCES "labels"("id") ON DELETE CASCADE,
  CONSTRAINT "_TaskLabels_B_fk" FOREIGN KEY ("B") REFERENCES "tasks"("id")  ON DELETE CASCADE
);

CREATE UNIQUE INDEX "_TaskLabels_AB_unique" ON "_TaskLabels"("A", "B");
CREATE        INDEX "_TaskLabels_B_index"   ON "_TaskLabels"("B");

-- ─────────────────────────────────────────────────────────────────────────────
-- ACTIVITIES
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "activities" (
  "id"           TEXT           NOT NULL,
  "type"         "ActivityType" NOT NULL,
  "metadata"     JSONB          NOT NULL DEFAULT '{}',
  "createdAt"    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  "userId"       TEXT           NOT NULL,
  "taskId"       TEXT,
  "boardId"      TEXT,
  "attachmentId" TEXT,

  CONSTRAINT "activities_pkey"        PRIMARY KEY ("id"),
  CONSTRAINT "activities_userId_fk"   FOREIGN KEY ("userId")
    REFERENCES "users"("id"),
  CONSTRAINT "activities_taskId_fk"   FOREIGN KEY ("taskId")
    REFERENCES "tasks"("id") ON DELETE SET NULL,
  CONSTRAINT "activities_boardId_fk"  FOREIGN KEY ("boardId")
    REFERENCES "boards"("id") ON DELETE SET NULL,
  CONSTRAINT "activities_attachmentId_fk" FOREIGN KEY ("attachmentId")
    REFERENCES "task_attachments"("id") ON DELETE SET NULL
);

CREATE INDEX "activities_boardId_createdAt_idx"  ON "activities"("boardId", "createdAt" DESC);
CREATE INDEX "activities_taskId_createdAt_idx"   ON "activities"("taskId",  "createdAt" DESC);
CREATE INDEX "activities_userId_createdAt_idx"   ON "activities"("userId",  "createdAt" DESC);
CREATE INDEX "activities_type_idx"               ON "activities"("type");

-- JSONB GIN index for searching inside metadata
CREATE INDEX "activities_metadata_gin_idx" ON "activities" USING gin ("metadata");

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE "notifications" (
  "id"        TEXT                 NOT NULL,
  "title"     VARCHAR(160)         NOT NULL,
  "body"      VARCHAR(500),
  "status"    "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
  "readAt"    TIMESTAMPTZ,
  "actionUrl" VARCHAR(500),
  "createdAt" TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  "userId"    TEXT                 NOT NULL,

  CONSTRAINT "notifications_pkey"    PRIMARY KEY ("id"),
  CONSTRAINT "notifications_userId_fk" FOREIGN KEY ("userId")
    REFERENCES "users"("id") ON DELETE CASCADE,
  -- readAt must be set when status is READ
  CONSTRAINT "notifications_readAt_consistency"
    CHECK (
      ("status" = 'UNREAD' AND "readAt" IS NULL) OR
      ("status" != 'UNREAD' AND "readAt" IS NOT NULL)
    )
);

CREATE INDEX "notifications_userId_status_createdAt_idx"
  ON "notifications"("userId", "status", "createdAt" DESC);

CREATE INDEX "notifications_status_createdAt_idx"
  ON "notifications"("status", "createdAt");

-- ─────────────────────────────────────────────────────────────────────────────
-- USEFUL VIEWS
-- ─────────────────────────────────────────────────────────────────────────────

-- Board summary used on the "My Boards" listing page
CREATE VIEW "v_board_summary" AS
SELECT
  b.id,
  b.name,
  b.description,
  b."isArchived",
  b."createdAt",
  b."updatedAt",
  b."ownerId",
  b."teamId",
  COUNT(DISTINCT t.id) FILTER (WHERE t."deletedAt" IS NULL)            AS "totalTasks",
  COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'DONE')                AS "doneTasks",
  COUNT(DISTINCT t.id) FILTER (WHERE t."dueDate" < NOW()
                                 AND t.status NOT IN ('DONE','CANCELLED')
                                 AND t."deletedAt" IS NULL)            AS "overdueTasks",
  COUNT(DISTINCT m."userId")                                           AS "memberCount"
FROM "boards"      b
LEFT JOIN "columns"      c  ON c."boardId"  = b.id
LEFT JOIN "tasks"        t  ON t."columnId" = c.id
LEFT JOIN "team_members" m  ON m."teamId"   = b."teamId"
GROUP BY b.id;
