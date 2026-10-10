import { FileKind } from './file-classifier.js';

/** Per-file outcome returned by an ingest service. */
export interface IngestFileResult {
  rowsTotal: number;
  rowsPersisted: number;
  decisionsCreated: number;
  errors: string[];
}

/** Per-file outcome of an ingest run, including classification. */
export interface IngestFileSummary {
  fileName: string;
  kind: FileKind | null;
  rowsTotal: number;
  rowsPersisted: number;
  decisionsCreated: number;
  errors: string[];
}

/** Outcome of a full ingest run (directory scan or single file). */
export interface IngestRunSummary {
  files: IngestFileSummary[];
  pendingDecisions: number;
}
