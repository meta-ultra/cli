const { join } = require("node:path");
const MetadataReader = require("@generator/metadata-reader");
const { normalize } = require("../src/index.js");

(async () => {
  const metadata = await MetadataReader.readMetadata(join(__dirname, "./metadata"));
  MetadataReader.normalize(metadata);
  console.log(JSON.stringify(normalize(metadata), null, 2));
})()
