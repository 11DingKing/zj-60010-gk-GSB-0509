import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../common/redis.service";
import { SubmitChallengeDto } from "./dto/challenge.dto";
import { ChallengeGrade } from "@prisma/client";

const LEADERBOARD_CACHE_KEY = "challenge:leaderboard";
const LEADERBOARD_CACHE_TTL = 300;

@Injectable()
export class ChallengeService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  calculateGrade(
    correctCount: number,
    totalCount: number,
    totalTime: number,
  ): { grade: ChallengeGrade; score: number } {
    const accuracy = correctCount / totalCount;

    const accuracyScore = accuracy * 60;

    const maxTime = 480;
    const optimalTime = 300;
    let timeScore: number;
    if (totalTime <= optimalTime) {
      timeScore = 40;
    } else if (totalTime >= maxTime) {
      timeScore = 0;
    } else {
      timeScore = ((maxTime - totalTime) / (maxTime - optimalTime)) * 40;
    }

    const totalScore = Math.round(accuracyScore + timeScore);

    let grade: ChallengeGrade;
    if (accuracy >= 0.9 && totalTime <= 300) {
      grade = ChallengeGrade.S;
    } else if (accuracy >= 0.8) {
      grade = ChallengeGrade.A;
    } else if (accuracy >= 0.6) {
      grade = ChallengeGrade.B;
    } else if (accuracy >= 0.4) {
      grade = ChallengeGrade.C;
    } else {
      grade = ChallengeGrade.D;
    }

    return { grade, score: totalScore };
  }

  async submitChallenge(userId: string, submitDto: SubmitChallengeDto) {
    const { materialId, totalTime, answers } = submitDto;

    const questionIds = answers.map((a) => a.questionId);
    const questions = await this.prisma.question.findMany({
      where: { id: { in: questionIds } },
    });

    const questionMap = new Map(questions.map((q) => [q.id, q]));
    let correctCount = 0;
    const answerResults: any[] = [];

    for (const answer of answers) {
      const question = questionMap.get(answer.questionId);
      if (!question) continue;

      const isCorrect = answer.userAnswer === question.correctAnswer;
      if (isCorrect) correctCount;
      if (isCorrect) correctCount++;

      answerResults.push({
        questionId: answer.questionId,
        userAnswer: answer.userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        timeSpent: answer.timeSpent,
      });
    }

    const totalCount = answers.length;
    const accuracy = totalCount > 0 ? correctCount / totalCount : 0;
    const { grade, score } = this.calculateGrade(
      correctCount,
      totalCount,
      totalTime,
    );

    const challengeRecord = await this.prisma.challengeRecord.create({
      data: {
        userId,
        materialId,
        totalTime,
        correctCount,
        totalCount,
        accuracy,
        grade,
        score,
      },
      include: {
        material: {
          select: { title: true },
        },
      },
    });

    await this.redisService.del(LEADERBOARD_CACHE_KEY);

    return {
      challengeRecord,
      results: answerResults,
    };
  }

  async getLeaderboard(limit: number = 10) {
    const cached = await this.redisService.getJson<any[]>(
      LEADERBOARD_CACHE_KEY,
    );
    if (cached) {
      return cached;
    }

    const leaderboard = await this.prisma.challengeRecord.findMany({
      orderBy: [{ score: "desc" }, { totalTime: "asc" }],
      take: limit,
      include: {
        user: {
          select: { username: true },
        },
        material: {
          select: { title: true },
        },
      },
    });

    await this.redisService.setJson(
      LEADERBOARD_CACHE_KEY,
      leaderboard,
      LEADERBOARD_CACHE_TTL,
    );
    return leaderboard;
  }

  async getUserBestScore(userId: string) {
    return this.prisma.challengeRecord.findFirst({
      where: { userId },
      orderBy: { score: "desc" },
      include: {
        material: {
          select: { title: true },
        },
      },
    });
  }

  async getRandomQuestions(limit: number = 20) {
    const questions = await this.prisma.question.findMany({
      include: {
        material: {
          select: { title: true, content: true, tableData: true },
        },
      },
    });

    if (questions.length <= limit) {
      return questions;
    }

    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  }
}
