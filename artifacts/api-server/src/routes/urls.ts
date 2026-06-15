import { Router } from "express";
import { nanoid } from "nanoid";
import { db, shortUrlsTable, clickEventsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { authMiddleware, AuthRequest } from "../middlewares/auth";
import { CreateUrlBody, DeleteUrlParams } from "@workspace/api-zod";

const router = Router();

router.get("/urls", authMiddleware, async (req: AuthRequest, res) => {
  const urls = await db
    .select()
    .from(shortUrlsTable)
    .where(eq(shortUrlsTable.userId, req.userId!))
    .orderBy(sql`${shortUrlsTable.createdAt} desc`);

  res.json(urls.map((u) => ({
    id: u.id,
    originalUrl: u.originalUrl,
    shortCode: u.shortCode,
    clickCount: u.clickCount,
    createdAt: u.createdAt.toISOString(),
  })));
});

router.post("/urls", authMiddleware, async (req: AuthRequest, res) => {
  const parsed = CreateUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { originalUrl, customCode } = parsed.data;
  const shortCode = customCode?.trim() || nanoid(7);

  const [existing] = await db
    .select()
    .from(shortUrlsTable)
    .where(eq(shortUrlsTable.shortCode, shortCode));

  if (existing) {
    res.status(400).json({ error: "Short code already taken" });
    return;
  }

  const [url] = await db
    .insert(shortUrlsTable)
    .values({ userId: req.userId!, originalUrl, shortCode })
    .returning();

  res.status(201).json({
    id: url.id,
    originalUrl: url.originalUrl,
    shortCode: url.shortCode,
    clickCount: url.clickCount,
    createdAt: url.createdAt.toISOString(),
  });
});

router.delete("/urls/:id", authMiddleware, async (req: AuthRequest, res) => {
  const parsed = DeleteUrlParams.safeParse({ id: parseInt(req.params.id as string, 10) });
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

  await db.delete(shortUrlsTable).where(eq(shortUrlsTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
