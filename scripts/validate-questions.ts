import { readFileSync } from "node:fs";
import path from "node:path";
import { DuplicateConflictError } from "../src/lib/questions/dedupe";
import { QuestionValidationError, validateQuestionBank } from "../src/lib/questions/validate";

const file = path.resolve(process.argv[2] ?? "src/data/straight-lines.json");

function main(): number {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    console.error(`Cannot read ${file}: ${err instanceof Error ? err.message : String(err)}`);
    return 1;
  }

  try {
    const { questions, duplicatesRemoved } = validateQuestionBank(raw);
    console.log(`OK: ${questions.length} unique questions in ${file}`);
    if (duplicatesRemoved > 0) {
      console.warn(
        `WARNING: ${duplicatesRemoved} identical duplicate(s) in the file were collapsed at load time; remove them from the JSON.`,
      );
    }
    return 0;
  } catch (err) {
    if (err instanceof QuestionValidationError || err instanceof DuplicateConflictError) {
      console.error(err.message);
      return 1;
    }
    throw err;
  }
}

process.exitCode = main();
