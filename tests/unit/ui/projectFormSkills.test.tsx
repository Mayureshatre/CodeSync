// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectForm } from '../../../apps/web/src/components/project/ProjectForm';
import '@testing-library/jest-dom';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('ProjectForm - Skill Requirements Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('displays human-readable skill names when loaded for editing existing project', () => {
    const initialData = {
      name: 'Existing Project',
      description: 'A project with existing skill requirements.',
      category: 'Web Development',
      status: 'open',
      teamSizeTarget: 3,
      collaborationType: ['open_source'],
      projectSkills: [
        {
          skillId: 'cmvtmp123react',
          requirementType: 'required',
          minProficiency: 'advanced',
          skill: { id: 'cmvtmp123react', name: 'React' },
        },
        {
          skillId: 'cmvtmp456js',
          requirementType: 'preferred',
          minProficiency: 'intermediate',
          skill: { id: 'cmvtmp456js', name: 'JavaScript' },
        },
      ],
      projectRoles: [],
    };

    render(<ProjectForm projectId="proj-1" initialData={initialData} />);

    // Must display actual names, NOT "Skill ID: cmvtmp..."
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.queryByText(/Skill ID: cmvtmp/i)).not.toBeInTheDocument();
  });

  it('displays readable skill name when user searches and selects a skill', async () => {
    const mockSkills = [
      { id: 'skill-ts-99', name: 'TypeScript' },
      { id: 'skill-pg-88', name: 'PostgreSQL' },
    ];

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ skills: mockSkills }),
    } as any);

    render(<ProjectForm />);

    const searchInput = screen.getByLabelText(/search and add skills/i);
    fireEvent.change(searchInput, { target: { value: 'Type' } });

    // Wait for debounced fetch and dropdown rendering
    const tsOption = await screen.findByRole('button', { name: 'TypeScript' });
    expect(tsOption).toBeInTheDocument();

    fireEvent.click(tsOption);

    // Selected skill requirement must display 'TypeScript'
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.queryByText(/Skill ID: skill-ts/i)).not.toBeInTheDocument();
  });

  it('gracefully handles missing skill relation without crashing', () => {
    const initialData = {
      name: 'Project with deleted skill',
      description: 'Handling deleted skill reference.',
      category: 'General',
      status: 'draft',
      teamSizeTarget: 2,
      collaborationType: ['open_source'],
      projectSkills: [
        {
          skillId: 'deleted-skill-id-777',
          requirementType: 'required',
          minProficiency: 'beginner',
          // skill is undefined/null
        },
      ],
      projectRoles: [],
    };

    render(<ProjectForm initialData={initialData} />);

    // Gracefully displays fallback with id without crashing
    expect(screen.getByText('deleted-skill-id-777')).toBeInTheDocument();
  });
});
