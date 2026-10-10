import { OutputsService } from './outputs.service.js';
import type { CreateOutputDto, CreateOutputPriceDto, UpdateOutputDto } from './dto/output.dto.js';
export declare class OutputsController {
    private readonly outputsService;
    constructor(outputsService: OutputsService);
    findAll(): Promise<import("./output.entity.js").Output[]>;
    findOne(id: number): Promise<import("./output.entity.js").Output>;
    findPrices(id: number): Promise<import("./output-price.entity.js").OutputPrice[]>;
    findCost(id: number): Promise<import("./outputs.service.js").OutputCost>;
    create(dto: CreateOutputDto): Promise<import("./output.entity.js").Output>;
    createPrice(id: number, dto: CreateOutputPriceDto): Promise<import("./output-price.entity.js").OutputPrice>;
    update(id: number, dto: UpdateOutputDto): Promise<import("./output.entity.js").Output>;
    remove(id: number): Promise<void>;
}
