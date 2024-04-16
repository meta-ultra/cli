import { type ApplicationDexie } from "../../db";
import { IRoleTableName } from "./IRole";

export async function populateIRole(db: ApplicationDexie) {
  const $table = db[IRoleTableName];
  await $table.clear();

  let data: any[] = [];

  await $table.bulkPut(data);
}