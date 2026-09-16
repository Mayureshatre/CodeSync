import React from 'react';
import Link from 'next/link';
import { ArrowRight, Puzzle, Sparkles, Code2, Users, Layout, Blocks } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-primary selection:bg-accent/20">
      
      {/* Navigation */}
      <nav className="px-6 h-20 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aurora-1 to-aurora-2 flex items-center justify-center shadow-elevation-low">
            <Blocks className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">CodeSync</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="/explore" className="text-secondary hover:text-primary transition-colors">Explore</Link>
          <Link href="/projects" className="text-secondary hover:text-primary transition-colors">Projects</Link>
          <Link href="/auth/login" className="text-secondary hover:text-primary transition-colors">Sign in</Link>
          <Link href="/auth/signup" className="bg-primary text-background hover:opacity-90 px-5 py-2.5 rounded-lg transition-all duration-200">
            Get Started
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center">
        
        {/* Hero Section */}
        <section className="relative w-full max-w-7xl mx-auto px-6 py-32 md:py-48 flex flex-col items-center text-center overflow-hidden">
          
          {/* Subtle Aurora Background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] opacity-30 dark:opacity-20 pointer-events-none blur-[120px] rounded-full"
               style={{ background: 'radial-gradient(circle at center, rgb(var(--aurora-1)), rgb(var(--aurora-2)), transparent 70%)' }}>
          </div>

          <div className="relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-elevated border border-border shadow-elevation-flat text-sm font-medium text-secondary mb-8">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>The premium network for builders</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 max-w-4xl mx-auto leading-tight">
              Where developers find their <span className="text-transparent bg-clip-text bg-gradient-to-r from-aurora-1 via-aurora-2 to-aurora-3">missing piece.</span>
            </h1>
            
            <p className="text-xl text-secondary mb-12 max-w-2xl mx-auto leading-relaxed">
              Find exactly the skills you need, match with passionate collaborators, and build your next big idea together in dedicated collaborative workspaces.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/signup" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-accent text-white hover:opacity-90 font-medium px-8 py-4 rounded-xl transition-all duration-200 shadow-elevation-low hover:shadow-elevation-overlay">
                Create your profile
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/explore" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-surface hover:bg-surface-elevated text-primary border border-border font-medium px-8 py-4 rounded-xl transition-all duration-200">
                Explore projects
              </Link>
            </div>
          </div>
        </section>

        {/* Abstract Matchmaking UI Representation */}
        <section className="w-full max-w-5xl mx-auto px-6 pb-32 relative">
          <div className="relative rounded-2xl md:rounded-3xl border border-border bg-surface p-8 md:p-12 shadow-elevation-overlay overflow-hidden">
            {/* Subtle inner aurora */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 relative z-10">
              
              {/* Dev 1 */}
              <div className="flex flex-col gap-4 w-full md:w-72 bg-background border border-border rounded-xl p-6 shadow-elevation-low transform transition-transform hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface-elevated border border-border flex items-center justify-center">
                    <Layout className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold">Frontend Dev</div>
                    <div className="text-xs text-secondary font-mono">React, Tailwind</div>
                  </div>
                </div>
                <div className="h-2 w-full bg-surface-elevated rounded-full overflow-hidden">
                  <div className="h-full bg-aurora-1 w-[85%] rounded-full" />
                </div>
              </div>

              {/* Match Connection */}
              <div className="flex flex-col items-center justify-center relative">
                <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center animate-pulse relative z-10">
                  <Puzzle className="w-6 h-6 text-accent" />
                </div>
                <div className="hidden md:block absolute top-1/2 left-[-150px] right-[-150px] h-[1px] bg-gradient-to-r from-transparent via-accent to-transparent z-0 opacity-50" />
              </div>

              {/* Dev 2 */}
              <div className="flex flex-col gap-4 w-full md:w-72 bg-background border border-border rounded-xl p-6 shadow-elevation-low transform transition-transform hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface-elevated border border-border flex items-center justify-center">
                    <Code2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold">Backend Dev</div>
                    <div className="text-xs text-secondary font-mono">Node.js, Postgres</div>
                  </div>
                </div>
                <div className="h-2 w-full bg-surface-elevated rounded-full overflow-hidden">
                  <div className="h-full bg-aurora-2 w-[92%] rounded-full" />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Value Proposition Grid */}
        <section className="w-full bg-surface-elevated py-32 border-t border-border">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-20 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Built for serious collaboration</h2>
              <p className="text-secondary text-lg">
                We remove the friction from finding your next co-founder, side-project partner, or open-source contributor.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Puzzle className="w-6 h-6 text-accent" />,
                  title: "Intelligent Matching",
                  desc: "Our engine analyzes skill requirements, proficiency levels, and availability to surface the most complementary developers."
                },
                {
                  icon: <Blocks className="w-6 h-6 text-aurora-2" />,
                  title: "Shared Workspaces",
                  desc: "Move from matching to building instantly. Each collaboration gets a dedicated sandbox with milestone tracking and resource links."
                },
                {
                  icon: <Users className="w-6 h-6 text-aurora-3" />,
                  title: "Verified Portfolios",
                  desc: "Showcase your actual technical expertise, past collaborations, and verified skills instead of just another resume."
                }
              ].map((feature, i) => (
                <div key={i} className="bg-surface border border-border p-8 rounded-2xl flex flex-col gap-4 hover:shadow-elevation-low transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-surface-elevated border border-border flex items-center justify-center mb-2">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-secondary leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-32 border-t border-border bg-background relative overflow-hidden">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] opacity-30 dark:opacity-20 pointer-events-none blur-[100px] rounded-t-full"
               style={{ background: 'radial-gradient(ellipse at bottom, rgb(var(--aurora-2)), transparent 70%)' }}>
          </div>
          
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">Ready to sync?</h2>
            <p className="text-xl text-secondary mb-12 max-w-2xl mx-auto">
              Join the premier network of developers building the next generation of software together.
            </p>
            <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 bg-primary text-background hover:opacity-90 font-medium px-10 py-5 rounded-xl transition-all duration-200 shadow-elevation-low hover:shadow-elevation-overlay">
              Start building today
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border bg-surface py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-aurora-1 to-aurora-2 flex items-center justify-center shadow-elevation-low">
                <Blocks className="w-3 h-3 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">CodeSync</span>
            </div>
            <p className="text-secondary max-w-sm leading-relaxed">
              Where developers find their missing piece. The premium matchmaking platform for ambitious builders.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 text-primary">Platform</h4>
            <ul className="space-y-4 text-secondary text-sm">
              <li><Link href="/explore" className="hover:text-primary transition-colors">Explore Developers</Link></li>
              <li><Link href="/projects" className="hover:text-primary transition-colors">Browse Projects</Link></li>
              <li><Link href="/auth/login" className="hover:text-primary transition-colors">Sign In</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 text-primary">Legal</h4>
            <ul className="space-y-4 text-secondary text-sm">
              <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted">
          <div>&copy; {new Date().getFullYear()} CodeSync. All rights reserved.</div>
          <div className="font-mono text-xs">Premium Minimal Engine</div>
        </div>
      </footer>
    </div>
  );
}
