export interface CreateProductDto {
    name: string;
    brandId: number;
}
export type UpdateProductDto = Partial<CreateProductDto>;
