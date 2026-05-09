import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { SkillType } from "@prisma/client";

export class AnswerDto {
  @IsString()
  questionId: string;

  @IsInt()
  userAnswer: number;

  @IsInt()
  timeSpent: number;
}

export class SubmitTrainingDto {
  @IsOptional()
  @IsString()
  materialId?: string;

  @IsBoolean()
  isChallenge: boolean;

  @IsInt()
  totalTime: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}

export class WrongAnswerResolveDto {
  @IsString()
  wrongAnswerId: string;
}
