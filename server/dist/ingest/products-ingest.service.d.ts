import { EntityRepository } from '@mikro-orm/core';
import { LlmModel } from '../llm/llm.model.js';
import { ActionQueueService } from '../action-queue/action-queue.service.js';
import { Brand } from '../brands/brand.entity.js';
import { Product } from '../products/product.entity.js';
import { ProductPrice } from '../products/product-price.entity.js';
import { CsvRow } from './csv-file.js';
import { IngestFileResult } from './ingest-result.js';
export declare class ProductsIngestService {
    private readonly productRepository;
    private readonly productPriceRepository;
    private readonly brandRepository;
    private readonly llm;
    private readonly actionQueue;
    constructor(productRepository: EntityRepository<Product>, productPriceRepository: EntityRepository<ProductPrice>, brandRepository: EntityRepository<Brand>, llm: LlmModel, actionQueue: ActionQueueService);
    ingest(fileName: string, rows: CsvRow[]): Promise<IngestFileResult>;
    private batchPrompt;
    private resolveSetAt;
    private resolveBrand;
}
