import { parse } from "https://deno.land/std/flags/mod.ts";

const flags = parse(Deno.args, {
  string: ["import-map","sdk-deps", "api", "sdk"],
  default: {
    "import-map": `${Deno.cwd()}/import_map.json`,
    "sdk-deps": "../deno-slack-sdk/src/deps.ts",
    "api": "../deno-slack-api/src/",
    "sdk": "../deno-slack-sdk/src/",
  },
});

// Regex for https://deno.land/x/deno_slack_api@x.x.x/
const API_REGEX = /https:\/\/deno.land\/x\/deno_slack_api@[0-9]+\.[0-9]+\.[0-9]+\//

const sdkDeps = await Deno.readTextFile(flags["sdk-deps"]);
await Deno.writeTextFile(flags["sdk-deps"], sdkDeps.replaceAll(API_REGEX, flags["api"]));

const importMap = JSON.parse(await Deno.readTextFile(flags["import-map"]));
importMap["imports"]["deno-slack-api/"] = flags.api;
importMap["imports"]["deno-slack-sdk/"] = flags.sdk;
await Deno.writeTextFile(flags["import-map"], JSON.stringify(importMap));
