import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Payment Service API')
    .setDescription('API documentation for Payment Microservice')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const envConfig = app.get(ConfigService);
  const port = envConfig.get<number>('PORT') || 3001;

  logger.log(envConfig.get<number>('PORT'));

  await app.listen(port);
  logger.log(`Payment Service running on port ${port}`);
  logger.log(`Swagger available at http://localhost:${port}/api`);
}
bootstrap();
