import { resolve } from "node:path"

import dotenv from "dotenv"

let isLoaded = false

export function ensureMastraEnv() {
  if (isLoaded) {
    return
  }

  dotenv.config({ path: resolve(process.cwd(), ".env.local"), override: true, quiet: true })
  isLoaded = true
}
