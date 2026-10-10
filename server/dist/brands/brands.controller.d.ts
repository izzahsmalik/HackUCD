import { BrandsService } from './brands.service.js';
import type { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto.js';
export declare class BrandsController {
    private readonly brandsService;
    constructor(brandsService: BrandsService);
    findAll(): Promise<import("./brand.entity.js").Brand[]>;
    findOne(id: number): Promise<import("./brand.entity.js").Brand>;
    create(dto: CreateBrandDto): Promise<import("./brand.entity.js").Brand>;
    update(id: number, dto: UpdateBrandDto): Promise<import("./brand.entity.js").Brand>;
    remove(id: number): Promise<void>;
}
