import { Controller, Get } from '@nestjs/common';

@Controller() // Không để gì nghĩa là ăn vào đường dẫn gốc (nhưng vẫn dính prefix api/v1)
export class AppController {
    @Get('health') // Endpoint: http://localhost:3000/api/v1/health
    checkHealth() {
        return {
            status: 'up',
            service: 'account-service',
            timestamp: new Date().toISOString()
        };
    }
}