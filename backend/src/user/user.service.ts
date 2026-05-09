import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SkillType } from "@prisma/client";

const TIMEZONE_OFFSET_HOURS = 8;

function toLocalDateString(utcDate: Date): string {
  const localMs = utcDate.getTime() + TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000;
  const localDate = new Date(localMs);
  const y = localDate.getUTCFullYear();
  const m = String(localDate.getUTCMonth() + 1).padStart(2, "0");
  const d = String(localDate.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getStreakDays(userId: string): Promise<number> {
    const records = await this.prisma.trainingRecord.findMany({
      where: { userId },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    if (records.length === 0) return 0;

    const uniqueDays = [
      ...new Set(records.map((r) => toLocalDateString(r.createdAt))),
    ].sort((a, b) => b.localeCompare(a));

    const today = toLocalDateString(new Date());
    const yesterday = toLocalDateString(
      new Date(Date.now() - 24 * 60 * 60 * 1000),
    );

    if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) {
      return 0;
    }

    let streak = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      const prev = new Date(uniqueDays[i - 1]);
      const curr = new Date(uniqueDays[i]);
      const diffMs = prev.getTime() - curr.getTime();
      const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));

      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

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

    const streakDays = await this.getStreakDays(userId);

    return {
      totalTrainings,
      totalChallenges,
      bestChallenge,
      unresolvedWrongAnswers: wrongAnswers,
      skillStats,
      recentTrainings,
      streakDays,
    };
  }
}
