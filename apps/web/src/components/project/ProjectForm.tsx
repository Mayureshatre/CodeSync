'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectSchema, ProjectInput } from '@/src/lib/validations/project';
import { Loader2, Plus, X, Trash2, Search } from 'lucide-react';
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
      window.location.href = `/projects/${project.slug}`;
    } catch (err: any) {
      setError(err.message);
    }
  };

  const currentTags = watch('tags') || [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 w-full max-w-3xl mx-auto bg-surface p-8 sm:p-10 rounded-2xl border border-border shadow-elevation-overlay">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary mb-2">{projectId ? 'Edit Workspace' : 'Create a Workspace'}</h2>
        <p className="text-sm text-secondary">Define your project details, required skills, and team roles.</p>
        
        {error && (
          <div className="mt-6 p-4 bg-error/10 border border-error/20 text-error text-sm rounded-xl">
            {error}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-primary mb-1.5">Project Name</label>
          <input 
            {...register('name')} 
            placeholder="e.g. CodeSync Platform"
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200 shadow-elevation-flat" 
          />
          {errors.name && <p className="text-error text-sm mt-1.5">{(errors.name?.message as string)}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-1.5">Description</label>
          <textarea 
            {...register('description')} 
            rows={4} 
            placeholder="Describe what you are building and why..."
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200 resize-none shadow-elevation-flat" 
          />
          {errors.description && <p className="text-error text-sm mt-1.5">{(errors.description?.message as string)}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">Category</label>
            <input 
              {...register('category')} 
              placeholder="e.g. Developer Tools"
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200 shadow-elevation-flat" 
            />
            {errors.category && <p className="text-error text-sm mt-1.5">{(errors.category?.message as string)}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1.5">Target Team Size</label>
            <input 
              type="number" 
              {...register('teamSizeTarget', { valueAsNumber: true })} 
              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200 shadow-elevation-flat" 
            />
            {errors.teamSizeTarget && <p className="text-error text-sm mt-1.5">{(errors.teamSizeTarget?.message as string)}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-3">Collaboration Types</label>
          <div className="flex flex-wrap gap-3">
            {['short_term', 'long_term', 'open_source', 'startup', 'freelance'].map(type => (
              <label key={type} className="flex items-center space-x-2 text-secondary hover:text-primary transition-colors cursor-pointer text-sm">
                <input 
                  type="checkbox" 
                  value={type} 
                  {...register('collaborationType')} 
                  className="rounded bg-background border-border text-accent focus:ring-accent/20 focus:ring-2 w-4 h-4 cursor-pointer" 
                />
                <span className="capitalize">{type.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
          {errors.collaborationType && <p className="text-error text-sm mt-2">{(errors.collaborationType?.message as string)}</p>}
        </div>
      </div>

      <div className="border-t border-border pt-8">
        <div className="mb-6">
          <h3 className="text-xl font-bold tracking-tight text-primary mb-1">Project Skills</h3>
          <p className="text-sm text-secondary">List the core technologies required for this project.</p>
        </div>
        
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={skillSearchQuery}
            onChange={(e) => setSkillSearchQuery(e.target.value)}
            placeholder="Search and add skills..."
            className="w-full bg-background border border-border rounded-xl pl-11 pr-4 py-2.5 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200 shadow-elevation-flat"
          />
          {skillSearchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-surface-elevated border border-border rounded-xl shadow-elevation-overlay max-h-56 overflow-y-auto">
              {skillSearchResults.map(skill => (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => {
                    appendSkill({ skillId: skill.id, requirementType: 'required', minProficiency: 'intermediate' } as any);
                    setSkillSearchQuery('');
                    setSkillSearchResults([]);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-primary hover:bg-surface hover:text-accent transition-colors first:rounded-t-xl last:rounded-b-xl"
                >
                  {skill.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {skillFields.length > 0 ? (
          <div className="space-y-3">
            {skillFields.map((field, index) => (
              <div key={field.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 bg-background p-4 rounded-xl border border-border shadow-elevation-low transition-all">
                <span className="text-primary flex-1 font-medium text-sm">Skill ID: {(field as any).skillId}</span>
                <div className="flex gap-3">
                  <select {...register(`projectSkills.${index}.requirementType`)} className="bg-surface text-primary text-sm border border-border focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none rounded-lg px-2 py-1.5 transition-all">
                    <option value="required">Required</option>
                    <option value="preferred">Preferred</option>
                  </select>
                  <select {...register(`projectSkills.${index}.minProficiency`)} className="bg-surface text-primary text-sm border border-border focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none rounded-lg px-2 py-1.5 transition-all">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                  <button type="button" onClick={() => removeSkill(index)} className="text-muted hover:text-error hover:bg-error/10 p-1.5 rounded-lg transition-colors" title="Remove Skill">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full py-6 text-center border-2 border-dashed border-border rounded-xl">
            <p className="text-muted text-sm">No skills added yet.</p>
          </div>
        )}
      </div>

      <div className="border-t border-border pt-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-primary mb-1">Roles</h3>
            <p className="text-sm text-secondary">Define the positions you are hiring for.</p>
          </div>
          <button
            type="button"
            onClick={() => appendRole({ title: '', slotsAvailable: 1, skills: [] })}
            className="text-accent text-sm font-medium flex items-center hover:text-accent-secondary transition-colors bg-accent/10 px-3 py-1.5 rounded-lg"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Role
          </button>
        </div>

        {roleFields.length > 0 ? (
          <div className="space-y-4">
            {roleFields.map((field, index) => (
              <div key={field.id} className="bg-background p-5 rounded-xl border border-border shadow-elevation-low transition-all">
                <div className="flex flex-col sm:flex-row gap-4 mb-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-secondary mb-1.5">Role Title</label>
                    <input 
                      {...register(`projectRoles.${index}.title`)} 
                      placeholder="e.g. Frontend Engineer" 
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent/20 focus:border-accent transition-all" 
                    />
                  </div>
                  <div className="w-full sm:w-24">
                    <label className="block text-xs font-medium text-secondary mb-1.5">Slots</label>
                    <input 
                      type="number" 
                      {...register(`projectRoles.${index}.slotsAvailable`, { valueAsNumber: true })} 
                      placeholder="1" 
                      className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent/20 focus:border-accent transition-all" 
                    />
                  </div>
                  <div className="flex items-end pb-1">
                    <button type="button" onClick={() => removeRole(index)} className="text-muted hover:text-error hover:bg-error/10 p-2 rounded-lg transition-colors" title="Remove Role">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {(errors.projectRoles as any)?.[index]?.title && <p className="text-error text-xs mt-1.5">{(errors.projectRoles as any)[index]?.title?.message as string}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full py-6 text-center border-2 border-dashed border-border rounded-xl">
            <p className="text-muted text-sm">No specific roles defined.</p>
          </div>
        )}
      </div>

      <div className="pt-8 mt-2 border-t border-border flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-accent hover:opacity-90 active:scale-[0.98] text-white font-medium py-2.5 px-8 rounded-xl flex items-center transition-all duration-200 disabled:opacity-50 disabled:active:scale-100 shadow-elevation-low"
        >
          {isSubmitting ? <Loader2 className="animate-spin w-5 h-5 mr-2.5" /> : null}
          {projectId ? 'Save Workspace' : 'Create Workspace'}
        </button>
      </div>
    </form>
  );
}
