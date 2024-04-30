import { Table } from "dexie";
import { db } from "../../db";
import { type IRole, IRoleTableName } from "./IRole";
import { IDictTableName, Dict } from "../IDict";

export class Role implements IRole {
  $table: Table;

  id?: number;
  name: string;
  code: string;
  order: number;
  statusValue?: number;
  remark?: string;

  status?: Dict;
 
  constructor(name: string, code: string, order: number, id?: number, statusValue?: number, remark?: string) {
    this.$table = db[IRoleTableName];

    this.name = name;
    this.code = code;
    this.order = order;
    if (id !== undefined) this.id = id;
    if (statusValue !== undefined) this.statusValue = statusValue;
    if (remark !== undefined) this.remark = remark;
  }

  async loadStatus() {
    if (this.statusValue !== undefined) {
      const record = await db[IDictTableName].get({
        "value": this.statusValue,
        ...Object({type:'角色状态'}),
      });
      if (record) {
        this.status = record as Dict;
      }
    }
  }
}