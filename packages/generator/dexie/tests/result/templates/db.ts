import Dexie, { type Table } from 'dexie';
import { type IDict, IDictTableName, IDictSchema, IDictKeyType, Dict, populateIDict } from './entities/IDict';
import { type IRole, IRoleTableName, IRoleSchema, IRoleKeyType, Role, populateIRole } from './entities/IRole';

export class ApplicationDexie extends Dexie {
  [IDictTableName]!: Table<IDict, IDictKeyType>;
  [IRoleTableName]!: Table<IRole, IRoleKeyType>;

  constructor() {
    super("applicationDatabase");
    this.version(1).stores({
      [IDictTableName]: IDictSchema,
      [IRoleTableName]: IRoleSchema,
    });
  }
}

export const db = new ApplicationDexie();

db[IDictTableName].mapToClass(Dict);
db[IRoleTableName].mapToClass(Role);

const populate = async function populate(this: ApplicationDexie) {
  console.info("[@meta-ultra] Dexie population is done.");

  await populateIDict(this);
  await populateIRole(this);
}.bind(db);
db.on("populate", () => populate());

// expose for debugging
(window as unknown as {db: Dexie}).db = db;
(window as unknown as {populate: (this: ApplicationDexie) => Promise<any>}).populate = populate;