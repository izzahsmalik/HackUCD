import { ProductsService } from './products.service.js';
import type { CreateProductDto, UpdateProductDto } from './dto/product.dto.js';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    findAll(): Promise<import("./product.entity.js").Product[]>;
    findOne(id: number): Promise<import("./product.entity.js").Product>;
    create(dto: CreateProductDto): Promise<import("./product.entity.js").Product>;
    update(id: number, dto: UpdateProductDto): Promise<import("./product.entity.js").Product>;
    remove(id: number): Promise<void>;
}
