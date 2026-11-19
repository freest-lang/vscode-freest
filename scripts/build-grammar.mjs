// Build syntaxes/freest.tmLanguage.json from syntaxes/freest.tmLanguage.yaml,
// expanding the {{name}} placeholders defined under `variables:` in the
// grammar's patterns, in the style of the TypeScript TextMate grammar.
import fs from "node:fs";
import { load } from "js-yaml";

const yamlPath = new URL("../syntaxes/freest.tmLanguage.yaml", import.meta.url);
const jsonPath = new URL("../syntaxes/freest.tmLanguage.json", import.meta.url);
const patternKeys = new Set(["match", "begin", "end", "while"]);

const grammar = load(fs.readFileSync(yamlPath, "utf8"));
const variables = grammar.variables ?? {};
delete grammar.variables;

function expandVariables(pattern, expanding = []) {
  return pattern.replace(/\{\{(\w+)\}\}/g, (_, name) => {
    if (!(name in variables)) {
      throw new Error(`unknown variable {{${name}}}`);
    }
    if (expanding.includes(name)) {
      throw new Error(`variable cycle ${[...expanding, name].join(" -> ")}`);
    }
    return expandVariables(variables[name], [...expanding, name]);
  });
}

function expandPatterns(value) {
  if (Array.isArray(value)) return value.map(expandPatterns);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, v]) => [
        key,
        patternKeys.has(key) && typeof v === "string" ? expandVariables(v) : expandPatterns(v),
      ]),
    );
  }
  return value;
}

fs.writeFileSync(jsonPath, JSON.stringify(expandPatterns(grammar), null, 2) + "\n");
