var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { ActionQueueModule } from '../action-queue/action-queue.module.js';
import { IngestModule } from '../ingest/ingest.module.js';
import { McpController } from './mcp.controller.js';
import { McpServerFactory } from './mcp-server.factory.js';
let McpModule = class McpModule {
};
McpModule = __decorate([
    Module({
        imports: [ActionQueueModule, IngestModule],
        controllers: [McpController],
        providers: [McpServerFactory],
    })
], McpModule);
export { McpModule };
//# sourceMappingURL=mcp.module.js.map