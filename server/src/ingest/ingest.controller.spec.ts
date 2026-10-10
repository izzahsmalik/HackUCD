import { BadRequestException } from '@nestjs/common';
import { IngestController } from './ingest.controller.js';
import { IngestService } from './ingest.service.js';
import { IngestRunSummary } from './ingest-result.js';

function makeFile(
  partial: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'bank.csv',
    encoding: '7bit',
    mimetype: 'text/csv',
    buffer: Buffer.from('date,amount\n2026-01-01,-4.50\n', 'utf8'),
    size: 27,
    stream: {} as Express.Multer.File['stream'],
    destination: '',
    filename: '',
    path: '',
    ...partial,
  };
}

function makeSummary(): IngestRunSummary {
  return {
    files: [
      {
        fileName: 'bank.csv',
        kind: 'transactions',
        rowsTotal: 1,
        rowsPersisted: 1,
        decisionsCreated: 0,
        errors: [],
      },
    ],
    pendingDecisions: 0,
  };
}

describe('IngestController.upload', () => {
  let controller: IngestController;
  let ingestCsv: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ingestCsv = vi.fn().mockResolvedValue(makeSummary());
    controller = new IngestController({
      ingestCsv,
    } as unknown as IngestService);
  });

  it('passes the file name and decoded text to the ingest service', async () => {
    const result = await controller.upload(makeFile());

    expect(ingestCsv).toHaveBeenCalledWith(
      'bank.csv',
      'date,amount\n2026-01-01,-4.50\n',
    );
    expect(result).toEqual(makeSummary());
  });

  it('rejects a missing file with 400', async () => {
    await expect(controller.upload(undefined)).rejects.toThrow(
      new BadRequestException('multipart field "file" is required'),
    );
    expect(ingestCsv).not.toHaveBeenCalled();
  });

  it('rejects a non-csv extension with 400', async () => {
    await expect(
      controller.upload(makeFile({ originalname: 'notes.txt' })),
    ).rejects.toThrow(BadRequestException);
    expect(ingestCsv).not.toHaveBeenCalled();
  });

  it('rejects an unexpected mimetype with 400', async () => {
    await expect(
      controller.upload(makeFile({ mimetype: 'application/zip' })),
    ).rejects.toThrow(BadRequestException);
    expect(ingestCsv).not.toHaveBeenCalled();
  });

  it('reduces a client-supplied name to a safe label', async () => {
    await controller.upload(makeFile({ originalname: '../../etc/passwd.csv' }));

    expect(ingestCsv).toHaveBeenCalledWith('passwd.csv', expect.any(String));
  });
});
