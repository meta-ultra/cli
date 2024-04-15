const { join } = require("node:path");
const { readMetadata } = require("../src/index.js");

(async () => {
  console.log(JSON.stringify(await readMetadata(join(__dirname, "./metadata")), null, 2));
})()
