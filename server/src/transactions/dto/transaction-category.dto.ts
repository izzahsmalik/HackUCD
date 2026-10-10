export interface CreateTransactionCategoryDto {
  name: string;
}

export type UpdateTransactionCategoryDto =
  Partial<CreateTransactionCategoryDto>;
