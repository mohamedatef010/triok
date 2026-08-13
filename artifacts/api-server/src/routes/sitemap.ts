import { Router, type IRouter } from "express";
import { db, videosTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/sitemap.xml", async (_req, res) => {
  try {
    // Fetch only published videos from the database
    const videos = await db
      .select({ id: videosTable.id, updatedAt: videosTable.updatedAt })
      .from(videosTable)
      .where(eq(videosTable.isPublished, true));

    const baseDomain = "https://xn----7sb1acdcpkxafxk9g.xn--p1ai"; // Punycode of классный-фокус.рф

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages without arbitrary lastmod
    const staticPages = [
      { path: "/" },
      { path: "/catalog" },
      { path: "/help" },
      { path: "/contacts" },
      { path: "/requisites" },
    ];

    for (const page of staticPages) {
      xml += `  <url>\n`;
      xml += `    <loc>${baseDomain}${page.path}</loc>\n`;
      xml += `  </url>\n`;
    }

    // Dynamic video/course pages
    for (const video of videos) {
      xml += `  <url>\n`;
      xml += `    <loc>${baseDomain}/video/${video.id}</loc>\n`;
      if (video.updatedAt) {
        const lastModDate = new Date(video.updatedAt).toISOString().split('T')[0];
        xml += `    <lastmod>${lastModDate}</lastmod>\n`;
      }
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    res.header("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(xml);
  } catch (error) {
    console.error("Error generating sitemap:", error);
    res.status(500).send("Error generating dynamic sitemap");
  }
});

export default router;
