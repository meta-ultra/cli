const { join, dirname } = require("node:path");
const { mkdir, writeFile } = require("node:fs/promises");

async function output(rootPath, generatedCodes) {
  return Promise.all(Object.entries(generatedCodes).map(async ([path, source]) => {
    const fullPath = join(rootPath, path);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, source, "utf-8");
  }));
};

module.exports = {
  output,
}
