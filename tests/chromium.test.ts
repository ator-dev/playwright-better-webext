import { chromium } from "playwright";
import { test, expect } from "@playwright/test";
import * as path from "node:path";
import { withExtension } from "../src";

test("chromium installs extensions with custom browser type", async () => {
  const browserTypeWithExtension = withExtension(chromium, [
    path.join(__dirname, "deadbeef-extension"),
    path.join(__dirname, "magic-number-extension"),
  ]);
  const browser = await browserTypeWithExtension.launchPersistentContext("", {
    // Note: "chromium" channel is required to prevent displaying windows ('new headless mode')
    channel: "chromium",
    headless: true,
  });

  const page = await browser.newPage();
  await page.goto("https://example.com/");

  const magicNumber = await page.locator("#magic-number");
  expect(await magicNumber.textContent()).toBe("42");

  const deadbeef = await page.locator("#deadbeef-container");
  expect(await deadbeef.textContent()).toBe("0xDEADBEEF");
});
