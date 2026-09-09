import { z } from 'zod';

export const SortOption = z.enum(['relevance', 'recency', 'popularity']);

export const developerSearchSchema = z.object({
  q: z.string().optional(),
  projectId: z.string().optional(),
  skills: z.array(z.string()).optional(),
  experience: z.array(z.string()).optional(),
  location: z.string().optional(),
  availability: z.array(z.string()).optional(),
  projectInterests: z.array(z.string()).optional(), // maps to preferredCollaboration
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: SortOption.default('relevance'),
});

export const projectSearchSchema = z.object({
  q: z.string().optional(),
  skills: z.array(z.string()).optional(),
  category: z.array(z.string()).optional(),
  teamSizeCurrent: z.coerce.number().optional(),
  teamSizeTarget: z.coerce.number().optional(),
  duration: z.array(z.string()).optional(),
  difficulty: z.array(z.string()).optional(), // maps to experienceRequirement
  availability: z.array(z.string()).optional(), // maps to weeklyCommitment
  projectType: z.array(z.string()).optional(), // maps to collaborationType
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: SortOption.default('relevance'),
});

export type DeveloperSearchInput = z.infer<typeof developerSearchSchema>;
export type ProjectSearchInput = z.infer<typeof projectSearchSchema>;
