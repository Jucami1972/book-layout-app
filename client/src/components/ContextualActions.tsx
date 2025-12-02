import { Button } from "@/components/ui/button";
import {
  BookOpen,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  Image,
  List,
  Plus,
  Quote,
  Table,
  Type,
} from "lucide-react";

interface ContextualActionsProps {
  context: "project" | "chapter" | "text-editor";
  onAction: (action: string) => void;
  selectedChapter?: number | null;
}

/**
 * Barra de acciones contextuales que muestra botones diferentes según el contexto
 * - En proyecto: agregar portada, capítulos, páginas preliminares
 * - En capítulo: agregar título, texto, subcapítulos
 * - En editor de texto: formato de texto, listas, tablas, citas
 */
export function ContextualActions({
  context,
  onAction,
  selectedChapter,
}: ContextualActionsProps) {
  if (context === "project") {
    return (
      <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg border">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction("add-cover")}
          className="gap-2"
        >
          <Image className="w-4 h-4" />
          Agregar Portada
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction("add-biography")}
          className="gap-2"
        >
          <FileText className="w-4 h-4" />
          Biografía del Autor
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction("add-dedication")}
          className="gap-2"
        >
          <Quote className="w-4 h-4" />
          Dedicatoria
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction("add-acknowledgments")}
          className="gap-2"
        >
          <FileText className="w-4 h-4" />
          Agradecimientos
        </Button>
        
        <Button
          variant="default"
          size="sm"
          onClick={() => onAction("add-chapter")}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Agregar Nuevo Capítulo
        </Button>
      </div>
    );
  }

  if (context === "chapter" && selectedChapter) {
    return (
      <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg border">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction("add-title")}
          className="gap-2"
        >
          <Heading1 className="w-4 h-4" />
          Agregar Título
        </Button>
        
        <Button
          variant="default"
          size="sm"
          onClick={() => onAction("add-text")}
          className="gap-2"
        >
          <Type className="w-4 h-4" />
          Agregar Texto/Párrafos
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction("add-subchapter-h2")}
          className="gap-2"
        >
          <Heading2 className="w-4 h-4" />
          Agregar Subcapítulo H2
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction("add-subtitle-h3")}
          className="gap-2"
        >
          <Heading3 className="w-4 h-4" />
          Agregar Subtítulo H3
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction("add-example")}
          className="gap-2"
        >
          <BookOpen className="w-4 h-4" />
          Agregar Ejemplo
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onAction("add-reference")}
          className="gap-2"
        >
          <Quote className="w-4 h-4" />
          Agregar Referencia
        </Button>
      </div>
    );
  }

  if (context === "text-editor") {
    return (
      <div className="flex flex-wrap gap-2 p-2 bg-muted/20 rounded-md border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAction("insert-list")}
          className="gap-2"
        >
          <List className="w-4 h-4" />
          Lista
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAction("insert-table")}
          className="gap-2"
        >
          <Table className="w-4 h-4" />
          Tabla
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAction("insert-quote")}
          className="gap-2"
        >
          <Quote className="w-4 h-4" />
          Cita
        </Button>
      </div>
    );
  }

  return null;
}
