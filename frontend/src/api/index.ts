import request from "@/utils/request";
import {
  User,
  LoginResponse,
  Material,
  Question,
  TrainingRecord,
  WrongAnswer,
  SkillStats,
  ChallengeRecord,
  DashboardStats,
  SkillType,
} from "@/types";

export interface LoginParams {
  username: string;
  password: string;
}

export interface RegisterParams {
  username: string;
  password: string;
  email?: string;
}

export interface AnswerItem {
  questionId: string;
  userAnswer: number;
  timeSpent: number;
}

export interface SubmitTrainingParams {
  materialId?: string;
  isChallenge: boolean;
  totalTime: number;
  answers: AnswerItem[];
}

export const authApi = {
  login: (params: LoginParams): Promise<LoginResponse> =>
    request.post("/auth/login", params),
  register: (params: RegisterParams): Promise<LoginResponse> =>
    request.post("/auth/register", params),
  getProfile: (): Promise<{ user: User }> => request.get("/auth/profile"),
};

export const userApi = {
  getProfile: (): Promise<any> => request.get("/user/profile"),
  getSkillStats: (): Promise<SkillStats[]> => request.get("/user/stats"),
  getRecentTrainings: (): Promise<TrainingRecord[]> =>
    request.get("/user/trainings"),
  getChallengeHistory: (): Promise<ChallengeRecord[]> =>
    request.get("/user/challenges"),
  getDashboardStats: (): Promise<DashboardStats> =>
    request.get("/user/dashboard"),
};

export const materialApi = {
  getAll: (): Promise<Material[]> => request.get("/materials"),
  getById: (id: string): Promise<Material> => request.get(`/materials/${id}`),
  getRandom: (): Promise<Material> => request.get("/materials/random"),
  getSkillTypes: (): Promise<SkillType[]> =>
    request.get("/materials/skill-types"),
  getBySkillType: (skillType: SkillType): Promise<Question[]> =>
    request.get(`/materials/by-skill/${skillType}`),
};

export const trainingApi = {
  submit: (
    params: SubmitTrainingParams,
  ): Promise<{ trainingRecord: TrainingRecord; results: any[] }> =>
    request.post("/training/submit", params),
  getWrongAnswers: (
    skillType?: SkillType,
    isResolved?: boolean,
  ): Promise<WrongAnswer[]> => {
    const params: any = {};
    if (skillType) params.skillType = skillType;
    if (isResolved !== undefined) params.isResolved = isResolved;
    return request.get("/training/wrong-answers", { params });
  },
  resolveWrongAnswer: (wrongAnswerId: string): Promise<WrongAnswer> =>
    request.post("/training/wrong-answers/resolve", { wrongAnswerId }),
  getRecord: (id: string): Promise<TrainingRecord> =>
    request.get(`/training/record/${id}`),
};

export const challengeApi = {
  submit: (
    params: any,
  ): Promise<{ challengeRecord: ChallengeRecord; results: any[] }> =>
    request.post("/challenge/submit", params),
  getLeaderboard: (limit?: number): Promise<ChallengeRecord[]> => {
    const params = limit ? { limit } : {};
    return request.get("/challenge/leaderboard", { params });
  },
  getBest: (): Promise<ChallengeRecord> => request.get("/challenge/best"),
};
