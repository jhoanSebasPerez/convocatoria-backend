import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    private readonly logger = new Logger('HTTP');

    use(req: Request, res: Response, next: NextFunction) {
        const { method, originalUrl, body, query, headers } = req;

        // Loguear la petición
        this.logger.log(`📥 [${method}] ${originalUrl}`);
        this.logger.debug(`Headers: ${JSON.stringify(headers)}`);
        this.logger.debug(`Query Params: ${JSON.stringify(query)}`);
        this.logger.debug(`Body: ${JSON.stringify(body)}`);

        next();
    }
}