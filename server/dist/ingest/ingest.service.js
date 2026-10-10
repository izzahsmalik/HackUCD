var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ConflictException, Injectable } from '@nestjs/common';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ActionQueueService } from '../action-queue/action-queue.service.js';
import { ProductsIngestService } from './products-ingest.service.js';
import { TransactionsIngestService } from './transactions-ingest.service.js';
import { parseCsvText, readCsvRows } from './csv-file.js';
import { FileClassifier } from './file-classifier.js';
import { DEFAULT_INGEST_DIRECTORY } from './ingest.constants.js';
let IngestService = class IngestService {
    classifier;
    transactionsIngest;
    productsIngest;
    actionQueue;
    running = false;
    constructor(classifier, transactionsIngest, productsIngest, actionQueue) {
        this.classifier = classifier;
        this.transactionsIngest = transactionsIngest;
        this.productsIngest = productsIngest;
        this.actionQueue = actionQueue;
    }
    async run(directory) {
        return this.exclusive(() => this.runFiles(directory ?? process.env.INGEST_DIRECTORY ?? DEFAULT_INGEST_DIRECTORY));
    }
    async ingestCsv(fileName, text) {
        return this.exclusive(async () => {
            const summary = emptySummary(fileName);
            try {
                const rows = parseCsvText(text, fileName);
                summary.rowsTotal = rows.length;
                Object.assign(summary, await this.processRows(fileName, rows));
            }
            catch (error) {
                summary.errors.push(String(error));
            }
            return { files: [summary], pendingDecisions: this.actionQueue.count() };
        });
    }
    async exclusive(fn) {
        if (this.running)
            throw new ConflictException('An ingest run is already in progress');
        this.running = true;
        try {
            return await fn();
        }
        finally {
            this.running = false;
        }
    }
    async runFiles(directory) {
        const entries = await readdir(directory, { withFileTypes: true });
        const files = entries.filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.csv'));
        const summaries = [];
        for (const entry of files) {
            const fileName = entry.name;
            const summary = emptySummary(fileName);
            try {
                const rows = await readCsvRows(join(directory, fileName));
                summary.rowsTotal = rows.length;
                Object.assign(summary, await this.processRows(fileName, rows));
            }
            catch (error) {
                summary.errors.push(String(error));
            }
            summaries.push(summary);
        }
        return { files: summaries, pendingDecisions: this.actionQueue.count() };
    }
    async processRows(fileName, rows) {
        const kind = await this.classifier.classify(fileName, rows);
        if (!kind) {
            return {
                kind: null,
                rowsPersisted: 0,
                decisionsCreated: 0,
                errors: [
                    'could not determine whether the file is transactions or product pricing',
                ],
            };
        }
        const result = await this.ingestRows(kind, fileName, rows);
        return {
            kind,
            rowsPersisted: result.rowsPersisted,
            decisionsCreated: result.decisionsCreated,
            errors: result.errors,
        };
    }
    ingestRows(kind, fileName, rows) {
        return kind === 'transactions'
            ? this.transactionsIngest.ingest(fileName, rows)
            : this.productsIngest.ingest(fileName, rows);
    }
};
IngestService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [FileClassifier,
        TransactionsIngestService,
        ProductsIngestService,
        ActionQueueService])
], IngestService);
export { IngestService };
function emptySummary(fileName) {
    return {
        fileName,
        kind: null,
        rowsTotal: 0,
        rowsPersisted: 0,
        decisionsCreated: 0,
        errors: [],
    };
}
//# sourceMappingURL=ingest.service.js.map