const _ = require("lodash");
const { cvtColumnName2TSPropName, cvtColumnType2TSType } = require("@generator/metadata-reader");

/**
 * Limitations:
 * 1. Compound indexes is not supported at the moment.
 */
function frameRouteHandlerDexieColumn(columnName, column, dexie) {
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
    isPrimary: !!column["primary_key"],
    length: column.length,

  };
}

function frameRouteHandlerDexieForeigns(foreigns) {
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

function frameRouteHandlerDexieMany(many) {
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
      table: {},
      columns: {},
      foreigns: [],
      many: [],
    };
    const { columns, foreigns = [], many = [], dexie = {} } = metadata[tableName];
    for (const columnName in columns) {
      resultTable.columns[cvtColumnName2TSPropName(columnName)] = frameRouteHandlerDexieColumn(columnName, columns[columnName], dexie);
    }
    resultTable.foreigns = frameRouteHandlerDexieForeigns(foreigns);
    resultTable.many = frameRouteHandlerDexieMany(many);
  }

  return result;
}

module.exports = {
  normalize,
}
