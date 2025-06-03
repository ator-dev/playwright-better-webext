export class ChromiumOverrides {
  private readonly extensionPaths: string[];

  constructor(extPaths: string[]) {
    this.extensionPaths = extPaths;
  }

  args(args: string[] = []) {
    return [
      ...args,
      `--disable-extensions-except=${this.extensionPaths.join(",")}`,
      `--load-extension=${this.extensionPaths.join(",")}`,
    ];
  }
}
