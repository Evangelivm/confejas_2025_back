import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  Delete,
} from '@nestjs/common';
import { SaludService } from './salud.service';

@Controller('salud')
export class SaludController {
  constructor(private readonly saludService: SaludService) {}

  @Get()
  findAll() {
    return this.saludService.findAll();
  }

  @Get('inv')
  getInventario() {
    return this.saludService.getInventario();
  }

  @Post('inv')
  createInventarioItem(@Body() data: any) {
    return this.saludService.createInventarioItem(data);
  }

  @Put('inv/:id')
  updateInventarioItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return this.saludService.updateInventarioItem(id, data);
  }

  @Patch('inv/decrease-stock/:id')
  decreaseStock(
    @Param('id', ParseIntPipe) id: number,
    @Body('amount', ParseIntPipe) amount: number,
  ) {
    return this.saludService.decreaseStock(id, amount);
  }

  @Delete('inv/:id')
  deleteInventarioItem(@Param('id', ParseIntPipe) id: number) {
    return this.saludService.deleteInventarioItem(id);
  }

  @Post('atencion')
  createAtencion(@Body() data: any) {
    return this.saludService.createAtencion(data);
  }
}
