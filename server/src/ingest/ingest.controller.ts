import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { IngestService } from './ingest.service.js';

export interface RunIngestDto {
  /** Directory to scan; defaults to INGEST_DIRECTORY or 'data/ingest' */
  directory?: string;
}

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
}
