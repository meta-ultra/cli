import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import alert from "cli-alert";
import shelljs from "shelljs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatesDirname = join(__dirname, "templates");

const getTemplatePathInfo = (template, typescript) => {
  const lang = typescript ? "ts" : "js";
  let templateDirname = undefined;
  let [type, version] = template.split("@");
  if (!version) {
    // defaults to the latest version
    const names = readdirSync(templatesDirname)
      .filter((name) => {
        if (statSync(join(templatesDirname, name)).isDirectory()) {
          return name.split("@")[0] === `${type}.${lang}`;
        } else {
          return false;
        }
      })
      .sort();

    if (names.length > 0) {
      templateDirname = names[names.length - 1];
      version = templateDirname.split("@")[1];
    }
  } else {
    templateDirname = `${type}.${lang}@${version}`;
  }

  return {
    type,
    version,
    typescript,
    path: templateDirname ? join(templatesDirname, templateDirname) : undefined,
  };
};

const cmdCreateProject = (cli) => {
  const [name] = cli.input.slice(1);
  const { template, typescript } = cli.flags;

  // check if the directory with the same is existing
  if (existsSync(name) && statSync(name).isDirectory()) {
    alert({ type: "error", msg: `Directory "${name}" is existing.` });
    process.exit(0);
  }
  // check if the specified template is existing
  const templatePathInfo = getTemplatePathInfo(template, typescript);
  if (!existsSync(templatePathInfo.path)) {
    alert({
      type: "error",
      msg: `Template "${template}" with ${typescript ? "TypeScript" : "JavaScript"} is not found.`,
    });
    process.exit(0);
  }

  // create the project root directory
  shelljs.mkdir(name);
  // initialize the structure of project based on template
  shelljs.cp("-R", join(templatePathInfo.path, "*"), name);

  //todo persist the project metadata created by muc

  alert({ type: "success", msg: `Succeed to create project "${name}".` });
};

export default cmdCreateProject;
