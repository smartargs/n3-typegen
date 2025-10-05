## n3-typegen

Generate TypeScript contract types and optional client implementations for NEO N3 from a contract manifest.

### Install

```bash
npm i -D @smartargs/n3-typegen
```

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

Each file contains a header with contract info and a generation timestamp.

### Generated Types

The `.d.ts` file declares a namespace `ExampleContract` with one function per ABI method. Duplicate ABI method names (overloads) are emitted as multiple function signatures.

Special handling:

- `_initialize` is omitted
- ABI `safe: true` methods are considered read-only and will use `invokeRead` in the client

### Generated Client

With `--impl`, a `ExampleContractClient` class is emitted. The class requires an `N3Invoker` implementation:

```ts
export interface N3Invoker {
  invokeFunction<T>(
    contractHash: string,
    method: string,
    args: unknown[]
  ): Promise<T>;
  invokeRead<T>(
    contractHash: string,
    method: string,
    args: unknown[]
  ): Promise<T>;
}
```

- Methods are generated with overload signatures and a single implementation using rest parameters.
- If all overloads are `safe`, the implementation uses `invokeRead`, else `invokeFunction`.

### Angular / NeoLine Integration

You can implement `N3Invoker` using your NeoLine Angular wrapper and pass it to the generated client.

```ts
// neoline-invoker.ts
import { sc } from "@cityofzion/neon-js";
import type { N3Invoker } from "./contracts/ExampleContractClient";

export class NeolineInvoker implements N3Invoker {
  constructor(private readonly neolineN3: any) {}

  private toParams(args: unknown[]) {
    return args.map((v) => sc.ContractParam.any(v));
  }

  async invokeRead<T>(
    contractHash: string,
    method: string,
    args: unknown[]
  ): Promise<T> {
    const res = await this.neolineN3.invokeRead({
      scriptHash: contractHash,
      operation: method,
      args: this.toParams(args),
    });
    return (res?.stack?.[0]?.value ?? res) as T;
  }

  async invokeFunction<T>(
    contractHash: string,
    method: string,
    args: unknown[]
  ): Promise<T> {
    const res = await this.neolineN3.invoke({
      scriptHash: contractHash,
      operation: method,
      args: this.toParams(args),
    });
    return res as T;
  }
}
```

Usage in an Angular service:

```ts
import { ExampleContractClient } from "./contracts/ExampleContractClient";
import { NeolineInvoker } from "./neoline-invoker";

export class SomeService {
  private readonly client: ExampleContractClient;

  constructor(neolineService: YourAngularNeolineService) {
    const invoker = new NeolineInvoker(neolineService.n3);
    this.client = new ExampleContractClient(invoker); // or pass contract hash if not using --hash
  }
}
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
