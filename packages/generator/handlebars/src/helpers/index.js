const token = require('./token.js');
const scopeImports = require('./scopeImports.js');

function makeArray(...args) {
  return args;
}

module.exports = [
  makeArray,
  ...Object.values(token),
  ...Object.values(scopeImports),
];
