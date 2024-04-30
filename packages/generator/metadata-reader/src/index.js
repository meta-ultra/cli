const core = require("./core.js");
const utils = require("./utils.js");

module.exports = {
  readMetadata: core.readMetadata,
  normalize: core.normalize,
  cvtColumnName2TSPropName: utils.cvtColumnName2TSPropName,
  cvtColumnType2TSType: utils.cvtColumnType2TSType,
};
