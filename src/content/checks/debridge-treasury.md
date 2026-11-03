---
title: "Did the funding wallet get its money from an Ethereum treasury?"
claim: "The Solana wallet behind the mixer deposit received about 249,904 USDC via deBridge from Ethereum treasury 0x6592b1f7… on Jul 4."
quote: "Where D3rUoXzW… got its money: a deBridge order from Ethereum treasury 0x6592b1f7…, 249,904 USDC on Jul 4"
rating: "true"
followUp: true
order: 10
summary: "This transfer checks out. The Ethereum wallet sent 249,903.86 USDC through deBridge, with 249,800.04 delivered on July 4. That transfer does not prove the wallet belongs to the team."
sources:
  - { label: "deBridge fill (Solana)", url: "https://solscan.io/tx/4pX4pxm71AXgVUXrmWR2hE8s5ZbeFrKyPTzSPpMTWzGZk4cSuGUcQxRTp7pvBHFXpbYqreiyKmJ21zsEvVTJFDZK" }
  - { label: "deBridge order record", url: "https://dln.debridge.finance/v1.0/dln/order/0xba69fd05868bab20a191f908ce26ac912de1bbfa849964c32cf1b3214b64af51" }
  - { label: "Treasury on Ethereum", url: "https://eth.blockscout.com/address/0x6592b1f772b5c5b8178add33cc8ed259952b76c1" }
---

## What we found

The deBridge order record shows maker `0x6592b1f772b5c5b8178add33cc8ed259952b76c1`, offering **249,903.86 USDC** on Ethereum. **249,800.04 USDC** was delivered to `D3rUoXzW…` on Jul 4, 2026.

## What the thread leaves out

The same treasury has openly sent USDC on Ethereum directly to wallets in this fleet, including `0x2fe4…` (2.73M), `0x4725…` (350K) and `0xc421…` (200K). So there is a visible funding trail as well as a mixed one.

**None of the team wallets we tested has a direct transfer with this treasury or those wallets.** See [the main ruling](#claim-is-schiffy-team-behind-fleet).

## Limits of this ruling

We confirmed which wallet sent the funds, not who controls it. We make no claim about the identity of its owner.
