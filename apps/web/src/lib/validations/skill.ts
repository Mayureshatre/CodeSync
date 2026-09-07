import { z } from 'zod';

export const userSkillSchema = z.object({
  skillId: z.string().min(1, "Skill ID is required"),
  proficiency: z.enum(["beginner", "intermediate", "advanced", "expert"]),
  yearsExperience: z.number().int().min(0).max(50).optional().nullable(),
});

export type UserSkillInput = z.infer<typeof userSkillSchema>;
