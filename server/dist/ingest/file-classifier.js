var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { LlmModel } from '../llm/llm.model.js';
const TRANSACTION_HINTS = [
    'amount',
    'debit',
    'credit',
    'date',
    'balance',
    'description',
];
const PRODUCT_HINTS = ['price', 'cost', 'product', 'item', 'sku'];
let FileClassifier = class FileClassifier {
    llm;
    constructor(llm) {
        this.llm = llm;
    }
    async classify(fileName, rows) {
        if (rows.length === 0)
            return null;
        const heuristic = classifyByHeaders(rows[0]);
        if (heuristic)
            return heuristic;
        return this.classifyWithLlm(fileName, rows);
    }
    async classifyWithLlm(fileName, rows) {
        try {
            const result = await this.llm.chatJson([
                {
                    role: 'user',
                    content: `A CSV file named "${fileName}" contains either a list of financial transactions ` +
                        `or a list of current product pricing. Headers:\n` +
                        `${Object.keys(rows[0] ?? {}).join(', ')}\n\nSample rows:\n` +
                        rows
                            .slice(0, 5)
                            .map((row) => JSON.stringify(row))
                            .join('\n'),
                },
            ], {
                type: 'object',
                properties: {
                    kind: { type: 'string', enum: ['transactions', 'products'] },
                },
                required: ['kind'],
                additionalProperties: false,
            }, { temperature: 0 });
            return result.kind === 'transactions' || result.kind === 'products'
                ? result.kind
                : null;
        }
        catch {
            return null;
        }
    }
};
FileClassifier = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [LlmModel])
], FileClassifier);
export { FileClassifier };
function classifyByHeaders(firstRow) {
    if (!firstRow)
        return null;
    const headers = Object.keys(firstRow).map((h) => h.toLowerCase());
    const has = (hints) => hints.some((hint) => headers.includes(hint));
    const isTransactions = has(TRANSACTION_HINTS);
    const isProducts = has(PRODUCT_HINTS);
    if (isTransactions && !isProducts)
        return 'transactions';
    if (isProducts && !isTransactions)
        return 'products';
    return null;
}
//# sourceMappingURL=file-classifier.js.map