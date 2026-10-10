import { ProductsService } from './products.service.js';
import type { CreateProductDto, CreateProductPriceDto, UpdateProductDto } from './dto/product.dto.js';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    findAll(): Promise<import("./product.entity.js").Product[]>;
    findOne(id: number): Promise<import("./product.entity.js").Product>;
    findPrices(id: number): Promise<import("./product-price.entity.js").ProductPrice[]>;
    create(dto: CreateProductDto): Promise<import("./product.entity.js").Product>;
    createPrice(id: number, dto: CreateProductPriceDto): Promise<import("./product-price.entity.js").ProductPrice>;
    update(id: number, dto: UpdateProductDto): Promise<import("./product.entity.js").Product>;
    remove(id: number): Promise<void>;
}
