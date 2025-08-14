import z from "zod";
export const pagingDTOSchema = z.object({
  page: z.coerce.number().min(1, { message: 'Page number must be at least 1' }).default(1),
  limit: z.coerce.number().min(1, { message: 'Limit must be at least 1' }).max(100).default(20),
  sort: z.string().optional(),
  order: z.string().optional(),
  cursor: z.string().optional(),
});
export type PagingDTO = z.infer<typeof pagingDTOSchema> & { total?: number; };

export type Paginated<T> = {
  data: T[];
  paging: PagingDTO;
  total: number;
};