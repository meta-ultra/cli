const { join } = require("node:path");
const MetadataReader = require("@generator/metadata-reader");
const { normalize, generate, output } = require("../src/index.js");

(async () => {
  const metadata = await MetadataReader.readMetadata(join(__dirname, "./metadata"));
  MetadataReader.normalize(metadata);
  const routeHandlerDexieMetadata = normalize(metadata);
  const generatedCodes = await generate(routeHandlerDexieMetadata);
  await output(join(__dirname, "./result"), generatedCodes);
})()
