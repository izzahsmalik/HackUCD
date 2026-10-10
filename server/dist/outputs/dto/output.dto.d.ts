export interface CreateOutputDto {
    name: string;
    productIds?: number[];
}
export type UpdateOutputDto = Partial<CreateOutputDto>;
export interface CreateOutputPriceDto {
    amount: number;
    setAt?: string;
}
