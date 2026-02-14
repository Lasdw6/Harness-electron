import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { protocolVersion } from "../contracts/types.js";
import { HarnessCliError } from "../errors.js";

type PackageInfo = {
  name?: string;
  version?: string;
  description?: string;
};

export async function versionCommand() {
  const packageJson = await readPackageInfo();
  return {
    package: packageJson.name ?? "@harnessgg/electron",
    version: packageJson.version ?? "unknown",
    description: packageJson.description ?? "",
    protocolVersion
  };
}

async function readPackageInfo(): Promise<PackageInfo> {
  const modulePath = fileURLToPath(import.meta.url);
  const packagePath = path.resolve(path.dirname(modulePath), "../../package.json");

  try {
    const raw = await readFile(packagePath, "utf8");
    return JSON.parse(raw) as PackageInfo;
  } catch (error) {
    throw new HarnessCliError(
      "INTERNAL_ERROR",
      `Failed to read package metadata from ${packagePath}`,
      false,
      ["harness-electron capabilities"],
      {
        cause: error instanceof Error ? error.message : String(error),
        packagePath
      }
    );
  }
}
