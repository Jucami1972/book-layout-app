import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface FrontMatterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "biography" | "dedication" | "acknowledgments" | "copyright";
  initialValue?: string;
  onSave: (content: string) => void;
}

const DIALOG_CONFIG = {
  biography: {
    title: "Biografía del Autor",
    description: "Escribe una breve biografía que aparecerá en la página 2 del libro",
    placeholder: "Ejemplo: Juan Pérez es escritor y conferencista especializado en desarrollo personal. Ha publicado más de 5 libros bestsellers y ha impactado la vida de miles de personas...",
    label: "Biografía",
  },
  dedication: {
    title: "Dedicatoria",
    description: "Escribe la dedicatoria que aparecerá en la página 7 del libro (en cursiva)",
    placeholder: "Ejemplo: A mi familia, por su apoyo incondicional...",
    label: "Dedicatoria",
  },
  acknowledgments: {
    title: "Agradecimientos",
    description: "Escribe los agradecimientos que aparecerán al inicio o final del libro",
    placeholder: "Ejemplo: Quiero agradecer a todas las personas que hicieron posible este libro...",
    label: "Agradecimientos",
  },
  copyright: {
    title: "Información de Copyright",
    description: "Información legal y de derechos de autor que aparecerá en la página 4",
    placeholder: "Ejemplo:\n© 2024 Juan Pérez. Todos los derechos reservados.\nISBN: 978-1-234567-89-0\nPrimera edición: Enero 2024\n\nNinguna parte de esta publicación puede ser reproducida...",
    label: "Copyright y Créditos",
  },
};

/**
 * Diálogo reutilizable para agregar elementos de front matter
 * (biografía, dedicatoria, agradecimientos, copyright)
 */
export function FrontMatterDialog({
  open,
  onOpenChange,
  type,
  initialValue = "",
  onSave,
}: FrontMatterDialogProps) {
  const [content, setContent] = useState(initialValue);
  const config = DIALOG_CONFIG[type];

  const handleSave = () => {
    onSave(content);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">{config.label}</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={config.placeholder}
              rows={type === "copyright" ? 12 : 8}
              className="font-serif"
            />
          </div>

          {type === "dedication" && (
            <p className="text-sm text-muted-foreground">
              💡 La dedicatoria aparecerá centrada y en cursiva en la página 7
            </p>
          )}

          {type === "biography" && (
            <p className="text-sm text-muted-foreground">
              💡 La biografía aparecerá en la página 2, antes del título principal
            </p>
          )}

          {type === "copyright" && (
            <p className="text-sm text-muted-foreground">
              💡 Incluye: copyright, ISBN, editorial, año de publicación, y restricciones legales
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
