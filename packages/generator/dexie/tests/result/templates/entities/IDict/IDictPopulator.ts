import { type ApplicationDexie } from "../../db";
import { IDictTableName } from "./IDict";

export async function populateIDict(db: ApplicationDexie) {
  const $table = db[IDictTableName];
  await $table.clear();

  let data: any[] = [];

  await $table.bulkPut(data);
}