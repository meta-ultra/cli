async function generate(metadata, filter, template = "default") {
  return new Promise((resolve) => {
    const component = require(`../components/${template}/index.js`);
    resolve(component.generate(metadata, filter));
  })
}

module.exports = {
  generate,
};
