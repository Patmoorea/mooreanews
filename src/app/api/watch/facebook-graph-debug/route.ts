import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import {
  getMooreaNewsPageAccessToken,
  fetchGraphPhotoById,
  graphPostFromPhotoFbidFallback,
} from "@/lib/facebook-watch";
import {
  fetchGraphPostById,
  GRAPH_POST_DETAIL_FIELDS,
} from "@/lib/facebook-post-enrich";
import { fetchOpenGraph } from "@/lib/open-graph";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** GET /api/watch/facebook-graph-debug?secret=...&fbid=... */
export async function GET(req: Request) {
  if (!(await verifyCronAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const fbid = new URL(req.url).searchParams.get("fbid")?.trim();
  if (!fbid || !/^\d{8,}$/.test(fbid)) {
    return NextResponse.json({ error: "fbid_required" }, { status: 400 });
  }

  const pageId = "350029589936";
  const postId = `${pageId}_${fbid}`;
  const token = await getMooreaNewsPageAccessToken();
  if (!token) {
    return NextResponse.json({ error: "no_token" }, { status: 500 });
  }

  const graphUrl = new URL(`https://graph.facebook.com/v21.0/${postId}`);
  graphUrl.searchParams.set("fields", GRAPH_POST_DETAIL_FIELDS);
  graphUrl.searchParams.set("access_token", token);
  const graphRes = await fetch(graphUrl.toString(), { cache: "no-store" });
  const graphRaw = await graphRes.text();

  const postById = await fetchGraphPostById(postId, token);
  const photo = await fetchGraphPhotoById(fbid, pageId, token);
  const ogFallback = await graphPostFromPhotoFbidFallback(fbid, pageId);

  const ogUrls = [
    `https://www.facebook.com/MooreaNews/posts/${fbid}`,
    `https://www.facebook.com/permalink.php?story_fbid=${fbid}&id=${pageId}`,
    `https://www.facebook.com/photo/?fbid=${fbid}&id=${pageId}`,
  ];
  const og: Record<string, unknown> = {};
  for (const u of ogUrls) {
    og[u] = await fetchOpenGraph(u);
  }

  const altPostIds = [
    postId,
    `1762281498446173_${fbid}`,
    fbid,
  ];
  const altGraph: Record<string, unknown> = {};
  for (const id of altPostIds) {
    const u = new URL(`https://graph.facebook.com/v21.0/${id}`);
    u.searchParams.set("fields", GRAPH_POST_DETAIL_FIELDS);
    u.searchParams.set("access_token", token);
    const r = await fetch(u.toString(), { cache: "no-store" });
    altGraph[id] = {
      status: r.status,
      body: (await r.text()).slice(0, 1500),
    };
  }

  let tokenDebug: unknown = null;
  const appId = process.env.FACEBOOK_APP_ID?.trim();
  const appSecret = process.env.FACEBOOK_APP_SECRET?.trim();
  if (appId && appSecret) {
    const du = new URL("https://graph.facebook.com/v21.0/debug_token");
    du.searchParams.set("input_token", token);
    du.searchParams.set("access_token", `${appId}|${appSecret}`);
    const dr = await fetch(du.toString(), { cache: "no-store" });
    tokenDebug = await dr.json();
  }

  const oembedUrl = new URL("https://graph.facebook.com/v21.0/oembed_post");
  oembedUrl.searchParams.set(
    "url",
    `https://www.facebook.com/MooreaNews/posts/${fbid}`,
  );
  oembedUrl.searchParams.set("access_token", token);
  const oembedRes = await fetch(oembedUrl.toString(), { cache: "no-store" });
  const oembed = {
    status: oembedRes.status,
    body: (await oembedRes.text()).slice(0, 1500),
  };

  return NextResponse.json({
    fbid,
    postId,
    graphHttp: graphRes.status,
    graphRaw: graphRaw.slice(0, 4000),
    postById,
    photo,
    ogFallback,
    og,
    altGraph,
    tokenDebug,
    oembed,
  });
}
