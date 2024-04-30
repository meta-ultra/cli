const Handlebars = require("handlebars");

module.exports = {
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
