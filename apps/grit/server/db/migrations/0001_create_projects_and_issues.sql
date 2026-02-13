-- GRIT schema: projects and issues
CREATE SCHEMA IF NOT EXISTS grit;

-- ---------------------------------------------------------------------------
-- projects — containers for grouping issues
-- ---------------------------------------------------------------------------
CREATE TABLE grit.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES public.entities(id),
  name VARCHAR(200) NOT NULL,
  key VARCHAR(10) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES public.users(id)
);

-- ---------------------------------------------------------------------------
-- issues — individual trackable items within a project
-- ---------------------------------------------------------------------------
CREATE TABLE grit.issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES public.entities(id),
  project_id UUID NOT NULL REFERENCES grit.projects(id) ON DELETE CASCADE,
  name VARCHAR(500) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL DEFAULT 'task',
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  reporter_id UUID NOT NULL REFERENCES public.users(id),
  assignee_id UUID REFERENCES public.users(id),
  parent_issue_id UUID REFERENCES grit.issues(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES public.users(id)
);

CREATE INDEX idx_issues_project_id ON grit.issues(project_id);
CREATE INDEX idx_issues_assignee_id ON grit.issues(assignee_id);
CREATE INDEX idx_issues_status ON grit.issues(status);
CREATE INDEX idx_issues_parent_issue_id ON grit.issues(parent_issue_id);
