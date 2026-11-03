// Public response configuration. Private evidence stays outside public/.
export const site = {
  name: "TengriChecker",
  url: "https://tengrichecker.com",
  tagline: "Observing digital ecosystems - tracking technological patterns and audience engagement.",
  contactEmail: "tengrichecker@proton.me" as string | null,
};

export const cases: Record<string, {
  title: string; subject: string; summary: string; threadUrl: string | null; reviewed: string;
}> = {
  "schiffy-fleet": {
    title: "The SCHIFFY fleet allegation",
    subject: "$SCHIFFY",
    summary: "Our response: the accusation is false. We have no connection to this fleet. Tengri did not connect any of our wallets to it. The records show a wider trading operation and errors in his timeline and holdings figures.",
    threadUrl: "https://x.com/TengriTheTruth/status/2117357066906120692",
    reviewed: "2026-11-02",
  },
};

export const fmtDate = (s: string) =>
  new Date(s + "T00:00:00Z").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
