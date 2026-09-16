'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSkillSchema, UserSkillInput } from '../../lib/validations/skill';

export function SkillManager() {
  const [skills, setSkills] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue } = useForm<UserSkillInput>({
    resolver: zodResolver(userSkillSchema),
    defaultValues: { proficiency: 'intermediate' }
  });

  const fetchUserSkills = async () => {
    try {
      const res = await fetch('/api/v1/profiles/me/skills');
      if (res.ok) {
        const data = await res.json();
        setSkills(data.userSkills);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserSkills();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        const res = await fetch(`/api/v1/skills?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.skills);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const onAddSkill = async (data: UserSkillInput) => {
    setError(null);
    try {
      const res = await fetch('/api/v1/profiles/me/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to add skill');
      }
      reset();
      setSearchQuery('');
      setSearchResults([]);
      fetchUserSkills();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const removeSkill = async (skillId: string) => {
    try {
      await fetch(`/api/v1/profiles/me/skills/${skillId}`, { method: 'DELETE' });
      fetchUserSkills();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-accent w-8 h-8" /></div>;

  return (
    <div className="w-full max-w-2xl mx-auto bg-surface p-8 sm:p-10 rounded-2xl border border-border shadow-elevation-overlay mt-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-primary mb-2">Technical Skills</h2>
        <p className="text-sm text-secondary">Add your skills and proficiency levels to improve your matchmaking accuracy.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/20 text-error text-sm rounded-xl">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-8">
        {skills.map((us) => (
          <div key={us.skillId} className="flex items-center bg-background border border-border text-primary px-3 py-1.5 rounded-xl text-sm shadow-elevation-low transition-all duration-200 hover:shadow-elevation-flat">
            <span className="w-2 h-2 rounded-full bg-accent mr-2.5"></span>
            <span className="font-medium mr-3">{us.skill.name}</span>
            <span className="text-secondary font-mono text-[10px] uppercase tracking-wider mr-3 border-l border-border pl-3">{us.proficiency}</span>
            <button onClick={() => removeSkill(us.skillId)} className="text-muted hover:text-error transition-colors p-0.5 rounded-full hover:bg-error/10">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        {skills.length === 0 && (
          <div className="w-full py-8 text-center border-2 border-dashed border-border rounded-xl">
            <p className="text-muted text-sm">No skills added yet.</p>
          </div>
        )}
      </div>

      <div className="border-t border-border pt-8">
        <h3 className="text-sm font-medium text-primary mb-4">Add a new skill</h3>
        
        <div className="relative mb-5">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search skills (e.g. React, Python, AWS)"
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
          />
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-surface border border-border rounded-xl shadow-elevation-overlay max-h-56 overflow-y-auto">
              {searchResults.map(skill => (
                <button
                  key={skill.id}
                  onClick={() => {
                    setValue('skillId', skill.id);
                    setSearchQuery(skill.name);
                    setSearchResults([]);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-primary hover:bg-surface-elevated transition-colors first:rounded-t-xl last:rounded-b-xl"
                >
                  {skill.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onAddSkill)} className="flex flex-col sm:flex-row items-end gap-4">
          <input type="hidden" {...register('skillId')} />
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-secondary mb-1.5">Proficiency Level</label>
            <select
              {...register('proficiency')}
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto bg-surface-elevated border border-border hover:border-accent hover:text-accent text-primary font-medium py-2.5 px-6 rounded-xl flex items-center justify-center transition-all duration-200 shadow-elevation-low min-h-[44px]"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Skill
          </button>
        </form>
      </div>
    </div>
  );
}
