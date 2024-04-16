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

function getDexieSchema(column) {
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
    schema: getDexieSchema(column),
    length: column.length,
  };
}

function normalize(metadata) {
  const dexieColumns = {};

  for (const tableName in metadata) {
    const { columns, dexie } = metadata[tableName];
    for (const columnName in columns) {
      dexieColumns[columnName] = frameDexieColumn(columnName, columns[columnName], dexie);
    }
  }

  return {
    columns: dexieColumns,
  };
}

module.exports = {
  normalize,
}
