import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
    constructor() {}

    // app health check endpoint
    @Get('health')
    healthCheck(): string {
        // return the health status of the application, along with the current date time in ISO format in proper json.
        return JSON.stringify({
            status: 'OK',
            timestamp: new Date().toISOString(),
        });
    }
};