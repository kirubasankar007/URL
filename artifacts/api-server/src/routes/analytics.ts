import { Router } from "express";
import { db, shortUrlsTable, clickEventsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middlewares/auth";
import { GetUrlAnalyticsParams } from "@workspace/api-zod";

const router = Router();

router.get("/urls/:id/analytics", authMiddleware, async (req: AuthRequest, res) => {
  const parsed = GetUrlAnalyticsParams.safeParse({ id: parseInt(req.params.id as string, 10) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [url] = await db
    .select()
    .from(shortUrlsTable)
    .where(and(eq(shortUrlsTable.id, parsed.data.id), eq(shortUrlsTable.userId, req.userId!)));

  if (!url) {
    res.status(404).json({ error: "URL not found" });
    return;
  }

  const clicks = await db
    .select()
    .from(clickEventsTable)
    .where(eq(clickEventsTable.shortUrlId, url.id))
    .orderBy(sql`${clickEventsTable.clickedAt} desc`)
    .limit(100);

  const clicksByDayRaw = await db
    .select({
      date: sql<string>`DATE(${clickEventsTable.clickedAt})::text`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(clickEventsTable)
    .where(eq(clickEventsTable.shortUrlId, url.id))
    .groupBy(sql`DATE(${clickEventsTable.clickedAt})`)
    .orderBy(sql`DATE(${clickEventsTable.clickedAt})`);

  res.json({
    url: {
      id: url.id,
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
      clickCount: url.clickCount,
      createdAt: url.createdAt.toISOString(),
    },
    clicks: clicks.map((c) => ({
      id: c.id,
      clickedAt: c.clickedAt.toISOString(),
      userAgent: c.userAgent ?? null,
      ipAddress: c.ipAddress ?? null,
    })),
    clicksByDay: clicksByDayRaw,
  });
});

router.get("/analytics/summary", authMiddleware, async (req: AuthRequest, res) => {
  const urls = await db
    .select()
    .from(shortUrlsTable)
    .where(eq(shortUrlsTable.userId, req.userId!));

  const totalUrls = urls.length;
  const totalClicks = urls.reduce((sum, u) => sum + u.clickCount, 0);
  const topUrls = [...urls]
    .sort((a, b) => b.clickCount - a.clickCount)
    .slice(0, 5)
    .map((u) => ({
      id: u.id,
      originalUrl: u.originalUrl,
      shortCode: u.shortCode,
      clickCount: u.clickCount,
      createdAt: u.createdAt.toISOString(),
    }));

  res.json({ totalUrls, totalClicks, topUrls });
});

export default router;
