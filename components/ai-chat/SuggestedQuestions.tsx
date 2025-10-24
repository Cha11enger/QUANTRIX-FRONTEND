'use client';

interface SuggestedQuestionsProps {
  questions: string[];
  onQuestionClick: (question: string) => void;
}

export function SuggestedQuestions({ questions, onQuestionClick }: SuggestedQuestionsProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Try asking:
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {questions.map((question, index) => (
          <button
            key={index}
            onClick={() => onQuestionClick(question)}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}