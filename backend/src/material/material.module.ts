import { Module } from "@nestjs/common";
import { MaterialService } from "./material.service";
import { MaterialController } from "./material.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { CommonModule } from "../common/common.module";

@Module({
  imports: [PrismaModule, CommonModule],
  providers: [MaterialService],
  controllers: [MaterialController],
  exports: [MaterialService],
})
export class MaterialModule {}
