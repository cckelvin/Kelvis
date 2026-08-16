import { QuizPayload, QuizQuestion } from "../types";

/**
 * Extract structured quiz JSON from markdown ```quiz ... ``` or text payload
 */
export function extractQuizFromText(text: string): QuizPayload | null {
  if (!text) return null;

  // Try matching ```quiz ... ```
  const quizBlockRegex = /```(?:quiz|json-quiz)\s*\n([\s\S]*?)```/i;
  const match = quizBlockRegex.exec(text);

  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        return {
          title: parsed.title || "Interactive Practice Quiz",
          topic: parsed.topic || "Knowledge Test",
          questions: parsed.questions.map((q: any, idx: number) => ({
            id: q.id || idx + 1,
            question: q.question || `Question ${idx + 1}`,
            options: Array.isArray(q.options)
              ? q.options.map((opt: any, optIdx: number) =>
                  typeof opt === "string"
                    ? { id: String.fromCharCode(65 + optIdx), text: opt }
                    : { id: opt.id || String.fromCharCode(65 + optIdx), text: opt.text || String(opt) }
                )
              : [],
            correctOptionId: q.correctOptionId || q.answer,
            explanation: q.explanation,
          })),
        };
      }
    } catch (e) {
      console.warn("Failed to parse ```quiz JSON:", e);
    }
  }

  // Try extracting general JSON containing questions array
  const generalJsonRegex = /\{\s*"title"[\s\S]*?"questions"\s*:\s*\[[\s\S]*?\]\s*\}/;
  const jsonMatch = generalJsonRegex.exec(text);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        return {
          title: parsed.title || "Interactive Practice Quiz",
          topic: parsed.topic || "Knowledge Test",
          questions: parsed.questions,
        };
      }
    } catch (e) {}
  }

  return null;
}

/**
 * Generate an instant starter quiz for common subjects if user clicks Quick Quiz on a message
 */
export function createTopicQuickQuiz(topicTitle: string, snippet?: string): QuizPayload {
  const cleanTopic = topicTitle.trim() || "General Knowledge";

  // Geography specific sample questions
  if (/geo|nigeria|river|drainage|climate|africa|rock|landform|plateau|ocean|continent|lagos|abuja/i.test(cleanTopic + " " + (snippet || ""))) {
    return {
      title: "Geography of West Africa & Physical Features",
      topic: "Geography & Earth Sciences",
      questions: [
        {
          id: 1,
          question: "At which Nigerian city do the River Niger and River Benue converge to form a majestic 'Y' shape?",
          options: [
            { id: "A", "text": "Jebba (Niger State)" },
            { id: "B", "text": "Lokoja (Kogi State)" },
            { id: "C", "text": "Makurdi (Benue State)" },
            { id: "D", "text": "Onitsha (Anambra State)" },
          ],
          correctOptionId: "B",
          explanation: "River Niger and River Benue meet at the historic confluence city of Lokoja, Kogi State, before flowing south into the Niger Delta.",
        },
        {
          id: 2,
          question: "Which prevailing air mass brings the cool, dry, and dust-laden Harmattan winds across West Africa between November and February?",
          options: [
            { id: "A", "text": "Tropical Continental (cT) air mass from the Sahara Desert" },
            { id: "B", "text": "Tropical Maritime (mT) air mass from the Atlantic Ocean" },
            { id: "C", "text": "Equatorial Easterlies from the Indian Ocean" },
            { id: "D", "text": "Polar Front Westerlies" },
          ],
          correctOptionId: "A",
          explanation: "The Tropical Continental (cT) air mass originates from the dry Sahara desert, carrying fine dust and causing the Harmattan season.",
        },
        {
          id: 3,
          question: "Which of the following is an example of an intrusive igneous rock structure formed deep inside the earth's crust?",
          options: [
            { id: "A", "text": "Basalt lava flow" },
            { id: "B", "text": "Granite Batholith" },
            { id: "C", "text": "Limestone cave" },
            { id: "D", "text": "Sandstone plateau" },
          ],
          correctOptionId: "B",
          explanation: "Granite batholiths are gigantic plutonic rock masses that cool and solidify slowly deep below the earth's surface.",
        },
        {
          id: 4,
          question: "Which major hydroelectric power (HEP) station is situated on the River Niger in Nigeria?",
          options: [
            { id: "A", "text": "Kainji Dam" },
            { id: "B", "text": "Shiroro Dam" },
            { id: "C", "text": "Dadinkowa Dam" },
            { id: "D", "text": "Kiri Dam" },
          ],
          correctOptionId: "A",
          explanation: "Kainji Dam (and Jebba Dam) are major hydroelectric power stations built across the River Niger in Niger State.",
        },
      ],
    };
  }

  // Science / Tech fallback
  return {
    title: `Knowledge Assessment: ${cleanTopic}`,
    topic: cleanTopic,
    questions: [
      {
        id: 1,
        question: `What is the primary core concept behind ${cleanTopic}?`,
        options: [
          { id: "A", text: "Fundamental principles and underlying mechanisms" },
          { id: "B", text: "Transient isolated non-recurrent anomalies" },
          { id: "C", text: "Unverified theoretical speculation" },
          { id: "D", text: "External unrelated variables" },
        ],
        correctOptionId: "A",
        explanation: "Mastery begins with a solid foundation in core mechanisms and fundamental definitions.",
      },
      {
        id: 2,
        question: `How is knowledge in ${cleanTopic} best applied to solve real-world problems?`,
        options: [
          { id: "A", text: "Through structured analysis, experimentation, and critical thinking" },
          { id: "B", text: "By completely ignoring proven empirical observations" },
          { id: "C", text: "By using random unmeasured trials" },
          { id: "D", text: "Without any verification or testing" },
        ],
        correctOptionId: "A",
        explanation: "Structured problem-solving yields consistent, verifiable, and optimal results.",
      },
    ],
  };
}
