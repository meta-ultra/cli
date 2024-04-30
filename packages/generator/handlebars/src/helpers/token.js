const utils = require("../utils.js") ;

/**
 *  Convert table name to property name in plural
 */
const pluralizeLowerCamelCase = (fieldName) => {
  return utils.pluralize(_.camelCase(fieldName));
};

const pluralizeUpperCamelCase = (fieldName) => {
  return utils.pluralize(_.upperCamelCase(fieldName));
};

const pluralizeKebabCase = (fieldName) => {
  return utils.pluralize(_.kebabCase(fieldName));
};

function tokenizeName(name) {
  const re = /[A-Z]/;
  const tokens = name.split(/[-_.]/);
  return tokens.reduce((tokens, token) => {
    let match = re.exec(token);
    while (match) {
      const subToken = token.substring(0, match.index).toLowerCase();
      if (subToken) {
        tokens.push(subToken);
      }
      token = token[match.index].toLowerCase() + token.slice(match.index + 1);
      match = re.exec(token);
    }
    if (token) {
      tokens.push(token.toLowerCase());
    }

    return tokens;
  }, []);
}

/**
 * Name a property on top of its foreign key name, such as turn "branch_id", "branchId" or "branch-id" to "branch".
 * This function will be used in Dexie, Route Handlers and UI tiers.
 */
const getForeignPropertyName = (fieldName) => {
  const tokens = tokenizeName(fieldName);
  if (tokens.length < 2) {
    throw Error(`The foreign field name should be made of two words at least, but "${fieldName}" was found!`);
  }
  tokens.pop();
  return tokens.map((token, i) => i === 0 ? token : _.capitalize(token)).join("");
};

module.exports = {
  slashify: utils.slashify,
  upperCamelCase: utils.upperCamelCase,
  pluralize: utils.pluralize,
  pluralizeLowerCamelCase,
  pluralizeUpperCamelCase,
  pluralizeKebabCase,
  tokenizeName,
  getForeignPropertyName,
};
