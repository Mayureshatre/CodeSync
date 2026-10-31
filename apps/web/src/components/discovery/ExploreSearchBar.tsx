'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';

interface ExploreSearchBarProps {
  actionPath: string;
  placeholder?: string;
}

export function ExploreSearchBar({
  actionPath,
  placeholder = 'Search...',
}: ExploreSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams?.get('q') || '';
  const [query, setQuery] = useState(initialQ);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (query.trim()) {
      params.set('q', query.trim());
    } else {
      params.delete('q');
    }
    const queryString = params.toString();
    router.push(queryString ? `${actionPath}?${queryString}` : actionPath);
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-3xl">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
      <input
        type="text"
        name="q"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full bg-surface border border-border text-primary placeholder:text-muted rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200 shadow-elevation-flat"
      />
    </form>
  );
}
