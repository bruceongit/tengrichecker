---
title: "Were these “large amounts” of RON?"
claim: "The transfers into the compromised wallet in 2026 were large amounts."
quote: "08.04.2026, 21:25:40 UTC: +1,466.880096 $RON. 14.05.2026, 16:43:51 UTC: +26,192.53841 $RON"
rating: misleading
case: jihoz-wallet
reviewed: "2026-11-03"
order: 3
featured: true
summary: "Misleading. Together they were worth about $2,870 when received, against a reported $9.7M theft. The larger one is exactly 10% of the pool's closing payment, and the wallet put up exactly 10% of the pool's 250,000 RON stake in 2023."
sources:
  - { label: "25,000 RON into the Safe, Apr 10, 2023", url: "https://app.roninchain.com/tx/0x4dcb995aa4b490e60bfaf0354a8bd4832c6e7464e3253f43b614af625dcc4c2d" }
  - { label: "Safe stakes 250,000 RON, Apr 10, 2023", url: "https://app.roninchain.com/tx/0x530f91e6754a4bf471e447d7b238cc67d4cb7da247157cf23e73e88048769b5e" }
  - { label: "Safe begins leaving, May 1, 2026", url: "https://app.roninchain.com/tx/0x21e81d661edd4b60ddc668758aef5f766bd3a40b830df11a638c28d61dacb78a" }
  - { label: "Closing payment, May 14, 2026", url: "https://app.roninchain.com/tx/0x18ab89f2a9a41931ca35258f41f1c2fa4030218a896d0b02a16dd7d055702a91" }
  - { label: "RON price on May 14, 2026 (DefiLlama)", url: "https://coins.llama.fi/prices/historical/1778769831/coingecko:ronin" }
  - { label: "Jihoz: “could be a refund for something”", url: "https://x.com/Jihoz_Axie/status/2117215666612916449" }
---

## In dollars

| Payment | RON | RON price that day | Value |
|---|---:|---:|---:|
| Apr 8, 2026 | 1,466.88 | $0.0886 | about $130 |
| May 14, 2026 | 26,192.54 | $0.1047 | about $2,743 |

Tengri's own screenshot values the wallet's entire RON balance, 51,578.89 RON, at $2.58K.

## Why one payment is so much larger

The large payment looks like the return of a stake. Here is the sequence:

1. **April 8–10, 2023:** at least 16 wallets paid RON into the Safe. `0xa09a9b6f…` paid **25,000**.
2. **April 10, 2023:** the Safe staked **250,000 RON** to become a validator. The wallet's deposit was exactly 10% of that.
3. **May 1, 2026:** the Safe called `requestRenounce` on the staking contract.
4. **May 9, 2026:** about 253,764 RON came back into the Safe.
5. **May 14, 2026:** the Safe paid out its whole balance of 261,925.38 RON. The wallet got **26,192.54**, exactly **10.000%**.

Every share in that last payment is a whole multiple of 1,000 RON out of 250,000, and the 13 shares add up to exactly 250,000. That is what a pool returning its stake looks like. The earlier payments were rewards, and this wallet's share of them after the hack ranged from 7.2% to 11.7%.

## Limits of this ruling

The 10% match is what the transactions show. We have not seen a statement from the pool's operators saying this is what the payment was. Jihoz wrote that it "could be a refund for something", so this is not an explanation Jihoz gave. We matched this wallet's deposit to its share, but not every other member's, since some shares may have changed hands.

Prices are daily figures from DefiLlama's CoinGecko feed.
