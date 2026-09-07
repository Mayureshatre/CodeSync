import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0B0D10] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}
