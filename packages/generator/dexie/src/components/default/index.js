const { join, relative } = require("node:path");
const { glob } = require("glob");
const { generateOnFly, slashify, upperCamelCase, registerHelpers } = require("../../core/handlebarsHelper");
const helpers = require("./helpers");

const HBS_RE = /\.hbs$/i;

function setup() {
  // setup handlebars
  registerHelpers(...Object.values(helpers));
}

async function doGenerate(metadata, filter) {
  const generatedCodes = {};
  const templateDirRelativePath = `./templates`;

  // generate code under the template root
  const absolutePaths = await glob(slashify(join(__dirname, templateDirRelativePath, "./*.*")));
  const paths = absolutePaths.map((absolutePath) => [absolutePath, slashify(relative(__dirname, absolutePath))]);
  await Promise.all(paths.map(async ([absolutePath, relativePath]) => {
    const filePath = `${relativePath.replace(templateDirRelativePath, "").replace(HBS_RE, "")}`;
    if (HBS_RE.test(relativePath)) {
      generatedCodes[filePath] = await generateOnFly(absolutePath, {metadata});
    }
    else {
      generatedCodes[filePath] = await readFileContent(absolutePath);
    }
  }));

  // generate code according to the "entities" folder.
  let entitiesAbsolutePaths = await glob(slashify(join(__dirname, templateDirRelativePath, `entities/**/*.*`)));
  if (filter) {
    entitiesAbsolutePaths = entitiesAbsolutePaths.filter((path) => RegExp(filter).test(path));
  }
  const entitiesPaths = entitiesAbsolutePaths.map((absolutePath) => [absolutePath, slashify(relative(__dirname, absolutePath))]);
  await Promise.all(Object.entries(metadata).map(([tableName, tableMetadata]) => {
    return Promise.all(entitiesPaths.map(async ([absolutePath, relativePath]) => {
      const filePath = `${relativePath.replace(templateDirRelativePath, "").replace(/{{Entity}}/g, upperCamelCase(tableName))}`.replace(HBS_RE, "");
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
