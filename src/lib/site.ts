// Public response configuration. Private evidence stays outside public/.
export const site = {
  name: "TengriChecker",
  url: "https://tengrichecker.com",
  tagline: "Observing digital ecosystems - tracking technological patterns and audience engagement.",
  contactEmail: "tengrichecker@proton.me" as string | null,
};

export const cases: Record<string, {
  title: string; subject: string; summary: string; threadUrl: string | null; reviewed: string; disclosure?: string;
}> = {
  "schiffy-fleet": {
    title: "The SCHIFFY fleet allegation",
    subject: "$SCHIFFY",
    summary: "Our response: the accusation is false. We have no connection to this fleet. Tengri did not connect any of our wallets to it. The records show a wider trading operation and errors in his timeline and holdings figures.",
    threadUrl: "https://x.com/TengriTheTruth/status/2117357066906120692",
    reviewed: "2026-11-02",
  },
  "jihoz-wallet": {
    title: "The Jihoz hacked-wallet allegation",
    subject: "$RON",
    summary: "Tengri says Jihoz is still sending RON to the wallet that Jihoz says was hacked. The payments are real, but Jihoz did not send them. A validator pool did, and the wallet had paid 25,000 RON into that pool in 2023. The wallet has not signed a transaction since April 7, 2024. These records do not show who carried out the 2024 theft.",
    threadUrl: "https://x.com/TengriTheTruth/status/2116510356155629993",
    reviewed: "2026-11-03",
    disclosure: "TengriChecker is published by the SCHIFFY team, so we are not a neutral party. In this same thread, Tengri accuses Jihoz and Sky Mavis of planning SCHIFFY.",
  },
};

export const fmtDate = (s: string) =>
  new Date(s + "T00:00:00Z").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
