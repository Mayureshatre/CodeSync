-- Enable trigram extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Project Search Indexes
CREATE INDEX "Project_search_idx" ON "Project" USING GIN (
  (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce("problemStatement", '')), 'C')
  )
);
CREATE INDEX "Project_name_trgm_idx" ON "Project" USING GIN (name gin_trgm_ops);

-- 2. Profile Search Indexes
CREATE INDEX "Profile_search_idx" ON "Profile" USING GIN (
  (
    setweight(to_tsvector('english', coalesce("displayName", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(username, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(bio, '')), 'C')
  )
);
CREATE INDEX "Profile_displayName_trgm_idx" ON "Profile" USING GIN ("displayName" gin_trgm_ops);
CREATE INDEX "Profile_username_trgm_idx" ON "Profile" USING GIN (username gin_trgm_ops);

-- 3. Skill Search Indexes
CREATE INDEX "Skill_name_trgm_idx" ON "Skill" USING GIN (name gin_trgm_ops);
