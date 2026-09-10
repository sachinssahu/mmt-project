import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  (ServeStaticModule.forRoot({
    rootPath: join(__dirname, '..', 'public'),
  }),
    await app.listen(process.env.PORT ?? 3000));
}
bootstrap();
