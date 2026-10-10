export interface IngestFileResult {
    rowsTotal: number;
    rowsPersisted: number;
    decisionsCreated: number;
    errors: string[];
}
