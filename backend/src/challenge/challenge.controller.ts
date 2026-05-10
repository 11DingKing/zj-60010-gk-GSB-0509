import { Controller, Get, Post, Body, Query, Request } from "@nestjs/common";
import { ChallengeService } from "./challenge.service";
import { SubmitChallengeDto } from "./dto/challenge.dto";
import { Public } from "../common/decorators/public.decorator";
import { SkillType } from "@prisma/client";

@Controller("challenge")
export class ChallengeController {
  constructor(private challengeService: ChallengeService) {}

  @Public()
  @Get("questions")
  async getRandomQuestions(
    @Query("count") count?: number,
    @Query("skillType") skillType?: SkillType,
  ) {
    return this.challengeService.getRandomQuestions(count || 20, skillType);
  }

  @Post("submit")
  async submitChallenge(@Request() req, @Body() submitDto: SubmitChallengeDto) {
    return this.challengeService.submitChallenge(req.user.userId, submitDto);
  }

  @Public()
  @Get("leaderboard")
  async getLeaderboard(@Query("limit") limit: number = 10) {
    return this.challengeService.getLeaderboard(limit);
  }

  @Get("best")
  async getUserBestScore(@Request() req) {
    return this.challengeService.getUserBestScore(req.user.userId);
  }
}
