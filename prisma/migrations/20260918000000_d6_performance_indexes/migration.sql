-- D6 Performance Indexes
-- Adds B-tree indexes to prevent full-table scans on heavily filtered queries.
-- These correspond to @@index declarations added to schema.prisma.

-- Project.status — used by the matching worker's open-project scan
-- (WHERE status = 'open') and by discovery filters.
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- Application.projectId — used by getApplicationsForProject
-- (WHERE "projectId" = ?) and by discovery/application list queries.
CREATE INDEX "Application_projectId_idx" ON "Application"("projectId");

-- Application.userId — used by getApplicationsForDeveloper
-- (WHERE "userId" = ?).
CREATE INDEX "Application_userId_idx" ON "Application"("userId");

-- Invitation.projectId — used by project-scoped invitation queries.
CREATE INDEX "Invitation_projectId_idx" ON "Invitation"("projectId");

-- Invitation.invitedUserId — used by getInvitationsForDeveloper
-- (WHERE "invitedUserId" = ?).
CREATE INDEX "Invitation_invitedUserId_idx" ON "Invitation"("invitedUserId");
