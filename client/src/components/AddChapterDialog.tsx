import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface AddChapterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  chapterCount: number;
  autoNumbering: boolean;
  numberFormat: string;
  onSave: (data: ChapterData) => void;
}

export interface ChapterData {
  title: string;
  type: "frontmatter" | "part" | "chapter" | "subchapter" | "backmatter";
  level: number;
  autoNumber: boolean;
}

/**
 * Diálogo para agregar un nuevo capítulo con opciones de tipo y numeración
 */
export function AddChapterDialog({
  open,
  onOpenChange,
  projectId,
  chapterCount,
  autoNumbering,
  numberFormat,
  onSave,
}: AddChapterDialogProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ChapterData["type"]>("chapter");
  const [useAutoNumber, setUseAutoNumber] = useState(autoNumbering);

  const getLevel = (chapterType: ChapterData["type"]): number => {
    switch (chapterType) {
      case "part":
        return 1;
      case "chapter":
        return 2;
      case "subchapter":
        return 3;
      default:
        return 1;
    }
  };

  const getPreviewTitle = () => {
    if (type === "chapter" && useAutoNumber) {
      const chapterNumber = chapterCount + 1;
      const formatted = numberFormat.replace("{n}", chapterNumber.toString());
      return title ? `${formatted}: ${title}` : formatted;
    }
    return title;
  };

  const handleSave = () => {
    if (!title.trim() && type !== "chapter") {
      return;
    }

    onSave({
      title: title.trim(),
      type,
      level: getLevel(type),
      autoNumber: useAutoNumber && type === "chapter",
    });

    // Reset form
    setTitle("");
    setType("chapter");
    setUseAutoNumber(autoNumbering);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Capítulo</DialogTitle>
          <DialogDescription>
            El capítulo se agregará al final del libro y siempre comenzará en página impar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Sección</Label>
            <Select value={type} onValueChange={(value: any) => setType(value)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="frontmatter">
                  Preliminar (Prólogo, Prefacio)
                </SelectItem>
                <SelectItem value="part">PARTE (División Principal)</SelectItem>
                <SelectItem value="chapter">Capítulo</SelectItem>
                <SelectItem value="subchapter">Subcapítulo</SelectItem>
                <SelectItem value="backmatter">
                  Final (Epílogo, Apéndice)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">
              {type === "chapter" ? "Título del Capítulo" : "Título"}
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === "chapter"
                  ? "Ej: El Miedo al Descubierto"
                  : type === "part"
                    ? "Ej: COMPRENDIENDO EL MIEDO"
                    : "Ej: Prólogo"
              }
            />
          </div>

          {type === "chapter" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoNumber"
                  checked={useAutoNumber}
                  onChange={(e) => setUseAutoNumber(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="autoNumber" className="cursor-pointer">
                  Numerar automáticamente
                </Label>
              </div>
              {useAutoNumber && (
                <p className="text-sm text-muted-foreground">
                  Formato: {numberFormat.replace("{n}", (chapterCount + 1).toString())}
                </p>
              )}
            </div>
          )}

          {getPreviewTitle() && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Vista previa:</p>
              <p className="font-semibold">{getPreviewTitle()}</p>
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong>PARTE:</strong> División principal del libro (Ej: PARTE I, PARTE II)
            </p>
            <p>
              <strong>Capítulo:</strong> Capítulo normal con numeración automática
            </p>
            <p>
              <strong>Subcapítulo:</strong> Subdivisión dentro de un capítulo
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() && type !== "chapter"}>
            Agregar Capítulo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
