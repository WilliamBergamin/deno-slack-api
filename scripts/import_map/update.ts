import { parse } from "https://deno.land/std/flags/mod.ts";

async function main() {
  const flags = parse(Deno.args, {
    string: ["import-map", "api"],
    default: {
      "import-map": `${Deno.cwd()}/import_map.json`,
      "api": "../deno-slack-api/src/",
    },
  });

  const importMap = JSON.parse(await Deno.readTextFile(flags["import-map"]));
  const apiDeps = await getApiDepsUsed(importMap["imports"]["deno-slack-sdk/"]);

  const sdkScope: Record<string, string> = {};
  for (const apiDep in apiDeps) {
    sdkScope[apiDep] = flags.api;
  }

  importMap["imports"]["deno-slack-api/"] = flags.api;
  importMap["scopes"] = {
    [importMap["imports"]["deno-slack-sdk/"]]: sdkScope,
  };

  await Deno.writeTextFile(flags["import-map"], JSON.stringify(importMap));
}

export async function getApiDepsUsed(sdkDep: string): Promise<Set<string>> {
  // Regex for https://deno.land/x/deno_slack_api@x.x.x/
  const API_REGEX =
    /(https:\/\/deno.land\/x\/deno_slack_api@[0-9]+\.[0-9]+\.[0-9]+\/)/;
  const response = await fetch(`${sdkDep}deps.ts?source,file`);
  const bodyReader = response.body!.getReader();

  const apiDeps = new Set<string>();
  while (true) {
    const { done, value } = await bodyReader.read();
    if (done) break;
    const file = new TextDecoder().decode(value);
    file.match(API_REGEX)?.forEach((match) => apiDeps.add(match));
  }
  return apiDeps;
}

if (import.meta.main) main();
