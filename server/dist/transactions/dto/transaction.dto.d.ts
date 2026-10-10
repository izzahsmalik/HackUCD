export interface CreateTransactionDto {
    amount: number;
    date: string;
    categoryId: number;
}
export type UpdateTransactionDto = Partial<CreateTransactionDto>;
