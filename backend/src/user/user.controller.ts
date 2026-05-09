import { Controller, Get, Param, Request } from "@nestjs/common";
import { UserService } from "./user.service";

@Controller("user")
export class UserController {
  constructor(private userService: UserService) {}

  @Get("profile")
  async getProfile(@Request() req) {
    return this.userService.getProfile(req.user.userId);
  }

  @Get("stats")
  async getSkillStats(@Request() req) {
    return this.userService.getSkillStats(req.user.userId);
  }

  @Get("trainings")
  async getRecentTrainings(@Request() req) {
    return this.userService.getRecentTrainings(req.user.userId);
  }

  @Get("challenges")
  async getChallengeHistory(@Request() req) {
    return this.userService.getChallengeHistory(req.user.userId);
  }

  @Get("dashboard")
  async getDashboardStats(@Request() req) {
    return this.userService.getDashboardStats(req.user.userId);
  }
}
