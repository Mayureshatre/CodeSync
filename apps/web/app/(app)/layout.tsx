import { AppNavbar } from '../../src/components/navigation/AppNavbar';
import { PendingDeletionBanner } from '../../src/components/account/PendingDeletionBanner';

export default function AppLayout({ children }: { children: React.ReactNode }) { 
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppNavbar />
      <PendingDeletionBanner />
      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>
    </div>
  ); 
}
