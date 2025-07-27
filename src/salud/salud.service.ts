import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SaludService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.getSaludData();
  }

  getInventario() {
    return this.prisma.inventario_salud.findMany({
      select: {
        id_inventario_salud: true,
        nombre: true,
        descripcion: true,
        stock: true,
        dosis: true,
      },
    });
  }

  createInventarioItem(data: {
    nombre: string;
    descripcion?: string;
    stock: number;
    dosis?: string;
  }) {
    return this.prisma.inventario_salud.create({ data });
  }

  updateInventarioItem(
    id: number,
    data: {
      nombre?: string;
      descripcion?: string;
      stock?: number;
      dosis?: string;
    },
  ) {
    return this.prisma.inventario_salud.update({
      where: { id_inventario_salud: id },
      data,
    });
  }

  async decreaseStock(id: number, amount: number) {
    const item = await this.prisma.inventario_salud.findUnique({
      where: { id_inventario_salud: id },
    });

    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    if (item.stock < amount) {
      throw new BadRequestException('Insufficient stock');
    }

    return this.prisma.inventario_salud.update({
      where: { id_inventario_salud: id },
      data: {
        stock: {
          decrement: amount,
        },
      },
    });
  }

  async deleteInventarioItem(id: number) {
    const item = await this.prisma.inventario_salud.findUnique({
      where: { id_inventario_salud: id },
    });

    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    return this.prisma.inventario_salud.delete({
      where: { id_inventario_salud: id },
    });
  }

  async createAtencion(data: any) {
    const {
      motivoConsulta,
      tratamiento,
      medicamentos,
      seguimiento,
      datos_id,
      fecha_consulta,
      fecha_seguimiento,
    } = data;

    const salud = await this.prisma.salud.create({
      data: {
        datos_id: datos_id,
        motivo_consulta: motivoConsulta,
        tratamiento: tratamiento,
        seguimiento: seguimiento ? 1 : 0,
        fecha_consulta: fecha_consulta,
        fecha_seguimiento: fecha_seguimiento,
      },
    });

    for (const medicamento of medicamentos) {
      await this.prisma.medicinas_recetadas.create({
        data: {
          id_salud: salud.id_salud,
          id_inventario_salud: medicamento.id,
          frecuencia: medicamento.frecuencia,
          duracion: medicamento.duracion,
        },
      });
    }

    return salud;
  }
}
