import { fetchInterviewSessions } from '@/app/chat/actions';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function InterviewSidebar() {
  const { userId } = await auth();

  if (!userId) {
    return <p>Not authenticated</p>;
  }

  const sessions = await fetchInterviewSessions(userId);

  return (
    <aside className="w-64 border-r p-4 overflow-auto">
      <h2 className="text-lg font-semibold mb-4">Interview History</h2>
      <div className="space-y-2">
        {sessions.map((session) => (
          <Link
            key={session.id}
            href={`/chat/${session.id}`}
            className="block p-3 rounded-lg hover:bg-accent transition-colors"
          >
            <div className="text-sm font-medium truncate">{session.jobType}</div>
            <div className="text-xs text-muted-foreground">
              {new Date(Number(session.createdAt)).toLocaleDateString()}
            </div>
            <div className="text-xs text-muted-foreground capitalize">
              {session.difficulty} · {session.questionType}
            </div>
          </Link>
        ))}
      </div>
    </aside>
  );
}
