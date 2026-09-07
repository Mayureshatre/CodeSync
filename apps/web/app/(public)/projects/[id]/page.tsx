import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { getProjectBySlug } from '@/src/server/services/projectService';
import { ProjectView } from '@/src/components/project/ProjectView';

export default async function PublicProjectPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const actorId = session?.user?.id;

  try {
    const project = await getProjectBySlug(params.id, actorId);
    const isOwner = actorId === project.ownerId;

    return (
      <div className="py-10 px-4 sm:px-6 lg:px-8 bg-[#0B0D10] min-h-screen">
        <ProjectView project={project} isOwner={isOwner} />
      </div>
    );
  } catch (error) {
    notFound();
  }
}
