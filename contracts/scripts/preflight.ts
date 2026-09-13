import { runSepoliaPreflight } from "./lib/network";

async function main() {
  await runSepoliaPreflight();
}

main().catch((error) => {
  console.error("Sepolia preflight failed:", error);
  process.exitCode = 1;
});
