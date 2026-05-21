import fs from "node:fs";
import path from "node:path";
import { ENTITY_REGISTRY, type EntityConfig } from "@clt/data-schema";
import { z } from "zod";

export interface ValidationError {
  file: string;
  issues: z.ZodIssue[];
}

export const validateEntityDir = (
  entity: EntityConfig<z.ZodTypeAny, z.ZodTypeAny>,
  dir: string,
): ValidationError[] => {
  const errors: ValidationError[] = [];
  if (!fs.existsSync(dir)) return errors;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".json") || file === "_index.json") continue;
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    const result = entity.schema.safeParse(data);
    if (!result.success) errors.push({ file, issues: result.error.issues });
  }
  return errors;
};

const run = () => {
  let totalErrors = 0;
  for (const entity of Object.values(ENTITY_REGISTRY)) {
    const baseDir = entity.dataPath("x").replace(/\/x\.json$/, "");
    const dir = path.resolve(baseDir);
    const errors = validateEntityDir(entity, dir);
    if (errors.length > 0) {
      totalErrors += errors.length;
      console.error(`\n${entity.kind} (${dir}):`);
      for (const e of errors) {
        console.error(`  ✗ ${e.file}`);
        for (const issue of e.issues) {
          console.error(`      [${issue.path.join(".")}] ${issue.message}`);
        }
      }
    }
  }
  if (totalErrors === 0) {
    console.log("All data files pass schema validation.");
    return;
  }
  process.exit(1);
};

if (import.meta.url === `file://${process.argv[1]}`) run();
