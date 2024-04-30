async function generate(metadata, databasePackage, filter, template = "default") {
  return new Promise((resolve) => {
    const component = require(`../components/${template}/index.js`);
    resolve(component.generate(metadata, databasePackage, filter));
  })
}

module.exports = {
  generate,
};
