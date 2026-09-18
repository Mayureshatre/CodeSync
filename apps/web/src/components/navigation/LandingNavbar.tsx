'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Blocks, Menu, X } from 'lucide-react';

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="px-6 h-20 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aurora-1 to-aurora-2 flex items-center justify-center shadow-elevation-low">
            <Blocks className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">CodeSync</span>
        </Link>
      </div>
      
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-8 text-sm font-medium">
        <Link href="/explore" className="text-secondary hover:text-primary transition-colors min-h-[44px] flex items-center">Explore</Link>
        <Link href="/projects" className="text-secondary hover:text-primary transition-colors min-h-[44px] flex items-center">Projects</Link>
        <Link href="/auth/login" className="text-secondary hover:text-primary transition-colors min-h-[44px] flex items-center">Sign in</Link>
        <Link href="/auth/signup" className="bg-primary text-background hover:opacity-90 px-5 py-2.5 rounded-lg transition-all duration-200 min-h-[44px] flex items-center justify-center">
          Get Started
        </Link>
      </div>

      {/* Mobile Menu Toggle */}
      <div className="md:hidden flex items-center">
        <button
          type="button"
          className="text-secondary hover:text-primary min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-surface border-b border-border shadow-elevation-overlay p-4 flex flex-col gap-2">
          <Link href="/explore" onClick={() => setMobileMenuOpen(false)} className="text-secondary hover:text-primary transition-colors px-4 py-3 min-h-[44px] flex items-center rounded-xl font-medium">Explore</Link>
          <Link href="/projects" onClick={() => setMobileMenuOpen(false)} className="text-secondary hover:text-primary transition-colors px-4 py-3 min-h-[44px] flex items-center rounded-xl font-medium">Projects</Link>
          <div className="h-px bg-border my-2"></div>
          <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="text-secondary hover:text-primary transition-colors px-4 py-3 min-h-[44px] flex items-center rounded-xl font-medium">Sign in</Link>
          <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)} className="bg-primary text-background hover:opacity-90 px-4 py-3 mt-2 rounded-xl transition-all duration-200 min-h-[44px] flex items-center justify-center font-medium">
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}
