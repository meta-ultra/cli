import { type NextRequest, type NextContext, NextResponse, objectify, withValidation } from "@meta-ultra/app-router";
import { dataUrify } from "@meta-ultra/dexie-utilities";
import yup from "../../yup";
import { db, IDictTableName } from "../dexie";

const $table = db[IDictTableName];

const paramsSchemaOfGet = yup.object({
  id: yup.number().integer(),
  type: yup.string(),
  text: yup.string(),
  value: yup.number().integer(),
  order: yup.number().integer(),
});
export const GET = withValidation(
  { paramsSchema: paramsSchemaOfGet },
  async function (request: NextRequest, context: NextContext) {
    try {
      const params = paramsSchemaOfGet.cast(context.params);
      /* Dexie START */
      const data = await $table.get(params);
      /* Dexie END */


      return NextResponse.json({
        code: 0,
        data,
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
 
const paramsSchemaOfPut = yup.object({
  id: yup.number().integer().required(),
});
const bodySchemaOfPut = yup.object({
  id: yup.number().integer(),
  type: yup.string(),
  text: yup.string(),
  value: yup.number().integer(),
  order: yup.number().integer(),
});
export const PUT = withValidation(
  { 
    paramsSchema: paramsSchemaOfPut, 
    bodySchema: bodySchemaOfPut,
  },
  async function (request: NextRequest, context: NextContext) {
    try {
      const params = paramsSchemaOfPut.cast(context.params);

      let data: object | FormData;
      const contentType = request.headers.get("Content-Type") || "";
      if (/^application\/json$/i.test(contentType)) {
        data = bodySchemaOfPut.cast(await request.json());
      }
      else {
        data = await request.formData();
      }

      /* Dexie START */
      const dexieRecord = objectify(data);
      await $table.update(params.id, dexieRecord);
      /* Dexie END */
      return NextResponse.json({ code: 0 });
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