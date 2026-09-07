import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { getProjectById } from '@/src/server/services/projectService';
import { ProjectForm } from '@/src/components/project/ProjectForm';

export default async function EditProjectPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  try {
    const project = await getProjectById(params.id, session.user.id);
    
    if (project.ownerId !== session.user.id) {
      notFound();
    }

    return (
      <div className="py-10 px-4 sm:px-6 lg:px-8 bg-[#0B0D10] min-h-screen">
        <ProjectForm projectId={project.id} initialData={project} />
      </div>
    );
  } catch (error) {
    notFound();
  }
}
