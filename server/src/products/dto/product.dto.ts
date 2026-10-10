export interface CreateProductDto {
  name: string;
  /** Existing brand id, positive integer */
  brandId: number;
}

export type UpdateProductDto = Partial<CreateProductDto>;
