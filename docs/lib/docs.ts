import { createDocs } from "sibl/server";
import config from "@/sibl.config";

export const docs = createDocs(config, {
  rootDir: process.cwd(),
});
