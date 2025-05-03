import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { json } from 'body-parser';
import { rootDir } from './shared/constants';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(`${rootDir}/uploads/photos`);
  app.use(cookieParser());
  app.enableCors({
    credentials: true,
    origin: [
      ...(process.env.LOCAL_CONNECTION?.split(',') || []),
      'https://mooncellar.space',
    ],
  });
  app.useGlobalPipes(new ValidationPipe());
  app.use(json({ limit: '2mb' }));

  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('MoonCellar API')
    .setDescription('API for MoonCellar server')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document);
  await app.listen(3228);
}
bootstrap();
