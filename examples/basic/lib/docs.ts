import path from "node:path";
import { createDocs } from "siglum/server";
import config from "@/siglum.config";

export const docs = createDocs(config, {
  rootDir: path.join(process.cwd(), "content"),
});
