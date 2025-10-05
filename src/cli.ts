#!/usr/bin/env node
import { Command } from "commander";
import { generate } from "./index.js";

const program = new Command();
program
  .name("n3-typegen")
  .description("Generate typed NEO N3 contract bindings")
  .requiredOption("--manifest <path>")
  .option("--out <dir>", "output directory", "src/contracts")
  .option("--name <contractName>", "override contract name from manifest")
  .option("--hash <scriptHash>", "contract scripthash to include in header")
  .option(
    "--impl",
    "also generate implementation class using a generic invoker",
    false
  )
  .action(async (opts) => {
    await generate(opts);
  });

program.parse();
