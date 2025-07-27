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
      unidadesDadas,
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
      await this.decreaseStock(medicamento.id, medicamento.unidadesDadas);
    }

    return salud;
  }

  async getAtencionDetails(idSalud: number) {
    const atencion = await this.prisma.salud.findUnique({
      where: { id_salud: idSalud },
      select: {
        id_salud: true,
        fecha_consulta: true,
        motivo_consulta: true,
        tratamiento: true,
        seguimiento: true,
        fecha_seguimiento: true,
        datos: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        medicinas_recetadas: {
          select: {
            frecuencia: true,
            duracion: true,
            inventario_salud: {
              select: {
                nombre: true,
                descripcion: true,
                dosis: true,
              },
            },
          },
        },
      },
    });

    if (!atencion) {
      throw new NotFoundException(`Atencion with ID ${idSalud} not found`);
    }

    // Concatenate nombre and apellido
    const formattedAtencion = {
      ...atencion,
      datos: {
        id: atencion.datos.id,
        nombre_completo: `${atencion.datos.nombre} ${atencion.datos.apellido}`,
      },
    };

    return formattedAtencion;
  }

  async getAllAtencionDetails() {
    const atenciones = await this.prisma.salud.findMany({
      select: {
        id_salud: true,
        fecha_consulta: true,
        motivo_consulta: true,
        tratamiento: true,
        seguimiento: true,
        fecha_seguimiento: true,
        datos: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        medicinas_recetadas: {
          select: {
            frecuencia: true,
            duracion: true,
            inventario_salud: {
              select: {
                nombre: true,
                descripcion: true,
                dosis: true,
              },
            },
          },
        },
      },
    });

    // Concatenate nombre and apellido for each attention record
    const formattedAtenciones = atenciones.map((atencion) => ({
      ...atencion,
      datos: {
        id: atencion.datos.id,
        nombre_completo: `${atencion.datos.nombre} ${atencion.datos.apellido}`,
      },
    }));

    return formattedAtenciones;
  }

  async getAtencionDetailsByDatosId(idDatos: number) {
    const atenciones = await this.prisma.salud.findMany({
      where: { datos_id: idDatos },
      select: {
        id_salud: true,
        fecha_consulta: true,
        motivo_consulta: true,
        tratamiento: true,
        seguimiento: true,
        fecha_seguimiento: true,
        datos: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
        medicinas_recetadas: {
          select: {
            frecuencia: true,
            duracion: true,
            inventario_salud: {
              select: {
                nombre: true,
                descripcion: true,
                dosis: true,
              },
            },
          },
        },
      },
    });

    const formattedAtenciones = atenciones.map((atencion) => ({
      ...atencion,
      datos: {
        id: atencion.datos.id,
        nombre_completo: `${atencion.datos.nombre} ${atencion.datos.apellido}`,
      },
    }));

    return formattedAtenciones;
  }
}
