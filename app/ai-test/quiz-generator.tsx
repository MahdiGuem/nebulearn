"use client";

import { useState } from "react";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface GeneratedQuiz {
  questions: QuizQuestion[];
  metadata: {
    documentId: string;
    topics: string[];
    totalChunks: number;
    generatedAt: string;
  };
}

interface QuizGeneratorProps {
  documentId: string;
}

export default function QuizGenerator({ documentId }: QuizGeneratorProps) {
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setQuiz(null);

    try {
      const response = await fetch("/api/ai/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, topic: topic || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate quiz");
      }

      setQuiz(data.quiz);
    } catch (err) {
      console.error("Quiz generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate quiz");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">
        Generate Quiz
      </h3>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Topic (optional)
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Leave empty for broad coverage"
            className="w-full rounded-md border border-gray-300 px-3 py-2
              text-gray-900 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating || !documentId}
          className="w-full rounded-md bg-green-600 px-4 py-2
            font-medium text-white hover:bg-green-700
            disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generating ? "Generating..." : "Generate Quiz"}
        </button>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {quiz && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Generated {quiz.questions.length} questions
                {quiz.metadata.topics.length > 0 && (
                  <span> • Topics: {quiz.metadata.topics.join(", ")}</span>
                )}
              </div>
              <button
                onClick={() => setShowAnswers(!showAnswers)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showAnswers ? "Hide Answers" : "Show Answers"}
              </button>
            </div>

            <div className="space-y-4">
              {quiz.questions.map((q, index) => (
                <div
                  key={index}
                  className="rounded-md border border-gray-200 p-4"
                >
                  <div className="mb-3 font-medium text-gray-900">
                    {index + 1}. {q.question}
                  </div>

                  <div className="space-y-2">
                    {q.options.map((option, optIndex) => (
                      <div
                        key={optIndex}
                        className={`flex items-center rounded-md px-3 py-2
                          ${
                            showAnswers && optIndex === q.correctAnswer
                              ? "bg-green-50 border border-green-200"
                              : "bg-gray-50"
                          }`}
                      >
                        <span className="mr-3 font-medium text-gray-600">
                          {String.fromCharCode(65 + optIndex)}.
                        </span>
                        <span className="text-gray-800">{option}</span>
                        {showAnswers && optIndex === q.correctAnswer && (
                          <span className="ml-auto text-sm font-medium text-green-600">
                            ✓ Correct
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {showAnswers && (
                    <div className="mt-3 rounded-md bg-blue-50 p-3 text-sm text-blue-800">
                      <strong>Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
