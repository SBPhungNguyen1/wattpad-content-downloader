(async () => {
  console.clear();

  console.log("🚀 CRAWL CURRENT CHAPTER");
  console.log("================================");

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // =========================================================
  // 1. FIND CURRENT CHAPTER
  // =========================================================

  const article = document.querySelector("article.story-part");

  if (!article) {
    throw new Error("❌ Cannot find article.story-part");
  }

  const chapterUrl = article.getAttribute("data-part-url") || location.href;

  const partId = article.getAttribute("data-part-id");

  // =========================================================
  // 2. GET CHAPTER NAME
  // =========================================================

  const chapterTitle =
    document.querySelector(".part-header h1")?.textContent?.trim() ||
    `Chapter ${partId || "unknown"}`;

  console.log("📖 Chapter:", chapterTitle);
  console.log("📖 Part ID:", partId);
  console.log("🔗 URL:", chapterUrl);

  // =========================================================
  // 3. SCROLL TO THE BOTTOM OF CHAPTER
  // =========================================================

  console.log("");
  console.log("📜 I'm scrolling to load the entire content...");

  let previousHeight = 0;
  let stableCount = 0;

  for (let i = 0; i < 100; i++) {
    const scrollingElement =
      document.scrollingElement || document.documentElement;

    const currentHeight = scrollingElement.scrollHeight;

    window.scrollTo({
      top: currentHeight,
      behavior: "smooth",
    });

    await sleep(1000);

    const newHeight = scrollingElement.scrollHeight;

    console.log(`Scroll ${i + 1}: ${currentHeight} → ${newHeight}`);

    if (newHeight === previousHeight) {
      stableCount++;
    } else {
      stableCount = 0;
    }

    previousHeight = newHeight;

    // Aint increase height in the next 3 times
    if (stableCount >= 3) {
      break;
    }
  }

  console.log("✅ To bottom page");

  // =========================================================
  // 4. GET NEWEST ARTICLE
  // =========================================================

  const finalArticle = document.querySelector("article.story-part");

  if (!finalArticle) {
    throw new Error("❌ Cannot find article.story-part after scroll");
  }

  // =========================================================
  // 5. GET ALL PARAGRAPH
  // =========================================================

  const paragraphs = [...finalArticle.querySelectorAll("p[data-p-id]")]
    .map((p) => {
      // Clone -> DOM wont affect
      const clone = p.cloneNode(true);

      // DELETE comment UI
      clone.querySelectorAll(".component-wrapper").forEach((el) => el.remove());

      return clone.textContent?.replace(/\u00a0/g, " ").trim() || "";
    })
    .filter(Boolean);

  // =========================================================
  // 6. MERGE CONTENT
  // =========================================================

  const content = paragraphs.join("\n\n");

  // =========================================================
  // 7. CREATE FILE CONTENT
  // =========================================================

  const fileContent = `${chapterTitle}\n\n${content}`;

  console.log("");
  console.log("================================");
  console.log("📊 RESULT");
  console.log("================================");

  console.log("Chapter:", chapterTitle);
  console.log("Part ID:", partId);
  console.log("URL:", chapterUrl);
  console.log("Paragraphs:", paragraphs.length);
  console.log("Characters:", content.length);

  console.log("");
  console.log("First paragraph:");
  console.log(paragraphs[0]);

  console.log("");
  console.log("Last paragraph:");
  console.log(paragraphs[paragraphs.length - 1]);

  // =========================================================
  // 8. DOWNLOAD TXT
  // =========================================================

  // Windows aint allow those file name
  // < > : " / \ | ? *

  const safeFileName = chapterTitle
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, " ")
    .trim();

  const fileName = `${safeFileName || `chapter-${partId}`}.txt`;

  const blob = new Blob([fileContent], {
    type: "text/plain;charset=utf-8",
  });

  const downloadUrl = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = downloadUrl;
  a.download = fileName;

  document.body.appendChild(a);

  a.click();

  a.remove();

  setTimeout(() => {
    URL.revokeObjectURL(downloadUrl);
  }, 1000);

  console.log("");
  console.log("📥 DOWNLOADED FILE:", fileName);

  // =========================================================
  // 9. RETURN
  // =========================================================

  return {
    partId,
    url: chapterUrl,
    title: chapterTitle,
    fileName,
    paragraphs,
    content: fileContent,
  };
})();
