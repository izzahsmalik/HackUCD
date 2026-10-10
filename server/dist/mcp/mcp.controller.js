var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Controller, Delete, Get, Injectable, Post, Req, Res, } from '@nestjs/common';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { McpServerFactory } from './mcp-server.factory.js';
let McpController = class McpController {
    serverFactory;
    constructor(serverFactory) {
        this.serverFactory = serverFactory;
    }
    async handlePost(req, res) {
        try {
            const server = this.serverFactory.create();
            const transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: undefined,
            });
            res.on('close', () => {
                void transport.close();
                void server.close();
            });
            await server.connect(transport);
            await transport.handleRequest(req, res, req.body);
        }
        catch (error) {
            if (!res.headersSent) {
                res.status(500).json({
                    jsonrpc: '2.0',
                    error: { code: -32603, message: 'Internal server error' },
                    id: null,
                });
            }
            else {
                res.end(String(error));
            }
        }
    }
    handleGet(res) {
        methodNotAllowed(res);
    }
    handleDelete(res) {
        methodNotAllowed(res);
    }
};
__decorate([
    Post(),
    __param(0, Req()),
    __param(1, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], McpController.prototype, "handlePost", null);
__decorate([
    Get(),
    __param(0, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], McpController.prototype, "handleGet", null);
__decorate([
    Delete(),
    __param(0, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], McpController.prototype, "handleDelete", null);
McpController = __decorate([
    Controller('mcp'),
    Injectable(),
    __metadata("design:paramtypes", [McpServerFactory])
], McpController);
export { McpController };
function methodNotAllowed(res) {
    res.status(405).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Method not allowed.' },
        id: null,
    });
}
//# sourceMappingURL=mcp.controller.js.map