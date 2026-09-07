'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectSchema, ProjectInput } from '@/src/lib/validations/project';
import { Loader2, Plus, X, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ProjectForm({ projectId, initialData }: { projectId?: string, initialData?: any }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [skillSearchResults, setSkillSearchResults] = useState<any[]>([]);

  const { register, control, handleSubmit, formState: { errors, isSubmitting }, watch, setValue } = useForm<any>({
    resolver: zodResolver(projectSchema),
    defaultValues: initialData || {
      status: 'draft',
      remoteFlag: true,
      collaborationType: [],
      visibility: 'open_source',
      tags: [],
      projectSkills: [],
      projectRoles: [],
    }
  });

  const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({
    control,
    name: "projectSkills"
  });

  const { fields: roleFields, append: appendRole, remove: removeRole } = useFieldArray({
    control,
    name: "projectRoles"
  });

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (skillSearchQuery.length >= 2) {
        const res = await fetch(`/api/v1/skills?q=${encodeURIComponent(skillSearchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSkillSearchResults(data.skills);
        }
      } else {
        setSkillSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [skillSearchQuery]);

  const onSubmit = async (data: any) => {
    setError(null);
    try {
      const url = projectId ? `/api/v1/projects/${projectId}` : '/api/v1/projects';
      const method = projectId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to save project');
      }

      const { project } = await res.json();
      router.push(`/projects/${project.slug}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const currentTags = watch('tags') || [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto bg-[#181c24] p-8 rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.45),0_0_0_1px_#263042]">
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">{projectId ? 'Edit Project' : 'Create Project'}</h2>
        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-sm rounded-[8px]">
            {error}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#f1f5f9] mb-1">Project Name</label>
          <input {...register('name')} className="w-full bg-[#141822] border border-[#263042] rounded-[8px] px-3 py-2 text-white" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{(errors.name?.message as string)}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#f1f5f9] mb-1">Description</label>
          <textarea {...register('description')} rows={4} className="w-full bg-[#141822] border border-[#263042] rounded-[8px] px-3 py-2 text-white" />
          {errors.description && <p className="text-red-500 text-xs mt-1">{(errors.description?.message as string)}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#f1f5f9] mb-1">Category</label>
            <input {...register('category')} className="w-full bg-[#141822] border border-[#263042] rounded-[8px] px-3 py-2 text-white" />
            {errors.category && <p className="text-red-500 text-xs mt-1">{(errors.category?.message as string)}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#f1f5f9] mb-1">Target Team Size</label>
            <input type="number" {...register('teamSizeTarget', { valueAsNumber: true })} className="w-full bg-[#141822] border border-[#263042] rounded-[8px] px-3 py-2 text-white" />
            {errors.teamSizeTarget && <p className="text-red-500 text-xs mt-1">{(errors.teamSizeTarget?.message as string)}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#f1f5f9] mb-1">Collaboration Types</label>
          <div className="flex flex-wrap gap-2">
            {['short_term', 'long_term', 'open_source', 'startup', 'freelance'].map(type => (
              <label key={type} className="flex items-center space-x-2 text-white text-sm">
                <input type="checkbox" value={type} {...register('collaborationType')} className="rounded bg-[#141822] border-[#263042] text-[#06b6d4] focus:ring-[#06b6d4]" />
                <span className="capitalize">{type.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
          {errors.collaborationType && <p className="text-red-500 text-xs mt-1">{(errors.collaborationType?.message as string)}</p>}
        </div>
      </div>

      <div className="border-t border-[#263042] pt-6">
        <h3 className="text-lg font-bold text-white mb-4">Project Skills</h3>
        
        {/* Simplified skill search & add */}
        <div className="relative mb-4">
          <input
            type="text"
            value={skillSearchQuery}
            onChange={(e) => setSkillSearchQuery(e.target.value)}
            placeholder="Search and add skills..."
            className="w-full bg-[#141822] border border-[#263042] rounded-[8px] px-3 py-2 text-white"
          />
          {skillSearchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-[#181c24] border border-[#263042] rounded-[8px] shadow-lg max-h-48 overflow-y-auto">
              {skillSearchResults.map(skill => (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => {
                    appendSkill({ skillId: skill.id, requirementType: 'required', minProficiency: 'intermediate' } as any);
                    setSkillSearchQuery('');
                    setSkillSearchResults([]);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-[#f1f5f9] hover:bg-[#1e2433]"
                >
                  {skill.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          {skillFields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-4 bg-[#141822] p-3 rounded-[8px] border border-[#263042]">
              <span className="text-white flex-1 font-medium text-sm">Skill ID: {(field as any).skillId}</span>
              <select {...register(`projectSkills.${index}.requirementType`)} className="bg-[#181c24] text-white text-sm border border-[#263042] rounded p-1">
                <option value="required">Required</option>
                <option value="preferred">Preferred</option>
              </select>
              <select {...register(`projectSkills.${index}.minProficiency`)} className="bg-[#181c24] text-white text-sm border border-[#263042] rounded p-1">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
              <button type="button" onClick={() => removeSkill(index)} className="text-red-400 hover:text-red-300">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[#263042] pt-6">
        <h3 className="text-lg font-bold text-white mb-4">Roles</h3>
        <button
          type="button"
          onClick={() => appendRole({ title: '', slotsAvailable: 1, skills: [] })}
          className="text-[#06b6d4] text-sm font-medium flex items-center mb-4"
        >
          <Plus className="w-4 h-4 mr-1" /> Add Role
        </button>

        <div className="space-y-4">
          {roleFields.map((field, index) => (
            <div key={field.id} className="bg-[#141822] p-4 rounded-[8px] border border-[#263042]">
              <div className="flex gap-4 mb-2">
                <input {...register(`projectRoles.${index}.title`)} placeholder="Role Title" className="flex-1 bg-[#181c24] border border-[#263042] rounded-[4px] px-2 py-1 text-white text-sm" />
                <input type="number" {...register(`projectRoles.${index}.slotsAvailable`, { valueAsNumber: true })} placeholder="Slots" className="w-20 bg-[#181c24] border border-[#263042] rounded-[4px] px-2 py-1 text-white text-sm" />
                <button type="button" onClick={() => removeRole(index)} className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {(errors.projectRoles as any)?.[index]?.title && <p className="text-red-500 text-xs mb-2">{(errors.projectRoles as any)[index]?.title?.message as string}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="pt-6 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#06b6d4] hover:bg-[#0891b2] text-[#0a0e16] font-bold py-2 px-6 rounded-[8px] flex items-center transition-colors disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : null}
          {projectId ? 'Save Changes' : 'Create Project'}
        </button>
      </div>
    </form>
  );
}
