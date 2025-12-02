import Epub from "epub-gen-memory";
import type { Project, Chapter } from "../../drizzle/schema";

export interface EPUBGenerationOptions {
  project: Project;
  chapters: Chapter[];
}

/**
 * Genera un archivo EPUB del libro
 */
export async function generateBookEPUB(options: EPUBGenerationOptions): Promise<Buffer> {
  const { project, chapters } = options;

  // Ordenar capítulos
  const sortedChapters = [...chapters].sort((a, b) => a.orderIndex - b.orderIndex);
  
  // Preparar contenido para EPUB
  const content = sortedChapters.map(chapter => ({
    title: chapter.title,
    data: cleanHTMLForEPUB(chapter.content),
    beforeToc: chapter.type === 'frontmatter',
    excludeFromToc: !chapter.includeInToc,
  }));

  const epubOptions = {
    title: project.title || 'Sin título',
    author: project.author || 'Autor desconocido',
    publisher: 'BookMaster',
    cover: project.coverImageUrl || undefined,
    content,
    css: generateEPUBStyles(project),
    fonts: [],
    lang: 'es',
    tocTitle: 'Tabla de Contenidos',
    appendChapterTitles: false,
    customOpfTemplatePath: undefined,
    customNcxTocTemplatePath: undefined,
    customHtmlTocTemplatePath: undefined,
    version: 3,
  };

  try {
    const epub = new (Epub as any)(epubOptions);
    const buffer = await epub.genEpub();
    return buffer;
  } catch (error) {
    console.error("Error generating EPUB:", error);
    throw new Error("No se pudo generar el archivo EPUB");
  }
}

/**
 * Limpia el HTML para que sea compatible con EPUB
 */
function cleanHTMLForEPUB(html: string): string {
  return html
    // Eliminar estilos inline que puedan causar problemas
    .replace(/style="[^"]*"/gi, '')
    // Asegurar que las imágenes tengan atributos alt
    .replace(/<img([^>]*?)>/gi, (match, attrs) => {
      if (!attrs.includes('alt=')) {
        return `<img${attrs} alt="Imagen">`;
      }
      return match;
    })
    // Normalizar espacios
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Genera los estilos CSS para el EPUB
 */
function generateEPUBStyles(project: Project): string {
  return `
    body {
      font-family: ${project.fontFamily}, serif;
      font-size: ${project.fontSize}pt;
      line-height: ${project.lineHeight / 100};
      margin: 1em;
      text-align: justify;
    }
    
    h1 {
      font-size: 2em;
      font-weight: bold;
      margin: 1em 0 0.5em 0;
      text-align: center;
      page-break-after: avoid;
    }
    
    h2 {
      font-size: 1.5em;
      font-weight: bold;
      margin: 1.5em 0 0.75em 0;
      page-break-after: avoid;
    }
    
    h3 {
      font-size: 1.2em;
      font-weight: bold;
      margin: 1.2em 0 0.6em 0;
      page-break-after: avoid;
    }
    
    p {
      margin: 0 0 1em 0;
      text-indent: 1.5em;
      orphans: 2;
      widows: 2;
    }
    
    p:first-of-type,
    h1 + p,
    h2 + p,
    h3 + p {
      text-indent: 0;
    }
    
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 1em auto;
    }
    
    blockquote {
      margin: 1em 2em;
      padding: 0.5em 1em;
      border-left: 3px solid #ccc;
      font-style: italic;
    }
    
    ul, ol {
      margin: 1em 0;
      padding-left: 2em;
    }
    
    li {
      margin: 0.5em 0;
    }
    
    strong, b {
      font-weight: bold;
    }
    
    em, i {
      font-style: italic;
    }
    
    .chapter-title {
      font-size: 2em;
      font-weight: bold;
      margin: 1em 0;
      text-align: center;
    }
  `;
}
