import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import alert from "cli-alert";
import shelljs from "shelljs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const getTemplateDirname = (template, typescript) => {
  const templateDirname = `${template.split("@")[0]}.${typescript ? "ts" : "js"}@0.1.0`;
  return join(__dirname, "templates", templateDirname);
};

const cmdCreateProject = (cli) => {
  const [name] = cli.input.slice(1);
  const { template, typescript } = cli.flags;
  const templateDirname = getTemplateDirname(template, typescript);
  console.log(templateDirname);

  if (existsSync(name)) {
    alert({ type: "error", msg: `Directory "${name}" is existing.` });
    process.exit(0);
  } else if (!existsSync(templateDirname)) {
    alert({ type: "error", msg: `Template is not found.` });
    process.exit(0);
  } else {
    shelljs.mkdir(name);
    shelljs.cp("-R", join(templateDirname, "*"), name);

    alert({ type: "success", msg: `Succeed to create project "${name}".` });
  }
};

export default cmdCreateProject;
