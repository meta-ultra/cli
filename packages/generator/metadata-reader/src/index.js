const { join } = require("node:path");
const { readdir, stat, readFile } = require("node:fs/promises");
const _ = require("lodash");
const toml = require("@ltd/j-toml");

const JSON_RE = /\.json$/i;
const TOML_RE = /\.toml$/i;

async function readJSON(filePath, node) {
  const buffer = await readFile(filePath);
  const content = buffer.toString("utf8");
  const json = JSON.parse(content);
  _.merge(node, json);
}

async function readToml(filePath, node) {
  const buffer = await readFile(filePath);
  const content = buffer.toString("utf8");
  const json = toml.parse(content, { bigint: false });
  _.merge(node, json);
}

/**
 * The priority from high to low: JSON -> TOML -> Directory Tree.
 */
async function read(filePath, node) {
  const names = await readdir(join(filePath))
  const jsonFiles = [];
  const tomlFiles = [];
  for (const name of names) {
    const childFilePath = join(filePath, name);
    const stats = await stat(childFilePath);

    if (stats.isDirectory()) {
      node[name] = node[name] || {};
      await read(childFilePath, node[name]);
    }
    else if (TOML_RE.test(name)) {
      tomlFiles.push(name);
    }
    else if (JSON_RE.test(name)) {
      jsonFiles.push(name);
    }
  }

  await Promise.all(
    tomlFiles.map((tomlFile) => {
      const childFilePath = join(filePath, tomlFile);
      const fileName = tomlFile.replace(TOML_RE, "");
      node[fileName] = node[fileName] || {};
      return readToml(childFilePath, node[fileName]);
    })
  );

  await Promise.all(
    jsonFiles.map((jsonFile) => {
      const childFilePath = join(filePath, jsonFile);
      const fileName = jsonFile.replace(JSON_RE, "");
      node[fileName] = node[fileName] || {};
      return readJSON(childFilePath, node[fileName]);
    })
  );

  return node;
}

async function readMetadata(filePath) {
  const root = {};
  await read(filePath, root);
  return root;
}

module.exports = {
  readMetadata,
};
