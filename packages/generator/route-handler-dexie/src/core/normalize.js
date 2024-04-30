const _ = require("lodash");

const cvtColumnName2TSPropName = _.camelCase;

function cvtColumnType2TSType(type) {
  const mappings = [
    [/^(string|(var)?char|text)$/i, "string"],
    [/^(number|smallint|int(eger)?|long|float8?|bigint|real|numeric|\d+(\.\d*)?)$/i, "number"],
    [/^(bool(ean)?)$/i, "boolean"],
    [/^(date|datetime|time(stampz?)?|interval)$/i, "Date"],
  ];
  const mapping = mappings.find(([re]) => re.test(type));

  return mapping ? mapping[1] : "any";
}

function getSchema(column) {
  if (!!column["primary_key"] && !!column["generated_by_default_as_identity"]) {
    return "++"; // auto-incremented-primary-key
  }
  else if (!!column["unique"]) {
    return "&"; // Unique
  }

  return "";
}

/**
 * Limitations:
 * 1. Compound indexes is not supported at the moment.
 */
function frameDexieColumn(columnName, column, dexie) {
  let indexed = !!_.get(dexie, `${columnName}.indexed`);
  if (!indexed) {
    indexed = !!column["primary_key"];
  }

  return {
    name: cvtColumnName2TSPropName(columnName),
    title: column.title,
    type: cvtColumnType2TSType(column.type),
    required: !!column["not_null"],
    indexed,
    schema: getSchema(column),
    length: column.length,
  };
}

function frameDexieForeigns(foreigns) {
  const resultForeigns = [];
  for (const [item0, item1] of foreigns) {
    resultForeigns.push([
      cvtColumnName2TSPropName(item0),
      _.merge(
        _.cloneDeep(item1),
        { foreignColumnName: cvtColumnName2TSPropName(item1.foreignColumnName) }
      )
    ]);
  }

  return resultForeigns;
}

function frameDexieMany(many) {
  const resultMany = [];
  for (const [item0, item1] of many) {
    resultMany.push([
      cvtColumnName2TSPropName(item0),
      _.merge(
        _.cloneDeep(item1),
        { manyColumnName: cvtColumnName2TSPropName(item1.manyColumnName) }
      )
    ]);
  }

  return resultMany;
}

/**
 * Get Dexie schema string.
 * Note that, the primary key must line at the first.
 */
const getSchemaString = (columns) => {
  let result = "";
  const fields = Object.entries(columns);
  if (fields.length) {
    let schema = fields.reduce((schema, field) => {
      const fieldOpts = field[1];
      if (!!fieldOpts["indexed"]) {
        const fieldName = field[0];
        schema.push(`${fieldOpts["schema"] || ""}${fieldName}`);
      }

      return schema;
    }, []);
    schema = schema.sort((a,b)=>{
      const aScore = a.startsWith("++") ? 0 : 1;
      const bScore = b.startsWith("++") ? 0 :1;
      return aScore - bScore > 0 ? 1 : -1;
    })
    result = schema.join(", ");
  }

  return result;
}

/**
 * Get the data type of the primary key.
 */
const getKeyType = (columns) => {
  const fields = Object.entries(columns);
  if (fields && fields.length) {
    const keyField = fields.find((field) => field[1] && field[1]["schema"] === "++");
    return keyField[1].type;
  }
  else {
    return "any";
  }
}

function normalize(metadata) {
  const result = {};

  for (const tableName in metadata) {
    const resultTable = result[tableName] = {
      table: {
        schema: undefined,
        keyType: undefined,
      },
      columns: {},
      foreigns: [],
      many: [],
    };
    const { columns, foreigns = [], many = [], dexie = {} } = metadata[tableName];
    for (const columnName in columns) {
      resultTable.columns[cvtColumnName2TSPropName(columnName)] = frameDexieColumn(columnName, columns[columnName], dexie);
    }
    resultTable.foreigns = frameDexieForeigns(foreigns);
    resultTable.many = frameDexieMany(many);
    resultTable.table.schema = getSchemaString(resultTable.columns);
    resultTable.table.keyType = getKeyType(resultTable.columns);
  }

  return result;
}

module.exports = {
  normalize,
}
