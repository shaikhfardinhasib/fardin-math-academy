import "server-only";
import rawQuestions from "@/data/straight-lines.json";
import { validateQuestionBank } from "./validate";
import type { Question } from "./schema";

/**
 * Server-only entry point for the question bank. The JSON is bundled via a
 * static import, so there is no runtime filesystem access (which would be
 * request-time work under cacheComponents) and the page stays prerenderable.
 */
export function loadQuestions(): Question[] {
  return validateQuestionBank(rawQuestions).questions;
}
