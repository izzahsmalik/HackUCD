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
import { BadRequestException, Body, Controller, Post, UploadedFile, UseInterceptors, } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { basename } from 'node:path';
import { IngestService } from './ingest.service.js';
import { MAX_UPLOAD_BYTES } from './ingest.constants.js';
const CSV_MIMETYPES = new Set([
    'text/csv',
    'text/plain',
    'application/vnd.ms-excel',
    'application/octet-stream',
]);
const MAX_FILE_NAME_LENGTH = 255;
let IngestController = class IngestController {
    ingestService;
    constructor(ingestService) {
        this.ingestService = ingestService;
    }
    run(dto) {
        if (dto?.directory !== undefined &&
            (typeof dto.directory !== 'string' || dto.directory.trim().length === 0)) {
            throw new BadRequestException('directory must be a non-empty string when provided');
        }
        return this.ingestService.run(dto.directory);
    }
    async upload(file) {
        if (!file) {
            throw new BadRequestException('multipart field "file" is required');
        }
        const fileName = sanitizeFileName(file.originalname);
        if (!fileName.toLowerCase().endsWith('.csv')) {
            throw new BadRequestException('only .csv files are accepted');
        }
        if (file.mimetype && !CSV_MIMETYPES.has(file.mimetype)) {
            throw new BadRequestException(`unsupported content type '${file.mimetype}'`);
        }
        return this.ingestService.ingestCsv(fileName, file.buffer.toString('utf8'));
    }
};
__decorate([
    Post('run'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], IngestController.prototype, "run", null);
__decorate([
    Post('upload'),
    UseInterceptors(FileInterceptor('file', {
        limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
    })),
    __param(0, UploadedFile()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IngestController.prototype, "upload", null);
IngestController = __decorate([
    Controller('ingest'),
    __metadata("design:paramtypes", [IngestService])
], IngestController);
export { IngestController };
function sanitizeFileName(originalName) {
    const name = basename(originalName ?? '')
        .replace(/[\u0000-\u001f\u007f]/g, '')
        .trim();
    if (name.length === 0)
        return 'upload.csv';
    return name.length > MAX_FILE_NAME_LENGTH
        ? name.slice(-MAX_FILE_NAME_LENGTH)
        : name;
}
//# sourceMappingURL=ingest.controller.js.map