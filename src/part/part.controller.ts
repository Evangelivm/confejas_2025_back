import { Controller, Get, Put, Param, Res, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Response } from 'express';

@Controller('part')
export class PartController {
  constructor(private readonly prismaService: PrismaService) {}

  @Get()
  async getParticipantes() {
    return this.prismaService.getParticipantes();
  }

  @Get(':id')
  async getParticipanteById(@Param('id') id: string, @Res() res: Response) {
    try {
      const participante = await this.prismaService.getParticipanteById(id);
      return res.status(HttpStatus.OK).json(participante);
    } catch (error) {
      if (error.message === 'Participante no encontrado') {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: error.message });
      }
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Error al consultar el participante' });
    }
  }
  @Get('full/:id')
  async getFullParticipanteById(@Param('id') id: string, @Res() res: Response) {
    try {
      const participante = await this.prismaService.getFullParticipanteById(id);
      return res.status(HttpStatus.OK).json(participante);
    } catch (error) {
      if (error.message === 'Participante no encontrado') {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: error.message });
      }
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Error al consultar el participante' });
    }
  }

  @Put(':id')
  async updateAsistencia(@Param('id') id: string) {
    const response = await this.prismaService.updateAsistencia(id);

    // Publicar resúmenes después del PUT
    console.log('Actualización realizada, publicando resúmenes...');
    // await this.prismaService.publishSummariesByAges();
    // await this.prismaService.publishRoomsByAgesAndGenre();
    // await this.prismaService.publishParticipantesOrdenados();

    return response;
  }
}
