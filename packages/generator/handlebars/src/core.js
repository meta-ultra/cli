const { isAbsolute, join } = require("node:path");
const { readFile } = require("node:fs/promises");
const Handlebars = require("handlebars");

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

module.exports = {
  readFileContent,
  generateOnFly,
  registerPartials,
  registerHelpers,
};
