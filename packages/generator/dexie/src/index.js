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

function normalize(metadata) {
  const result = {};

  for (const tableName in metadata) {
    const resultTable = result[tableName] = {
      columns: {},
      foreigns: [],
      many: [],
    };
    const { columns, foreigns = [], many = [], dexie = {} } = metadata[tableName];
    for (const columnName in columns) {
      resultTable.columns[columnName] = frameDexieColumn(columnName, columns[columnName], dexie);
    }
    resultTable.foreigns = frameDexieForeigns(foreigns);
    resultTable.many = frameDexieMany(many);
  }

  return result;
}

module.exports = {
  normalize,
}
