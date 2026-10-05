# AscendMM

Professional market-making and strategy vault protocol for the Elysium ecosystem.

This repository contains the **AscendMM frontend**. The product shell (Phase 1)
is now integrated with the **deployed AscendVault on the Kinetiq Elysium
testnet**: wallet connection, live on-chain vault reads, and real approve /
deposit / redeem flows are implemented against chain **99801**. Smart contracts
are developed separately — nothing here modifies or redeploys them.

## Live testnet integration

| Item | Value |
| --- | --- |
| Network | Elysium Testnet (chain ID **99801**) |
| RPC | `https://testnet-rpc.elysium.kinetiq.xyz` |
| Gas token | HYPE |
| Explorer | `https://elysium.kinetiq.xyz/testnet-explorer` |
| AscendVault | [`0xa49Ef74F7de5022340bE2f7DeD7bD2c54b344480`](https://elysium.kinetiq.xyz/testnet-explorer/address/0xa49Ef74F7de5022340bE2f7DeD7bD2c54b344480) |
| Strategy (Idle) | [`0xE6662124835F0927245697459fd90e77ac58329a`](https://elysium.kinetiq.xyz/testnet-explorer/address/0xE6662124835F0927245697459fd90e77ac58329a) — **No yield strategy** |
| Underlying asset | [`0xaeB1Eb6928a1980830eEAE86e70CF751f0D4CEd6`](https://elysium.kinetiq.xyz/testnet-explorer/address/0xaeB1Eb6928a1980830eEAE86e70CF751f0D4CEd6) — **TEST-ONLY MockERC20 “asMMT”** |
| Vault owner | `0x550C5DDab8f8D5b57275db3048d9D327Ea748D1b` |
| **Native HYPE vault** | [`0x8C68b40C6c553b41824F6F8d5E995FCBf809B2e7`](https://elysium.kinetiq.xyz/testnet-explorer/address/0x8C68b40C6c553b41824F6F8d5E995FCBf809B2e7) — native-asset track |
| HypeIdleStrategy | [`0x5bC48661a4CD27FF226295e3D226c11E7C06Ed97`](https://elysium.kinetiq.xyz/testnet-explorer/address/0x5bC48661a4CD27FF226295e3D226c11E7C06Ed97) — **No yield strategy** |
| Native asset sentinel | `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE` (returned by `asset()`; HYPE is never an ERC-20 in this app) |

> ⚠️ **asMMT is a mock asset with no value**, deployed purely to exercise the
> deposit/redeem flows on testnet. The vault is a strategy-enabled ERC-4626
> share vault (share token “asMMV”, 18 decimals) whose `asset()` is the
> TEST-ONLY asMMT token and whose `strategy()` is the deployed IdleStrategy —
> verified on-chain. Idle assets sit in the vault; `strategyInvested()`
> reports what is deployed to the strategy; `idle + deployed = totalAssets`.
> The current IdleStrategy **generates no yield** — no APY or performance
> numbers are shown because none exist on-chain.
>
> The **native HYPE vault** is the second live track: `asset()` returns the
> native sentinel (0xEeee…EEeE), shares use **21 decimals** (virtual offset —
> verified on-chain), `deposit()`/`mint()` are **payable** and carry native
> HYPE as `msg.value`, and `withdraw()`/`redeem()` return HYPE. **No
> `approve()` exists anywhere in the HYPE flow** — the vault is not an
> ERC-20 (transfer/approve revert) and the wallet's native HYPE balance is
> the user's asset balance. Share symbol: “asHYPEV”. The HypeIdleStrategy
> likewise generates no yield.

Implemented against the deployed contracts:

- Central chain config and verified ABIs (`src/lib/elysium.ts`, `src/lib/abis.ts`)
- EIP-6963 / injected wallet connection, reconnection, and disconnect
- Network detection with one-click add/switch to chain 99801
- Live strategy-aware vault reads: `asset`, `totalAssets`, `totalSupply`,
  `strategy`, `strategyInvested`, idle assets (vault's underlying-token
  balance), `owner`, `decimals`, `name`, `symbol`, `convertToAssets` (share
  price and user position value), `convertToShares` (deposit exchange rate),
  `previewDeposit` / `previewRedeem` (live transaction estimates), plus user
  asMMT balance, vault allowance, and share balance — all pinned to chain
  99801 so they never depend on the wallet's active network
- Real ERC-20 `approve` (only when the allowance is insufficient, confirmed
  on-chain before the deposit is broadcast) — ERC-20 track only
- Real ERC-4626 `deposit` and `redeem` (asMMT track) and native payable
  `deposit`/`mint` + `withdraw`/`redeem` (HYPE track, `msg.value` based,
  approval-free)
- Transaction states: wallet confirmation → pending (explorer link) →
  success / failure; reads auto-refresh after every confirmed transaction
- Honest labeling throughout: “Elysium Testnet · chain 99801” and
  “TEST-ONLY asMMT (mock asset, no value)”

Not exposed by the deployed contract (and therefore not invented): the vault's
fee configuration. The ABI was probed via RPC — `fees()`, `fee()`,
`feeConfig()` and `performanceFee()` all revert, so the UI shows “Not
exposed”. The strategy owner operations `investIdle()` / `exitStrategy()`
are deliberately not part of the user-facing ABI and are never presented as
user deposit controls.

## Stack

- Next.js 15 (App Router) + TypeScript
- wagmi v3 + viem (wallet, contract reads/writes, chain 99801 config)
- TanStack Query (react-query cache backing wagmi reads; invalidation on tx)
- Tailwind CSS v4 + shadcn/ui-style primitives on Radix
- Lucide icons, Recharts for performance charts

## Routes

| Route            | Purpose                                                     |
| ---------------- | ----------------------------------------------------------- |
| `/`              | Overview: hero, metrics, capabilities, featured vaults (leads with the live vault) |
| `/vaults`        | Vault explorer with type filters (live vault + preview entries) |
| `/vaults/[id]`   | Vault detail — for the live vault: real chain state panel, approve/deposit/redeem; for preview entries: Phase 1 mock UI |
| `/strategies`    | Strategy marketplace (preview data)                         |
| `/portfolio`     | Live wallet portfolio: asMMT balance, asMMV shares, native HYPE balance, asHYPEV shares |

## Architecture

```
src/
  app/                 routes (compose components only)
  components/          UI — typed props, no direct data fetching
    layout/  vault/  strategy/  portfolio/  wallet/  ui/
  hooks/
    use-vault-contract.ts   live contract + user reads (pinned to 99801)
    use-vault-writes.ts     shared tx state machine (confirm→pending→result)
  lib/
    elysium.ts         ⛓ chain 99801 config + deployed addresses (source of truth)
    abis.ts            verified vault ABI (no invented signatures)
    wagmi.ts           wagmi config (single chain, public RPC, injected connector)
    vaults.ts          vault catalog: live testnet entry + preview entries
    types.ts           domain types the UI renders
    format.ts          number / percentage / token formatters
    mock-data.ts       ⚠️ preview-only data for non-deployed vault entries
```

Boundaries: only pages import the vault catalog; components take typed props.
On-chain data flows through the two hooks; writes go exclusively through
`useVaultTransaction`, which invalidates contract queries on confirmation so
balances and vault state refresh automatically.

**Preview data is isolated in `src/lib/mock-data.ts` and clearly labeled.**
Only the `ascend-asmmt-testnet` (ERC-20 asMMT) and `hype-native-testnet`
(native HYPE) vault entries are live and transactable; every other entry
remains a Phase 1 placeholder and can never call the deployed contracts.

## Deliberately not implemented

Strategy owner operations (`investIdle()` / `exitStrategy()`), real strategy
yield (the current IdleStrategy generates none), HyperCore/Ascend integration,
real analytics/indexing (activity, PnL history), backend auth, database
integration, and any fee display (no fee getter exists on the deployed
contract). Preview vault entries cannot transact.

## Development

```bash
bun install
bun run dev        # dev server
bun run typecheck  # tsc --noEmit
bun run build      # production build
```

To use the live flows you need an EVM browser wallet with Elysium testnet
HYPE for gas and TEST-ONLY asMMT (available from the testnet faucet/owner).
