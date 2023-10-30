import meow from "meow";
import chalk from "chalk";
import welcome from "./welcome.js";
import cmdCreateProject from "./cmdCreateProject/index.js";

const helpText = `
  Usage
    ${chalk.green("npx muc")} ${chalk.cyan("<command>")} ${chalk.yellow("[options]")}
    ${chalk.green("pnpm dlx muc")} ${chalk.cyan("<command>")} ${chalk.yellow("[options]")}

  Commands
    ${chalk.cyan("help [command]")}  Show the help text or helper for specific command
    ${chalk.cyan(
      "create <name>"
    )}   Create folder with specific name, and initialize the project with specified template

  Options
    ${chalk.yellow("--template, -t <template>")} Works with ${chalk.cyan(
  "create"
)} command to specify template for initializing project
`;

const cli = meow(helpText, {
  importMeta: import.meta,
  description: false,
  flags: {
    help: {
      type: "boolean",
      default: false,
      shortFlag: "h",
    },
    version: {
      type: "boolean",
      default: false,
      shortFlag: "v",
    },
    /**----------------------
     *    Command Create Project Start
     *------------------------**/
    template: {
      type: "string",
      default: "pnpm-workspace-react-bem",
      shortFlag: "t",
    },
    typescript: {
      type: "boolean",
      default: true,
    },
    /*---- END OF Command Create Project ----*/
  },
});

if (cli.input.length === 0) {
  welcome(cli.pkg);
} else if (cli.input[0] === "create") {
  cmdCreateProject(cli);
} else {
  cli.showHelp();
}

// import welcome from "cli-welcome";
// import chalk from "chalk";
// import { readFile } from "node:fs/promises";

// const pkg = JSON.parse(await readFile(new URL("./package.json", import.meta.url)));

// welcome({
//   title: pkg.name,
//   tagLine: "Powered by Meta Ultra",
//   description: pkg.description,
//   version: pkg.version,
//   bgColor: "#FADC00",
//   color: "#000000",
//   bold: true,
//   clear: true,
// });

// console.log(`
// Hi, welcome using @meta-ultra/cli. I'm John Huang(ID: fsjohnhuang), the author of Meta Ultra libraries.
// Without further ado, run "muc create <package name> -- ts-react-webapp" to start a journey for building your own React Webapp with TypeScript right now.

// 📖 ${chalk.hex("#1da1f2").bold.inverse(" GitHub ")} ${chalk.dim(
//   "https://github.com/meta-ultra/cli"
// )}
// 😎 ${chalk.hex("#6cc644").bold.inverse("  Blog  ")} ${chalk.dim(
//   "https://www.cnblogs.com/fsjohnhuang/"
// )}
// `);
