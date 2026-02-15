import { spawn } from "node:child_process"
import { resolve } from "node:path"
import dotenv from "dotenv"

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error("Usage: node scripts/run-with-env-local.mjs <command> [...args]")
  process.exit(1)
}

dotenv.config({ path: resolve(process.cwd(), ".env.local"), override: true, quiet: true })

const [command, ...commandArgs] = args
const child = spawn(command, commandArgs, {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
})

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 1)
})

child.on("error", (error) => {
  console.error(error)
  process.exit(1)
})
