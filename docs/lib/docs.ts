import { createDocs } from "@taylorbryant/sibl/server";
import config from "@/sibl.config";

export const docs = createDocs(config, {
  rootDir: process.cwd(),
});
