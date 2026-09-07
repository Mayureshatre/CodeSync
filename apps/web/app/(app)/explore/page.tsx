'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function ExplorePage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/matches')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load recommendations');
        return res.json();
      })
      .then(json => {
        setData(json.recommendations || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#06b6d4]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
        <p className="text-red-400">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[#1e2433] text-white rounded hover:bg-[#263042]">Retry</button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">No matches yet</h2>
        <p className="text-[#94a3b8]">Complete your profile and add skills to get personalized recommendations.</p>
        <Link href="/profile/edit" className="px-4 py-2 bg-[#06b6d4] text-[#0a0e16] font-bold rounded-[8px] hover:bg-[#0891b2]">
          Update Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold text-white mb-8">Recommended Projects</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.map((item: any) => (
          <div key={item.project.id} className="bg-[#181c24] p-6 rounded-[12px] border border-[#263042] flex flex-col h-full hover:border-[#06b6d4] transition-colors">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-white line-clamp-1">{item.project.name}</h2>
              {item.match && (
                <div className="flex flex-col items-end shrink-0 ml-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-[#06b6d4] bg-[#06b6d4]/10 text-[#06b6d4] font-bold">
                    {Math.round(item.match.score)}%
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-[#94a3b8] text-sm mb-4 line-clamp-3 flex-1">{item.project.description}</p>
            
            {item.match && (
              <div className="text-xs text-[#06b6d4] bg-[#06b6d4]/10 px-3 py-2 rounded mb-4">
                {item.match.explanation}
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 mb-6">
              {item.project.projectSkills?.slice(0, 3).map((ps: any) => (
                <span key={ps.skillId} className="px-2 py-1 bg-[#1e2433] text-[#94a3b8] text-xs rounded border border-[#263042]">
                  {ps.skill.name}
                </span>
              ))}
              {item.project.projectSkills?.length > 3 && (
                <span className="px-2 py-1 bg-[#1e2433] text-[#94a3b8] text-xs rounded border border-[#263042]">
                  +{item.project.projectSkills.length - 3} more
                </span>
              )}
            </div>
            
            <Link href={`/projects/${item.project.id}`} className="block w-full text-center py-2 bg-[#1e2433] hover:bg-[#263042] text-white rounded-[8px] transition-colors mt-auto">
              View Project
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
