import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Send,
  Zap,
  Code,
  PenTool,
  FastForward,
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
  const [customAnswers, setCustomAnswers] = useState<Record<number, string>>({});
  const [confirmedAnswers, setConfirmedAnswers] = useState<Record<number, boolean>>({});

  // Reset states whenever a new quiz opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setSelectedAnswers({});
      setCustomAnswers({});
      setConfirmedAnswers({});
    }
  }, [isOpen, quiz]);

  if (!isOpen || !quiz || !quiz.questions || quiz.questions.length === 0) {
    return null;
  }

  const isCoding = quiz.isCodingSpecification || quiz.topic?.toLowerCase().includes("platform") || quiz.topic?.toLowerCase().includes("app");
  const questions = quiz.questions;
  const currentQ = questions[currentIndex] || questions[0];
  const totalQuestions = questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const currentSelectedOptionId = selectedAnswers[currentQ.id];

  const handleSelectOption = (optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionId,
    }));
  };

  const handleCustomTextChange = (text: string) => {
    setCustomAnswers((prev) => ({
      ...prev,
      [currentQ.id]: text,
    }));
  };

  const handleConfirmOption = () => {
    if (!currentSelectedOptionId) return;
    setConfirmedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: true,
    }));

    if (!isLastQuestion) {
      setTimeout(() => {
        setCurrentIndex((prev) => Math.min(prev + 1, totalQuestions - 1));
      }, 250);
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

  const handleSubmit = (skipDefaults = false) => {
    const lines: string[] = [];

    if (isCoding) {
      lines.push(`🚀 **Project Blueprint & Requirements**`);
      lines.push(`**Target Project:** ${quiz.topic || quiz.title || "Web Application"}`);
      lines.push(``);

      if (skipDefaults) {
        lines.push(`Using high-performance recommended defaults for all technical specifications.`);
      } else {
        lines.push(`Here are my selected design tokens and architecture specifications:`);
        questions.forEach((q, idx) => {
          const chosenId = selectedAnswers[q.id] || "A";
          const chosenOption = q.options.find((o) => o.id === chosenId);
          const isCustom = chosenOption?.isCustom || chosenId === "CUSTOM" || chosenId === "D";
          const customText = customAnswers[q.id];

          let answerText = "";
          if (isCustom && customText?.trim()) {
            answerText = `[Custom Requirement] ${customText.trim()}`;
          } else if (chosenOption) {
            answerText = chosenOption.text;
          } else {
            answerText = "Recommended modern standard";
          }

          lines.push(`${idx + 1}. **${q.question}**`);
          lines.push(`   - Selected Choice: **${answerText}**`);
        });
      }

      lines.push(``);
      lines.push(
        `Please start coding this application now! First explain the architectural plan, then write the web structure (HTML), design token system (CSS), application shell, core components, and state engine with complete code files so I can run and preview the live app.`
      );
    } else {
      lines.push(`🎯 **Quiz Answers Submission**`);
      lines.push(`**Topic / Subject:** ${quiz.topic || quiz.title || "Knowledge Assessment"}`);
      lines.push(``);
      lines.push(`Here are my submitted answers for review:`);

      questions.forEach((q, idx) => {
        const chosenId = selectedAnswers[q.id] || "No answer selected";
        const chosenOption = q.options.find((o) => o.id === chosenId);
        const isCustom = chosenOption?.isCustom || chosenId === "CUSTOM";
        const customText = customAnswers[q.id];

        let chosenText = "";
        if (isCustom && customText?.trim()) {
          chosenText = `(Custom) ${customText.trim()}`;
        } else if (chosenOption) {
          chosenText = `(${chosenId}) ${chosenOption.text}`;
        } else {
          chosenText = `[Unanswered]`;
        }

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
    }

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
          className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs"
        />

        {/* Floating Sheet sliding up from base */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 260 }}
          className="relative w-full max-w-4xl h-[88vh] max-h-[88vh] bg-white dark:bg-zinc-900 border-t border-x border-slate-300 dark:border-zinc-800 rounded-t-[32px] shadow-2xl flex flex-col overflow-hidden z-10"
        >
          {/* Top Grab Handle & Header */}
          <div className="pt-3 pb-2 px-6 border-b border-slate-200 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/80 flex flex-col shrink-0">
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full mx-auto mb-2 cursor-grab active:cursor-grabbing opacity-80" />

            <div className="flex items-center justify-between">
              {/* Subject / Topic Pill */}
              <div className="flex items-center space-x-2.5">
                <div
                  className={`p-1.5 rounded-xl text-white shadow-xs ${
                    isCoding
                      ? "bg-gradient-to-tr from-emerald-600 to-teal-600"
                      : "bg-gradient-to-tr from-amber-500 to-orange-600"
                  }`}
                >
                  {isCoding ? (
                    <Code className="w-4 h-4" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-xs font-extrabold uppercase tracking-wider ${
                        isCoding
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {isCoding ? "Interactive Blueprint Setup" : "Quick Practice Test"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                      {quiz.topic || "Knowledge Check"}
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 line-clamp-1">
                    {quiz.title || "Specification & Design Options"}
                  </h3>
                </div>
              </div>

              {/* Progress & Quick Actions */}
              <div className="flex items-center space-x-2 sm:space-x-3">
                {isCoding && (
                  <button
                    type="button"
                    onClick={() => handleSubmit(true)}
                    className="hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-200/70 hover:bg-slate-300/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
                    title="Skip questions and start coding immediately with standard defaults"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    <span>Quick Start</span>
                  </button>
                )}

                <div className="hidden md:flex flex-col items-end text-xs">
                  <span className="font-semibold text-slate-600 dark:text-zinc-300">
                    {answeredCount} of {totalQuestions} completed
                  </span>
                  <div className="w-24 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isCoding
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                          : "bg-gradient-to-r from-amber-500 to-emerald-500"
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-200 dark:hover:bg-zinc-700 transition cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Quiz Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 flex flex-col justify-between max-w-3xl mx-auto w-full">
            {/* Top Center: Question */}
            <div className="pt-1 sm:pt-3 pb-4 text-center space-y-2.5">
              <div
                className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                  isCoding
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Step {currentIndex + 1} of {totalQuestions}</span>
              </div>

              <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tight leading-snug max-w-2xl mx-auto px-2">
                {currentQ.question}
              </h2>
            </div>

            {/* Middle: Options + Custom Input */}
            <div className="space-y-3 max-w-xl mx-auto w-full my-auto py-2">
              {currentQ.options.map((opt, idx) => {
                const isSelected = currentSelectedOptionId === opt.id;
                const letterLabel = opt.id || String.fromCharCode(65 + idx);
                const isCustom = opt.isCustom || opt.id === "CUSTOM" || (idx === currentQ.options.length - 1 && currentQ.allowCustomAnswer);

                return (
                  <div key={opt.id || idx} className="space-y-2">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleSelectOption(opt.id)}
                      className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between relative group ${
                        isSelected
                          ? isCoding
                            ? "bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-500 text-slate-900 dark:text-zinc-100 ring-2 ring-emerald-500/80 shadow-[0_0_24px_rgba(16,185,129,0.25)]"
                            : "bg-amber-50/90 dark:bg-amber-950/50 border-amber-500 text-slate-900 dark:text-zinc-100 ring-2 ring-amber-500/80 shadow-[0_0_24px_rgba(245,158,11,0.25)]"
                          : "bg-slate-50 dark:bg-zinc-800/60 hover:bg-white dark:hover:bg-zinc-800 border-slate-200 dark:border-zinc-700/80 text-slate-800 dark:text-zinc-200 hover:border-slate-300 dark:hover:border-zinc-600 shadow-xs"
                      }`}
                    >
                      <div className="flex items-center space-x-3 sm:space-x-3.5 min-w-0 pr-3">
                        {/* Letter badge */}
                        <div
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-extrabold text-xs sm:text-sm shrink-0 transition-colors ${
                            isSelected
                              ? isCoding
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-amber-500 text-white shadow-xs"
                              : "bg-white dark:bg-zinc-700 text-slate-700 dark:text-zinc-300 border border-slate-300 dark:border-zinc-600 group-hover:border-slate-400"
                          }`}
                        >
                          {isCustom ? <PenTool className="w-3.5 h-3.5" /> : letterLabel}
                        </div>

                        {/* Option Text */}
                        <span className="text-xs sm:text-sm font-semibold leading-snug">
                          {opt.text}
                        </span>
                      </div>

                      {/* Checkmark indicator */}
                      <div className="shrink-0">
                        {isSelected ? (
                          <div
                            className={`w-5 h-5 rounded-full text-white flex items-center justify-center shadow-xs ${
                              isCoding ? "bg-emerald-600" : "bg-amber-500"
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-zinc-600" />
                        )}
                      </div>
                    </motion.button>

                    {/* Custom Text Area if Custom Option is selected */}
                    <AnimatePresence>
                      {isSelected && isCustom && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-1.5 px-2"
                        >
                          <div className="relative">
                            <input
                              type="text"
                              autoFocus
                              placeholder="Type your custom requirements or tech stack..."
                              value={customAnswers[currentQ.id] || ""}
                              onChange={(e) => handleCustomTextChange(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-400 dark:border-emerald-600 bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50 shadow-inner"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {/* Confirm / Lock in button */}
              <div className="pt-3 flex justify-center">
                <button
                  type="button"
                  onClick={handleConfirmOption}
                  disabled={!currentSelectedOptionId}
                  className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                    currentSelectedOptionId
                      ? isCoding
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95"
                        : "bg-amber-600 hover:bg-amber-700 text-white shadow-md active:scale-95"
                      : "bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed"
                  }`}
                >
                  <Send className="w-3 h-3" />
                  <span>
                    {isLastQuestion ? "Ready to Build" : "Lock In & Next Step"}
                  </span>
                </button>
              </div>
            </div>

            <div className="h-1" />
          </div>

          {/* Bottom Navigation Bar */}
          <div className="px-6 py-3.5 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/90 flex items-center justify-between gap-3 shrink-0">
            {/* Step Pills & Prev button */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className={`p-1.5 rounded-xl border border-slate-300 dark:border-zinc-700 text-xs font-semibold flex items-center space-x-1 transition ${
                  currentIndex === 0
                    ? "opacity-30 cursor-not-allowed text-slate-400"
                    : "hover:bg-white dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 cursor-pointer"
                }`}
                title="Previous Step"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              <div className="flex items-center space-x-1">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentIndex;
                  const hasAnswered = !!selectedAnswers[q.id];

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-7 h-7 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                        isCurrent
                          ? isCoding
                            ? "bg-emerald-600 text-white scale-105 ring-2 ring-emerald-500/40"
                            : "bg-amber-600 text-white scale-105 ring-2 ring-amber-500/40"
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
            </div>

            {/* Right: Next or Submit */}
            <div className="flex items-center space-x-2">
              {!isLastQuestion ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!currentSelectedOptionId}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                    currentSelectedOptionId
                      ? "bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 shadow-xs active:scale-95"
                      : "bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed"
                  }`}
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={answeredCount === 0}
                  className={`px-5 py-2 rounded-xl text-xs font-extrabold flex items-center space-x-2 transition-all cursor-pointer ${
                    answeredCount > 0
                      ? isCoding
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 animate-pulse active:scale-95"
                        : "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-600/30 animate-pulse active:scale-95"
                      : "bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed"
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>{isCoding ? "Start Building App" : "Submit Test"}</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
