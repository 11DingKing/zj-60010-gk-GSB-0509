import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SkillType } from "@prisma/client";

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        skillStats: true,
        challengeRecords: {
          orderBy: { score: "desc" },
          take: 5,
        },
      },
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      skillStats: user.skillStats,
      topChallenges: user.challengeRecords,
    };
  }

  async getSkillStats(userId: string) {
    return this.prisma.skillStats.findMany({
      where: { userId },
    });
  }

  async getRecentTrainings(userId: string, limit: number = 20) {
    const trainings = await this.prisma.trainingRecord.findMany({
      where: { userId, isChallenge: false },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        material: {
          select: { title: true },
        },
      },
    });
    return trainings;
  }

  async getChallengeHistory(userId: string, limit: number = 20) {
    return this.prisma.challengeRecord.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        material: {
          select: { title: true },
        },
      },
    });
  }

  async getDashboardStats(userId: string) {
    const totalTrainings = await this.prisma.trainingRecord.count({
      where: { userId, isChallenge: false },
    });

    const totalChallenges = await this.prisma.challengeRecord.count({
      where: { userId },
    });

    const bestChallenge = await this.prisma.challengeRecord.findFirst({
      where: { userId },
      orderBy: { score: "desc" },
    });

    const wrongAnswers = await this.prisma.wrongAnswer.count({
      where: { userId, isResolved: false },
    });

    const skillStats = await this.getSkillStats(userId);

    const recentTrainings = await this.prisma.trainingRecord.findMany({
      where: { userId, isChallenge: false },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        totalTime: true,
        correctCount: true,
        totalCount: true,
        accuracy: true,
        createdAt: true,
      },
    });

    return {
      totalTrainings,
      totalChallenges,
      bestChallenge,
      unresolvedWrongAnswers: wrongAnswers,
      skillStats,
      recentTrainings,
    };
  }
}
