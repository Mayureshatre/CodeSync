'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Blocks, Menu, X, Compass, FolderKanban, MessageSquare, Bell, User } from 'lucide-react';

export function AppNavbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Explore', href: '/explore', icon: Compass },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/explore" className="flex items-center gap-2" onClick={closeMenu}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aurora-1 to-aurora-2 flex items-center justify-center shadow-elevation-low">
              <Blocks className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">CodeSync</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1 h-full">
          {navLinks.map((link) => {
            const isActive = pathname?.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 min-h-[44px] ${
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-secondary hover:text-primary hover:bg-surface-elevated'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center">
          <button
            type="button"
            className="p-2 -mr-2 text-secondary hover:text-primary rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-surface border-b border-border shadow-elevation-overlay py-4 px-4 flex flex-col gap-2">
          {navLinks.map((link) => {
            const isActive = pathname?.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={closeMenu}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors min-h-[44px] ${
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-secondary hover:text-primary hover:bg-surface-elevated'
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.name}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
