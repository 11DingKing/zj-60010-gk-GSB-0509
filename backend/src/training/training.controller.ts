import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  Query,
} from "@nestjs/common";
import { TrainingService } from "./training.service";
import { SubmitTrainingDto, WrongAnswerResolveDto } from "./dto/training.dto";
import { SkillType } from "@prisma/client";

@Controller("training")
export class TrainingController {
  constructor(private trainingService: TrainingService) {}

  @Post("submit")
  async submitTraining(@Request() req, @Body() submitDto: SubmitTrainingDto) {
    return this.trainingService.submitTraining(req.user.userId, submitDto);
  }

  @Get("wrong-answers")
  async getWrongAnswers(
    @Request() req,
    @Query("skillType") skillType?: SkillType,
    @Query("isResolved") isResolved?: boolean,
  ) {
    const resolved =
      isResolved === true || isResolved === "true"
        ? true
        : isResolved === false || isResolved === "false"
          ? false
          : undefined;
    return this.trainingService.getWrongAnswers(
      req.user.userId,
      skillType,
      resolved,
    );
  }

  @Post("wrong-answers/resolve")
  async resolveWrongAnswer(
    @Request() req,
    @Body() body: WrongAnswerResolveDto,
  ) {
    return this.trainingService.resolveWrongAnswer(
      req.user.userId,
      body.wrongAnswerId,
    );
  }

  @Get("record/:id")
  async getTrainingRecord(@Request() req, @Param("id") id: string) {
    return this.trainingService.getTrainingRecord(req.user.userId, id);
  }
}
