'use client';

import { useState, useEffect } from 'react';
import { useActions, useUIState } from 'ai/rsc';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const JOB_TYPE_CUSTOM = 'custom';
const JOB_TYPE_SOFTWARE_ENGINEER = 'software-engineer';

const SOFTWARE_ENGINEER_DESCRIPTION =
  'We are looking for a Software Engineer to join our team to design, develop and implement software solutions. The ideal candidate has strong problem-solving skills, proficiency in multiple programming languages, and experience with software development methodologies.';

const QuestionDifficulty = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
};

const QuestionType = {
  BEHAVIORAL: 'behavioral',
  TECHNICAL: 'technical',
  MIXED: 'mixed',
};

const DISPLAY_TEXT = {
  JOB_SELECTION_TITLE: 'Select Job Role',
  CUSTOM_JOB: 'Custom Job',
  SOFTWARE_ENGINEER: 'Software Engineer',
  JOB_TITLE_PLACEHOLDER: 'Job title (Required)',
  JOB_DESCRIPTION_PLACEHOLDER:
    'Job description (Optional) - Get tailored interview questions by providing a job description',
  CUSTOMIZE_INTERVIEW_TITLE: 'Customize Interview Details',
  DIFFICULTY_SELECTION_TEXT: 'Choose difficulty: easy, medium, or hard.',
  QUESTION_TYPE_SELECTION_TEXT: 'Choose question type: behavioral, technical, or mixed.',
  QUESTION_COUNT_SELECTION_TEXT: 'How many questions?',
  START_INTERVIEW_TITLE: 'Start Interview',
  START_INTERVIEW_BUTTON: 'Start Interview',
  JOB_TITLE_REQUIRED: 'Please enter a job title first',
  INTERVIEW_TITLE: ' Interview',
  START_OVER: 'Start Over',
  LOADING_QUESTIONS: 'Loading questions...',
  ANSWER_PLACEHOLDER: 'Type your answer here...',
  SUBMIT_ANSWER: 'Submit Answer',
  WELCOME_TITLE: 'Hi, Job Candidate',
  WELCOME_SUBTITLE: 'Ready to land your dream job?',
  JOBSIMPLE: 'Jobsimple',
};

const QUESTION_COUNT_MIN = 1;
const QUESTION_COUNT_MAX = 10;

function JobSelection({ jobType, handleJobSelection }) {
  return (
    <div className="grid grid-cols-2 gap-2 mb-6">
      <Button
        variant={jobType === JOB_TYPE_CUSTOM ? 'default' : 'outline'}
        className="h-12"
        onClick={() => handleJobSelection(JOB_TYPE_CUSTOM)}
      >
        {DISPLAY_TEXT.CUSTOM_JOB}
      </Button>
      <Button
        variant={jobType === JOB_TYPE_SOFTWARE_ENGINEER ? 'default' : 'outline'}
        className="h-12"
        onClick={() => handleJobSelection(JOB_TYPE_SOFTWARE_ENGINEER)}
      >
        {DISPLAY_TEXT.SOFTWARE_ENGINEER}
      </Button>
    </div>
  );
}

function JobDetailsInput({ jobType, customJobTitle, setCustomJobTitle, jobDescription, setJobDescription, disabled }) {
  return (
    <div className="space-y-4">
      <div>
        <Input
          placeholder={DISPLAY_TEXT.JOB_TITLE_PLACEHOLDER}
          value={customJobTitle}
          onChange={(e) => setCustomJobTitle(e.target.value)}
          required={jobType === JOB_TYPE_CUSTOM}
          disabled={disabled}
        />
      </div>
      <div>
        <Textarea
          placeholder={DISPLAY_TEXT.JOB_DESCRIPTION_PLACEHOLDER}
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={5}
        />
      </div>
    </div>
  );
}

function DifficultySelection({ questionDifficulty, setQuestionDifficulty }) {
  return (
    <div>
      <p className="mb-4">{DISPLAY_TEXT.DIFFICULTY_SELECTION_TEXT}</p>
      <div className="flex flex-wrap gap-2">
        {Object.values(QuestionDifficulty).map((difficulty) => (
          <Button
            key={difficulty}
            variant={questionDifficulty === difficulty ? 'default' : 'outline'}
            onClick={() => setQuestionDifficulty(difficulty)}
          >
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </Button>
        ))}
      </div>
    </div>
  );
}

