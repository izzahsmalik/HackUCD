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
import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { QueryService } from './query.service.js';
let QueryController = class QueryController {
    queryService;
    constructor(queryService) {
        this.queryService = queryService;
    }
    ask(dto) {
        if (dto === null ||
            typeof dto !== 'object' ||
            typeof dto.question !== 'string' ||
            dto.question.trim().length === 0) {
            throw new BadRequestException('question must be a non-empty string');
        }
        return this.queryService.ask(dto.question);
    }
    plan(dto) {
        if (dto === null ||
            typeof dto !== 'object' ||
            typeof dto.question !== 'string' ||
            dto.question.trim().length === 0) {
            throw new BadRequestException('question must be a non-empty string');
        }
        return this.queryService.planOnly(dto.question);
    }
};
__decorate([
    Post(),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QueryController.prototype, "ask", null);
__decorate([
    Post('plan'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QueryController.prototype, "plan", null);
QueryController = __decorate([
    Controller('query'),
    __metadata("design:paramtypes", [QueryService])
], QueryController);
export { QueryController };
//# sourceMappingURL=query.controller.js.map