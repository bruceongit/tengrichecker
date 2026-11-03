import { defineConfig } from "astro/config";
import { basename } from "node:path";

// Claim documents share a case page: give their headings unique IDs.
function claimHeadings() {
  return (tree, file) => {
    const slug = basename(file.path || "claim", ".md");
    let index = 0;
    function visit(node) {
      if (node.type === "element" && /^h[1-6]$/.test(node.tagName)) {
        node.properties = { ...node.properties, id: `record-${slug}-${++index}` };
        if (node.tagName === "h2") node.tagName = "h3";
      }
      node.children?.forEach(visit);
    }
    visit(tree);
  };
}
export default defineConfig({
  site: "https://tengrichecker.com",
  trailingSlash: "ignore",
  markdown: { rehypePlugins: [claimHeadings] },
  output: "static",
  integrations: []
});
