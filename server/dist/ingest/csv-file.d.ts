export type CsvRow = Record<string, string>;
export declare function readCsvRows(path: string): Promise<CsvRow[]>;
export declare function parseCents(value: string, context: string): number;
export declare function cell(value: string | undefined): string;
