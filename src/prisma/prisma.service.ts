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
    await this.publishSummariesByAges();
    await this.publishRoomsByAgesAndGenre();
    await this.publishParticipantesOrdenados();
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
          nacimiento: Date;
          sexo: string;
          tipo: string;
          talla: string;
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
        a.nacimiento,
        a.sexo, 
        a.tipo,
        a.talla, 
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
        a.id_comp, 
        SUM(CASE WHEN a.sexo = 'H' THEN 1 ELSE 0 END) AS hombres, 
        SUM(CASE WHEN a.sexo = 'M' THEN 1 ELSE 0 END) AS mujeres 
      FROM 
        datos a 
      JOIN 
        asistencia b 
      ON 
        a.id = b.datos_id 
      WHERE 
        a.id_comp IN (
          SELECT id_comp 
          FROM datos 
          WHERE edad = ${edad}
        ) 
        AND a.tipo = 'Participante' 
        AND b.asistio = 'Si' 
      GROUP BY 
        a.id_comp 
      ORDER BY 
        hombres DESC, 
        mujeres DESC;
    `;
  }

  // Método para ejecutar la consulta de habitaciones según la edad y género
  async getRoomsByAgesAndGenre(edad: number, sexo: string) {
    const result = await this.$queryRaw`
 SELECT
        a.id_habitacion,
        a.habitacion,
        a.capacidad AS 'camas',
        COUNT(b.id) AS 'registrados',
        COUNT(CASE WHEN c.asistio = 'Si' THEN 1 END) AS 'ocupados',
        a.capacidad - COUNT(CASE WHEN c.asistio = 'Si' THEN 1 END) AS 'libres'
    FROM habitacion a
    JOIN datos b ON a.id_habitacion = b.id_habitacion
    JOIN asistencia c ON b.id = c.datos_id
    WHERE b.sexo = ${sexo} 
      AND a.id_habitacion IN (
          SELECT id_habitacion
          FROM datos
          WHERE edad = ${edad}
          GROUP BY id_habitacion
      )
    GROUP BY a.id_habitacion,a.habitacion, a.capacidad;
  `;

    // Convertir los resultados a tipo number
    return (result as any).map((row) => ({
      ...row,
      registrados: Number(row.registrados),
      ocupados: Number(row.ocupados),
      libres: Number(row.libres),
    }));
  }

  // Método para publicar y guardar en Hashes
  async publishSummariesByAges() {
    const edades = [
      18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
    ];

    for (const edad of edades) {
      const summary = await this.getSummaryByAge(edad);
      const channel = `summary-age-${edad}`;
      const serializedSummary = JSON.stringify(summary);

      // Guardar el último mensaje en un Redis Hash
      await this.redisService.setHash(
        `last-message:${channel}`,
        'message',
        serializedSummary,
      );

      // Publicar el mensaje en el canal Pub/Sub
      await this.redisService.publish(channel, serializedSummary);

      console.log(
        `Publicado y guardado resumen para edad ${edad} en el canal ${channel}`,
      );
    }
  }
  // Método para publicar habitaciones y guardar en Hashes
  async publishRoomsByAgesAndGenre() {
    const edades = [
      18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
    ];
    const generos = ['H', 'M'];
    for (const genero of generos) {
      for (const edad of edades) {
        const rooms = await this.getRoomsByAgesAndGenre(edad, genero);
        const channel = `rooms-age-${edad}-${genero}`;
        const serializedRooms = JSON.stringify(rooms);

        // Guardar el último mensaje en un Redis Hash
        await this.redisService.setHash(
          `last-message:${channel}`,
          'message',
          serializedRooms,
        );

        // Publicar el mensaje en el canal Pub/Sub
        await this.redisService.publish(channel, serializedRooms);

        console.log(
          `Publicado y guardado resumen para edad ${edad} y sexo ${genero} en el canal ${channel}`,
        );
      }
    }
  }

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
  async getLastMessage(channel: string) {
    const message = await this.redisService.getHashField(
      `last-message:${channel}`,
      'message',
    );
    return message ? JSON.parse(message) : null;
  }
  // Método para obtener lista completa ordenada por compañía y sexo
  async getParticipantesOrdenados() {
    try {
      const participantes = await this.$queryRaw<
        {
          nombres: string;
          sexo: string;
          estaca: string;
          barrio: string;
          comp: string;
          habitacion: string;
          asistio: string;
        }[]
      >`
        SELECT
          CONCAT(a.apellido, ", ", a.nombre) AS nombres,
          a.sexo AS sexo,
          CONCAT("Estaca ", f.estaca) AS estaca,
          e.barrio AS barrio,
          a.id_comp AS comp,
          c.habitacion AS habitacion,
          d.asistio AS asistio
        FROM datos a
        JOIN habitacion c ON a.id_habitacion = c.id_habitacion
        JOIN asistencia d ON a.id = d.id_asistencia
        JOIN barrio e ON a.id_barrio = e.id_barrio
        JOIN estaca f ON a.id_estaca = f.id_estaca
        ORDER BY a.id_comp, a.sexo DESC, d.asistio DESC;
      `;

      console.log('Lista ordenada consultada');
      return participantes;
    } catch (error) {
      console.error('Error al consultar la lista ordenada:', error);
      throw new Error('Error al consultar la lista ordenada de participantes');
    }
  }

  // Método para obtener lista completa ordenada por compañía y sexo
  async getParticipantesByCompania(id: string) {
    try {
      const participantes = await this.$queryRaw<
        {
          id: number;
          nombres: string;
          sexo: string;
          estaca: string;
          barrio: string;
          edad: number;
          comp: string;
          tipo: string;
          habitacion: string;
          asistio: string;
        }[]
      >`
        SELECT
          a.id,
          CONCAT(a.apellido, ", ", a.nombre) AS nombres,
          a.sexo AS sexo,
          f.estaca AS estaca,
          e.barrio AS barrio,
          a.edad,
          a.tipo,
          g.comp AS comp,
          c.habitacion AS habitacion,
          d.asistio AS asistio
        FROM datos a
        JOIN habitacion c ON a.id_habitacion = c.id_habitacion
        JOIN asistencia d ON a.id = d.id_asistencia
        JOIN barrio e ON a.id_barrio = e.id_barrio
        JOIN estaca f ON a.id_estaca = f.id_estaca
        JOIN comp g ON a.id_comp = g.id_comp
        WHERE g.id_comp = ${id}
        ORDER BY a.id_comp, a.sexo DESC, d.asistio DESC;
      `;

      console.log('Lista ordenada por compania consultada');
      return participantes;
    } catch (error) {
      console.error(
        'Error al consultar la lista ordenada por compania:',
        error,
      );
      throw new Error(
        'Error al consultar la lista ordenada de participantes por compania',
      );
    }
  }

  // Método para obtener los datos de salud de todos los participantes
  async getSaludData() {
    try {
      const saludData = await this.$queryRaw<
        {
          id: number;
          nombres: string;
          edad: number;
          sexo: string;
          comp: string;
          grupo_sang: string;
          enf_cronica: string;
          trat_med: string;
          alergia_med: string;
        }[]
      >`
        SELECT
          a.id,
          CONCAT(a.nombre, " ", a.apellido) AS nombres,
          a.edad,
          a.sexo,
          REPLACE(g.comp, 'C', '') AS comp,
          a.grupo_sang,
          a.enf_cronica,
          a.trat_med,
          a.alergia_med
        FROM datos a
        JOIN comp g ON a.id_comp = g.id_comp
        ORDER BY g.comp, nombres;
      `;

      console.log('\x1b[95mDatos de salud consultados\x1b[0m');
      return saludData;
    } catch (error) {
      console.error('Error al consultar los datos de salud:', error);
      throw new Error('Error al consultar los datos de salud');
    }
  }

  // Método para obtener los datos de salud de todos los participantes
  async getFullSaludData(id: string) {
    try {
      const saludData = await this.$queryRaw<
        {
          id: number;
          nombres: string;
          edad: number;
          sexo: string;
          comp: string;
          grupo_sang: string;
          enf_cronica: string;
          trat_med: string;
          alergia_med: string;
        }[]
      >`
        SELECT
          a.id,
          CONCAT(a.nombre, " ", a.apellido) AS nombres,
          a.edad,
          a.sexo,
          CONCAT('Compañia ', REPLACE(g.comp, 'C', '')) AS comp,
          a.grupo_sang,
          a.enf_cronica,
          a.trat_med,
          a.alergia_med
        FROM datos a
        JOIN comp g ON a.id_comp = g.id_comp
        ORDER BY g.comp, nombres;
      `;

      console.log('\x1b[95mDatos de salud completos consultados\x1b[0m');
      return saludData;
    } catch (error) {
      console.error('Error al consultar los datos de salud completos:', error);
      throw new Error('Error al consultar los datos de salud completos');
    }
  }

  async publishParticipantesOrdenados() {
    try {
      const participantes = await this.getParticipantesOrdenados();
      const message = JSON.stringify(participantes);
      const channel = 'participantes-ordenados';

      // Guardar en Redis Hash
      await this.redisService.setHash(
        `last-message:${channel}`,
        'message',
        message,
      );

      // Publicar en el canal
      await this.redisService.publish(channel, message);

      console.log('Lista de participantes ordenados publicada y guardada');
      return participantes;
    } catch (error) {
      console.error('Error al publicar lista ordenada:', error);
      throw new Error('Error al publicar lista ordenada de participantes');
    }
  }

  // Método para crear un nuevo participante y su asistencia en una transacción
  async createParticipanteWithAsistencia(data: {
    apellido: string;
    nombre: string;
    nacimiento: string;
    edad: number;
    sexo: string;
    id_estaca: number;
    id_barrio: number;
    id_comp: number;
    id_habitacion: number;
  }) {
    return this.$transaction(async (prisma) => {
      // 1. Insertar en la tabla 'datos'
      const newParticipante = await prisma.$executeRaw`
        INSERT INTO datos (apellido, nombre, nacimiento, edad, sexo, id_estaca, id_barrio, id_comp, id_habitacion, id_sesion, tipo)
        VALUES (${data.apellido}, ${data.nombre}, ${data.nacimiento}, ${data.edad}, ${data.sexo}, ${data.id_estaca}, ${data.id_barrio}, ${data.id_comp}, ${data.id_habitacion}, 1,"Participante");
      `;

      // Obtener el ID del último registro insertado en 'datos'
      const lastInsertedIdResult = await prisma.$queryRaw<{ id: number }[]>`
        SELECT LAST_INSERT_ID() as id;
      `;
      const datosId = Number(lastInsertedIdResult[0].id); // Convert BigInt to Number

      // 2. Insertar en la tabla 'asistencia' usando el ID de 'datos'
      await prisma.$executeRaw`
        INSERT INTO asistencia (datos_id, asistio, id_participacion)
        VALUES (${datosId}, 'Si', 2);
      `;

      console.log(
        `Nuevo participante con ID ${datosId} y su asistencia registrados con éxito.`,
      );
      return {
        message: 'Participante y asistencia registrados con éxito',
        id: datosId,
      };
    });
  }
}
