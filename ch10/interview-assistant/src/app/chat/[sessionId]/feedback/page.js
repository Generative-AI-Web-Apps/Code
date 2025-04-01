import { notFound } from 'next/navigation';
import {
  getInterviewFeedback,
  getInterviewSession,
  saveInterviewFeedback,
  generateInterviewFeedback,
} from '../../actions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import Markdown from '@/components/Markdown';

export const dynamic = 'force-dynamic';

export default async function FeedbackPage({ params }) {
  const { sessionId } = params;

  try {
    await getInterviewSession(sessionId);
  } catch (error) {
    console.error('Session error:', error);
    return notFound();
  }

  let feedback = await getInterviewFeedback(sessionId);

  if (!feedback) {
    // Generate feedback if it doesn't exist
    feedback = await generateInterviewFeedback(sessionId);
    await saveInterviewFeedback(sessionId, feedback);
  }
  return (
    <div className="container mx-auto py-10">
      <Card className="w-[80%] mx-auto">
        <CardHeader>
          <CardTitle>Interview Feedback</CardTitle>
          <CardDescription>Here's a comprehensive feedback for the interview session.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose lg:prose-lg"><Markdown text={feedback} /></div>
        </CardContent>
      </Card>
    </div>
  );
}
