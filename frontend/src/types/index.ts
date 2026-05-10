export interface User {
  id: string;
  username: string;
  email?: string;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export enum SkillType {
  GROWTH_RATE = "GROWTH_RATE",
  PROPORTION = "PROPORTION",
  MULTIPLE = "MULTIPLE",
  AVERAGE = "AVERAGE",
  ANNUAL_GROWTH = "ANNUAL_GROWTH",
}

export const SkillTypeNames: Record<SkillType, string> = {
  [SkillType.GROWTH_RATE]: "同比增长率",
  [SkillType.PROPORTION]: "比重计算",
  [SkillType.MULTIPLE]: "倍数关系",
  [SkillType.AVERAGE]: "平均数",
  [SkillType.ANNUAL_GROWTH]: "年均增长率",
};

export enum ChallengeGrade {
  S = "S",
  A = "A",
  B = "B",
  C = "C",
  D = "D",
}

export interface TableData {
  headers: string[];
  rows: (string | number)[][];
}

export interface Material {
  id: string;
  title: string;
  content: string;
  tableData: TableData;
  category?: string;
  difficulty: number;
  createdAt: string;
  questions: Question[];
}

export interface Question {
  id: string;
  materialId: string;
  questionText: string;
  options: string[] | number[];
  correctAnswer: number;
  skillType: SkillType;
  explanation: string;
  formula: string;
  calculation: string;
  tip: string;
  orderIndex: number;
}

export interface AnswerResult {
  questionId: string;
  userAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  timeSpent: number;
  skillType: SkillType;
  explanation: string;
  formula: string;
  calculation: string;
  tip: string;
}

export interface TrainingRecord {
  id: string;
  userId: string;
  materialId?: string;
  isChallenge: boolean;
  totalTime: number;
  correctCount: number;
  totalCount: number;
  accuracy: number;
  answers: AnswerResult[];
  createdAt: string;
}

export interface WrongAnswer {
  id: string;
  userId: string;
  questionId: string;
  userAnswer: number;
  correctAnswer: number;
  timeSpent: number;
  isResolved: boolean;
  createdAt: string;
  resolvedAt?: string;
  question: Question & { material: Material };
}

export interface SkillStats {
  id: string;
  userId: string;
  skillType: SkillType;
  totalAttempts: number;
  correctCount: number;
  totalTimeSpent: number;
  accuracy: number;
  avgTimePerQuestion: number;
}

export interface ChallengeRecord {
  id: string;
  userId: string;
  materialId: string;
  totalTime: number;
  correctCount: number;
  totalCount: number;
  accuracy: number;
  grade: ChallengeGrade;
  score: number;
  createdAt: string;
  material?: Material;
}

export interface DashboardStats {
  totalTrainings: number;
  totalChallenges: number;
  bestChallenge?: ChallengeRecord;
  unresolvedWrongAnswers: number;
  skillStats: SkillStats[];
  recentTrainings: TrainingRecord[];
  streakDays: number;
}
