import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RedisService } from "../common/redis.service";
import { SkillType } from "@prisma/client";

const MATERIALS_CACHE_KEY = "materials:all";
const MATERIAL_CACHE_PREFIX = "material:";
const CACHE_TTL = 3600;

@Injectable()
export class MaterialService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async findAll() {
    const cached = await this.redisService.getJson<any[]>(MATERIALS_CACHE_KEY);
    if (cached) {
      return cached;
    }

    const materials = await this.prisma.material.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    await this.redisService.setJson(MATERIALS_CACHE_KEY, materials, CACHE_TTL);
    return materials;
  }

  async findOne(id: string) {
    const cacheKey = `${MATERIAL_CACHE_PREFIX}${id}`;
    const cached = await this.redisService.getJson<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const material = await this.prisma.material.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!material) {
      throw new NotFoundException("材料不存在");
    }

    await this.redisService.setJson(cacheKey, material, CACHE_TTL);
    return material;
  }

  async getRandomMaterial() {
    const materials = await this.prisma.material.findMany({
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    const validMaterials = materials.filter((m) => m._count.questions >= 5);
    if (validMaterials.length === 0) {
      throw new NotFoundException("没有可用的完整材料");
    }

    const randomIndex = Math.floor(Math.random() * validMaterials.length);
    return this.findOne(validMaterials[randomIndex].id);
  }

  async getQuestionsBySkillType(skillType: SkillType, limit: number = 20) {
    const questions = await this.prisma.question.findMany({
      where: { skillType },
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

  async getSkillTypes() {
    return Object.values(SkillType);
  }

  async clearCache() {
    await this.redisService.del(MATERIALS_CACHE_KEY);
  }
}
