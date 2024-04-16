export const IDictTableName = "dict";
export const IDictSchema = "++id, value, type";
export type IDictKeyType = number;

export interface IDict {
  id?: number;
  type: string;
  text: string;
  value: number;
  order?: number;
}