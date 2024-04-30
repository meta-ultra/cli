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

/**
 * Destructure reference string like tokens. For example:
 * - "user.name" -> ["user", undefined, "name"]
 * - "user.({type:'admin'}).name" -> ["user", "{type:'admin'}", "name"]
 */
function tokenizeReference(ref) {
  let [tableName, condition, fieldName] = _.trim(ref).split(".").map((token) => _.trim(token));
  if (fieldName === undefined) {
    fieldName = condition;
    condition = "";
  }
  condition = _.trim(condition.replace(/^\(|\)$/g, ""));
  condition = _.isEmpty(condition) ? undefined : condition;

  return [tableName, condition, fieldName];
}

function setTableType(tableName, table, columns) {
  if ("type" in table) return;

  for (const [name, value] of Object.entries(columns)) {
    const ref = value["foreign_key_references"];
    if (ref) {
      const [foreignTableName] = tokenizeReference(ref);
      if (tableName === foreignTableName) {
        table.type = "self_reference";
        table.selfReferenceColumnName = name;
      }
    }
  }
}

function resolveForeignKey(metadata, sTableName, sColumnName, dTableName, dColumnName, dCondition) {
  const { columns } = metadata[sTableName];
  const column = columns[sColumnName];

  const foreigns = metadata[sTableName]["foreigns"] = metadata[sTableName]["foreigns"] || [];

  let ref = column["foreign_key_references"];
  if (ref) {
    const [foreignTableName, foreignCondition, foreignColumnName] = tokenizeReference(ref);
    const foreignColumn = resolveForeignKey(metadata, foreignTableName, foreignColumnName, sTableName, sColumnName, foreignCondition);

    column.type = foreignColumn.type;
    foreigns.push([sColumnName, {
      foreignTableName,
      foreignCondition,
      foreignColumnName,
    }]);
  }
  else if (dTableName && dColumnName) {
    if (metadata[sTableName]) {
      const many = metadata[sTableName]["many"] = metadata[sTableName]["many"] || [];
      many.push([sColumnName, {
        manyTableName: dTableName,
        manyCondition: dCondition,
        manyColumnName: dColumnName,
      }]);
    }

    return column;
  }
}

function normalize(metadata) {
  for (const tableName in metadata) {
    const tableMetadata = metadata[tableName];
    if (tableMetadata.columns) {
      tableMetadata.table = tableMetadata.table || {};
      setTableType(tableName, tableMetadata.table, tableMetadata.columns);

      for (const columnName in tableMetadata.columns) {
        // resolve foreign key to fulfill corresponding column definition
        resolveForeignKey(metadata, tableName, columnName);
      }
    }
  }
}

module.exports = {
  readMetadata,
  normalize,
};
