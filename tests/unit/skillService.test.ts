import { describe, it, expect, vi } from 'vitest';
import { addUserSkill } from '../../apps/web/src/server/services/skillService';
import { prisma } from '../../apps/web/src/server/db';
import { NotFoundError, ConflictError } from '../../apps/web/src/server/errors';

vi.mock('../../apps/web/src/server/db', () => ({
  prisma: {
    skill: {
      findUnique: vi.fn(),
    },
    userSkill: {
      findUnique: vi.fn(),
      create: vi.fn(),
    }
  }
}));

describe('skillService', () => {
  describe('addUserSkill', () => {
    it('throws NotFoundError if skill does not exist', async () => {
      vi.mocked(prisma.skill.findUnique).mockResolvedValue(null);
      await expect(addUserSkill('user1', { skillId: 's1', proficiency: 'expert' })).rejects.toThrow(NotFoundError);
    });

    it('throws ConflictError if user already has skill', async () => {
      vi.mocked(prisma.skill.findUnique).mockResolvedValue({ id: 's1' } as any);
      vi.mocked(prisma.userSkill.findUnique).mockResolvedValue({ id: 'us1' } as any);
      await expect(addUserSkill('user1', { skillId: 's1', proficiency: 'expert' })).rejects.toThrow(ConflictError);
    });

    it('creates user skill successfully', async () => {
      vi.mocked(prisma.skill.findUnique).mockResolvedValue({ id: 's1' } as any);
      vi.mocked(prisma.userSkill.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.userSkill.create).mockResolvedValue({ id: 'us1', proficiency: 'expert' } as any);

      const result = await addUserSkill('user1', { skillId: 's1', proficiency: 'expert' });
      expect(result.id).toBe('us1');
      expect(prisma.userSkill.create).toHaveBeenCalledWith({
        data: {
          userId: 'user1',
          skillId: 's1',
          proficiency: 'expert',
          yearsExperience: null,
        },
        include: { skill: true }
      });
    });
  });
});
