import { Suspense } from 'react';
import Link from 'next/link';
import { getInterviewSession } from '../actions';
import ChatThread from '@/components/chat/ChatThread';
import { isTTSEnabled } from '@/features/text-to-speach';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function ChatPage({ params }) {
  try {
    const session = await getInterviewSession(params.sessionId);
    const ttsEnabled = isTTSEnabled();
    return (
      <div className="container mx-auto p-4">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader className="bg-slate-50">
            <div className="flex justify-between items-center">
              <CardTitle>
                {session.jobType} Interview ({session.difficulty})
              </CardTitle>
              <div className="text-sm text-slate-500">
                {session.isCompleted ? (
                  <span className="bg-green-100 text-green-800 py-1 px-2 rounded">Completed</span>
                ) : (
                  <span className="bg-blue-100 text-blue-800 py-1 px-2 rounded">In Progress</span>
                )}
              </div>
            </div>
            <div className="flex gap-4 text-sm text-slate-500">
              <div>Questions: {session.questionCount}</div>
              <div>Type: {session.questionType}</div>
              {ttsEnabled && <div className="text-blue-600">Voice Interview Available</div>}
              {session.isCompleted && <Link href={`/chat/${params.sessionId}/feedback`}><b>View Feedback</b></Link>}
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <Suspense fallback={<div>Loading interview session...</div>}>
              <ChatThread
                sessionId={params.sessionId}
                initialMessages={session.messages || []}
                isCompleted={session.isCompleted}
              />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error('Error loading interview session:', error);
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-4xl">
          <CardContent className="pt-6">
            <p className="text-center text-red-500">Failed to load interview session</p>
          </CardContent>
        </Card>
      </div>
    );
  }
}
