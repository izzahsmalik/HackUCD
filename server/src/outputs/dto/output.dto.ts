export interface CreateOutputDto {
  name: string;
  /** Existing product ids this Output relies on (distinct positive integers); optional */
  productIds?: number[];
}

export type UpdateOutputDto = Partial<CreateOutputDto>;

export interface CreateOutputPriceDto {
  /** Integer cents, >= 0 */
  amount: number;
  /** Optional ISO datetime; defaults to now */
  setAt?: string;
}