function QuestionTypeSelection({ questionType, setQuestionType }) {
  return (
    <div>
      <p className="mb-4">{DISPLAY_TEXT.QUESTION_TYPE_SELECTION_TEXT}</p>
      <div className="flex flex-wrap gap-2">
        {Object.values(QuestionType).map((type) => (
          <Button
            key={type}
            variant={questionType === type ? 'default' : 'outline'}
            onClick={() => setQuestionType(type)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </Button>
        ))}
      </div>
    </div>
  );
}

function QuestionCountSelection({ questionCount, setQuestionCount }) {
  const questionCounts = Array.from(
    { length: QUESTION_COUNT_MAX - QUESTION_COUNT_MIN + 1 },
    (_, i) => QUESTION_COUNT_MIN + i,
  );

  return (
    <div>
      <p className="mb-4">{DISPLAY_TEXT.QUESTION_COUNT_SELECTION_TEXT}</p>
      <div className="flex flex-wrap gap-2">
        {questionCounts.map((count) => (
          <Button
            key={count}
            variant={questionCount === count ? 'default' : 'outline'}
            onClick={() => setQuestionCount(count)}
          >
            {count}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const [formState, setFormState] = useState({
    showInterviewCustomization: false,
    jobType: '',
    customJobTitle: '',
    jobDescription: '',
    questionDifficulty: QuestionDifficulty.MEDIUM,
    questionType: QuestionType.MIXED,
    questionCount: 3,
    isInterviewStarted: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [conversation, setConversation] = useUIState();
  const { createInterviewSession } = useActions();

  const updateFormState = (newState) => {
    setFormState((prevState) => ({ ...prevState, ...newState }));
  };

  useEffect(() => {
    if (formState.jobType === JOB_TYPE_SOFTWARE_ENGINEER) {
      updateFormState({ customJobTitle: 'Software Engineer', jobDescription: SOFTWARE_ENGINEER_DESCRIPTION });
    } else if (formState.jobType === JOB_TYPE_CUSTOM) {
      updateFormState({ customJobTitle: '', jobDescription: '' });
    }
  }, [formState.jobType]);

  const handleJobSelection = (type) => {
    updateFormState({ jobType: type, showInterviewCustomization: true });
  };

  const startInterview = async () => {
    if (!isLoaded || !userId) {
      setError('Please sign in to start an interview');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const interviewConfig = {
        jobType: formState.jobType === 'custom' ? formState.customJobTitle : 'Software Engineer',
        jobDescription: formState.jobDescription,
        difficulty: formState.questionDifficulty,
        questionType: formState.questionType,
        questionCount: formState.questionCount,
      };
      console.log('Starting interview with config:', interviewConfig);
      const { sessionId } = await createInterviewSession(interviewConfig);
      router.push(`/chat/${sessionId}`);
    } catch (err) {
      console.error('Interview creation failed:', err);
      setError(err.message || 'Failed to start interview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    updateFormState({ isInterviewStarted: false });
    setConversation([]);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto py-12 px-4">
      <div className="w-full">
        <h1 className="text-4xl font-bold text-center mb-2">
          <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            {DISPLAY_TEXT.JOBSIMPLE}
          </span>
        </h1>

        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-blue-600">{DISPLAY_TEXT.WELCOME_TITLE}</h2>
            <p className="text-3xl text-gray-500">{DISPLAY_TEXT.WELCOME_SUBTITLE}</p>
          </div>

          <Card className="mt-6">
            <CardContent className="pt-6">
              <h3 className="text-xl font-medium mb-2">{DISPLAY_TEXT.JOB_SELECTION_TITLE}</h3>
              <JobSelection jobType={formState.jobType} handleJobSelection={handleJobSelection} />

              {formState.showInterviewCustomization && (
                <JobDetailsInput
                  jobType={formState.jobType}
                  customJobTitle={formState.customJobTitle}
                  setCustomJobTitle={(value) => updateFormState({ customJobTitle: value })}
                  jobDescription={formState.jobDescription}
                  setJobDescription={(value) => updateFormState({ jobDescription: value })}
                  disabled={formState.jobType === JOB_TYPE_SOFTWARE_ENGINEER}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {formState.showInterviewCustomization && (
          <div className="space-y-8 mt-8">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-xl font-medium mb-6">{DISPLAY_TEXT.CUSTOMIZE_INTERVIEW_TITLE}</h3>

                <div className="space-y-8">
                  <DifficultySelection
                    questionDifficulty={formState.questionDifficulty}
                    setQuestionDifficulty={(value) => updateFormState({ questionDifficulty: value })}
                  />
                  <QuestionTypeSelection
                    questionType={formState.questionType}
                    setQuestionType={(value) => updateFormState({ questionType: value })}
                  />
                  <QuestionCountSelection
                    questionCount={formState.questionCount}
                    setQuestionCount={(value) => updateFormState({ questionCount: value })}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-start">
              <Card className="w-full">
                <CardContent className="pt-6">
                  <h3 className="text-xl font-medium mb-4">{DISPLAY_TEXT.START_INTERVIEW_TITLE}</h3>
                  <Button
                    onClick={startInterview}
                    size="lg"
                    className="w-full md:w-auto"
                    disabled={(formState.jobType === JOB_TYPE_CUSTOM && !formState.customJobTitle.trim()) || isLoading}
                  >
                    {isLoading ? 'Creating Session...' : DISPLAY_TEXT.START_INTERVIEW_BUTTON}
                  </Button>
                  {formState.jobType === JOB_TYPE_CUSTOM && !formState.customJobTitle.trim() && (
                    <p className="text-red-500 mt-2">{DISPLAY_TEXT.JOB_TITLE_REQUIRED}</p>
                  )}
                  {error && <p className="text-red-500 mt-2">{error}</p>}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {formState.isInterviewStarted && (
          <div className="space-y-6 mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {formState.jobType === JOB_TYPE_CUSTOM ? formState.customJobTitle : 'Software Engineer'}
                {DISPLAY_TEXT.INTERVIEW_TITLE}
              </h2>
              <Button variant="outline" onClick={handleStartOver}>
                {DISPLAY_TEXT.START_OVER}
              </Button>
            </div>

            <div className="border rounded-lg p-6 min-h-96">
              {conversation.length > 0 ? (
                <div className="space-y-4">
                  {conversation.map((message, index) => (
                    <div key={index} className="space-y-2">
                      <p className="font-medium">{message.role === 'user' ? 'You' : 'Interviewer'}</p>
                      <div className="p-3 rounded-lg bg-gray-100">{message.display || message.content}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">{DISPLAY_TEXT.LOADING_QUESTIONS}</p>
                </div>
              )}
            </div>

            <div>
              <Textarea placeholder={DISPLAY_TEXT.ANSWER_PLACEHOLDER} className="min-h-24" />
              <div className="flex justify-end mt-2">
                <Button>{DISPLAY_TEXT.SUBMIT_ANSWER}</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
