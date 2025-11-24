import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  const logger = new Logger('Bootstrap');

  const config = new DocumentBuilder()
    .setTitle('Subscription Service API')
    .setDescription('API documentation for Subscription Microservice')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
        name: 'Authorization',
        description: 'JWT Authorization header. Example: "Bearer {token}"',
      },
      'authorization',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const envConfig = app.get(ConfigService);
  logger.log(envConfig.get<number>('PORT'));
  const port = envConfig.get<number>('PORT') || 3000;
  await app.listen(port);

  logger.log(`Subscription Service running on port ${port}`);
  logger.log(`Swagger available at http://localhost:${port}/api`);
}
bootstrap();
