import type {
  Browser,
  BrowserContext,
  BrowserType,
  BrowserServer,
  LaunchOptions,
  ConnectOverCDPOptions,
  ConnectOptions,
} from "playwright-core";
import { ChromiumOverrides } from "./chromium_overrides";

type LaunchServerOptions = Parameters<BrowserType["launchServer"]>[0];
type LaunchPersistentContextOptions = Parameters<
  BrowserType["launchPersistentContext"]
>[1];

export class ChromiumWithExtensions implements BrowserType {
  private readonly overrides: ChromiumOverrides;

  constructor(
    private readonly browserType: BrowserType,
    extPaths: string | string[],
  ) {
    if (browserType.name() !== "chromium") {
      throw new Error(`unexpected browser: ${browserType.name()}`);
    }

    this.overrides = new ChromiumOverrides(extPaths);
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
    const args = this.overrides.args(options.args);
    return this.browserType.launch({ ...options, args });
  }

  async launchPersistentContext(
    userDataDir: string,
    options: LaunchPersistentContextOptions = {},
  ): Promise<BrowserContext> {
    return this.browserType.launchPersistentContext(userDataDir, {
      ...options,
      args: this.overrides.args(options.args),
    });
  }

  async launchServer(options: LaunchServerOptions = {}): Promise<BrowserServer> {
    return this.browserType.launchServer({
      ...options,
      args: this.overrides.args(options.args),
    });
  }

  name(): string {
    return this.browserType.name();
  }
}
