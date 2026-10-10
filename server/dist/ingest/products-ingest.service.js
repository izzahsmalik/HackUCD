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
import { ProductDecision } from '../action-queue/product-decision.js';
import { Brand } from '../brands/brand.entity.js';
import { Product } from '../products/product.entity.js';
import { ProductPrice } from '../products/product-price.entity.js';
import { cell } from './csv-file.js';
import { DEFAULT_BATCH_SIZE, MATCH_CONFIDENCE, MAX_PRODUCTS_PER_CALL, } from './ingest.constants.js';
const PARSE_ROWS_SCHEMA = {
    type: 'object',
    properties: {
        rows: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    index: { type: 'integer' },
                    productName: { type: 'string' },
                    amountCents: { type: 'integer' },
                    setAt: { type: ['string', 'null'] },
                    matchProductId: { type: ['integer', 'null'] },
                    confidence: { type: 'number' },
                },
                required: [
                    'index',
                    'productName',
                    'amountCents',
                    'setAt',
                    'matchProductId',
                    'confidence',
                ],
                additionalProperties: false,
            },
        },
    },
    required: ['rows'],
    additionalProperties: false,
};
let ProductsIngestService = class ProductsIngestService {
    productRepository;
    productPriceRepository;
    brandRepository;
    llm;
    actionQueue;
    constructor(productRepository, productPriceRepository, brandRepository, llm, actionQueue) {
        this.productRepository = productRepository;
        this.productPriceRepository = productPriceRepository;
        this.brandRepository = brandRepository;
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
        const all = await this.productRepository.findAll({ populate: ['brand'] });
        const brands = new Map((await this.brandRepository.findAll()).map((b) => [
            b.name.toLowerCase(),
            b,
        ]));
        const batchSize = Number(process.env.INGEST_BATCH_SIZE) || DEFAULT_BATCH_SIZE;
        const productList = all
            .map((p) => ({ id: p.id, name: p.name, brandName: cell(p.brand?.name) }))
            .slice(0, MAX_PRODUCTS_PER_CALL);
        if (all.length > MAX_PRODUCTS_PER_CALL) {
            result.errors.push(`Product catalog has ${all.length} products; only the first ${MAX_PRODUCTS_PER_CALL} were offered for matching`);
        }
        for (let offset = 0; offset < rows.length; offset += batchSize) {
            const batch = rows.slice(offset, offset + batchSize);
            let parsed;
            try {
                parsed = await this.llm.chatJson(this.batchPrompt(batch, productList, offset), PARSE_ROWS_SCHEMA, { temperature: 0 });
            }
            catch (error) {
                result.errors.push(`LLM batch failed (${offset}–${offset + batch.length}): ${String(error)}`);
                continue;
            }
            const em = this.productRepository.getEntityManager();
            for (const row of parsed.rows ?? []) {
                const source = batch[row.index - offset];
                if (!source) {
                    result.errors.push(`LLM returned an out-of-range row index ${row.index}`);
                    continue;
                }
                if (!Number.isInteger(row.amountCents) || row.amountCents < 0) {
                    result.errors.push(`Row ${row.index}: price '${source.price ?? source.amount}' is not a non-negative integer (cents)`);
                    continue;
                }
                const setAt = this.resolveSetAt(row.setAt);
                const productName = cell(row.productName) ||
                    firstNonEmpty(source, ['product', 'item', 'name']);
                if (!productName) {
                    result.errors.push(`Row ${row.index}: no product name could be determined`);
                    continue;
                }
                const candidate = row.matchProductId !== null
                    ? all.find((p) => p.id === row.matchProductId)
                    : undefined;
                if (row.confidence < MATCH_CONFIDENCE) {
                    this.actionQueue.enqueue(new ProductDecision({
                        rowIndex: row.index,
                        fileName,
                        rawRow: source,
                        productName,
                        amountCents: row.amountCents,
                        setAt,
                        candidateProducts: candidate
                            ? [
                                {
                                    id: candidate.id,
                                    name: candidate.name,
                                    brandName: cell(candidate.brand?.name),
                                },
                            ]
                            : productList.slice(0, 10),
                        confidence: row.confidence,
                    }, this.productRepository, this.productPriceRepository, this.brandRepository));
                    result.decisionsCreated++;
                    continue;
                }
                if (candidate) {
                    em.persist(this.productPriceRepository.create({
                        amount: row.amountCents,
                        setAt,
                        product: candidate,
                    }));
                }
                else {
                    const brand = await this.resolveBrand(brands, source);
                    const product = this.productRepository.create({
                        name: productName,
                        brand,
                    });
                    em.persist(product);
                    em.persist(this.productPriceRepository.create({
                        amount: row.amountCents,
                        setAt,
                        product,
                    }));
                }
                result.rowsPersisted++;
            }
            await em.flush();
        }
        return result;
    }
    batchPrompt(batch, products, offset) {
        return [
            {
                role: 'system',
                content: `You parse rows of a product-pricing CSV. For each row, output the product name, the price in ` +
                    `integer cents (never floats), the price timestamp as an ISO datetime (or null if the row has none), ` +
                    `and how the row relates to the existing product catalog: ` +
                    `matchProductId is the id of the existing product this row's price belongs to, or null if it is a ` +
                    `product not in the list (a new product will be created). confidence (0..1) is how sure you are ` +
                    `about the match; be conservative — below 0.8 the row goes to a human for review. ` +
                    `Existing products: ` +
                    JSON.stringify(products),
            },
            {
                role: 'user',
                content: batch
                    .map((row, i) => `${offset + i}: ${JSON.stringify(row)}`)
                    .join('\n'),
            },
        ];
    }
    resolveSetAt(setAt) {
        if (setAt) {
            const date = new Date(setAt);
            if (!Number.isNaN(date.getTime()))
                return date;
        }
        return new Date();
    }
    async resolveBrand(brands, source) {
        const name = firstNonEmpty(source, ['brand', 'manufacturer', 'maker']) ||
            'Uncategorized';
        const key = name.toLowerCase();
        const existing = brands.get(key);
        if (existing)
            return existing;
        const brand = this.brandRepository.create({ name });
        brands.set(key, brand);
        return brand;
    }
};
ProductsIngestService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Product)),
    __param(1, InjectRepository(ProductPrice)),
    __param(2, InjectRepository(Brand)),
    __metadata("design:paramtypes", [EntityRepository,
        EntityRepository,
        EntityRepository,
        LlmModel,
        ActionQueueService])
], ProductsIngestService);
export { ProductsIngestService };
function firstNonEmpty(row, keys) {
    for (const key of keys) {
        const value = cell(row[key]);
        if (value)
            return value;
    }
    return '';
}
//# sourceMappingURL=products-ingest.service.js.map