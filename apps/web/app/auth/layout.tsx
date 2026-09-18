import { ReactNode } from 'react';
import Link from 'next/link';
import { Blocks } from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Subtle Aurora Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] opacity-20 pointer-events-none blur-[120px] rounded-full"
           style={{ background: 'radial-gradient(circle at center, rgb(var(--aurora-1)), rgb(var(--aurora-2)), transparent 70%)' }}>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 flex flex-col items-center mb-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-aurora-1 to-aurora-2 flex items-center justify-center shadow-elevation-low group-hover:shadow-elevation-overlay transition-all duration-300 transform group-hover:-translate-y-0.5">
            <Blocks className="w-4 h-4 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-primary">CodeSync</span>
        </Link>
      </div>

      <div className="relative z-10">
        {children}
      </div>
    </main>
  );
}
