import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SubmitTrainingDto, AnswerDto } from "./dto/training.dto";
import { SkillType } from "@prisma/client";

@Injectable()
export class TrainingService {
  constructor(private prisma: PrismaService) {}

  async submitTraining(userId: string, submitDto: SubmitTrainingDto) {
    const { materialId, isChallenge, totalTime, answers } = submitDto;

    const questionIds = answers.map((a) => a.questionId);
    const questions = await this.prisma.question.findMany({
      where: { id: { in: questionIds } },
    });

    const questionMap = new Map(questions.map((q) => [q.id, q]));
    let correctCount = 0;
    const wrongAnswers: any[] = [];
    const answerResults: any[] = [];
    const skillStatsUpdates: Map<
      SkillType,
      { correct: number; total: number; time: number }
    > = new Map();

    for (const answer of answers) {
      const question = questionMap.get(answer.questionId);
      if (!question) continue;

      const isCorrect = answer.userAnswer === question.correctAnswer;

      if (isCorrect) {
        correctCount++;
      }

      answerResults.push({
        questionId: answer.questionId,
        userAnswer: answer.userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        timeSpent: answer.timeSpent,
        skillType: question.skillType,
        explanation: question.explanation,
        formula: question.formula,
        calculation: question.calculation,
        tip: question.tip,
      });

      const skillStat = skillStatsUpdates.get(question.skillType) || {
        correct: 0,
        total: 0,
        time: 0,
      };
      skillStat.total++;
      skillStat.time += answer.timeSpent;
      if (isCorrect) skillStat.correct++;
      skillStatsUpdates.set(question.skillType, skillStat);

      if (!isCorrect) {
        wrongAnswers.push({
          userId,
          questionId: answer.questionId,
          userAnswer: answer.userAnswer,
          correctAnswer: question.correctAnswer,
          timeSpent: answer.timeSpent,
        });
      }
    }

    const totalCount = answers.length;
    const accuracy = totalCount > 0 ? correctCount / totalCount : 0;

    const trainingRecord = await this.prisma.$transaction(async (tx) => {
      const record = await tx.trainingRecord.create({
        data: {
          userId,
          materialId,
          isChallenge,
          totalTime,
          correctCount,
          totalCount,
          accuracy,
          answers: answerResults,
        },
      });

      if (wrongAnswers.length > 0) {
        await tx.wrongAnswer.createMany({
          data: wrongAnswers,
        });
      }

      for (const [skillType, stats] of skillStatsUpdates) {
        const existing = await tx.skillStats.findUnique({
          where: {
            userId_skillType: {
              userId,
              skillType,
            },
          },
        });

        if (existing) {
          const newTotalAttempts = existing.totalAttempts + stats.total;
          const newCorrectCount = existing.correctCount + stats.correct;
          const newTotalTimeSpent = existing.totalTimeSpent + stats.time;

          await tx.skillStats.update({
            where: { id: existing.id },
            data: {
              totalAttempts: newTotalAttempts,
              correctCount: newCorrectCount,
              totalTimeSpent: newTotalTimeSpent,
              accuracy:
                newTotalAttempts > 0 ? newCorrectCount / newTotalAttempts : 0,
              avgTimePerQuestion:
                newTotalAttempts > 0 ? newTotalTimeSpent / newTotalAttempts : 0,
            },
          });
        }
      }

      return record;
    });

    return {
      trainingRecord,
      results: answerResults,
    };
  }

  async getWrongAnswers(
    userId: string,
    skillType?: SkillType,
    isResolved?: boolean,
  ) {
    const where: any = { userId };
    if (skillType !== undefined) {
      where.question = { skillType };
    }
    if (isResolved !== undefined) {
      where.isResolved = isResolved;
    }

    return this.prisma.wrongAnswer.findMany({
      where,
      include: {
        question: {
          include: {
            material: {
              select: { title: true, content: true, tableData: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async resolveWrongAnswer(userId: string, wrongAnswerId: string) {
    const wrongAnswer = await this.prisma.wrongAnswer.findUnique({
      where: { id: wrongAnswerId },
    });

    if (!wrongAnswer || wrongAnswer.userId !== userId) {
      throw new NotFoundException("错题记录不存在");
    }

    return this.prisma.wrongAnswer.update({
      where: { id: wrongAnswerId },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
      },
    });
  }

  async getTrainingRecord(userId: string, recordId: string) {
    const record = await this.prisma.trainingRecord.findUnique({
      where: { id: recordId },
      include: {
        material: {
          select: { title: true, content: true, tableData: true },
        },
      },
    });

    if (!record || record.userId !== userId) {
      throw new NotFoundException("训练记录不存在");
    }

    return record;
  }
}
