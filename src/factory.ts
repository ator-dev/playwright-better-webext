import { BrowserType } from "playwright";
import { FirefoxWithExtensions } from "./firefox_browser";
import { ChromiumWithExtensions } from "./chromium_browser";

export const withExtension = (
  browserType: BrowserType,
  extensionsPaths: string | string[],
): BrowserType => {
  switch (browserType.name()) {
    case "firefox":
      return new FirefoxWithExtensions(browserType, extensionsPaths);
    case "chromium":
      return new ChromiumWithExtensions(browserType, extensionsPaths);
  }
  throw new Error(`unsupported browser: ${browserType.name()}`);
};
