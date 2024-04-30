const _ = require("lodash");

const slashify = (x) => x.replace(/\\/g, "/");

const upperCamelCase = (value) => _.upperFirst(_.camelCase(value));

const pluralize = (x) => {
  return /(ch|sh|x|s)$/.test(x) ? x + "es" : x + "s";
};

module.exports = {
  slashify,
  upperCamelCase,
  pluralize,
};
