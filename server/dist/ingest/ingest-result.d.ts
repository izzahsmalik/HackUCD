import { FileKind } from './file-classifier.js';
export interface IngestFileResult {
    rowsTotal: number;
    rowsPersisted: number;
    decisionsCreated: number;
    errors: string[];
}
export interface IngestFileSummary {
    fileName: string;
    kind: FileKind | null;
    rowsTotal: number;
    rowsPersisted: number;
    decisionsCreated: number;
    errors: string[];
}
export interface IngestRunSummary {
    files: IngestFileSummary[];
    pendingDecisions: number;
}
