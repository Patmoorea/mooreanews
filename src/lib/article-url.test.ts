import { test } from "node:test";
import assert from "node:assert/strict";
import {
  facebookPostIdFromPublicSlug,
  publicArticleSlug,
  rssSourceUrl,
  withoutStaleGarde,
} from "./article-url";

test("slug lisible pour import FB", () => {
  const s = publicArticleSlug({
    slug: "mooreanews-fb-350029589936-1902101807797474",
    title: "🌧️ Vigilance orange : fortes pluies à Moorea !",
  });
  assert.equal(s, "vigilance-orange-fortes-pluies-a-moorea-1902101807797474");
  assert.equal(facebookPostIdFromPublicSlug(s), "1902101807797474");
  assert.equal(publicArticleSlug({ slug: "garde-moorea-x", title: "T" }), "garde-moorea-x");
});

test("source RSS", () => {
  assert.equal(
    rssSourceUrl({
      slug: "rss-tahiti-infos-0a",
      body: "![](https://www.tahiti-infos.com/photo/art/default/1.jpg) [Lire](https://www.tahiti-infos.com/Un-foot_a239738.html)",
    }),
    "https://www.tahiti-infos.com/Un-foot_a239738.html",
  );
});

test("garde : seule la plus récente", () => {
  const out = withoutStaleGarde([
    { slug: "garde-moorea-a", publishedAt: "2026-10-10" },
    { slug: "x", publishedAt: "2026-10-01" },
    { slug: "garde-moorea-b", publishedAt: "2026-10-17" },
  ]);
  assert.deepEqual(out.map((a) => a.slug), ["x", "garde-moorea-b"]);
});
