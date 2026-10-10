var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { LlmModel } from '../llm/llm.model.js';
import { ActionQueueService } from '../action-queue/action-queue.service.js';
import { TransactionDecision } from '../action-queue/transaction-decision.js';
import { TransactionCategory } from '../transactions/transaction-category.entity.js';
import { TransactionGroup } from '../transactions/transaction-group.entity.js';
import { Transaction } from '../transactions/transaction.entity.js';
import { DEFAULT_BATCH_SIZE, MATCH_CONFIDENCE } from './ingest.constants.js';
const PARSE_ROWS_SCHEMA = {
    type: 'object',
    properties: {
        rows: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    index: { type: 'integer' },
                    amountCents: { type: 'integer' },
                    date: { type: 'string' },
                    categoryName: { type: 'string' },
                    confidence: { type: 'number' },
                },
                required: [
                    'index',
                    'amountCents',
                    'date',
                    'categoryName',
                    'confidence',
                ],
                additionalProperties: false,
            },
        },
    },
    required: ['rows'],
    additionalProperties: false,
};
let TransactionsIngestService = class TransactionsIngestService {
    transactionRepository;
    categoryRepository;
    groupRepository;
    llm;
    actionQueue;
    constructor(transactionRepository, categoryRepository, groupRepository, llm, actionQueue) {
        this.transactionRepository = transactionRepository;
        this.categoryRepository = categoryRepository;
        this.groupRepository = groupRepository;
        this.llm = llm;
        this.actionQueue = actionQueue;
    }
    async ingest(fileName, rows) {
        const result = {
            rowsTotal: rows.length,
            rowsPersisted: 0,
            decisionsCreated: 0,
            errors: [],
        };
        const group = this.groupRepository.create({
            originalFileName: fileName,
            groupName: '',
        });
        await this.groupRepository.getEntityManager().persist(group).flush();
        const categories = await this.loadCategories();
        const batchSize = Number(process.env.INGEST_BATCH_SIZE) || DEFAULT_BATCH_SIZE;
        for (let offset = 0; offset < rows.length; offset += batchSize) {
            const batch = rows.slice(offset, offset + batchSize);
            let parsed;
            try {
                parsed = await this.llm.chatJson(this.batchPrompt(batch, categories, offset), PARSE_ROWS_SCHEMA, { temperature: 0 });
            }
            catch (error) {
                result.errors.push(`LLM batch failed (${offset}–${offset + batch.length}): ${String(error)}`);
                continue;
            }
            const em = this.transactionRepository.getEntityManager();
            for (const row of parsed.rows ?? []) {
                const source = batch[row.index - offset];
                if (!source) {
                    result.errors.push(`LLM returned an out-of-range row index ${row.index}`);
                    continue;
                }
                if (!Number.isInteger(row.amountCents)) {
                    result.errors.push(`Row ${row.index}: amount is not an integer (cents)`);
                    continue;
                }
                if (typeof row.date !== 'string' ||
                    !/^\d{4}-\d{2}-\d{2}$/.test(row.date) ||
                    Number.isNaN(new Date(row.date).getTime())) {
                    result.errors.push(`Row ${row.index}: date '${row.date}' is not YYYY-MM-DD`);
                    continue;
                }
                if (row.confidence < MATCH_CONFIDENCE) {
                    this.actionQueue.enqueue(new TransactionDecision({
                        rowIndex: row.index,
                        fileName,
                        rawRow: source,
                        amountCents: row.amountCents,
                        date: row.date,
                        suggestedCategoryName: row.categoryName,
                        confidence: row.confidence,
                        existingCategories: [...categories.values()]
                            .filter((c) => Number.isInteger(c.id))
                            .map((c) => ({ id: c.id, name: c.name })),
                        groupId: group.id,
                    }, this.transactionRepository, this.categoryRepository, this.groupRepository));
                    result.decisionsCreated++;
                    continue;
                }
                const category = this.resolveCategory(categories, row.categoryName);
                em.persist(this.transactionRepository.create({
                    amount: row.amountCents,
                    date: row.date,
                    category,
                    group,
                }));
                result.rowsPersisted++;
            }
            await em.flush();
        }
        await this.setGroupName(group, rows, fileName, result);
        return result;
    }
    batchPrompt(batch, categories, offset) {
        return [
            {
                role: 'system',
                content: `You parse rows of a financial-transactions CSV. For each row, output the amount in integer ` +
                    `cents (negative = expense, positive = income), the date as YYYY-MM-DD, and a category name. ` +
                    `Prefer reusing one of these existing categories when it fits: ` +
                    `[${[...categories.values()].map((c) => c.name).join(', ') || 'none yet'}]. ` +
                    `Create a short new category name otherwise. ` +
                    `confidence (0..1) is how sure you are about the category assignment; ` +
                    `be conservative — below 0.8 the row goes to a human for review.`,
            },
            {
                role: 'user',
                content: batch
                    .map((row, i) => `${offset + i}: ${JSON.stringify(row)}`)
                    .join('\n'),
            },
        ];
    }
    async loadCategories() {
        const all = await this.categoryRepository.findAll();
        return new Map(all.map((c) => [c.name.toLowerCase(), c]));
    }
    resolveCategory(categories, name) {
        const key = name.toLowerCase();
        const existing = categories.get(key);
        if (existing)
            return existing;
        const category = this.categoryRepository.create({ name });
        categories.set(key, category);
        return category;
    }
    async setGroupName(group, rows, fileName, result) {
        try {
            const { name } = await this.llm.chatJson([
                {
                    role: 'user',
                    content: `These are rows from a transactions CSV file named "${fileName}". ` +
                        `Give a short (2–5 word) name describing this group of transactions. Rows:\n` +
                        rows
                            .slice(0, 20)
                            .map((row) => JSON.stringify(row))
                            .join('\n'),
                },
            ], {
                type: 'object',
                properties: { name: { type: 'string' } },
                required: ['name'],
                additionalProperties: false,
            }, { temperature: 0 });
            if (typeof name === 'string' && name.trim().length > 0) {
                this.groupRepository.assign(group, { groupName: name.trim() });
                await this.groupRepository.getEntityManager().flush();
                return;
            }
        }
        catch (error) {
            result.errors.push(`Group name generation failed: ${String(error)}`);
        }
        this.groupRepository.assign(group, { groupName: fileName });
        await this.groupRepository.getEntityManager().flush();
    }
};
TransactionsIngestService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Transaction)),
    __param(1, InjectRepository(TransactionCategory)),
    __param(2, InjectRepository(TransactionGroup)),
    __metadata("design:paramtypes", [EntityRepository,
        EntityRepository,
        EntityRepository,
        LlmModel,
        ActionQueueService])
], TransactionsIngestService);
export { TransactionsIngestService };
//# sourceMappingURL=transactions-ingest.service.js.map