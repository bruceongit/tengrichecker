---
title: "Is the $SCHIFFY team behind the 16-wallet “fleet”?"
claim: "Implied by the thread: the people who launched $SCHIFFY secretly funded a fleet of wallets through a mixer, bought their own launch, and sold on the community."
quote: "Imagine they fund 3 wallets through a privacy mixer on Solana to hide their identities."
rating: team-denial
order: 1
featured: true
summary: "False. We have no connection to this fleet. We do not own, fund or control these wallets. Tengri has not established any direct or indirect link showing that we own, fund or control this fleet. That is our statement as the SCHIFFY team; our address checks found zero direct transfers between the addresses tested."
sources:
  - { label: "All 1,400 other launches", url: "/evidence/launches" }
  - { label: "Fleet wallet list (JSON)", url: "/data/fleet.json" }
  - { label: "$SCHIFFY mint block", url: "https://robinhoodchain.blockscout.com/block/49365824" }
  - { label: "$SCHIFFY token contract", url: "https://robinhoodchain.blockscout.com/address/0x42aFA2124ca5a2B83898E46B2dA9a190995b1E18" }
---

## Our answer

**Team statement: this accusation is false.** We are the $SCHIFFY team. We don't own, fund or control these wallets, and we have no connection to whoever does.

**What the records show:** our address checks found zero direct transfers between the addresses tested. Tengri has not established any direct or indirect link showing that we own, fund or control this fleet. Coordinated trading is not proof of team ownership. The results below cover records checked through November 2, 2026.

Several of Tengri's trade figures check out, as the other claims on this page explain. His accusation is a different matter. It rests on the word "they", and the thread never shows a transaction from the fleet, or from the money behind it, to us.

## This is a sniping operation

These wallets do this constantly, on tokens that have nothing to do with us.

- **It was running before we launched.** Ten of the 16 wallets were buying launches together on [Jul 27](https://robinhoodchain.blockscout.com/tx/0x71cc69017176107c00ab26ed4717a3acf6f02e8998f148dcb43b1733a4d8b097). $SCHIFFY launched Aug 29.
- **It hit at least 1,400 other launches the same way**, from 1,150 different deployers. [Every one is listed](/evidence/launches). 431 came before $SCHIFFY existed.
- **None of those tokens were launched by the five team wallets tested.**
- **$SCHIFFY was about 0.27% of received token-transfer events** since Aug 29, across 2,542 tokens. This is a share of transfer count, not trading value or profit.
- **Activity continued through the snapshot.** These wallets were receiving other tokens on Nov 2.

## The launch was open to everyone

**It wasn't a zero-block buy.** Nothing was swapped in the mint block. The first trade came 95 blocks and 10 seconds after mint. The fleet's first buy came **2,619 blocks and 263 seconds** after mint.

**It wasn't early for this fleet.** Its median entry on other launches is 65 seconds, and it bought faster than this on 1,184 of those 1,400.

**It wasn't first in line.** Before the fleet's first buy, 192 other wallets had made 513 swap transactions, and 121 of those wallets used the same public router the fleet used.

**There was no whitelist and no team allocation.**

- The mint sent the [entire 1B supply](https://robinhoodchain.blockscout.com/block/49365824) into the pool in one transaction.
- The fleet got its $SCHIFFY from public pool and router contracts. None came from us.
- Some scanners flag this token as "can whitelist". That refers to an exemption list for a maximum-wallet limit in the standard Doppler token contract. On the [live contract](https://robinhoodchain.blockscout.com/address/0x42aFA2124ca5a2B83898E46B2dA9a190995b1E18), that limit was never turned on: `maxBalanceLimit` is 0 and `isBalanceLimitActive` is false.
- The token's owner is the Doppler Airlock contract, not a team wallet.

**Our own dev buy waited in line too.** It came 233 seconds after mint, after 185 other wallets had already traded.

## What we tested

| Test | Result |
|---|---|
| Any token, either direction, on Robinhood Chain: 17 team-side addresses vs. 32 wallets (the 20 fleet wallets plus others that sold in the lockstep block) | **0 transfers** |
| Native ETH: all 186 transaction records for the five team wallets tested vs. those wallets and the treasury | **0 matches** |
| Ethereum, direct transfers: eight team-side wallets vs. the treasury and seven wallets it deals with | **0 transfers** |

Some counterparties do overlap on Ethereum. The ones we could identify are routers, marketplaces, bridges and spam airdrop senders. A few remain unlabeled.


The team-side address list is not published here. These are findings from our review; the public materials alone cannot independently reproduce those private address comparisons.

## The accusation still needs a connection

Tengri did not show a transaction connecting any of our wallets to this fleet or its funding treasury. His post describes what the fleet traded; it does not connect those trades to us.

The fleet's approximately 13.6-day sell-free gap was unusual. We cannot explain the decisions of wallets we do not control. [See the hold comparison](#claim-is-schiffy-an-extraction-experiment). That gap is evidence of a trading decision, not proof of team ownership.
