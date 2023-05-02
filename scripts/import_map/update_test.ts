import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.185.0/testing/asserts.ts";
import {
  afterEach,
  beforeAll,
} from "https://deno.land/std@0.185.0/testing/bdd.ts";
import { apiDepsIn } from "./update.ts";
import * as mockFetch from "https://deno.land/x/mock_fetch@0.3.0/mod.ts";
import { HttpError } from "https://deno.land/std@0.182.0/http/http_errors.ts";

const depsTsMock =
  `export { SlackAPI } from "https://deno.land/x/deno_slack_api@2.1.0/mod.ts";
   export type {SlackAPIClient, Trigger} from "https://deno.land/x/deno_slack_api@2.2.0/types.ts";`;

beforeAll(() => {
  mockFetch.install();
});

afterEach(() => {
  mockFetch.reset();
});

Deno.test("apiDepsIn should return a list of the api module urls used by a module", async () => {
  mockFetch.mock("GET@/x/deno_slack_sdk@x.x.x/deps.ts", (req: Request) => {
    assertEquals(
      req.url,
      "https://deno.land/x/deno_slack_sdk@x.x.x/deps.ts?source,file",
    );
    return new Response(depsTsMock);
  });

  const apiDeps = await apiDepsIn(
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

Deno.test("apiDepsIn should throw http error on response not ok", async () => {
  mockFetch.mock("GET@/x/deno_slack_sdk@x.x.x/deps.ts", () => {
    return new Response("error", { status: 500 });
  });

  await assertRejects(
    async () => {
      return await apiDepsIn(
        "https://deno.land/x/deno_slack_sdk@x.x.x/",
      );
    },
    HttpError,
  );
});
