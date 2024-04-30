/**
 * The publicly accessiable functions will be registered as Handlebars Helpers.
 */
const _ = require("lodash");
const Handlebars = require("handlebars");

/**
 * Frame the yup schema.
 */
const getYupSchema = (field, strict, isQueryForm) => {
  let schema = [];
  if (/^files?$/i.test(field.yup.type)) {
    schema.push("files()");
  }
  if (/^date$/i.test(field.yup.type)) {
    if (isQueryForm) {
      schema.push(`maybeArrayOf(yup.date())`);
    }
    else {
      schema.push(`date()`);
    }
  }
  else {
    schema = [`${field.yup.type === "integer" ? "number" : field.yup.type}()`];
    if (["number", "integer"].indexOf(field.yup.type) !== -1) {
      if (field.yup.type === "integer") {
        schema.push("integer()");
      }

      if ("min" in field) {
        schema.push(`min(${field.min})`);
      }
      if ("max" in field) {
        schema.push(`max(${field.max})`);
      }
    }
    else if (field.yup.type === "string") {
      if (_.isNumber(field.length)) {
        schema.push(`max(${field.length})`);
      }

      const regexp = _.get(field, "yup.regexp");
      if (regexp) {
        schema.push(`matches(RegExp("${regexp}"))`);
      }
    }
  }

  if (strict === true && field.required) {
    schema.push("required()");
  }

  return schema.length ? new Handlebars.SafeString(schema.join(".")) : "";
};


const getPrimaryKeys = (columns) => {
  return _.pickBy(columns, (value, key) => {
    return value.isPrimary;
  });
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

module.exports = {
  getManyAppearOnce,
  getYupSchema,
  getPrimaryKeys,
};
