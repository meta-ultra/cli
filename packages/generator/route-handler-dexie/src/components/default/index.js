const { join, relative } = require("node:path");
const { glob } = require("glob");
const _ = require("lodash");
const { generateOnFly, readFileContent, slashify, registerHelpers, pluralize } = require("@generator/handlebars");
const helpers = require("./helpers");

const HBS_RE = /\.hbs$/i;

function setup() {
  // setup handlebars
  registerHelpers(...Object.values(helpers));
}

async function doGenerate(metadata, filter) {
  const generatedCodes = {};
  const templateDirRelativePath = `./templates`;

  let entitiesAbsolutePaths = await glob(slashify(join(__dirname, templateDirRelativePath, `./**/*.*`)));
  if (filter) {
    entitiesAbsolutePaths = entitiesAbsolutePaths.filter((path) => RegExp(filter).test(path));
  }
  const entitiesPaths = entitiesAbsolutePaths.map((absolutePath) => [absolutePath, slashify(relative(__dirname, absolutePath))]);
  await Promise.all(Object.entries(metadata).map(([tableName, tableMetadata]) => {
    return Promise.all(entitiesPaths.map(async ([absolutePath, relativePath]) => {
      const filePath = `${relativePath.replace(templateDirRelativePath, "").replace(/{{name}}/g, pluralize(_.kebabCase(tableName)))}`.replace(HBS_RE, "");
      if (HBS_RE.test(relativePath)) {
        generatedCodes[filePath] = await generateOnFly(absolutePath, {tableName, ...tableMetadata});
      }
      else {
        generatedCodes[filePath] = await readFileContent(absolutePath);
      }
    }));
  }));

  return generatedCodes;
}

async function generate(metadata, filter) {
  setup();
  return doGenerate(metadata, filter);
}

module.exports = {
  generate,
}
