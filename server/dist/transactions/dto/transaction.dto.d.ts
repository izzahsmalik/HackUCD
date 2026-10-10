export interface CreateTransactionDto {
    amount: number;
    date: string;
    categoryId: number;
    groupId: number;
}
export type UpdateTransactionDto = Partial<CreateTransactionDto>;
