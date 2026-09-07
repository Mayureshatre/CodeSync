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

  if (loading) return <Loader2 className="animate-spin text-[#06b6d4] mx-auto my-8" />;

  return (
    <div className="max-w-2xl mx-auto bg-[#181c24] p-8 rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.45),0_0_0_1px_#263042] mt-8">
      <h2 className="text-xl font-bold text-white mb-4">Your Skills</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-sm rounded-[8px]">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        {skills.map((us) => (
          <div key={us.skillId} className="flex items-center bg-[#141822] border border-[#06b6d4] text-[#f1f5f9] px-3 py-1.5 rounded-[8px] text-sm">
            <span className="w-2 h-2 rounded-full bg-[#06b6d4] mr-2"></span>
            <span className="font-medium mr-2">{us.skill.name}</span>
            <span className="text-[#94a3b8] text-xs mr-2 border-l border-[#263042] pl-2">{us.proficiency}</span>
            <button onClick={() => removeSkill(us.skillId)} className="text-[#94a3b8] hover:text-red-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        {skills.length === 0 && <p className="text-[#64748b] text-sm">No skills added yet.</p>}
      </div>

      <div className="border-t border-[#263042] pt-6">
        <h3 className="text-sm font-medium text-[#f1f5f9] mb-3">Add a Skill</h3>
        
        <div className="relative mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search skills (e.g. React, Python)"
            className="w-full bg-[#141822] border border-[#263042] rounded-[8px] px-3 py-2 text-[14px] text-white placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/20 focus:border-[#06b6d4]"
          />
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-[#181c24] border border-[#263042] rounded-[8px] shadow-lg max-h-48 overflow-y-auto">
              {searchResults.map(skill => (
                <button
                  key={skill.id}
                  onClick={() => {
                    setValue('skillId', skill.id);
                    setSearchQuery(skill.name);
                    setSearchResults([]);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-[#f1f5f9] hover:bg-[#1e2433] transition-colors"
                >
                  {skill.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onAddSkill)} className="flex items-end gap-4">
          <input type="hidden" {...register('skillId')} />
          <div className="flex-1">
            <label className="block text-xs text-[#94a3b8] mb-1">Proficiency</label>
            <select
              {...register('proficiency')}
              className="w-full bg-[#141822] border border-[#263042] rounded-[8px] px-3 py-2 text-[14px] text-white focus:outline-none focus:ring-2 focus:ring-[#06b6d4]/20 focus:border-[#06b6d4]"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-transparent border border-[#263042] hover:bg-[#1e2433] hover:border-[#334155] text-[#f1f5f9] font-medium py-2 px-4 rounded-[8px] flex items-center transition-colors h-[38px]"
          >
            <Plus className="w-4 h-4 mr-2" /> Add
          </button>
        </form>
      </div>
    </div>
  );
}
