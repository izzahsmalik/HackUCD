import { LlmModel } from '../llm/llm.model.js';
import { CsvRow } from './csv-file.js';
export type FileKind = 'transactions' | 'products';
export declare class FileClassifier {
    private readonly llm;
    constructor(llm: LlmModel);
    classify(fileName: string, rows: CsvRow[]): Promise<FileKind | null>;
    private classifyWithLlm;
}
