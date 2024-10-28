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
    origin: [process.env.LOCAL_CONNECTION, 'https://mooncellar.space'],
  });
  app.useGlobalPipes(new ValidationPipe());
  app.use(json({ limit: '2mb' }));
  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('Games Api')
    .setDescription('Api for RA and IGDB')
    .setVersion('1.0')
    .addTag('games')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(3228);
}
bootstrap();
