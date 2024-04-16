export const IRoleTableName = "role";
export const IRoleSchema = "++id";
export type IRoleKeyType = number;

export interface IRole {
  id?: number;
  name: string;
  code: string;
  order: number;
  statusValue?: number;
  remark?: string;
}