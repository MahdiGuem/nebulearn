"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type LessonContent = {
  question?: string;
  options?: string[];
  imageUrl?: string;
  correctAnswer?: string;
  hint?: string;
};

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  lessonType: "QUIZ" | "YES_NO" | "SHORT_ANSWER";
  difficulty: number;
  xpReward: number;
  content: LessonContent;
  trackId: string;
  trackName: string;
  subjectName: string;
  classId: string;
};

type Completion = {
  completedAt: string;
  finalScore: number;
  attemptsCount: number;
};

type SubmitResult = {
  success: boolean;
  isCorrect: boolean;
  score: number;
  correctAnswer: string;
  xpEarned: number;
};

function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

function QuizUI({
  lesson,
  onSubmit,
  result,
  disabled,
}: {
  lesson: Lesson;
  onSubmit: (answer: string) => void;
  result: SubmitResult | null;
  disabled: boolean;
}) {
  const content = lesson.content as LessonContent;
  const options = content?.options || [];
  const [selected, setSelected] = useState<string | null>(null);
  const router = useRouter();
  useEffect(() => {
    setSelected(null);
  }, [lesson.id]);

  return (
    <div className="space-y-6">
      {content?.question && (
        <p className="text-lg text-purple-100">{content.question}</p>
      )}

      {content?.imageUrl && (
        <div className="flex justify-center">
          <img
            src={content.imageUrl}
            alt="Lesson content"
            className="max-w-full rounded-lg border border-purple-500/30"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {options.map((option, index) => {
          const isCorrectChoice = result && String(result.correctAnswer || "").toLowerCase() === option.toLowerCase();
          const isSelectedChoice = selected === option;
          const showResult = result;

          return (
            <button
              key={index}
              onClick={() => !disabled && setSelected(String(index))}
              disabled={disabled}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all",
                result
                  ? isCorrectChoice
                    ? "border-green-500 bg-green-500/20"
                    : isSelectedChoice
                      ? "border-red-500 bg-red-500/20"
                      : "border-white/10 opacity-50"
                  : selected === String(index)
                    ? "border-purple-500 bg-purple-500/20"
                    : "border-white/10 hover:border-purple-500/50",
                disabled && "cursor-not-allowed",
              )}
            >
              <span className="text-purple-100">{option}</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => selected && onSubmit(selected)}
        disabled={disabled || !selected}
        className="btn-arrow w-full justify-center"
      >
        <span>Submit Answer</span>
        <span className="btn-arrow-icon">→</span>
      </button>
    </div>
  );
}

function YesNoUI({
  lesson,
  onSubmit,
  result,
  disabled,
}: {
  lesson: Lesson;
  onSubmit: (answer: string) => void;
  result: SubmitResult | null;
  disabled: boolean;
}) {
  const content = lesson.content as LessonContent;
  const correctAnswer = String(content?.correctAnswer || "").toLowerCase();
  const router = useRouter();
  return (
    <div className="space-y-6">
      {content?.question && (
        <p className="text-lg text-purple-100">{content.question}</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        {["yes", "no"].map((option) => {
          const isCorrectChoice = correctAnswer === option;
          const showResult = result;

          return (
            <button
              key={option}
              onClick={() => !disabled && onSubmit(option)}
              disabled={disabled}
              className={cn(
                "py-12 rounded-xl border-2 text-2xl font-bold capitalize transition-all",
                result
                  ? isCorrectChoice
                    ? "border-green-500 bg-green-500/20 text-green-400"
                    : "border-red-500 bg-red-500/20 text-red-400"
                  : "border-white/10 hover:border-purple-500/50 text-purple-100",
                disabled && "cursor-not-allowed",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ShortAnswerUI({
  lesson,
  onSubmit,
  result,
  disabled,
}: {
  lesson: Lesson;
  onSubmit: (answer: string) => void;
  result: SubmitResult | null;
  disabled: boolean;
}) {
  const content = lesson.content as LessonContent;
  const [answer, setAnswer] = useState("");

  return (
    <div className="space-y-6">
      {content?.question && (
        <p className="text-lg text-purple-100">{content.question}</p>
      )}

      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={disabled}
        placeholder="Type your answer..."
        className="input-underline w-full text-lg"
      />

      <button
        onClick={() => answer && onSubmit(answer)}
        disabled={disabled || !answer.trim()}
        className="btn-arrow w-full justify-center"
      >
        <span>Submit Answer</span>
        <span className="btn-arrow-icon">→</span>
      </button>
    </div>
  );
}

function ResultView({
  lesson,
  result,
  completion,
  onRetry,
}: {
  lesson: Lesson;
  result: SubmitResult;
  completion: Completion;
  onRetry: () => void;
}) {
  const router = useRouter();
  return (
    <div className="space-y-6 text-center">
      <div className="text-6xl">
        {result.isCorrect ? "🎉" : "💪"}
      </div>

      <div>
        <h2 className={cn(
          "text-3xl font-bold",
          result.isCorrect ? "text-green-400" : "text-yellow-400"
        )}>
          {result.isCorrect ? "Correct!" : "Not quite!"}
        </h2>
        <p className="text-purple-200/60 mt-2">
          Score: {result.score}/100
        </p>
      </div>

      {!result.isCorrect && result.correctAnswer && (
        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
          <p className="text-sm text-purple-200/60">Correct answer:</p>
          <p className="text-purple-100 font-medium">{result.correctAnswer}</p>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 text-yellow-400">
        <span>⭐</span>
        <span className="text-xl font-bold">+{result.xpEarned} XP</span>
      </div>

      {lesson.classId && lesson.trackId && (
        <button
          onClick={() => router.push(`/student/classes/${lesson.classId}/${lesson.trackId}`)}
          className="btn-arrow w-full justify-center"
        >
          <span>Back to Track</span>
          <span className="btn-arrow-icon">←</span>
        </button>
      )}

      <button
        onClick={onRetry}
        className="w-full py-3 text-purple-300 hover:text-purple-100 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}

export function LessonClient({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [completion, setCompletion] = useState<Completion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  async function loadLesson() {
    try {
      const res = await fetch(`/api/lessons/${lessonId}`);
      const data = await res.json();
      if (res.ok) {
        setLesson(data.lesson);
        setCompletion(data.completion);
      } else {
        setError(data.error || "Failed to load lesson");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(answer: string) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/lessons/${lessonId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        if (data.success) {
          setCompletion({
            completedAt: new Date().toISOString(),
            finalScore: data.score,
            attemptsCount: (completion?.attemptsCount || 0) + 1,
          });
        }
      }
    } catch {
      setError("Failed to submit answer");
    } finally {
      setSubmitting(false);
    }
  }

  function handleRetry() {
    setLoading(true);
    setResult(null);
    setCompletion(null);
    loadLesson();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 rounded-full border-4 border-purple-500/30 animate-spin" style={{ borderTopColor: 'rgba(168, 85, 247, 0.8)' }} />
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-4xl">🌌</div>
        <p className="text-purple-200/60">{error || "Lesson not found"}</p>
        <Link
          href="/student/classes"
          className="px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-full text-purple-200 hover:bg-purple-600/30 transition-colors"
        >
          ← Back to classes
        </Link>
      </div>
    );
  }

  const isCompleted = completion !== null;
  const isPassed = completion?.finalScore && completion.finalScore >= 60;

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center gap-4">
        <Link
          href={`/student/classes`}
          className="p-2 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 transition-colors"
        >
          ←
        </Link>
        <div className="flex-1">
          <p className="text-sm text-purple-200/50">{lesson.subjectName} · {lesson.trackName}</p>
          <h1 className="text-2xl font-bold text-white">{lesson.title}</h1>
        </div>
        <div className="text-right">
          <p className="text-sm text-purple-200/60">
            {["Easy", "Medium", "Hard"][lesson.difficulty] || "Easy"}
          </p>
          <p className="text-yellow-400 font-medium">{lesson.xpReward} XP</p>
        </div>
      </div>

      {lesson.description && (
        <p className="text-purple-200/70">{lesson.description}</p>
      )}

      {isCompleted && !result ? (
        <div className="space-y-6 text-center">
          <div className="text-6xl">{isPassed ? "✅" : "📝"}</div>
          <div>
            <h2 className={cn(
              "text-2xl font-bold",
              isPassed ? "text-green-400" : "text-yellow-400"
            )}>
              {isPassed ? "Completed!" : "Not quite - Try Again!"}
            </h2>
            <p className="text-purple-200/60 mt-2">
              Score: {completion.finalScore}/100 · {completion.attemptsCount} attempt
              {completion.attemptsCount !== 1 ? "s" : ""}
            </p>
          </div>
          {lesson.classId && lesson.trackId && (
            <button
              onClick={() => router.push(`/student/classes/${lesson.classId}/${lesson.trackId}`)}
              className="btn-arrow w-full justify-center"
            >
              <span>Back to Track</span>
              <span className="btn-arrow-icon">←</span>
            </button>
          )}
          {!isPassed && (
            <button
              onClick={handleRetry}
              className="w-full py-3 text-purple-300 hover:text-purple-100 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      ) : result ? (
        <ResultView
          lesson={lesson}
          result={result}
          completion={completion!}
          onRetry={handleRetry}
        />
      ) : (
        <>
          {lesson.lessonType === "QUIZ" && (
            <QuizUI
              lesson={lesson}
              onSubmit={handleSubmit}
              result={result}
              disabled={submitting}
            />
          )}
          {lesson.lessonType === "YES_NO" && (
            <YesNoUI
              lesson={lesson}
              onSubmit={handleSubmit}
              result={result}
              disabled={submitting}
            />
          )}
          {lesson.lessonType === "SHORT_ANSWER" && (
            <ShortAnswerUI
              lesson={lesson}
              onSubmit={handleSubmit}
              result={result}
              disabled={submitting}
            />
          )}
        </>
      )}
    </div>
  );
}