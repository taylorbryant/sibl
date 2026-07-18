import { createDocs } from "siglum/server";
import config from "@/siglum.config";

export const docs = createDocs(config, {
  rootDir: process.cwd(),
});
