import { ConsoleLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
    // create the main NestJS HTTP application
    const app = await NestFactory.create(AppModule, {
        logger: new ConsoleLogger(),
    });

    // get ConfigService to safely read values from .env
    const configService = app.get(ConfigService);

    // read port (defaults to 7002 if PORT is not set in .env)
    const port = configService.get<number>('PORT') ?? 7002;

    // read RabbitMQ connection string from .env
    const rabbitMqUrl = configService.getOrThrow<string>(
        'RABBITMQ_CONNECTION_STRING',
    );

    // attach RabbitMQ microservice listener so this app can consume queue messages
    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.RMQ,
        options: {
            urls: [rabbitMqUrl],
            queue: 'subscription_plan_queue',
            queueOptions: {
                // keep queue alive across RabbitMQ restarts
                durable: true,
            },
        },
    });

    // configure Swagger API documentation
    const swaggerConfig = new DocumentBuilder()
        .setTitle('Payment Service API')
        .setDescription('Payment Service API documentation.')
        .setVersion('1.0.0')
        .build();

    // mount Swagger UI at /swagger
    const documentFactory = () =>
        SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('/swagger', app, documentFactory);

    // start RabbitMQ microservice listeners
    await app.startAllMicroservices();

    // start the HTTP server
    await app.listen(port);

    // log server and Swagger URLs
    console.info(`Server running on http://localhost:${port}`);
    console.info(`Swagger UI running on http://localhost:${port}/swagger`);
}

// start the application
void bootstrap();
