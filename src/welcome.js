import cliWelcome from "cli-welcome";
import chalk from "chalk";

const welcome = (pkg) => {
  cliWelcome({
    title: pkg.name,
    tagLine: "Powered by Meta Ultra",
    description: pkg.description,
    version: pkg.version,
    bgColor: "#FADC00",
    color: "#000000",
    bold: true,
    clear: true,
  });

  console.log(`
  Hi, welcome using @meta-ultra/cli. I'm John Huang, the author of Meta Ultra libraries.
  Without further ado, run "muc create <package name> -- ts-react-webapp" to start a journey for building your own React Webapp with TypeScript right now.

  📖 ${chalk.hex("#1da1f2").bold.inverse(" GitHub ")} ${chalk.dim(
    "https://github.com/meta-ultra/cli"
  )}
  😎 ${chalk.hex("#6cc644").bold.inverse("  Blog  ")} ${chalk.dim(
    "https://www.cnblogs.com/fsjohnhuang/"
  )}
`);
};

export default welcome;
