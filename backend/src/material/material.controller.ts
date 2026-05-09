import { Controller, Get, Param, Request } from "@nestjs/common";
import { MaterialService } from "./material.service";
import { SkillType } from "@prisma/client";
import { Public } from "../common/decorators/public.decorator";

@Controller("materials")
export class MaterialController {
  constructor(private materialService: MaterialService) {}

  @Public()
  @Get()
  async findAll() {
    return this.materialService.findAll();
  }

  @Public()
  @Get("random")
  async getRandomMaterial() {
    return this.materialService.getRandomMaterial();
  }

  @Public()
  @Get("skill-types")
  async getSkillTypes() {
    return this.materialService.getSkillTypes();
  }

  @Public()
  @Get("by-skill/:skillType")
  async getQuestionsBySkillType(@Param("skillType") skillType: SkillType) {
    return this.materialService.getQuestionsBySkillType(skillType);
  }

  @Public()
  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.materialService.findOne(id);
  }
}
