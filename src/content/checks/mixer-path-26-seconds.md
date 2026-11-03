---
title: "Was fleet funding routed through a mixer in “26 seconds”?"
claim: "A 15,000 USDC deposit into Privacy Cash funded seven fleet wallets through fresh wallets and Relay, with one path taking 26 seconds end to end."
quote: "One wallet's path, 26 seconds end to end on Aug 13"
rating: mostly-true
followUp: true
order: 9
summary: "His timing is wrong: 2 minutes 26 seconds, not 26 seconds. The transfers are real, but the step across the mixer is inferred from the times and amounts. It is not a visible transfer linking the two wallets."
sources:
  - { label: "Deposit into Privacy Cash (Solana)", url: "https://solscan.io/tx/5qsz9ucQWApV8H4dtGqeDQMn5sAR33p8Z1YhWJX2gximfbrsQ4d2dUQtC5HrCPCioErz27K9bPEPKtRPh69bj9E9" }
  - { label: "Mixer withdrawal (Solana)", url: "https://solscan.io/tx/5cBfyBxWA3b4YWxUJj9arqsw4rFJS6m7PGEA13ENqPoA47XyVym9EgE7jKo46oitKVzFK93C5qrpHvt5iHuVsvmG" }
  - { label: "Bridge through Relay (Solana)", url: "https://solscan.io/tx/3caiSAAvovosnKfYD6iULVkptMV94ZfFQv3ThN8ngqi9CYHfWnhdzHearQGDTzXmkESmiYRnXyLp1bCtbZ1Rv58V" }
  - { label: "Relay delivery to 0x585a", url: "https://robinhoodchain.blockscout.com/tx/0x07ac078cf328078807280067cda6a5e7a2eeb40e8a05ecf3a6e2dd73df8087fd" }
---

## What we confirmed

| Time (UTC, Aug 13) | Step | Result |
|---|---|---|
| 14:52:39 | `D3rUoXzW…` deposits into Privacy Cash | 15,000 USDC, confirmed |
| 14:55:01 | Mixer pays a fresh wallet | 2,000 USDC out, 1,992.54 received |
| 14:55:03 | Fresh wallet bridges through Relay | 1,992.54 USDC, confirmed |
| 14:55:05 | Relay delivers to `0x585a…` | 1.0492 ETH, confirmed |

Five other deliveries the thread cites are also real. [c4c0](https://robinhoodchain.blockscout.com/tx/0xbee1aded107eef692da388be766d0cf010225f83515c424b8545e9d8af551a82), [1e2d](https://robinhoodchain.blockscout.com/tx/0xa1a63798f5b59bbf43a5d9fc6c79b9a794ceff9c063b85d6f8f2ab181ed9a3b2), [977f](https://robinhoodchain.blockscout.com/tx/0xa6447639fa8cff07f21a379ea8edc5e5e14086281927cdc3fa68c96097c6ab84), [deda](https://robinhoodchain.blockscout.com/tx/0xf5b2cf5bf0bc577f506c4e52ccf5da2c0d0f8afa2e5eab407c48dd835a52f010) and [8f28](https://robinhoodchain.blockscout.com/tx/0x0d28754912b08f03a3fb2e6a3dd27785dc86aaca89293d774ea59ad0bcbbfa70) all landed between 14:53:35 and 14:54:49, each from the same Relay solver, each for about 1.05 to 1.17 ETH.

The thread cites six deliveries by link, including `0x585a…`. We did not trace a seventh.

## What's wrong

His timing is wrong. From 14:52:39 to 14:55:05 is **2 minutes 26 seconds**, not 26 seconds. The transfers themselves are still real.

## What's inferred

A mixer breaks the on-chain link between deposit and withdrawal by design. The connection rests on timing and amounts, not on a transaction. It's a reasonable inference here, but it remains an inference, and "to hide their identities" is a claim about motive.
