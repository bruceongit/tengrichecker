---
title: "Did the wallet receive those two RON payments?"
claim: "The compromised wallet received +1,466.880096 RON on April 8, 2026 and +26,192.53841 RON on May 14, 2026."
quote: "Look at these transactions to his \"compromised\" address"
rating: "true"
case: jihoz-wallet
reviewed: "2026-11-03"
order: 6
summary: "Right. Both amounts and dates are correct. The times are two hours off UTC, and the post gives the same hash for both transactions."
sources:
  - { label: "Apr 8, 2026 payout", url: "https://app.roninchain.com/tx/0xcd7677270d0ade44ec205aa8ded3d8c5058f09766536a0be96053a10c37e1e1f" }
  - { label: "May 14, 2026 payout", url: "https://app.roninchain.com/tx/0x18ab89f2a9a41931ca35258f41f1c2fa4030218a896d0b02a16dd7d055702a91" }
---

## What we found

| Date | Time (UTC) | RON | Balance after | Block |
|---|---|---:|---:|---:|
| Apr 8, 2026 | 19:25:40 | +1,466.880096 | 25,386.35 | 54,603,576 |
| May 14, 2026 | 14:43:51 | +26,192.53841 | 51,578.89 | 55,650,522 |

These were not the only ones. The wallet received five validator payouts in 2026, totalling 30,320.96 RON. Nothing has arrived since May 14, 2026.

## Small errors

- **Times:** the post labels them UTC, but they are two hours later than UTC. They match the explorer display in Tengri's screenshot, which appears to be set to Central European Summer Time.
- **Hashes:** "tx 1" and "tx 2" in the post are the same hash, `0xcd767727…`. That is the April payment. The May payment is `0x18ab89f2…`.

Neither error changes the finding. The payments happened.
