import { spawn } from "node:child_process";

export function spawnCommand(
  command,
  args,
  { cwd, env, stdio = "inherit", detached = false },
) {
  return spawn(command, args, {
    cwd,
    detached,
    env,
    stdio,
  });
}

export function runCommand(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawnCommand(command, args, options);

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve({ code: 0, signal: null });
        return;
      }

      reject(new Error(`${command} exited with ${code ?? signal}`));
    });
  });
}

export function captureCommand(command, args, { cwd, env }) {
  return new Promise((resolve) => {
    const child = spawnCommand(command, args, {
      cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      resolve({ code: 1, stdout, stderr: error.message });
    });
    child.on("exit", (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}
