import {
  IsInt,
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
} from "class-validator";
import { Type } from "class-transformer";
import { ChallengeGrade } from "@prisma/client";

export class ChallengeAnswerDto {
  @IsString()
  questionId: string;

  @IsInt()
  userAnswer: number;

  @IsInt()
  timeSpent: number;
}

export class SubmitChallengeDto {
  @IsString()
  materialId: string;

  @IsInt()
  totalTime: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChallengeAnswerDto)
  answers: ChallengeAnswerDto[];
}
