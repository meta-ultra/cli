const _ = require("lodash");

/**
 * Retrieve the table names for the foreign keys from the one side.
 */
function getForeignTableNames(foreigns) {
  return _.map(foreigns, (item) => _.get(item, "1.foreignTableName"));
};

/**
 * Retrieve the table names for the foreign keys from the many side.
 * Note that, the table name will be ignored when it exists multiple times.
 */
function getManyTableNames(many) {
  const tableNames = [];
  for (let i = 0; i < many.length; i++) {
    const tableName = _.get(many[i], "1.manyTableName");
    tableNames.push(tableName);
  }
  const result = Object.values(_.groupBy(tableNames, _.identity))
  .filter((tableNames) => tableNames.length === 1)
  .map(_.first);

  return result;
};

/**
 * Get the available many to build many properties inside the foreign entity.
 */
function getManyAppearOnce(many){
  const manyTableNames = getManyTableNames(many);
  return many.filter((item) => {
    return manyTableNames.indexOf(item[1].manyTableName) !== -1;
  });
}

/**
 * Returns the dudeplicated foreign table names for named import statement.
 */
function getForeignManyTableNames(foreigns, many, tableName) {
  const foreignTableNames = getForeignTableNames(foreigns);
  const manyTableNames = getManyTableNames(many);

  let names = _.uniq(_.concat(foreignTableNames, manyTableNames));
  if (typeof tableName === "string") {
    names = names.filter((name) => name !== tableName);
  }

  return names;
};

function rateColumnPriority(column) {
  return column[1].required ? 2 : column[1]["schema"] === "++" ? 1 : 0;
};
/**
 * Convert $dexie from object to array of entries and the required properties line in the most front,
 * and primary key follow ups, then the rest optional keys at the end.
 */
function sortByRequiredFirst($dexie){
  return Object.entries($dexie).sort((a, b) => rateColumnPriority(a) - rateColumnPriority(b) > 0 ? -1 : 1);
};

module.exports = {
  getManyAppearOnce,
  getForeignManyTableNames,
  sortByRequiredFirst,
}
