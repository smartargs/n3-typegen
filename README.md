## n3-typegen

Generate TypeScript contract types and optional client implementations for NEO N3 from a contract manifest.

![npm version](https://img.shields.io/npm/v/%40smartargs%2Fn3-typegen)
![license](https://img.shields.io/badge/license-MIT-blue.svg)
![node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)

### Install

```bash
npm i -D @smartargs/n3-typegen
```

### Requirements

- Node.js >= 18
- To use generated clients at runtime, you need an invoker implementation (e.g., a wallet SDK like NeoLine or an RPC client). The examples below use `@cityofzion/neon-js` to build params, but you can replace it with your own encoder.

### CLI

```bash
npx @smartargs/n3-typegen --manifest <path> [--out <dir>] [--name <contract>] [--hash <scriptHash>] [--impl]
```

- **--manifest <path>**: Path to N3 contract manifest JSON (required)
- **--out <dir>**: Output directory (default: `src/contracts`)
- **--name <contract>**: Override contract name (affects file/namespace/class)
- **--hash <scriptHash>**: Embed contract scripthash in generated header and client
- **--impl**: Also emit a concrete client class using an `N3Invoker` interface

Outputs:

- `<Name>.d.ts`: ambient namespace with method signatures
- `<Name>Client.ts` (with `--impl`): client class that calls an `N3Invoker`

Example:

```bash
# Interface only
npx @smartargs/n3-typegen --manifest sample/manifest.json --out sample/out --name ExampleContract --hash 0x1234

# Interface + implementation client
npx @smartargs/n3-typegen --manifest sample/manifest.json --out sample/out --name ExampleContract --hash 0x1234 --impl
```

### Generated Types

The `.d.ts` file exports an `ExampleContractAPI` interface with one method per ABI function. Duplicate ABI method names (overloads) are emitted as multiple function signatures.

Special handling:

- ABI `safe: true` methods are considered read-only and will use `invokeRead` in the client

### Generated Client

With `--impl`, a `ExampleContractClient` class is emitted. The class requires an `N3Invoker` implementation:

```ts
export interface N3Invoker {
  invoke<T>(contractHash: string, method: string, args: unknown[]): Promise<T>;
  invokeRead<T>(
    contractHash: string,
    method: string,
    args: unknown[]
  ): Promise<T>;
}
```

- Methods are generated with overload signatures and a single implementation using rest parameters.
- If all overloads are `safe`, the implementation uses `invokeRead`, else `invoke`.

### Implementing an N3Invoker (NeoLine, Neon-JS, or custom)

Implement `N3Invoker` using your preferred stack (Angular, React, Node.js, etc.). The invoker simply needs to expose `invoke` for state-changing calls and `invokeRead` for read-only calls.

```ts
// wallet-invoker.ts
import { sc } from "@cityofzion/neon-js"; // optional; use your own encoder if preferred
import type { N3Invoker } from "./contracts/ExampleContractClient";

export class WalletInvoker implements N3Invoker {
  constructor(
    private readonly provider: { invoke: Function; invokeRead: Function }
  ) {}

  private toParams(args: unknown[]) {
    return args.map((v) => sc.ContractParam.any(v));
  }

  async invokeRead<T>(
    contractHash: string,
    method: string,
    args: unknown[]
  ): Promise<T> {
    const res = await this.provider.invokeRead({
      scriptHash: contractHash,
      operation: method,
      args: this.toParams(args),
    });
    return (res?.stack?.[0]?.value ?? res) as T;
  }

  async invoke<T>(
    contractHash: string,
    method: string,
    args: unknown[]
  ): Promise<T> {
    const res = await this.provider.invoke({
      scriptHash: contractHash,
      operation: method,
      args: this.toParams(args),
    });
    return res as T;
  }
}
```

Usage:

```ts
import { ExampleContractClient } from "./contracts/ExampleContractClient";
import { WalletInvoker } from "./wallet-invoker";

const invoker = new WalletInvoker(neoline.n3); // or any provider exposing invoke/invokeRead
const client = new ExampleContractClient(invoker); // or pass contract hash if not using --hash
```

### Programmatic API

```ts
import { generate } from "@smartargs/n3-typegen";

await generate({
  manifest: "path/to/manifest.json",
  out: "src/contracts",
  name: "ExampleContract",
  hash: "0x1234",
  impl: true,
});
```
