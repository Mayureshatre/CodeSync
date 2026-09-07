import { z } from 'zod';

export const projectSkillSchema = z.object({
  skillId: z.string().min(1, "Skill is required"),
  requirementType: z.enum(["required", "preferred"]),
  minProficiency: z.enum(["beginner", "intermediate", "advanced", "expert"]),
});

export const projectRoleSkillSchema = z.object({
  skillId: z.string().min(1, "Skill is required"),
  requirementType: z.enum(["required", "preferred"]),
  minProficiency: z.enum(["beginner", "intermediate", "advanced", "expert"]),
});

export const projectRoleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2, "Role title must be at least 2 characters").max(100),
  slotsAvailable: z.number().int().min(1).max(50),
  skills: z.array(projectRoleSkillSchema).optional().default([]),
});

export const projectSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters").max(100),
  description: z.string().min(10, "Description is too short").max(2000),
  problemStatement: z.string().max(1000).optional().nullable(),
  goals: z.string().max(1000).optional().nullable(),
  category: z.string().min(1, "Category is required"),
  status: z.enum(["draft", "open", "in_progress", "paused", "completed", "archived"]).default("draft"),
  teamSizeTarget: z.number().int().min(1).max(100),
  durationEstimate: z.string().max(100).optional().nullable(),
  weeklyCommitment: z.string().max(100).optional().nullable(),
  remoteFlag: z.boolean().default(true),
  collaborationType: z.array(z.string()).min(1, "Select at least one collaboration type"),
  visibility: z.enum(["open_source", "private"]).default("open_source"),
  repoUrl: z.string().url().optional().nullable().or(z.literal('')),
  demoUrl: z.string().url().optional().nullable().or(z.literal('')),
  tags: z.array(z.string()).max(10),
  experienceRequirement: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional().nullable(),
  
  projectSkills: z.array(projectSkillSchema).optional().default([]),
  projectRoles: z.array(projectRoleSchema).optional().default([]),
});

export type ProjectInput = z.infer<typeof projectSchema>;
export type ProjectRoleInput = z.infer<typeof projectRoleSchema>;
export type ProjectSkillInput = z.infer<typeof projectSkillSchema>;
