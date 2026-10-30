import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('TRANSLOGIC S.A. - API de Gestión de Flotas y Facturación')
    .setDescription(
      'API REST para la gestión integral de camiones de carga, furgonetas eléctricas, planificación de servicios de transporte, simulación y facturación atómica, y reportes de rentabilidad.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Servidor backend TRANSLOGIC corriendo en: http://localhost:${port}`);
  console.log(`Documentación Swagger disponible en: http://localhost:${port}/api/docs`);
}
bootstrap();
