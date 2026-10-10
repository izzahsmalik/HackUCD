export interface CreateProductDto {
  name: string;
  /** Integer cents, >= 0 */
  price: number;
  /** Existing brand id, positive integer */
  brandId: number;
}

export type UpdateProductDto = Partial<CreateProductDto>;