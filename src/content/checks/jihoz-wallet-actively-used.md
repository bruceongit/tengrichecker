---
title: "Was the hacked wallet still being used in 2025 and 2026?"
claim: "The wallet was actively used after the hack. Phishing coins were sent out of it, and someone logged in two years later to clean it up."
quote: "It wasn't just RON tokens being moved the wallet was actively used. For example, phishing coins were sent out of the wallet. On-chain, that’s standard wallet maintenance. What kind of burglar steals $10M in a break-in, comes back 2 years later, logs in, and cleans up the wallet?"
quoteUrl: "https://x.com/TengriTheTruth/status/2116827922145169562"
rating: "false"
case: jihoz-wallet
reviewed: "2026-11-03"
order: 2
featured: true
summary: "Wrong. The wallet's last signed transaction was on April 7, 2024, and its transaction count has stayed at 4,045 since. The later entries Tengri points to were sent by other wallets, in bulk, across many holders at once."
sources:
  - { label: "Last signed transaction, Apr 7, 2024", url: "https://app.roninchain.com/tx/0xec4c0a13d0c7fa762fc64cf6c8c45252b5df16c599994686ad914974b5d47946" }
  - { label: "Aug 24, 2026 cUSDC batch", url: "https://app.roninchain.com/tx/0x13e99c31b90b9470a6c05aef7270e3f5e3e5dba1cb6b3aa4b8a779266a5fb847" }
  - { label: "Aug 24, 2026 cWETH batch", url: "https://app.roninchain.com/tx/0x4b78af590ade1d3b2f5fa0a717089f4a0ca08e6a6c6bc861315d0596300badb5" }
  - { label: "May 28, 2025 spam-token burn", url: "https://app.roninchain.com/tx/0x0fd95a7d8d5cfb585d33d0ec500362bf5bde4995afb2db46d42844faeb9ec7a8" }
  - { label: "May 29, 2025 spam-token burn", url: "https://app.roninchain.com/tx/0xf1cac349210c7c2ac77311e7b7a232afb57874cef33c6fbb837cb9fceaf23cab" }
  - { label: "May 31, 2025 spam-token burn", url: "https://app.roninchain.com/tx/0x5fd2b94922c9f68c5baf73905a14bdb56b6e0ae35126a070b2dd060e4d7229c6" }
  - { label: "Jihoz: one transaction was “from compound”", url: "https://x.com/Jihoz_Axie/status/2117215666612916449" }
  - { label: "The hacked wallet, 0xa09a9b6f…", url: "https://app.roninchain.com/address/0xa09a9b6f90ab23fcdcd6c3d087c1dfb65dddfb05" }
---

## The test anyone can run

A wallet's transaction count, its nonce, goes up by one each time its key signs a transaction. Nobody else can raise it.

| Date | Transaction count |
|---|---:|
| Feb 22, 2024, just before the drain | 3,974 |
| Apr 8, 2024 | 4,045 |
| Jan 1, 2025 | 4,045 |
| Jan 1, 2026 | 4,045 |
| Nov 3, 2026 | 4,045 |

The last signed transaction is number 4,044, on April 7, 2024. Nothing has been signed from this wallet since. Nobody "logged in" two years later.

## What Tengri is looking at

An explorer lists a token movement as "from" a wallet even when that wallet signed nothing. Only five such entries appear after April 7, 2024:

| Date | Entry | Actually sent by | What happened |
|---|---|---|---|
| May 28, 2025 | 3,000 fake "RON Airdrop" | `0x8100…` | The spam token's own `burn` call, covering 1,000 wallets in one transaction |
| May 29, 2025 | 3,000 fake "RON Airdrop" | `0x2475…` | Same, 1,000 wallets |
| May 31, 2025 | 3,000 fake "RON Airdrop" | `0x6391…` | Same, 1,000 wallets |
| Aug 24, 2026 | 16.0 cUSDC | `0x7d6e…` | Batch of 5 holders listed in address order. The wallet got back $0.29 in USDC |
| Aug 24, 2026 | Dust cWETH | `0x7d6e…` | Batch of 5 holders listed in address order |

`0x7d6e22db…` sent about 90 other transactions between those two batches, in about 11 minutes. The two Aug 24 entries are the ones circled in Tengri's screenshot. Jihoz has said one of the transactions was "from compound". We found the batch pattern, but we have not identified who operates that wallet.

Since April 8, 2024, the wallet's RON balance has changed 38 times. Every change was an increase, and no RON has left it. Tengri's follow-up description, ["transactions approved by the wallet"](https://x.com/TengriTheTruth/status/2116885993286467757), is also wrong.

## An awkward fact we are not hiding

The key **did** sign after the theft began. Between the start of the drain on February 22, 2024 and April 7, 2024, it signed 71 transactions. The first ones belong to the attacker's drain. After that, a rescue moved the remaining assets, including NFTs, to `0x2d62c27c…`, a wallet that had dealt with this one before the hack. The last signed transaction went there.

So the wallet was used for about six weeks after the theft, and the chain does not show who signed the rescue. Tengri's claim is about later years, though, and for those years the record is clear.
