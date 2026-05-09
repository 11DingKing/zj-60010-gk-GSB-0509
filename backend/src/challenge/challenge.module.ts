import { Module } from "@nestjs/common";
import { ChallengeService } from "./challenge.service";
import { ChallengeController } from "./challenge.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { CommonModule } from "../common/common.module";

@Module({
  imports: [PrismaModule, CommonModule],
  providers: [ChallengeService],
  controllers: [ChallengeController],
  exports: [ChallengeService],
})
export class ChallengeModule {}
