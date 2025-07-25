import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly prismaService: PrismaService) {}

  @Get()
  async getStats() {
    return await this.prismaService.getParticipantesOrdenados();
  }
}
