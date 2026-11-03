---
title: "Was Jihoz the one sending RON to the hacked wallet?"
claim: "Jihoz personally is still transferring large amounts of RON in 2026 to the wallet Jihoz says was compromised."
quote: "why is he still transferring large amounts of $RON in 2026 to that exact same compromised wallet"
rating: "false"
case: jihoz-wallet
reviewed: "2026-11-03"
order: 1
featured: true
summary: "Wrong. Both payments came from a validator pool's multisig, in transactions sent by 0xdf846e5d…. The hacked wallet paid into that pool in 2023, but it is not one of the multisig's owners, and it did not sign either transaction."
sources:
  - { label: "Apr 8, 2026 payout", url: "https://app.roninchain.com/tx/0xcd7677270d0ade44ec205aa8ded3d8c5058f09766536a0be96053a10c37e1e1f" }
  - { label: "May 14, 2026 payout", url: "https://app.roninchain.com/tx/0x18ab89f2a9a41931ca35258f41f1c2fa4030218a896d0b02a16dd7d055702a91" }
  - { label: "Validator Safe 0xa27a1095…", url: "https://app.roninchain.com/address/0xa27a1095015dc037c92403f4b26196b04f342961" }
  - { label: "Disperse contract 0x5d518933…", url: "https://app.roninchain.com/address/0x5d518933351a0bc14b24b329b33b813565608769" }
  - { label: "The hacked wallet, 0xa09a9b6f…", url: "https://app.roninchain.com/address/0xa09a9b6f90ab23fcdcd6c3d087c1dfb65dddfb05" }
---

## What we found

Neither transaction came from the hacked wallet. Tengri's own screenshot shows the sender as `0x5d51…8769`, a contract that splits one payment across a list of wallets. The transactions show who called it:

| | Apr 8, 2026 | May 14, 2026 |
|---|---:|---:|
| Transaction sent by | `0xdf846e5d…` | `0xdf846e5d…` |
| Through | Safe `0xa27a1095…` | Safe `0xa27a1095…` |
| Total paid out | 17,569.84 RON | 261,925.38 RON |
| Wallets paid | 13 | 13 |
| Share to `0xa09a9b6f…` | 1,466.88 RON | 26,192.54 RON |

The Safe needs two of its three owners to sign. Those owners are `0xdf846e5d…`, `0xb136cb12…` and `0x816a0cb9…`. `0xa09a9b6f…` is not one of them.

The Safe registered as a Ronin validator on April 10, 2023, with a 250,000 RON stake. It then claimed rewards and paid them out to its members.

## The link Tengri could have pointed to

The hacked wallet was a member of this pool. It paid **25,000 RON** into the Safe on [April 10, 2023](https://app.roninchain.com/tx/0x4dcb995aa4b490e60bfaf0354a8bd4832c6e7464e3253f43b614af625dcc4c2d), ten months before the hack. That is why it was on the list. See [the claim about the amounts](#claim-jihoz-large-amounts).

## Limits of this ruling

We checked the token and direct RON transfer records of the two hacked wallets, as of October 31, 2026, against the three owners. We found no transfers between them. That test does not cover every wallet Jihoz may use, and it does not show who controls the three owner wallets.
