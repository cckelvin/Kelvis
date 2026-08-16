import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  HelpCircle,
  Award,
  Send,
  RotateCcw,
  Zap,
} from "lucide-react";
import { QuizPayload, QuizQuestion } from "../types";

interface QuickQuizDrawerProps {
  isOpen: boolean;
  quiz: QuizPayload | null;
  onClose: () => void;
  onSubmitQuiz: (submissionText: string) => void;
}

export const QuickQuizDrawer: React.FC<QuickQuizDrawerProps> = ({
  isOpen,
  quiz,
  onClose,
  onSubmitQuiz,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [confirmedAnswers, setConfirmedAnswers] = useState<Record<number, boolean>>({});

  // Reset states whenever a new quiz opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setSelectedAnswers({});
      setConfirmedAnswers({});
    }
  }, [isOpen, quiz]);

  if (!isOpen || !quiz || !quiz.questions || quiz.questions.length === 0) {
    return null;
  }

  const questions = quiz.questions;
  const currentQ = questions[currentIndex] || questions[0];
  const totalQuestions = questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const currentSelectedOptionId = selectedAnswers[currentQ.id];
  const isCurrentConfirmed = !!confirmedAnswers[currentQ.id];

  const handleSelectOption = (optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionId,
    }));
  };

  const handleConfirmOption = () => {
    if (!currentSelectedOptionId) return;
    setConfirmedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: true,
    }));

    // If not last question, auto advance after a brief moment or let user click Next
    if (!isLastQuestion) {
      setTimeout(() => {
        setCurrentIndex((prev) => Math.min(prev + 1, totalQuestions - 1));
      }, 350);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    // Generate structured prompt to feed into Kelvis normal response area
    const lines: string[] = [];
    lines.push(`🎯 **Quiz Answers Submission**`);
    lines.push(`**Topic / Subject:** ${quiz.topic || quiz.title || "Knowledge Assessment"}`);
    lines.push(``);
    lines.push(`Here are my submitted answers for review:`);

    questions.forEach((q, idx) => {
      const chosenId = selectedAnswers[q.id] || "No answer selected";
      const chosenOption = q.options.find((o) => o.id === chosenId);
      const chosenText = chosenOption ? `(${chosenId}) ${chosenOption.text}` : `[Unanswered]`;
      lines.push(`${idx + 1}. **${q.question}**`);
      lines.push(`   - Selected Answer: **${chosenText}**`);
      if (q.correctOptionId) {
        lines.push(`   - Target Key: Option ${q.correctOptionId}`);
      }
    });

    lines.push(``);
    lines.push(
      `Please evaluate my test in your response area: provide my overall score (e.g. 4/5 or percentage), give thorough explanations for each question, celebrate correct answers, and provide insightful feedback on topics I should review!`
    );

    const submissionText = lines.join("\n");
    onClose();
    onSubmitQuiz(submissionText);
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-auto">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
        />

        {/* Floating Sheet sliding up from base */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 260 }}
          className="relative w-full max-w-5xl h-[92vh] max-h-[92vh] bg-white dark:bg-zinc-900 border-t border-x border-slate-300 dark:border-zinc-800 rounded-t-[36px] shadow-2xl flex flex-col overflow-hidden z-10"
        >
          {/* Top Grab Handle & Header */}
          <div className="pt-3 pb-2 px-6 border-b border-slate-200 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/80 flex flex-col shrink-0">
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full mx-auto mb-2 cursor-grab active:cursor-grabbing opacity-80" />

            <div className="flex items-center justify-between">
              {/* Subject / Topic Pill */}
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Quick Practice Test
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                      {quiz.topic || "Knowledge Check"}
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 line-clamp-1">
                    {quiz.title || "Interactive Assessment"}
                  </h3>
                </div>
              </div>

              {/* Progress Bar & Close */}
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex flex-col items-end text-xs">
                  <span className="font-semibold text-slate-600 dark:text-zinc-300">
                    {answeredCount} of {totalQuestions} answered
                  </span>
                  <div className="w-24 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-200 dark:hover:bg-zinc-700 transition cursor-pointer"
                  title="Close test"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Quiz Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 flex flex-col justify-between max-w-4xl mx-auto w-full">
            {/* Top Center: Question */}
            <div className="pt-2 sm:pt-4 pb-6 text-center space-y-3">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Question {currentIndex + 1} of {totalQuestions}</span>
              </div>

              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight leading-snug max-w-3xl mx-auto px-2">
                {currentQ.question}
              </h2>
            </div>

            {/* Middle: Multiple Choice Options with Glowing Selection */}
            <div className="space-y-3 sm:space-y-4 max-w-2xl mx-auto w-full my-auto py-2">
              {currentQ.options.map((opt, idx) => {
                const isSelected = currentSelectedOptionId === opt.id;
                const letterLabel = opt.id || String.fromCharCode(65 + idx);

                return (
                  <motion.button
                    key={opt.id || idx}
                    type="button"
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full text-left p-4 sm:p-4.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between relative group ${
                      isSelected
                        ? "bg-amber-50/90 dark:bg-amber-950/50 border-amber-500 text-slate-900 dark:text-zinc-100 ring-2 ring-amber-500/80 shadow-[0_0_28px_rgba(245,158,11,0.32)] dark:shadow-[0_0_35px_rgba(245,158,11,0.22)]"
                        : "bg-slate-50 dark:bg-zinc-800/60 hover:bg-white dark:hover:bg-zinc-800 border-slate-200 dark:border-zinc-700/80 text-slate-800 dark:text-zinc-200 hover:border-slate-300 dark:hover:border-zinc-600 shadow-xs"
                    }`}
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 pr-3">
                      {/* Letter badge (A, B, C, D) */}
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-extrabold text-sm sm:text-base shrink-0 transition-colors ${
                          isSelected
                            ? "bg-amber-500 text-white shadow-md shadow-amber-500/30"
                            : "bg-white dark:bg-zinc-700 text-slate-700 dark:text-zinc-300 border border-slate-300 dark:border-zinc-600 group-hover:border-amber-400 group-hover:text-amber-600"
                        }`}
                      >
                        {letterLabel}
                      </div>

                      {/* Option Text */}
                      <span className="text-sm sm:text-base font-semibold leading-snug">
                        {opt.text}
                      </span>
                    </div>

                    {/* Checkmark icon for selected option */}
                    <div className="shrink-0">
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                          <CheckCircle2 className="w-4 h-4 fill-current" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-zinc-600" />
                      )}
                    </div>
                  </motion.button>
                );
              })}

              {/* Confirm / Send Answer Button Below Options */}
              <div className="pt-3 flex justify-center">
                <button
                  type="button"
                  onClick={handleConfirmOption}
                  disabled={!currentSelectedOptionId}
                  className={`px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                    currentSelectedOptionId
                      ? "bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/25 active:scale-95"
                      : "bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed"
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isLastQuestion ? "Lock In & Ready to Submit" : "Lock In Answer"}
                  </span>
                </button>
              </div>
            </div>

            {/* Empty space filler */}
            <div className="h-2" />
          </div>

          {/* Bottom Bar: Touching the Base Edge */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            {/* Number of Questions Below (Left Side) */}
            <div className="flex items-center space-x-3">
              {/* Previous Question Button */}
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className={`p-2 rounded-xl border border-slate-300 dark:border-zinc-700 text-xs font-semibold flex items-center space-x-1 transition ${
                  currentIndex === 0
                    ? "opacity-30 cursor-not-allowed text-slate-400"
                    : "hover:bg-white dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer"
                }`}
                title="Previous Question"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              {/* Number of Questions & Step Pills */}
              <div className="flex items-center space-x-1.5">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentIndex;
                  const hasAnswered = !!selectedAnswers[q.id];

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                        isCurrent
                          ? "bg-amber-600 text-white shadow-xs scale-105 ring-2 ring-amber-500/40"
                          : hasAnswered
                          ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                          : "bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-300 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <span className="text-xs font-bold text-slate-600 dark:text-zinc-400 hidden md:inline">
                ({answeredCount}/{totalQuestions} Answered)
              </span>
            </div>

            {/* Right Corner Below beside Number of Questions */}
            <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
              {!isLastQuestion ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!currentSelectedOptionId}
                  className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                    currentSelectedOptionId
                      ? "bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 shadow-md active:scale-95"
                      : "bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed"
                  }`}
                >
                  <span>Next Question</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={answeredCount === 0}
                  className={`px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center space-x-2 transition-all cursor-pointer ${
                    answeredCount > 0
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 animate-pulse active:scale-95"
                      : "bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed"
                  }`}
                >
                  <Award className="w-4 h-4" />
                  <span>Submit Test & Get Feedback</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
