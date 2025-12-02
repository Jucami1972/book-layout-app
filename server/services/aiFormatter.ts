import { invokeLLM } from "../_core/llm";

export interface BookAnalysis {
  genre: string;
  suggestedTemplate: string;
  tone: string;
  targetAudience: string;
  recommendations: string[];
}

export interface StyleSuggestions {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  marginGutter: number;
}

/**
 * Analiza el contenido del libro y sugiere el género y estilo
 */
export async function analyzeBookContent(content: string): Promise<BookAnalysis> {
  const prompt = `Analiza el siguiente contenido de un libro y determina:
1. El género literario (novela, ensayo, autoayuda, técnico, infantil, poesía, etc.)
2. El tono (formal, informal, académico, narrativo, etc.)
3. El público objetivo
4. Recomendaciones de formato y estilo

Contenido (primeros 3000 caracteres):
${content.substring(0, 3000)}

Responde en formato JSON con esta estructura:
{
  "genre": "género detectado",
  "tone": "tono del texto",
  "targetAudience": "público objetivo",
  "recommendations": ["recomendación 1", "recomendación 2", ...]
}`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "Eres un experto en análisis literario y diseño editorial. Analiza textos y proporciona recomendaciones profesionales de formato.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "book_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              genre: { type: "string" },
              tone: { type: "string" },
              targetAudience: { type: "string" },
              recommendations: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["genre", "tone", "targetAudience", "recommendations"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    const contentStr = typeof content === 'string' ? content : '{}';
    const analysis = JSON.parse(contentStr);
    
    // Determinar plantilla sugerida basada en el género
    const suggestedTemplate = getSuggestedTemplate(analysis.genre);

    return {
      ...analysis,
      suggestedTemplate,
    };
  } catch (error) {
    console.error("Error analyzing book content:", error);
    // Retornar análisis por defecto en caso de error
    return {
      genre: "general",
      suggestedTemplate: "classic",
      tone: "neutral",
      targetAudience: "general",
      recommendations: ["Usar formato estándar para libros"],
    };
  }
}

/**
 * Sugiere estilos de formato basados en el género del libro
 */
export async function suggestFormatting(genre: string, publicationType: string): Promise<StyleSuggestions> {
  const templates: Record<string, StyleSuggestions> = {
    novela: {
      fontFamily: "Georgia",
      fontSize: 11,
      lineHeight: 160,
      marginTop: 19,
      marginBottom: 19,
      marginLeft: 19,
      marginRight: 19,
      marginGutter: 6,
    },
    ensayo: {
      fontFamily: "Garamond",
      fontSize: 11,
      lineHeight: 165,
      marginTop: 20,
      marginBottom: 20,
      marginLeft: 20,
      marginRight: 20,
      marginGutter: 8,
    },
    autoayuda: {
      fontFamily: "Arial",
      fontSize: 11,
      lineHeight: 170,
      marginTop: 20,
      marginBottom: 20,
      marginLeft: 20,
      marginRight: 20,
      marginGutter: 6,
    },
    técnico: {
      fontFamily: "Times New Roman",
      fontSize: 10,
      lineHeight: 150,
      marginTop: 25,
      marginBottom: 25,
      marginLeft: 25,
      marginRight: 20,
      marginGutter: 10,
    },
    infantil: {
      fontFamily: "Comic Sans MS",
      fontSize: 14,
      lineHeight: 180,
      marginTop: 15,
      marginBottom: 15,
      marginLeft: 15,
      marginRight: 15,
      marginGutter: 5,
    },
    poesía: {
      fontFamily: "Palatino",
      fontSize: 12,
      lineHeight: 200,
      marginTop: 25,
      marginBottom: 25,
      marginLeft: 30,
      marginRight: 30,
      marginGutter: 5,
    },
  };

  // Normalizar género
  const normalizedGenre = genre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // Buscar plantilla que coincida
  for (const [key, template] of Object.entries(templates)) {
    if (normalizedGenre.includes(key)) {
      return template;
    }
  }

  // Retornar plantilla clásica por defecto
  return templates.novela;
}

/**
 * Mejora el contenido de un capítulo con sugerencias de IA
 */
export async function improveChapterContent(content: string, improvementType: "grammar" | "style" | "both"): Promise<string> {
  let systemPrompt = "";
  
  if (improvementType === "grammar") {
    systemPrompt = "Eres un corrector profesional. Corrige errores ortográficos y gramaticales manteniendo el estilo del autor. Devuelve solo el texto corregido en HTML.";
  } else if (improvementType === "style") {
    systemPrompt = "Eres un editor literario. Mejora el estilo y la fluidez del texto sin cambiar su significado. Devuelve solo el texto mejorado en HTML.";
  } else {
    systemPrompt = "Eres un editor profesional. Corrige errores y mejora el estilo del texto. Devuelve solo el texto editado en HTML.";
  }

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: content,
        },
      ],
    });

    const result = response.choices[0]?.message?.content;
    return typeof result === 'string' ? result : content;
  } catch (error) {
    console.error("Error improving content:", error);
    return content;
  }
}

/**
 * Determina la plantilla sugerida basada en el género
 */
function getSuggestedTemplate(genre: string): string {
  const genreMap: Record<string, string> = {
    novela: "novel-classic",
    "ciencia ficción": "novel-scifi",
    fantasía: "novel-fantasy",
    romance: "novel-romance",
    misterio: "novel-mystery",
    ensayo: "essay-academic",
    autoayuda: "selfhelp-modern",
    técnico: "textbook-technical",
    infantil: "children-colorful",
    poesía: "poetry-elegant",
  };

  const normalizedGenre = genre.toLowerCase();
  
  for (const [key, template] of Object.entries(genreMap)) {
    if (normalizedGenre.includes(key)) {
      return template;
    }
  }

  return "classic";
}

/**
 * Genera una portada con IA basada en el título y género
 */
export async function generateCoverPrompt(title: string, author: string, genre: string): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "Eres un diseñador de portadas de libros. Crea descripciones detalladas para generar portadas con IA.",
        },
        {
          role: "user",
          content: `Crea un prompt detallado en inglés para generar una portada de libro con IA para:
Título: ${title}
Autor: ${author}
Género: ${genre}

El prompt debe describir la imagen de portada ideal, incluyendo estilo visual, colores, elementos y atmósfera. No incluyas texto en la imagen.`,
        },
      ],
    });

    const result = response.choices[0]?.message?.content;
    return typeof result === 'string' ? result : `Professional book cover for ${genre} genre, elegant design, high quality`;
  } catch (error) {
    console.error("Error generating cover prompt:", error);
    return `Professional book cover for ${genre} genre, elegant design, high quality`;
  }
}
