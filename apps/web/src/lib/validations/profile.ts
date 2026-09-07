import { z } from 'zod';

export const profileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters").max(50),
  username: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and dashes").min(3).max(30),
  bio: z.string().max(280).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  timezone: z.string().max(50).optional().nullable(),
  availability: z.enum(["available", "open_to_projects", "busy", "not_looking"]),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced", "expert"]),
  preferredCollaboration: z.array(z.enum([
    "short_term", "long_term", "open_source", "startup", "freelance", "hackathon", "learning_project", "side_project"
  ])),
  profileVisibility: z.enum(["public", "unlisted"]),
  githubUrl: z.string().url().optional().nullable().or(z.literal('')),
  linkedinUrl: z.string().url().optional().nullable().or(z.literal('')),
  portfolioUrl: z.string().url().optional().nullable().or(z.literal('')),
  websiteUrl: z.string().url().optional().nullable().or(z.literal('')),
});

export type ProfileInput = z.infer<typeof profileSchema>;
