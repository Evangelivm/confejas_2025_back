import { Module } from '@nestjs/common';
import { SaludService } from './salud.service';
import { SaludController } from './salud.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SaludService],
  controllers: [SaludController],
})
export class SaludModule {}
