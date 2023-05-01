import { assertEquals } from "https://deno.land/std@0.185.0/testing/asserts.ts";
import { getApiDepsUsed } from "./update.ts";
import * as mockFetch from "https://deno.land/x/mock_fetch@0.3.0/mod.ts";

mockFetch.install();

const message =
            `export { SlackAPI } from "https://deno.land/x/deno_slack_api@2.1.0/mod.ts";
			export type {SlackAPIClient, Trigger} from "https://deno.land/x/deno_slack_api@2.2.0/types.ts";`;
          .enqueue(new TextEncoder().encode(message));
Deno.test("getApiDepsUsed should return a list of all the versions of the api in the sdk", async () => {
  mockFetch.mock("GET@/x/deno_slack_sdk@x.x.x/deps.ts", (req: Request) => {
    assertEquals(
      req.url,
      "https://deno.land/x/deno_slack_sdk@x.x.x/deps.ts?source,file",
    );

    let timer: number | undefined = undefined;
    const body = new ReadableStreamDefaultReader({});
    return new Response(body, {
      headers: {
        "content-type": "text/plain",
        "x-content-type-options": "nosniff",
      },
    });
  });

  const apiDeps = await getApiDepsUsed(
    "https://deno.land/x/deno_slack_sdk@x.x.x/",
  );

  assertEquals(
    apiDeps,
    new Set([
      "https://deno.land/x/deno_slack_api@2.1.0/",
      "https://deno.land/x/deno_slack_api@2.2.0/",
    ]),
  );
});
