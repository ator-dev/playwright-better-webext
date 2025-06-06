import type {
  Browser,
  BrowserContext,
  BrowserType,
  BrowserServer,
  LaunchOptions,
  ConnectOverCDPOptions,
  ConnectOptions,
} from "playwright-core";
import { FirefoxOverrides } from "./firefox_overrides";
import { FirefoxAddonInstaller } from "./firefox_addon_installer";
import { FirefoxExtensionPreferenceRepository } from "./firefox_extension_preferences";
import { findFreeTcpPort } from "./firefox_remote";
import * as fs from "node:fs/promises";
import * as path from "node:path";

type LaunchServerOptions = Parameters<BrowserType["launchServer"]>[0];
type LaunchPersistentContextOptions = Parameters<
  BrowserType["launchPersistentContext"]
>[1];

type PortFn = () => number | Promise<number>;
type Port = number | PortFn;

export class FirefoxWithExtensions implements BrowserType {
  private readonly defaultPort: Port;

  constructor(
    private readonly browserType: BrowserType,
    private readonly addonPaths: string[],
    defaultDebuggingServerPort: number | PortFn = findFreeTcpPort,
  ) {
    if (browserType.name() !== "firefox") {
      throw new Error(`unexpected browser: ${browserType.name()}`);
    }

    this.defaultPort = defaultDebuggingServerPort;
  }

  async connectOverCDP(
    endpointURLOrOptions: string | (ConnectOverCDPOptions & { wsEndpoint?: string }),
    options?: ConnectOverCDPOptions,
  ): Promise<Browser> {
    if (typeof endpointURLOrOptions === "string") {
      return this.browserType.connectOverCDP(endpointURLOrOptions, options);
    } else {
      return this.browserType.connectOverCDP(endpointURLOrOptions);
    }
  }

  async connect(
    wsEndpointOrOptions: string | (ConnectOptions & { wsEndpoint?: string }),
    options?: ConnectOptions,
  ): Promise<Browser> {
    if (typeof wsEndpointOrOptions === "string") {
      return this.browserType.connect(wsEndpointOrOptions, options);
    } else {
      return this.browserType.connect(wsEndpointOrOptions);
    }
  }

  executablePath(): string {
    return this.browserType.executablePath();
  }

  async launch(options: LaunchOptions = {}): Promise<Browser> {
    const overrides = new FirefoxOverrides(await this.getDefaultPort());
    const { args, port } = overrides.debuggingServerPortArgs(options.args);
    const firefoxUserPrefs = overrides.userPrefs(options.firefoxUserPrefs);
    const browser = await this.browserType.launch({
      ...options,
      args,
      firefoxUserPrefs,
    });
    await this.installAddons(port);
    return browser;
  }

  async launchPersistentContext(
    userDataDir: string,
    options: LaunchPersistentContextOptions = {},
  ): Promise<BrowserContext> {
    const overrides = new FirefoxOverrides(await this.getDefaultPort());
    const { args, port } = overrides.debuggingServerPortArgs(options.args);
    const firefoxUserPrefs = overrides.userPrefs(options.firefoxUserPrefs);

    // patch extension preferences before launch
    await this.overridePermissions(userDataDir);

    const browser = await this.browserType.launchPersistentContext(userDataDir, {
      ...options,
      args,
      firefoxUserPrefs,
    });
    await this.installAddons(port);
    return browser;
  }

  async launchServer(options: LaunchServerOptions = {}): Promise<BrowserServer> {
    const overrides = new FirefoxOverrides(await this.getDefaultPort());
    const { args, port } = overrides.debuggingServerPortArgs(options.args);
    const firefoxUserPrefs = overrides.userPrefs(options.firefoxUserPrefs);
    const browserServer = await this.browserType.launchServer({
      ...options,
      args,
      firefoxUserPrefs,
    });
    await this.installAddons(port);
    return browserServer;
  }

  name(): string {
    return this.browserType.name();
  }

  async installAddons(debuggingServerPort: number): Promise<void> {
    const installer = new FirefoxAddonInstaller(debuggingServerPort);
    await Promise.all(
      this.addonPaths.map(async (path) => {
        await installer.install(path);
      }),
    );
  }

  async overridePermissions(userDataDir: string): Promise<void> {
    const repo = new FirefoxExtensionPreferenceRepository(userDataDir);
    for (const addonPath of this.addonPaths) {
      const manifest = JSON.parse(
        await fs.readFile(path.join(addonPath, "manifest.json"), "utf-8"),
      );
      if (manifest.manifest_version !== 3) {
        continue;
      }
      if (
        (!(manifest.content_scripts instanceof Array) ||
          manifest.content_scripts.length === 0) &&
        !(manifest.optional_permissions instanceof Array) &&
        manifest.optional_permissions.length === 0
      ) {
        continue;
      }

      const addonId = manifest.browser_specific_settings?.gecko?.id;
      if (!addonId) {
        console.warn(
          `Addon ${addonPath} does not have browser_specific_settings.gecko.id, it will not be able to override permissions.`,
        );
        continue;
      }
      await repo.patch((prefs) => {
        for (const contentScript of manifest.content_scripts) {
          const matches = contentScript.matches;
          if (!(matches instanceof Array) || matches.length === 0) {
            continue;
          }
          prefs.addOrigins(addonId, contentScript.matches);
          if (matches.includes("<all_urls>")) {
            prefs.addPermissions(addonId, ["<all_urls>"]);
          }
        }

        prefs.addOrigins(addonId, manifest.content_scripts[0].matches);
        if (manifest.optional_permissions) {
          prefs.addPermissions(addonId, manifest.optional_permissions);
        }
      });
    }
  }

  private async getDefaultPort(): Promise<number> {
    if (typeof this.defaultPort === "function") {
      return await this.defaultPort();
    }
    return this.defaultPort;
  }
}
