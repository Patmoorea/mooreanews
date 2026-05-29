/** Auth partagée pour les endpoints /api/cron/* */

export async function verifyCronAuth(req: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET?.trim();

  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth === `Bearer ${secret}`) return true;
    const url = new URL(req.url);
    if (url.searchParams.get("secret") === secret) return true;
    return false;
  }

  if (req.headers.get("x-vercel-cron") === "1") return true;
  return process.env.NODE_ENV !== "production";
}
