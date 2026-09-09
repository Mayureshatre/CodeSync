CREATE UNIQUE INDEX "Application_active_unique" ON "Application"("projectId", "userId") WHERE status NOT IN ('withdrawn', 'rejected');
