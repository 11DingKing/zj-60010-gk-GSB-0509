import { Controller, Get, Post, Body, Query, Request } from "@nestjs/common";
import { ChallengeService } from "./challenge.service";
import { SubmitChallengeDto } from "./dto/challenge.dto";
import { Public } from "../common/decorators/public.decorator";

@Controller("challenge")
export class ChallengeController {
  constructor(private challengeService: ChallengeService) {}

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

  @Public()
  @Get("random-questions")
  async getRandomQuestions(@Query("limit") limit: number = 20) {
    return this.challengeService.getRandomQuestions(limit);
  }
}
