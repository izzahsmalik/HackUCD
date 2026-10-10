export interface CreateTransactionDto {
  /** Integer cents; negative = expense, positive = income */
  amount: number;
  /** Valid date string (ISO YYYY-MM-DD) */
  date: string;
  /** Existing category id, positive integer */
  categoryId: number;
  /** Existing transaction group id, positive integer */
  groupId: number;
}

export type UpdateTransactionDto = Partial<CreateTransactionDto>;
