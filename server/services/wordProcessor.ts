import mammoth from "mammoth";

export interface ProcessedChapter {
  title: string;
  content: string;
  type: "frontmatter" | "part" | "chapter" | "subchapter" | "backmatter";
  level: number;
  parentId?: number;
  orderIndex: number;
}

export interface WordAnalysisResult {
  title?: string;
  subtitle?: string;
  author?: string;
  chapters: ProcessedChapter[];
}

/**
 * Process a Word document and extract structured content with hierarchy
 */
export async function processWordDocument(fileData: string): Promise<WordAnalysisResult> {
  // Decode base64 to buffer
  const buffer = Buffer.from(fileData, "base64");

  // Extract HTML with style information
  const result = await mammoth.convertToHtml(
    { buffer },
    {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Title'] => h1.title:fresh",
        "p[style-name='Subtitle'] => h2.subtitle:fresh",
      ],
    }
  );

  const html = result.value;

  // Parse HTML to extract structure
  const chapters: ProcessedChapter[] = [];
  let title: string | undefined;
  let subtitle: string | undefined;
  let author: string | undefined;
  
  // Split by major headings
  const lines = html.split(/(<h[1-3][^>]*>.*?<\/h[1-3]>)/gi);
  
  let currentContent = "";
  let currentTitle = "";
  let currentType: ProcessedChapter["type"] = "chapter";
  let currentLevel = 2;
  let orderIndex = 0;
  let currentPartIndex: number | undefined;

  // First pass: detect title, subtitle, and author from first few lines
  const firstLines = html.substring(0, 2000);
  const titleMatch = firstLines.match(/<h1[^>]*class="title"[^>]*>(.*?)<\/h1>/i) || 
                     firstLines.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (titleMatch) {
    const detectedTitle = stripHtml(titleMatch[1]).trim();
    // Only use as title if it's not a common section name
    if (!/^(PARTE|CAPÍTULO|CHAPTER|DEDICATORIA|CONTENIDO)/i.test(detectedTitle)) {
      title = detectedTitle;
    }
  }
  
  const subtitleMatch = firstLines.match(/<h2[^>]*class="subtitle"[^>]*>(.*?)<\/h2>/i);
  if (subtitleMatch) {
    subtitle = stripHtml(subtitleMatch[1]).trim();
  } else {
    // Try to detect subtitle as second line after title
    const lines = firstLines.split(/<\/?[ph][1-6]?[^>]*>/gi).filter(l => l.trim());
    if (lines.length >= 2 && lines[1] && lines[1].length < 200) {
      subtitle = stripHtml(lines[1]).trim();
    }
  }

  // Try to detect author from copyright or first paragraphs
  const authorMatch = html.match(/(?:Copyright|©|Autor|Author)[\s:]*(?:©\s*)?(\d{4})?\s*([A-ZÁ-Ú][a-záéíóúñ]+(?:\s+[A-ZÁ-Ú]\.?\s*)?[A-ZÁ-Ú][a-záéíóúñ]+(?:\s+[A-ZÁ-Ú]\.?)?)/i);
  if (authorMatch) {
    author = authorMatch[2]?.trim();
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line) continue;

    // Check if it's a heading
    const h1Match = line.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const h2Match = line.match(/<h2[^>]*>(.*?)<\/h2>/i);
    const h3Match = line.match(/<h3[^>]*>(.*?)<\/h3>/i);

    if (h1Match || h2Match || h3Match) {
      // Save previous section if exists
      if (currentTitle && currentContent.trim()) {
        chapters.push({
          title: currentTitle,
          content: normalizeContent(currentContent.trim()),
          type: currentType,
          level: currentLevel,
          parentId: currentType === "subchapter" && currentPartIndex !== undefined ? currentPartIndex : undefined,
          orderIndex: orderIndex++,
        });
      }

      // Start new section
      const headingText = stripHtml((h1Match || h2Match || h3Match)![1] || "").trim();
      
      // Skip if this is the title we already detected
      if (title && headingText === title) {
        currentContent = "";
        continue;
      }
      
      // Detect type based on content and position
      if (h1Match) {
        // H1 could be PART or special section
        if (
          /^PARTE\s+[IVX\d]+/i.test(headingText) ||
          /^PART\s+[IVX\d]+/i.test(headingText) ||
          /^SECCIÓN\s+[IVX\d]+/i.test(headingText)
        ) {
          currentType = "part";
          currentLevel = 1;
          currentPartIndex = orderIndex;
        } else if (
          /^(DEDICATORIA|AGRADECIMIENTOS|CONTENIDO|ÍNDICE|PREFACIO|PRÓLOGO|INTRODUCCIÓN)/i.test(headingText)
        ) {
          currentType = "frontmatter";
          currentLevel = 1;
          currentPartIndex = undefined;
        } else if (
          /^(EPÍLOGO|CONCLUSIÓN|BIBLIOGRAFÍA|REFERENCIAS|APÉNDICE|SOBRE EL AUTOR)/i.test(headingText)
        ) {
          currentType = "backmatter";
          currentLevel = 1;
          currentPartIndex = undefined;
        } else {
          // Regular chapter with H1
          currentType = "chapter";
          currentLevel = 2;
        }
      } else if (h2Match) {
        // H2 is typically a chapter
        currentType = "chapter";
        currentLevel = 2;
      } else if (h3Match) {
        // H3 is a subchapter
        currentType = "subchapter";
        currentLevel = 3;
      }

      currentTitle = headingText;
      currentContent = "";
    } else {
      // Accumulate content
      currentContent += line + "\n";
    }
  }

  // Save last section
  if (currentTitle && currentContent.trim()) {
    chapters.push({
      title: currentTitle,
      content: normalizeContent(currentContent.trim()),
      type: currentType,
      level: currentLevel,
      parentId: currentType === "subchapter" && currentPartIndex !== undefined ? currentPartIndex : undefined,
      orderIndex: orderIndex++,
    });
  }

  // If no chapters were detected, create a single chapter with all content
  if (chapters.length === 0) {
    const plainText = stripHtml(html);
    if (plainText.trim()) {
      chapters.push({
        title: "Contenido Importado",
        content: html,
        type: "chapter",
        level: 2,
        orderIndex: 0,
      });
    }
  }

  return {
    title,
    subtitle,
    author,
    chapters,
  };
}

/**
 * Remove HTML tags from string
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * Normalize spacing and formatting in HTML content
 */
export function normalizeContent(html: string): string {
  return html
    .replace(/\n\s*\n\s*\n/g, "\n\n") // Remove excessive line breaks
    .replace(/<p>\s*<\/p>/g, "") // Remove empty paragraphs
    .replace(/<br\s*\/?>\s*<br\s*\/?>/g, "</p><p>") // Convert double breaks to paragraphs
    .trim();
}
