import { BrowserType } from "playwright";
import { FirefoxWithExtensions } from "./firefox_browser";
import { ChromiumWithExtensions } from "./chromium_browser";

export const withExtension = (
  browserType: BrowserType,
  extensionPaths: string | string[],
): BrowserType => {
  const _extensionPaths = typeof extensionPaths === "string" ? [ extensionPaths ] : extensionPaths;
  switch (browserType.name()) {
    case "firefox":
      return new FirefoxWithExtensions(browserType, _extensionPaths);
    case "chromium":
      return new ChromiumWithExtensions(browserType, _extensionPaths);
  }
  throw new Error(`unsupported browser: ${browserType.name()}`);
};
