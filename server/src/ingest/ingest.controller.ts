import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { basename } from 'node:path';
import { IngestService } from './ingest.service.js';
import { MAX_UPLOAD_BYTES } from './ingest.constants.js';
import { IngestRunSummary } from './ingest-result.js';

export interface RunIngestDto {
  /** Directory to scan; defaults to INGEST_DIRECTORY or 'data/ingest' */
  directory?: string;
}

/** Mimetypes browsers/curl produce for CSV uploads; the extension is the real gate. */
const CSV_MIMETYPES = new Set([
  'text/csv',
  'text/plain',
  'application/vnd.ms-excel',
  'application/octet-stream',
]);

/** Longest original file name kept in summaries/labels. */
const MAX_FILE_NAME_LENGTH = 255;

@Controller('ingest')
export class IngestController {
  constructor(private readonly ingestService: IngestService) {}

  @Post('run')
  run(@Body() dto: RunIngestDto) {
    if (
      dto?.directory !== undefined &&
      (typeof dto.directory !== 'string' || dto.directory.trim().length === 0)
    ) {
      throw new BadRequestException(
        'directory must be a non-empty string when provided',
      );
    }
    return this.ingestService.run(dto.directory);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
    }),
  )
  async upload(
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<IngestRunSummary> {
    if (!file) {
      throw new BadRequestException('multipart field "file" is required');
    }
    const fileName = sanitizeFileName(file.originalname);
    if (!fileName.toLowerCase().endsWith('.csv')) {
      throw new BadRequestException('only .csv files are accepted');
    }
    if (file.mimetype && !CSV_MIMETYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `unsupported content type '${file.mimetype}'`,
      );
    }
    return this.ingestService.ingestCsv(fileName, file.buffer.toString('utf8'));
  }
}

/**
 * Reduces a client-supplied name to a safe display label: basename only
 * (never used as a path), printable characters, bounded length.
 */
function sanitizeFileName(originalName: string): string {
  const name = basename(originalName ?? '')
    // oxlint-disable-next-line no-control-regex -- stripping control characters is the point
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim();
  if (name.length === 0) return 'upload.csv';
  return name.length > MAX_FILE_NAME_LENGTH
    ? name.slice(-MAX_FILE_NAME_LENGTH)
    : name;
}
