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

module.exports = {
  cvtColumnName2TSPropName,
  cvtColumnType2TSType,
};
