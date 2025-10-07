#!/usr/bin/env node
import { Command } from "commander";
import { generate } from "./index.js";

const program = new Command();
program
  .name("n3-typegen")
  .description("Generate typed NEO N3 contract bindings")
  .option("--manifest <path>")
  .option("--node <url>", "RPC node URL to fetch manifest from")
  .option("--out <dir>", "output directory", "src/contracts")
  .option("--name <contractName>", "override contract name from manifest")
  .option("--hash <scriptHash>", "contract scripthash to include in header")
  .option(
    "--embed-hash",
    "embed contract hash into client class (static)",
    false
  )
  .option(
    "--impl",
    "also generate implementation class using a generic invoker",
    false
  )
  .action(async (opts) => {
    if (!opts.manifest && !opts.node) {
      throw new Error("Provide either --manifest <path> or --node <url>");
    }
    if (opts.node && !opts.hash) {
      throw new Error("--node requires --hash to locate the contract");
    }
    await generate(opts);
  });

program.parse();
