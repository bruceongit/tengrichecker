export type RatingKey = "true" | "mostly-true" | "mixture" | "misleading" | "unproven" | "no-evidence" | "false" | "opinion" | "team-denial";

export const ratings: Record<RatingKey, { label: string; mark: string; meaning: string; schema: number | null }> = {
  "team-denial": { label: "False — team response", mark: "✕", meaning: "The SCHIFFY team states that this accusation is false. This records the team's statement. The evidence sections separately report the scope and results of the transaction checks.", schema: null },
  "true": { label: "Right", mark: "✓", meaning: "This claim matches the records we checked.", schema: 5 },
  "mostly-true": { label: "Mostly right", mark: "✓", meaning: "The main point checks out. Some details are wrong or do not match our count.", schema: 4 },
  "mixture": { label: "Partly wrong", mark: "±", meaning: "Some parts check out. Other important parts are wrong. The page explains which.", schema: 3 },
  "misleading": { label: "Misleading", mark: "!", meaning: "The facts are presented in a way that gives the wrong impression.", schema: 2 },
  "unproven": { label: "Not verified", mark: "?", meaning: "We have not confirmed this claim. Treat it as a claim, not a checked fact. That does not prove it false.", schema: null },
  "no-evidence": { label: "No proof shown", mark: "?", meaning: "He has not shown the link he claims. The reviewed records do not establish the claimed connection.", schema: null },
  "false": { label: "Wrong", mark: "✕", meaning: "The records contradict him. This claim is wrong.", schema: 1 },
  "opinion": { label: "Opinion", mark: "“", meaning: "This is a judgment about motives, not a fact the records can prove.", schema: null },
};

export const ratingOrder: RatingKey[] = ["team-denial", "false", "mixture", "misleading", "no-evidence", "unproven", "mostly-true", "true", "opinion"];
