import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';
import { WsGateway } from 'src/ws/ws.gateway';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly redisService: RedisService) {
    super({
      log: ['info', 'warn', 'error'], // Opcional: logs para monitoreo
    });
  }

  async onModuleInit() {
    await this.$connect();

    // Publicar los resúmenes al iniciar el backend
    console.log('Backend iniciado, publicando resúmenes...');
    // await this.publishSummariesByAges();
    // await this.publishRoomsByAgesAndGenre();
    // await this.publishParticipantesOrdenados();
  }

  async onModuleDestroy() {
    await this.$disconnect(); // Cierra las conexiones al finalizar
  }

  // Método para obtener todos los participantes
  async getParticipantes() {
    const participantes = await this.$queryRaw<
      { id: number; name: string }[]
    >`SELECT id, CONCAT(apellido, ', ', nombre) AS name FROM datos;`;

    console.log('\x1b[95mLista total consultada\x1b[0m');
    return participantes;
  }

  // Método para obtener un participante por id_part
  async getParticipanteById(id: string) {
    if (!id || isNaN(Number(id))) {
      throw new Error('El id proporcionado no es válido');
    }

    try {
      const participante = await this.$queryRaw<
        {
          id: number;
          comp: string;
          nombre: string;
          apellido: string;
          habitacion: string;
          edad: number;
          estaca: string;
          barrio: string;
          asistio: string;
        }[]
      >`
      SELECT 
        a.id, 
        b.comp, 
        a.nombre, 
        a.apellido, 
        c.habitacion, 
        a.edad, 
        d.estaca, 
        e.barrio,
        f.asistio 
      FROM datos a
      JOIN comp b ON a.id_comp = b.id_comp
      JOIN habitacion c ON a.id_habitacion = c.id_habitacion
      JOIN estaca d ON a.id_estaca = d.id_estaca
      JOIN barrio e ON a.id_barrio = e.id_barrio
      JOIN asistencia f ON a.id = f.datos_id
      WHERE a.id = ${id};
    `;

      if (participante.length === 0) {
        throw new Error('Participante no encontrado');
      }

      const nombre = participante[0].nombre || 'Desconocido';
      const apellido = participante[0].apellido || 'Desconocido';
      console.log(`Se consultó a \x1b[33m${nombre} ${apellido}\x1b[0m`);

      return participante;
    } catch (error) {
      console.error('Error al consultar el participante:', error);
      throw new Error('Error al consultar el participante');
    }
  }

  // Método para obtener un participante por id_part
  async getFullParticipanteById(id: string) {
    if (!id || isNaN(Number(id))) {
      throw new Error('El id proporcionado no es válido');
    }

    try {
      const participante = await this.$queryRaw<
        {
          id: number;
          comp: string;
          nombre: string;
          apellido: string;
          habitacion: string;
          edad: number;
          estaca: string;
          barrio: string;
          asistio: string;
          telefono: string;
          sexo: string;
          tipo: string;
          correo: string;
          nom_c1: string;
          telef_c1: string;
          grupo_sang: string;
          miembro: string;
          enf_cronica: string;
          trat_med: string;
          seguro: string;
          alergia_med: string;
        }[]
      >`
      SELECT 
        a.id, 
        b.comp, 
        a.nombre, 
        a.apellido, 
        c.habitacion, 
        a.edad, 
        d.estaca, 
        e.barrio,
        f.asistio,
        a.telefono, 
        a.sexo, 
        a.tipo, 
        a.correo, 
        a.nom_c1, 
        a.telef_c1, 
        a.grupo_sang, 
        a.miembro, 
        a.enf_cronica, 
        a.trat_med, 
        a.seguro, 
        a.alergia_med 
      FROM datos a
      JOIN comp b ON a.id_comp = b.id_comp
      JOIN habitacion c ON a.id_habitacion = c.id_habitacion
      JOIN estaca d ON a.id_estaca = d.id_estaca
      JOIN barrio e ON a.id_barrio = e.id_barrio
      JOIN asistencia f ON a.id = f.datos_id
      WHERE a.id = ${id};
    `;

      if (participante.length === 0) {
        throw new Error('Participante no encontrado');
      }

      const nombre = participante[0].nombre || 'Desconocido';
      const apellido = participante[0].apellido || 'Desconocido';
      console.log(
        `Se consultó \x1b[4mtoda la información\x1b[24m de \x1b[33m${nombre} ${apellido}\x1b[0m`,
      );

      return participante;
    } catch (error) {
      console.error('Error al consultar el participante:', error);
      throw new Error('Error al consultar el participante');
    }
  }

  // Método para actualizar 'asistio' en la tabla asistencia
  async updateAsistencia(id: string) {
    const participante = await this.getParticipanteById(id); // Obtener el nombre

    // Ejecutamos la actualización de la asistencia
    await this.$executeRaw`
    UPDATE asistencia
    SET asistio = "Si"
    WHERE datos_id = ${id};
  `;

    const nombre = participante?.[0]?.nombre || 'Desconocido';
    const apellido = participante?.[0]?.apellido || 'Desconocido';
    console.log(
      `\x1b[32mLa asistencia de \x1b[33m${nombre} ${apellido}\x1b[32m ha sido registrada\x1b[0m`,
    );

    return { message: 'Asistencia actualizada con éxito' };
  }
  // Método para ejecutar la consulta según la edad
  async getSummaryByAge(edad: number) {
    return this.$queryRaw`
      SELECT 
        a.compañia, 
        SUM(CASE WHEN a.sexo = 'H' THEN 1 ELSE 0 END) AS hombres, 
        SUM(CASE WHEN a.sexo = 'M' THEN 1 ELSE 0 END) AS mujeres 
      FROM 
        datos a 
      JOIN 
        asistencia b 
      ON 
        a.id_part = b.id_part 
      WHERE 
        a.compañia IN (
          SELECT id_comp 
          FROM datos 
          WHERE edad = ${edad}
        ) 
        AND a.tipo = 'Participante' 
        AND b.asistio = 'Si' 
      GROUP BY 
        a.compañia 
      ORDER BY 
        hombres DESC, 
        mujeres DESC;
    `;
  }

  // // Método para ejecutar la consulta de habitaciones según la edad y género
  // async getRoomsByAgesAndGenre(edad: number, sexo: string) {
  //   const result = await this.$queryRaw`
  //   SELECT
  //       a.habitacion,
  //       a.nro_camas AS 'camas',
  //       COUNT(b.id_part) AS 'registrados',
  //       COUNT(CASE WHEN c.asistio = 'Si' THEN 1 END) AS 'ocupados',
  //       a.nro_camas - COUNT(CASE WHEN c.asistio = 'Si' THEN 1 END) AS 'libres'
  //   FROM habitacion a
  //   JOIN participante b ON a.habit_id = b.habitacion
  //   JOIN asistencia c ON b.id_part = c.id_part
  //   WHERE a.sexo = ${sexo}  -- Filtro por género
  //     AND a.habit_id IN (
  //         SELECT habitacion
  //         FROM participante
  //         WHERE edad = ${edad}  -- Filtro por edad
  //         GROUP BY habitacion
  //     )
  //   GROUP BY a.habitacion, a.nro_camas;
  // `;

  //   // Convertir los resultados a tipo number
  //   return (result as any).map((row) => ({
  //     ...row,
  //     registrados: Number(row.registrados),
  //     ocupados: Number(row.ocupados),
  //     libres: Number(row.libres),
  //   }));
  // }

  // Método para publicar y guardar en Hashes
  // async publishSummariesByAges() {
  //   const edades = [
  //     18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
  //   ];

  //   for (const edad of edades) {
  //     const summary = await this.getSummaryByAge(edad);
  //     const channel = `summary-age-${edad}`;
  //     const serializedSummary = JSON.stringify(summary);

  //     // Guardar el último mensaje en un Redis Hash
  //     await this.redisService.setHash(
  //       `last-message:${channel}`,
  //       'message',
  //       serializedSummary,
  //     );

  //     // Publicar el mensaje en el canal Pub/Sub
  //     await this.redisService.publish(channel, serializedSummary);

  //     console.log(
  //       `Publicado y guardado resumen para edad ${edad} en el canal ${channel}`,
  //     );
  //   }
  // }
  // Método para publicar habitaciones y guardar en Hashes
  // async publishRoomsByAgesAndGenre() {
  //   const edades = [
  //     18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
  //   ];
  //   const generos = ['H', 'M'];
  //   for (const genero of generos) {
  //     for (const edad of edades) {
  //       const rooms = await this.getRoomsByAgesAndGenre(edad, genero);
  //       const channel = `rooms-age-${edad}-${genero}`;
  //       const serializedRooms = JSON.stringify(rooms);

  //       // Guardar el último mensaje en un Redis Hash
  //       await this.redisService.setHash(
  //         `last-message:${channel}`,
  //         'message',
  //         serializedRooms,
  //       );

  //       // Publicar el mensaje en el canal Pub/Sub
  //       await this.redisService.publish(channel, serializedRooms);

  //       console.log(
  //         `Publicado y guardado resumen para edad ${edad} y sexo ${genero} en el canal ${channel}`,
  //       );
  //     }
  //   }
  // }

  // PrismaService - Agregar nueva consulta para obtener estacas
  async getEstacas() {
    const estacas = await this.$queryRaw<
      { id_estaca: number; estaca: string }[]
    >`SELECT id_estaca, estaca FROM estaca;`;

    console.log('Estacas consultadas:', estacas);
    return estacas;
  }
  // Método para obtener barrios por estaca
  async getBarriosByEstaca(estacaId: string) {
    return this.$queryRaw`
      SELECT id_barrio, barrio 
      FROM barrio 
      WHERE id_estaca = ${estacaId};
    `;
  }
  // Obtener el último mensaje desde Redis Hash
  // async getLastMessage(channel: string) {
  //   const message = await this.redisService.getHashField(
  //     `last-message:${channel}`,
  //     'message',
  //   );
  //   return message ? JSON.parse(message) : null;
  // }
  // Método para obtener lista completa ordenada por compañía y sexo
  // async getParticipantesOrdenados() {
  //   try {
  //     const participantes = await this.$queryRaw<
  //       {
  //         nombres: string;
  //         sexo: string;
  //         estaca: string;
  //         barrio: string;
  //         compañia: string;
  //         habitacion: string;
  //         asistio: string;
  //       }[]
  //     >`
  //       SELECT
  //         CONCAT(a.apellidos, ", ", a.nombres) AS nombres,
  //         a.sexo AS sexo,
  //         CONCAT("Estaca ", f.estaca) AS estaca,
  //         e.barrio AS barrio,
  //         a.compañia AS compañia,
  //         c.habitacion AS habitacion,
  //         d.asistio AS asistio
  //       FROM participante a
  //       JOIN habitacion c ON a.habitacion = c.habit_id
  //       JOIN asistencia d ON a.id_part = d.id_part
  //       JOIN barrio e ON a.barrio = e.id_barrio
  //       JOIN estaca f ON a.estaca = f.est_id
  //       ORDER BY a.compañia, a.sexo DESC, d.asistio DESC;
  //     `;

  //     console.log('Lista ordenada consultada');
  //     return participantes;
  //   } catch (error) {
  //     console.error('Error al consultar la lista ordenada:', error);
  //     throw new Error('Error al consultar la lista ordenada de participantes');
  //   }
  // }
  // async publishParticipantesOrdenados() {
  //   try {
  //     const participantes = await this.getParticipantesOrdenados();
  //     const message = JSON.stringify(participantes);
  //     const channel = 'participantes-ordenados';

  //     // Guardar en Redis Hash
  //     await this.redisService.setHash(
  //       `last-message:${channel}`,
  //       'message',
  //       message,
  //     );

  //     // Publicar en el canal
  //     await this.redisService.publish(channel, message);

  //     console.log('Lista de participantes ordenados publicada y guardada');
  //     return participantes;
  //   } catch (error) {
  //     console.error('Error al publicar lista ordenada:', error);
  //     throw new Error('Error al publicar lista ordenada de participantes');
  //   }
  // }
}
