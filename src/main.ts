import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [process.env.CORS_ORIGIN], // Orígenes permitidos
    methods: 'GET,PUT,POST,PATCH,DELETE', // Métodos permitidos
    allowedHeaders: 'Content-Type, Accept', // Encabezados permitidos
    credentials: true, // Habilitar el envío de cookies y cabeceras de autenticación
  });

  await app.listen(3000);
}
bootstrap();
