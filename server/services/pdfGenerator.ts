import puppeteer from "puppeteer";
import type { Project, Chapter } from "../../drizzle/schema";

export interface PDFGenerationOptions {
  project: Project;
  chapters: Chapter[];
  includePageNumbers?: boolean;
  includeToc?: boolean;
}

/**
 * Genera un PDF del libro con configuración profesional
 */
export async function generateBookPDF(options: PDFGenerationOptions): Promise<Buffer> {
  const { project, chapters, includePageNumbers = true, includeToc = true } = options;

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();
    
    // Generar HTML completo del libro
    const html = generateBookHTML(project, chapters, includeToc);
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Configurar tamaño de página
    const pageSize = getPageSize(project.pageSize);
    
    // Generar PDF
    const pdfBuffer = await page.pdf({
      format: pageSize.format as any,
      width: pageSize.width,
      height: pageSize.height,
      printBackground: true,
      margin: {
        top: `${project.marginTop}mm`,
        right: `${project.marginRight}mm`,
        bottom: `${project.marginBottom}mm`,
        left: `${project.marginLeft + project.marginGutter}mm`,
      },
      displayHeaderFooter: includePageNumbers,
      headerTemplate: includePageNumbers ? getHeaderTemplate(project) : '',
      footerTemplate: includePageNumbers ? getFooterTemplate() : '',
      preferCSSPageSize: false,
    });
    
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

/**
 * Genera el HTML completo del libro con estilos
 */
function generateBookHTML(project: Project, chapters: Chapter[], includeToc: boolean): string {
  const styles = generateStyles(project);
  
  // Ordenar capítulos
  const sortedChapters = [...chapters].sort((a, b) => a.orderIndex - b.orderIndex);
  
  // Separar front matter, capítulos principales y back matter
  const frontMatter = sortedChapters.filter(ch => ch.type === 'frontmatter');
  const mainChapters = sortedChapters.filter(ch => ch.type === 'chapter');
  const backMatter = sortedChapters.filter(ch => ch.type === 'backmatter');
  
  // Generar tabla de contenidos
  const tocHtml = includeToc ? generateTOC(mainChapters) : '';
  
  // Generar HTML de capítulos
  const frontMatterHtml = frontMatter.map(ch => generateChapterHTML(ch, false)).join('\n');
  const mainChaptersHtml = mainChapters.map(ch => generateChapterHTML(ch, true)).join('\n');
  const backMatterHtml = backMatter.map(ch => generateChapterHTML(ch, false)).join('\n');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${project.title}</title>
      <style>${styles}</style>
    </head>
    <body>
      <div class="book">
        ${frontMatterHtml}
        ${tocHtml}
        ${mainChaptersHtml}
        ${backMatterHtml}
      </div>
    </body>
    </html>
  `;
}

/**
 * Genera el HTML de un capítulo individual
 */
function generateChapterHTML(chapter: Chapter, isMainChapter: boolean): string {
  const pageBreak = chapter.startOnNewPage ? 'page-break-before: always;' : '';
  const chapterClass = isMainChapter ? 'main-chapter' : 'special-chapter';
  
  return `
    <div class="chapter ${chapterClass}" style="${pageBreak}">
      <h1 class="chapter-title">${chapter.title}</h1>
      <div class="chapter-content">
        ${chapter.content}
      </div>
    </div>
  `;
}

/**
 * Genera la tabla de contenidos
 */
function generateTOC(chapters: Chapter[]): string {
  const tocItems = chapters
    .filter(ch => ch.includeInToc)
    .map((ch, index) => `
      <div class="toc-item">
        <span class="toc-title">${ch.title}</span>
        <span class="toc-dots"></span>
        <span class="toc-page">${index + 1}</span>
      </div>
    `)
    .join('\n');

  return `
    <div class="toc" style="page-break-before: always;">
      <h1 class="toc-heading">Tabla de Contenidos</h1>
      <div class="toc-list">
        ${tocItems}
      </div>
    </div>
  `;
}

/**
 * Genera los estilos CSS para el libro
 */
function generateStyles(project: Project): string {
  return `
    @page {
      size: ${getPageSize(project.pageSize).cssSize};
      margin: ${project.marginTop}mm ${project.marginRight}mm ${project.marginBottom}mm ${project.marginLeft + project.marginGutter}mm;
    }
    
    * {
      box-sizing: border-box;
    }
    
    body {
      margin: 0;
      padding: 0;
      font-family: ${project.fontFamily}, serif;
      font-size: ${project.fontSize}pt;
      line-height: ${project.lineHeight / 100};
      color: #000;
      background: #fff;
    }
    
    .book {
      width: 100%;
      height: 100%;
    }
    
    .chapter {
      margin-bottom: 2em;
    }
    
    .chapter-title {
      font-size: ${project.fontSize * 2}pt;
      font-weight: bold;
      margin: 0 0 1.5em 0;
      text-align: center;
      page-break-after: avoid;
    }
    
    .chapter-content p {
      margin: 0 0 1em 0;
      text-align: justify;
      text-indent: 1.5em;
      orphans: 2;
      widows: 2;
    }
    
    .chapter-content p:first-of-type {
      text-indent: 0;
    }
    
    .chapter-content h2 {
      font-size: ${project.fontSize * 1.5}pt;
      font-weight: bold;
      margin: 1.5em 0 0.75em 0;
      page-break-after: avoid;
    }
    
    .chapter-content h3 {
      font-size: ${project.fontSize * 1.2}pt;
      font-weight: bold;
      margin: 1.2em 0 0.6em 0;
      page-break-after: avoid;
    }
    
    .chapter-content img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 1em auto;
      page-break-inside: avoid;
    }
    
    .chapter-content blockquote {
      margin: 1em 2em;
      padding: 0.5em 1em;
      border-left: 3px solid #ccc;
      font-style: italic;
    }
    
    .chapter-content ul, .chapter-content ol {
      margin: 1em 0;
      padding-left: 2em;
    }
    
    .chapter-content li {
      margin: 0.5em 0;
    }
    
    .toc {
      margin-bottom: 2em;
    }
    
    .toc-heading {
      font-size: ${project.fontSize * 2}pt;
      font-weight: bold;
      margin: 0 0 1.5em 0;
      text-align: center;
    }
    
    .toc-list {
      margin: 0;
    }
    
    .toc-item {
      display: flex;
      align-items: baseline;
      margin: 0.5em 0;
      page-break-inside: avoid;
    }
    
    .toc-title {
      flex-shrink: 0;
    }
    
    .toc-dots {
      flex-grow: 1;
      border-bottom: 1px dotted #999;
      margin: 0 0.5em;
      min-width: 1em;
    }
    
    .toc-page {
      flex-shrink: 0;
    }
    
    @media print {
      body {
        background: none;
      }
    }
  `;
}

/**
 * Obtiene las dimensiones de página según el tamaño seleccionado
 */
function getPageSize(pageSize: string): { format?: string; width?: string; height?: string; cssSize: string } {
  const sizes: Record<string, { format?: string; width: string; height: string; cssSize: string }> = {
    '6x9': { width: '6in', height: '9in', cssSize: '6in 9in' },
    '5.5x8.5': { width: '5.5in', height: '8.5in', cssSize: '5.5in 8.5in' },
    '8.5x11': { width: '8.5in', height: '11in', cssSize: '8.5in 11in' },
    'A4': { format: 'A4', width: '210mm', height: '297mm', cssSize: 'A4' },
    'A5': { format: 'A5', width: '148mm', height: '210mm', cssSize: 'A5' },
    'Letter': { format: 'Letter', width: '8.5in', height: '11in', cssSize: 'Letter' },
  };
  
  return sizes[pageSize] || sizes['6x9'];
}

/**
 * Genera el template de cabecera para páginas
 */
function getHeaderTemplate(project: Project): string {
  return `
    <div style="font-size: 9pt; text-align: center; width: 100%; margin-top: 10mm;">
      <span>${project.title}</span>
    </div>
  `;
}

/**
 * Genera el template de pie de página con números
 */
function getFooterTemplate(): string {
  return `
    <div style="font-size: 9pt; text-align: center; width: 100%; margin-bottom: 10mm;">
      <span class="pageNumber"></span>
    </div>
  `;
}
