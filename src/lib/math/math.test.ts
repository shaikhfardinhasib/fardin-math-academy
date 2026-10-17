import { describe, expect, it } from "vitest";
import rawQuestions from "@/data/straight-lines.json";
import { stripCitations } from "@/lib/text/sanitize";
import { renderMathToHtml } from "./render";
import { tokenize } from "./tokenize";

describe("tokenize", () => {
  it("returns [] for empty input and one text token for plain text", () => {
    expect(tokenize("")).toEqual([]);
    expect(tokenize("hello")).toEqual([{ kind: "text", value: "hello" }]);
  });

  it("parses inline math", () => {
    expect(tokenize("a $x^2$ b")).toEqual([
      { kind: "text", value: "a " },
      { kind: "inline", value: "x^2" },
      { kind: "text", value: " b" },
    ]);
  });

  it("parses block math", () => {
    expect(tokenize("before $$\\frac{a}{b}$$ after")).toEqual([
      { kind: "text", value: "before " },
      { kind: "block", value: "\\frac{a}{b}" },
      { kind: "text", value: " after" },
    ]);
  });

  it("handles adjacent and mixed math", () => {
    expect(tokenize("$a$$$b$$$c$")).toEqual([
      { kind: "inline", value: "a" },
      { kind: "block", value: "b" },
      { kind: "inline", value: "c" },
    ]);
  });

  it("treats an escaped \\$ as a literal dollar in text", () => {
    expect(tokenize("cost \\$5 and $x$")).toEqual([
      { kind: "text", value: "cost $5 and " },
      { kind: "inline", value: "x" },
    ]);
  });

  it("keeps \\$ inside math for KaTeX", () => {
    expect(tokenize("$a \\$ b$")).toEqual([{ kind: "inline", value: "a \\$ b" }]);
  });

  it("treats unclosed $ and $$ as text", () => {
    expect(tokenize("price $5")).toEqual([{ kind: "text", value: "price $5" }]);
    expect(tokenize("a $$ b")).toEqual([{ kind: "text", value: "a $$ b" }]);
    expect(tokenize("$x$ then $y")).toEqual([
      { kind: "inline", value: "x" },
      { kind: "text", value: " then $y" },
    ]);
  });

  it("handles Bangla text mixed with math", () => {
    const tokens = tokenize("$(1, -\\sqrt{3})$ বিন্দুটির পোলার স্থানাঙ্ক $(r, \\theta)$ কোনটি?");
    expect(tokens.map((t) => t.kind)).toEqual(["inline", "text", "inline", "text"]);
    expect(tokens[1]).toEqual({ kind: "text", value: " বিন্দুটির পোলার স্থানাঙ্ক " });
    expect(tokens[3]).toEqual({ kind: "text", value: " কোনটি?" });
  });

  it("shipped strings have balanced math: no stray $ left in text tokens", () => {
    for (const q of rawQuestions) {
      for (const s of [q.question, q.explanation, q.shortcut_tip, ...q.options]) {
        for (const t of tokenize(s)) {
          if (t.kind === "text") expect(t.value, `${q.id}: ${s}`).not.toContain("$");
        }
      }
    }
  });
});

describe("stripCitations", () => {
  it("removes cite artifacts and the space before them", () => {
    expect(stripCitations("answer [cite: 1, 2].")).toBe("answer.");
    expect(stripCitations("a [cite_start]b [cite_end] c")).toBe("a b c");
    expect(stripCitations("no artifacts $[a, b]$")).toBe("no artifacts $[a, b]$");
  });
});

describe("renderMathToHtml", () => {
  it("renders valid LaTeX", () => {
    expect(renderMathToHtml("x^2", false)).toContain("katex");
    expect(renderMathToHtml("x^2", true)).toContain("katex-display");
  });

  it("never throws on invalid LaTeX", () => {
    for (const bad of ["\\frac{", "\\undefinedmacro", "}{", "\\begin{matrix"]) {
      expect(() => renderMathToHtml(bad, false)).not.toThrow();
    }
  });

  it("does not honour \\href when trust is false", () => {
    const html = renderMathToHtml("\\href{javascript:alert(1)}{x}", false) ?? "";
    expect(html).not.toContain("<a ");
  });

  it("renders every shipped math fragment without a KaTeX error", () => {
    for (const q of rawQuestions) {
      for (const s of [q.question, q.explanation, q.shortcut_tip, ...q.options]) {
        for (const t of tokenize(s)) {
          if (t.kind === "text") continue;
          const html = renderMathToHtml(t.value, t.kind === "block");
          expect(html, `${q.id}: ${t.value}`).not.toContain("katex-error");
        }
      }
    }
  });
});
