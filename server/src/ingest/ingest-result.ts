/** Per-file outcome returned by an ingest service. */
export interface IngestFileResult {
  rowsTotal: number;
  rowsPersisted: number;
  decisionsCreated: number;
  errors: string[];
}
