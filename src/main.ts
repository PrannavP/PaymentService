import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConsoleLogger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    // create the NestJS application using the AppModule
    const app = await NestFactory.create(AppModule, {
        logger: new ConsoleLogger(),
    });

    // use the ValidationPipe globally to validate incoming requests
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));

	// swagger doc configuration
	const swaggerConfig = new DocumentBuilder()
		.setTitle("Payment Service API")
		.setDescription("Payment Service API documentation.")
		.setVersion("1.0.0")
		// .addBearerAuth(
		// {
		// 	type: 'http',
		// 	scheme: 'bearer',
		// 	bearerFormat: 'JWT',
		// 	name: 'JWT',
		// 	description: 'Enter JWT token',
		// 	in: 'header',
		// },
		// 'JWT-auth', // This name must match the decorator exactly
		// )
		.build()

	const documentFactory = () => SwaggerModule.createDocument(app, swaggerConfig);
	SwaggerModule.setup("/swagger", app, documentFactory);

	console.info(`Server running on port ${process.env.PORT ?? 7002}`);
	console.log(`Swagger UI is running on http://localhost:${process.env.PORT || 7002}/swagger `);



	// run and listen the app on port 7002 if env file PORT does not exists.
	await app.listen(process.env.PORT ?? 7002);
};

bootstrap();