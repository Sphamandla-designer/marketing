import { Config } from "@remotion/cli/config";
import { existsSync, readdirSync } from "node:fs";

// Use a browser that is already on the machine when there is one, so a render
// never depends on downloading Chrome. Override with REMOTION_BROWSER.
const findBrowser = (): string | null => {
  if (process.env.REMOTION_BROWSER) return process.env.REMOTION_BROWSER;
  const root = "/opt/pw-browsers";
  if (!existsSync(root)) return null;
  for (const dir of readdirSync(root).filter((d) => d.startsWith("chromium_headless_shell-")).sort().reverse()) {
    const bin = `${root}/${dir}/chrome-headless-shell-linux64/chrome-headless-shell`;
    if (existsSync(bin)) return bin;
  }
  return null;
};

const browser = findBrowser();
if (browser) Config.setBrowserExecutable(browser);
Config.setVideoImageFormat("png"); // lossless frames into the encoder: product screens stay crisp
Config.setOverwriteOutput(true);
