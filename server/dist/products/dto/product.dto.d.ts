export interface CreateProductDto {
    name: string;
    price: number;
    brandId: number;
}
export type UpdateProductDto = Partial<CreateProductDto>;
