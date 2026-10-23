/** Tiny argv parser: `--flag`, `--key value`, positionals. Unknown flags are errors. */
export function parseArgs(
  argv: string[],
  spec: { values: string[]; booleans: string[] },
): { flags: Map<string, string | true>; positionals: string[] } {
  const flags = new Map<string, string | true>();
  const positionals: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (!arg.startsWith("--")) {
      positionals.push(arg);
      continue;
    }
    const name = arg.slice(2);
    if (spec.values.includes(name)) {
      const value = argv[++i];
      if (value === undefined || value.startsWith("--")) throw new Error(`--${name} needs a value`);
      flags.set(name, value);
    } else if (spec.booleans.includes(name)) flags.set(name, true);
    else throw new Error(`unknown option --${name}`);
  }
  return { flags, positionals };
}
