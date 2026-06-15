import { Router } from "express";
import { db, shortUrlsTable, clickEventsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/r/:code", async (req, res) => {
  const { code } = req.params;

  const [url] = await db
    .select()
    .from(shortUrlsTable)
    .where(eq(shortUrlsTable.shortCode, code));

  if (!url) {
    res.status(404).json({ error: "Short URL not found" });
    return;
  }

  const userAgent = req.headers["user-agent"] ?? null;
  const ipAddress = (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ?? req.socket.remoteAddress ?? null;

  await db.insert(clickEventsTable).values({
    shortUrlId: url.id,
    userAgent,
    ipAddress,
  });

  await db
    .update(shortUrlsTable)
    .set({ clickCount: sql`${shortUrlsTable.clickCount} + 1` })
    .where(eq(shortUrlsTable.id, url.id));

  res.redirect(url.originalUrl);
});

export default router;
