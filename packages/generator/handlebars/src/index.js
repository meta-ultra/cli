const _ = require("lodash");
const { sprintf } = require("sprintf-js");
const helpers = require("./helpers/index.js");
const core = require("./core.js");
const utils = require("./utils.js");

// register built-in helpers
core.registerHelpers(
  _.every,
  _.isEmpty,
  _.isEqual,
  sprintf,
  ...helpers,
);

module.exports = {
  ...core,
  slashify: utils.slashify,
  upperCamelCase: utils.upperCamelCase,
  pluralize: utils.pluralize,
};
