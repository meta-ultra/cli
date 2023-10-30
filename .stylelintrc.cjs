module.exports = {
  extends: [
    "stylelint-config-standard",
    "stylelint-config-recess-order",
    "stylelint-config-prettier",
    "stylelint-prettier/recommended",
  ],
  plugins: ["stylelint-prettier", "@namics/stylelint-bem"],
  rules: {
    "plugin/stylelint-bem-namics": { namespaces: ["mu-"], patternPrefixes: [], helperPrefixes: [] },
    // Enable Prettier formatting rules
    "prettier/prettier": true,
    "selector-class-pattern": null,
  },
};
