import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { Material, Question, AnswerResult, SkillType } from "@/types";

export interface TrainingState {
  mode: "material" | "skill" | "challenge";
  material?: Material;
  questions: Question[];
  currentIndex: number;
  answers: { questionId: string; userAnswer: number; timeSpent: number }[];
  startTime: number;
  questionStartTime: number;
  skillType?: SkillType;
  isFinished: boolean;
  results: AnswerResult[];
}

export const useTrainingStore = defineStore("training", () => {
  const state = ref<TrainingState>({
    mode: "material",
    material: undefined,
    questions: [],
    currentIndex: 0,
    answers: [],
    startTime: 0,
    questionStartTime: 0,
    skillType: undefined,
    isFinished: false,
    results: [],
  });

  const currentQuestion = computed(
    () => state.value.questions[state.value.currentIndex],
  );

  const totalQuestions = computed(() => state.value.questions.length);

  const progress = computed(() =>
    state.value.questions.length > 0
      ? ((state.value.currentIndex + 1) / state.value.questions.length) * 100
      : 0,
  );

  function startMaterialTraining(material: Material) {
    state.value = {
      mode: "material",
      material,
      questions: [...material.questions].sort(
        (a, b) => a.orderIndex - b.orderIndex,
      ),
      currentIndex: 0,
      answers: [],
      startTime: Date.now(),
      questionStartTime: Date.now(),
      isFinished: false,
      results: [],
    };
  }

  function startSkillTraining(questions: Question[], skillType: SkillType) {
    state.value = {
      mode: "skill",
      questions,
      currentIndex: 0,
      answers: [],
      startTime: Date.now(),
      questionStartTime: Date.now(),
      skillType,
      isFinished: false,
      results: [],
    };
  }

  function startChallenge(material: Material) {
    state.value = {
      mode: "challenge",
      material,
      questions: [...material.questions].sort(
        (a, b) => a.orderIndex - b.orderIndex,
      ),
      currentIndex: 0,
      answers: [],
      startTime: Date.now(),
      questionStartTime: Date.now(),
      isFinished: false,
      results: [],
    };
  }

  function answerQuestion(userAnswer: number) {
    const timeSpent = Math.round(
      (Date.now() - state.value.questionStartTime) / 1000,
    );
    const question = currentQuestion.value;

    if (question) {
      state.value.answers.push({
        questionId: question.id,
        userAnswer,
        timeSpent,
      });
    }
  }

  function nextQuestion() {
    if (state.value.currentIndex < state.value.questions.length - 1) {
      state.value.currentIndex++;
      state.value.questionStartTime = Date.now();
      return true;
    }
    return false;
  }

  function getTotalTime(): number {
    return Math.round((Date.now() - state.value.startTime) / 1000);
  }

  function finish(results: AnswerResult[]) {
    state.value.isFinished = true;
    state.value.results = results;
  }

  function reset() {
    state.value = {
      mode: "material",
      material: undefined,
      questions: [],
      currentIndex: 0,
      answers: [],
      startTime: 0,
      questionStartTime: 0,
      isFinished: false,
      results: [],
    };
  }

  return {
    state,
    currentQuestion,
    totalQuestions,
    progress,
    startMaterialTraining,
    startSkillTraining,
    startChallenge,
    answerQuestion,
    nextQuestion,
    getTotalTime,
    finish,
    reset,
  };
});
