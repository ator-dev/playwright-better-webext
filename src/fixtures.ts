import { withExtension } from "./factory";
import { test as base, expect } from "@playwright/test";

export const createFixture = (extensionPaths: string | string[]) => {
  const test = base.extend<Record<never, never>>({
    browser: [async ({ playwright, browserName }, use) => {
      await use(
        await withExtension(playwright[browserName], extensionPaths).launch(),
      );
    }, { scope: "worker", timeout: 0 }],

    context: [async ({ context, playwright, browserName }, use) => {
      if (browserName === "chromium") {
        const browserType = withExtension(playwright[browserName], extensionPaths);
        const newContext = await browserType.launchPersistentContext("", {
          // Note: "chromium" channel is required to prevent displaying windows ('new headless mode')
          channel: "chromium",
          headless: true,
        });
        await use(newContext);
        await context.close();
      } else {
        await use(context);
        await context.close();
      }
    }, { scope: "test" }],
  });

  return { test, expect };
};
