import type { Request, Response } from 'express';
import { McpServerFactory } from './mcp-server.factory.js';
export declare class McpController {
    private readonly serverFactory;
    constructor(serverFactory: McpServerFactory);
    handlePost(req: Request, res: Response): Promise<void>;
    handleGet(res: Response): void;
    handleDelete(res: Response): void;
}
