import 'dotenv/config';

// When NODE_TLS_REJECT_UNAUTHORIZED=0 is set in .env (needed if a local
// antivirus / corporate proxy intercepts HTTPS and presents its own cert),
// dotenv will have loaded it by this point and Node will honour it for all
// subsequent TLS connections, including requests to openlibrary.org.

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    const config = new DocumentBuilder()
        .setTitle('Online Library API')
        .setDescription('API for test assignment')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    await app.listen(3000);
}

bootstrap();
