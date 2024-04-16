const { isAbsolute, join } = require("node:path");
const { readFile } = require("node:fs/promises");
const Handlebars = require("handlebars");
const _ = require("lodash");
const { sprintf } = require("sprintf-js");

const readFileContent = async (path) =>
  (await readFile(isAbsolute(path) ? path : join(__dirname, path))).toString("utf8");

/**
 * render template on fly for development
 * @param {*} path - the template path
 * @param {*} context - the context parameter Handlebars template function consumes
 * @param {*} options - the options parameter Handlebars template function consumes
 * @returns
 */
const generateOnFly = async (path, context, options) => {
  const content = await readFileContent(path);
  const template = Handlebars.compile(content);
  const code = template(context, options);

  return code;
};

const registerPartials = async (...partials) => {
  return Promise.all(partials.map((partial) => {
    if (isObject(partial)) {
      return Promise.all(
        Object.entries(partial).map(async ([name, path]) => {
          const content = await readFileContent(path);
          Handlebars.registerPartial(name, content);
        })
      )
    }
    else if (isArray(partial)) {
      return registerPartials(...partial);
    }
  }));
};

const registerHelpers = (...fns) => {
  fns.forEach((fn) => {
    if (typeof fn === "function") {
      Handlebars.registerHelper(fn.name, fn);
    }
    else if (isArray(fn)) {
      registerHelpers(...fn);
    }
    else if (isObject(fn)) {
      registerHelpers(...Object.values(fn));
    }
  });
};

const slashify = (x) => x.replace(/\\/g, "/");

const upperCamelCase = (value) => _.upperFirst(_.camelCase(value));

const pluralize = (x) => {
  return /(ch|sh|x|s)$/.test(x) ? x + "es" : x + "s";
};

/**
 *  Convert table name to property name in plural
 */
const pluralizeLowerCamelCase = (fieldName) => {
  return pluralize(_.camelCase(fieldName));
};

const pluralizeUpperCamelCase = (fieldName) => {
  return pluralize(_.upperCamelCase(fieldName));
};

const pluralizeKebabCase = (fieldName) => {
  return pluralize(_.kebabCase(fieldName));
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

const scopeImports = {
  scope(options) {
    options.data.scopeImports = [];
    const prog = options.fn(this);

    // normalize, including name conflict detection
    const identifiers = new Set();
    const imports = {};
    for (const {members, package} of options.data.scopeImports) {
      imports[package] = imports[package] || [];
      for (const member of members) {
        const found = !!imports[package].find((existingMember) => {
          if (typeof member === "string") {
            return existingMember === member;
          }
          else if (
            typeof member === "object" &&
            typeof existingMember === "object" &&
            member.type === existingMember.type
          ) {
            switch (member.type) {
              case "as":
                return isEqual(member.payload.original, existingMember.payload.original);
              default:
                return member.payload === existingMember.payload;
            }
          }
          else {
            return false;
          }
        });

        if (!found) {
          let hasNameConflit = false;
          if (typeof member === "string") {
            hasNameConflit = identifiers.has(member);
            identifiers.add(member);
          }
          else {
            if (member.type === "as") {
              hasNameConflit = identifiers.has(member.payload.alias);
              identifiers.add(member.payload.alias);
            }
            else {
              hasNameConflit = identifiers.has(member.payload);
              identifiers.add(member.payload);
            }
          }
          if (hasNameConflit) {
            throw Error(`Name conflit occurs in the import statments.`);
          }
          imports[package].push(member);
        }
      }
    }
    identifiers.clear();
    // sort in the order of default, asterisk, named type alias , named type, named member alias and named member.
    const rateMember = (member) => {
      if (typeof member === "string") {
        return 6;
      }
      else {
        let score = {
          default: 1,
          asterisk: 2,
          type: 4,
        }[member.type];

        // either named type alias or named member alias
        if (!score) {
          score = typeof member.payload.original === "string" ? 5 : 3;
        }

        return score;
      }
    }
    for (const [name, members] of Object.entries(imports)) {
      imports[name] = members.sort((p, n) => rateMember(p) - rateMember(n));
    }
    // generate code
    const importStrings = [];
    for (const [name, members] of Object.entries(imports)) {
      let importString = [];
      for (let i = 0; i < members.length; i++) {
        let member = members[i];
        if (member.type === "default") {
          importString.push(member.payload);
        }
        else if (member.type === "asterisk") {
          importString.push(`* as ${member.payload}`);
        }
        else {
          const namedImportString = [];
          while (member) {
            if (typeof member === "string") {
              namedImportString.push(member);
            }
            else if (member.type === "type") {
              namedImportString.push(`type ${member.payload}`);
            }
            else {
              if (typeof member.payload.original === "string") {
                namedImportString.push(`${member.payload.original} as ${member.payload.alias}`);
              }
              else {
                namedImportString.push(`type ${member.payload.original.payload} as ${member.payload.alias}`);
              }
            }
            member = members[i += 1];
          }

          importString.push(`{ ${namedImportString.join(", ")} }`);
        }
      }
      importStrings.push(`import ${importString.join(", ")} from "${name}";`);
    }
    let importCode = importStrings.join("\r\n") + "\r\n";
    importCode = importCode ? importCode + "\r\n" : "";

    delete options.data.scopeImports;
    const code = new Handlebars.SafeString(importCode + prog.trim());
    return code;
  },
  import(...args) {
    if (args.length <= 2) {
      throw Error(`The "as" helper should be called with "from" and "to" parameters.`);
    }
    else {
      const options = args.pop();
      const package = args.pop();
      const members = args;
      options.data.scopeImports.push({members, package});
    }
  },
  as(original, alias, options) {
    if (!options) {
      throw Error(`The "as" helper should be called with "from" and "to" parameters.`);
    }
    else {
      return {type: "as", payload: {original, alias}};
    }
  },
  default(name, options) {
    if (!options) {
      throw Error(`The "default" helper should be called with "name" parameters.`);
    }
    else {
      return {type: "default", payload: name};
    }
  },
  asterisk(name, options) {
    if (!options) {
      throw Error(`The "asterisk" helper should be called with "name" parameters.`);
    }
    else {
      return {type: "asterisk", payload: name};
    }
  },
  type(name, options) {
    if (!options) {
      throw Error(`The "type" helper should be called with "name" parameters.`);
    }
    else {
      return {type: "type", payload: name};
    }
  }
};

// register built-in helpers
registerHelpers(
  _.isEmpty,
  _.isEqual,
  upperCamelCase,
  sprintf,
  pluralizeLowerCamelCase,
  pluralizeUpperCamelCase,
  pluralizeKebabCase,
  getForeignPropertyName,
  ...Object.values(scopeImports),
);

module.exports = {
  generateOnFly,
  registerPartials,
  registerHelpers,
  slashify,
  upperCamelCase,
};
