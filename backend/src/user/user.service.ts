import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SkillType } from "@prisma/client";

const TIMEZONE = "Asia/Shanghai";

function getLocalDate(date: Date): string {
  return date.toLocaleDateString("zh-CN", { timeZone: TIMEZONE });
}

function getTodayLocalDate(): string {
  return getLocalDate(new Date());
}

function getYesterdayLocalDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getLocalDate(yesterday);
}

function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

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

  async calculateStreak(userId: string): Promise<number> {
    const allRecords = await this.prisma.trainingRecord.findMany({
      where: { userId },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    if (allRecords.length === 0) {
      return 0;
    }

    const uniqueDates = new Set<string>();
    for (const record of allRecords) {
      uniqueDates.add(getLocalDate(record.createdAt));
    }

    const sortedDates = Array.from(uniqueDates).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });

    if (sortedDates.length === 0) {
      return 0;
    }

    const today = getTodayLocalDate();
    const yesterday = getYesterdayLocalDate();

    if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
      return 0;
    }

    let streak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = Math.round(
        (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays === 1) {
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

    const streak = await this.calculateStreak(userId);

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
