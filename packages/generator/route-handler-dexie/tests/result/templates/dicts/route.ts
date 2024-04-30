import { type NextRequest, type NextContext, NextResponse, objectify, withValidation } from "@meta-ultra/app-router";
import { isEqual, isArray, isString } from "lodash-es";
import yup from "../yup";
/* Dexie START */
import { query, pickPrimitive, dataUrify } from "@meta-ultra/dexie-utilities";
import { db, IDictTableName, IDict } from "../dexie";
/* Dexie END */

const $table = db[IDictTableName];

const searchParamsSchemaOfGet = yup.object({
  page: yup.number().integer().min(1),
  pageSize: yup.number().integer().min(1),
  sorter: yup.object({
    field: yup.string(),
    order: yup.string(),
  }),
  id: yup.number().integer(),
  type: yup.string(),
  text: yup.string(),
  value: yup.number().integer(),
  order: yup.number().integer(),
});

export const GET = withValidation(
  { searchParamsSchema: searchParamsSchemaOfGet },
  async function (request: NextRequest, context: NextContext) {
    try {
      const { page, pageSize, sorter, ...rest } = searchParamsSchemaOfGet.cast(objectify(request.nextUrl.searchParams));
      /* Dexie START */
      const { total, data } = await query($table, rest, page, pageSize, sorter);
      /* Dexie END */
 
      return NextResponse.json({
        code: 0,
        data: {
          total,
          data,
        }
      });
    }
    catch(e) {
      return NextResponse.json({
        code: 1,
        error: e,
        message: (e as {message?: string}).message,
      });
    }
  }
);

const searchParamsSchemaOfDelete = yup.object({
  ids: yup.mixed().test((value) => yup.number().integer().isValidSync(value) || yup.array().of(yup.number().integer()).isValidSync(value)),
  id: yup.number().integer(),
  type: yup.string(),
  text: yup.string(),
  value: yup.number().integer(),
  order: yup.number().integer(),
});
export const DELETE = withValidation(
  { searchParamsSchema: searchParamsSchemaOfDelete },
  async function (request: NextRequest, context: NextContext) {
    try {
      let { ids, ...rest } = searchParamsSchemaOfDelete.cast(objectify(request.nextUrl.searchParams));
      /* Dexie START */
      await db.transaction("rw", $table, async () => {
        let executed = false;
        if (isArray(ids)) {
          executed = true;
          ids = yup.array().of(yup.number().integer()).cast(ids);
          await $table.bulkDelete((ids as any[]).filter((x) => x !== undefined) as number[]);
        }
        else if (isString(ids)) {
          executed = true;
          ids = yup.number().integer().cast(ids);
          await $table.bulkDelete([ids] as number[]);
        }
        if (!executed) {
          const { total, data } = await query($table, rest);
          await Promise.all(data.map(async (target) => {
            return $table.filter((record: IDict) => {
              return isEqual(record, target);
            }).delete();
          }));
        }      });
      /* Dexie END */
      return NextResponse.json({code: 0});
    }
    catch(e) {
      return NextResponse.json({
        code: 1,
        error: e,
        message: (e as {message?: string}).message,
      });
    }
  }
);

const singleBodySchemaOfPost = yup.object({
  id: yup.number().integer(),
  type: yup.string().required(),
  text: yup.string().required(),
  value: yup.number().integer().required(),
  order: yup.number().integer(),
});
const batchBodySchemaOfPost = yup.array().of(singleBodySchemaOfPost);
const bodySchemaOfPost = yup.mixed().test((value) => {
  return singleBodySchemaOfPost.isValidSync(value) || batchBodySchemaOfPost.isValidSync(value);
});
export const POST = withValidation(
  { bodySchema: bodySchemaOfPost },
  async function (request: NextRequest, context: NextContext) {
    let data: object | FormData;
    const contentType = request.headers.get("Content-Type") || "";
    if (/^application\/json$/i.test(contentType)) {
      data = await request.json();
    }
    else {
      data = await request.formData();
    }

    const isBatch = batchBodySchemaOfPost.isValidSync(data);
    try {
      if (isBatch) {
        // The data must be the type of JSON for batch operating.
        const records = batchBodySchemaOfPost.cast(data);
        if (records) {
          /* Dexie START */
          await Promise.all(
            records.map(async (record) => {
              const dexieRecord = objectify(record);
              if (!await $table.where(pickPrimitive(dexieRecord)).count()) {
                await $table.add({...dexieRecord as any});
              }
            })
          )
          /* Dexie END */
        } 
      }
      else {
        const record = data instanceof FormData ? data : singleBodySchemaOfPost.cast(data);
        /* Dexie START */
        const dexieRecord = objectify(record);
        await $table.add(singleBodySchemaOfPost.cast(dexieRecord) as any);
        /* Dexie END */
      }
      return NextResponse.json({code: 0});
    }
    catch(e) {
      return NextResponse.json({
        code: 1,
        // error: e, // the error instance thrown from Dexie might be not able to serialized through JSON.stringify, uncomment this line if you're sure JSON.stringify(e) will not hit a new error.
        message: (e as {message?: string}).message,
      });
    }
  }
);