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

  private getChinaDate(date: Date): string {
    const chinaOffset = 8 * 60;
    const localOffset = date.getTimezoneOffset();
    const totalOffset = chinaOffset + localOffset;
    const chinaTime = new Date(date.getTime() + totalOffset * 60 * 1000);
    return chinaTime.toISOString().split("T")[0];
  }

  private calculateStreak(dates: string[]): number {
    if (dates.length === 0) return 0;

    const uniqueDates = [...new Set(dates)].sort().reverse();

    let streak = 0;
    const today = this.getChinaDate(new Date());
    const yesterday = this.getChinaDate(
      new Date(Date.now() - 24 * 60 * 60 * 1000),
    );

    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
      return 0;
    }

    for (let i = 0; i < uniqueDates.length; i++) {
      if (i === 0) {
        streak++;
        continue;
      }

      const current = new Date(uniqueDates[i - 1]);
      const prev = new Date(uniqueDates[i]);

      const diffDays =
        (current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays <= 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
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

    const allRecords = await this.prisma.$queryRaw<{ createdAt: Date }[]>`
      SELECT "createdAt" FROM training_records WHERE "userId" = ${userId}
      UNION ALL
      SELECT "createdAt" FROM challenge_records WHERE "userId" = ${userId}
      ORDER BY "createdAt" DESC
    `;

    const chinaDates = allRecords.map((r) => this.getChinaDate(r.createdAt));
    const streak = this.calculateStreak(chinaDates);

    return {
      totalTrainings,
      totalChallenges,
      bestChallenge,
      unresolvedWrongAnswers: wrongAnswers,
      skillStats,
      recentTrainings,
      streak,
    };
  }
}
