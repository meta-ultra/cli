import { Table } from "dexie";
import { db } from "../../db";
import { type IDict, IDictTableName } from "./IDict";
import { pick, isEqual } from "lodash-es";
import { type IRole, IRoleTableName, Role } from "../IRole";

export class Dict implements IDict {
  $table: Table;

  id?: number;
  type: string;
  text: string;
  value: number;
  order?: number;

  roles?: Role[];
 
  constructor(type: string, text: string, value: number, id?: number, order?: number) {
    this.$table = db[IDictTableName];

    this.type = type;
    this.text = text;
    this.value = value;
    if (id !== undefined) this.id = id;
    if (order !== undefined) this.order = order;
  }

  async loadRoles() {
    if (!isEqual(pick(this, Object.keys({type:'角色状态'})), {type:'角色状态'})) {
      this.roles = [];
    }

    this.roles = await db[IRoleTableName].filter((record) => {
      return record.statusValue === this.value;
    }).toArray() as Role[];

}
}