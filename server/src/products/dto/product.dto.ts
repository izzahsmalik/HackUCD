export interface CreateProductDto {
  name: string;
  /** Existing brand id, positive integer */
  brandId: number;
}

export type UpdateProductDto = Partial<CreateProductDto>;

export interface CreateProductPriceDto {
  /** Integer cents, >= 0 */
  amount: number;
  /** Optional ISO datetime; defaults to now */
  setAt?: string;
}
