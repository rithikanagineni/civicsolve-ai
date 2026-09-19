import "dotenv/config";
import { runSeed } from "@/server/seed/seedData";
import { pool } from "@/db";

async function main() {
  const force = process.argv.includes("--force");
  const result = await runSeed(force);
  console.log("[CivicSolve seed]", result);
  await pool.end();
}

main().catch((error) => {
  console.error("[CivicSolve seed] failed:", error);
  process.exit(1);
});
