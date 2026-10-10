export interface CreateBrandDto {
  name: string;
}

export type UpdateBrandDto = Partial<CreateBrandDto>;