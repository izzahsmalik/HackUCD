import { readFile } from 'node:fs/promises';
import Papa from 'papaparse';
export async function readCsvRows(path) {
    return parseCsvText(await readFile(path, 'utf8'), path);
}
export function parseCsvText(text, label = 'input') {
    const parsed = Papa.parse(text.replace(/^﻿/, ''), {
        header: true,
        skipEmptyLines: true,
    });
    if (parsed.errors.length > 0) {
        const first = parsed.errors[0];
        throw new Error(`Failed to parse ${label}: ${first.message} (row ${first.row ?? '?'})`);
    }
    return parsed.data;
}
export function parseCents(value, context) {
    const cleaned = value.replace(/[$,\s]/g, '');
    const number = Number(cleaned);
    if (cleaned.length === 0 || Number.isNaN(number)) {
        throw new Error(`${context}: cannot parse amount '${value}'`);
    }
    return Math.round(number * 100);
}
export function cell(value) {
    return value?.trim() ?? '';
}
//# sourceMappingURL=csv-file.js.map