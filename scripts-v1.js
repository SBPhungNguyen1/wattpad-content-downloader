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

    // Height doesn't increase 3 times in a row
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
  // 5. GET ALL PARAGRAPHS
  // =========================================================

  const paragraphs = [...finalArticle.querySelectorAll("p[data-p-id]")]
    .map((p) => {
      // Clone -> don't modify original DOM
      const clone = p.cloneNode(true);

      // -------------------------------------------------------
      // Remove comment / UI elements
      // -------------------------------------------------------

      clone.querySelectorAll(".component-wrapper").forEach((el) => {
        el.remove();
      });

      // -------------------------------------------------------
      // Convert <br> to newline
      // -------------------------------------------------------

      clone.querySelectorAll("br").forEach((br) => {
        br.replaceWith("\n");
      });

      // -------------------------------------------------------
      // Extract text
      // -------------------------------------------------------

      let text = clone.textContent || "";

      // -------------------------------------------------------
      // Normalize text
      // -------------------------------------------------------

      text = text
        // NBSP -> normal space
        .replace(/\u00a0/g, " ")

        // Normalize line endings
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")

        // Remove spaces around newlines
        .replace(/[ \t]*\n[ \t]*/g, "\n")

        // Multiple spaces -> one space
        .replace(/[ \t]{2,}/g, " ")

        // Too many newlines -> max 2
        .replace(/\n{3,}/g, "\n\n")

        .trim();

      return text;
    })
    .filter(Boolean);

  // =========================================================
  // 6. NORMALIZE PARAGRAPHS
  // =========================================================

  const normalizedParagraphs = paragraphs.map((paragraph) => {
    let text = paragraph;

    /*
     * Wattpad sometimes renders one paragraph like this:
     *
     * "Ngày xưa, tại một vương quốc nọ có tục lệ là người nào tới tuổi già cũng bị đuổi ra
     * khỏi nhà."
     *
     * We want:
     *
     * "Ngày xưa, tại một vương quốc nọ có tục lệ là người nào tới tuổi già cũng bị đuổi ra khỏi nhà."
     */

    text = text
      // Join lines when the next line continues normal text.
      .replace(/([^\n])\n(?=[a-zà-ỹA-ZÀ-Ỹ0-9"“‘(])/g, "$1 ")

      // Normalize spaces again
      .replace(/[ \t]{2,}/g, " ")

      .trim();

    return text;
  });

  // =========================================================
  // 7. MERGE CONTENT
  // =========================================================

  const content = normalizedParagraphs.join("\n\n");

  // =========================================================
  // 8. CREATE FILE CONTENT
  // =========================================================

  const fileContent = `${chapterTitle}\n\n${content}`;

  // =========================================================
  // 9. RESULT
  // =========================================================

  console.log("");
  console.log("================================");
  console.log("📊 RESULT");
  console.log("================================");

  console.log("Chapter:", chapterTitle);
  console.log("Part ID:", partId);
  console.log("URL:", chapterUrl);
  console.log("Paragraphs:", normalizedParagraphs.length);
  console.log("Characters:", content.length);

  console.log("");
  console.log("First paragraph:");
  console.log(normalizedParagraphs[0]);

  console.log("");
  console.log("Last paragraph:");
  console.log(normalizedParagraphs[normalizedParagraphs.length - 1]);

  // =========================================================
  // 10. DOWNLOAD TXT
  // =========================================================

  // Windows doesn't allow:
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
  // 11. RETURN
  // =========================================================

  return {
    partId,
    url: chapterUrl,
    title: chapterTitle,
    fileName,
    paragraphs: normalizedParagraphs,
    content: fileContent,
  };
})();
