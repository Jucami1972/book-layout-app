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
import { Slider } from "@/components/ui/slider";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface CoverEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  title: string;
  author: string;
  onSave: (coverData: CoverData) => void;
}

export interface CoverData {
  imageFile?: File;
  titleX: number;
  titleY: number;
  authorX: number;
  authorY: number;
  titleFontSize: number;
  authorFontSize: number;
  titleColor: string;
  authorColor: string;
}

/**
 * Editor de portada que permite:
 * - Subir imagen de fondo
 * - Posicionar título y autor con controles visuales
 * - Ajustar tamaño de fuente y color
 */
export function CoverEditor({
  open,
  onOpenChange,
  projectId,
  title,
  author,
  onSave,
}: CoverEditorProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [titleX, setTitleX] = useState(50); // Porcentaje
  const [titleY, setTitleY] = useState(40);
  const [authorX, setAuthorX] = useState(50);
  const [authorY, setAuthorY] = useState(60);
  const [titleFontSize, setTitleFontSize] = useState(48);
  const [authorFontSize, setAuthorFontSize] = useState(24);
  const [titleColor, setTitleColor] = useState("#FFFFFF");
  const [authorColor, setAuthorColor] = useState("#FFFFFF");
  const [isDraggingTitle, setIsDraggingTitle] = useState(false);
  const [isDraggingAuthor, setIsDraggingAuthor] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecciona un archivo de imagen");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (isDraggingTitle) {
      setTitleX(x);
      setTitleY(y);
    } else if (isDraggingAuthor) {
      setAuthorX(x);
      setAuthorY(y);
    }
  };

  const handleSave = () => {
    if (!imageFile) {
      toast.error("Por favor sube una imagen de portada");
      return;
    }

    onSave({
      imageFile,
      titleX,
      titleY,
      authorX,
      authorY,
      titleFontSize,
      authorFontSize,
      titleColor,
      authorColor,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Diseñar Portada del Libro</DialogTitle>
          <DialogDescription>
            Sube una imagen y posiciona el título y autor donde desees
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Vista previa de la portada */}
          <div className="space-y-4">
            <div
              ref={canvasRef}
              className="relative w-full aspect-[2/3] bg-muted rounded-lg overflow-hidden cursor-crosshair border-2 border-dashed"
              onClick={handleCanvasClick}
              style={{
                backgroundImage: imagePreview ? `url(${imagePreview})` : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {!imagePreview && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Upload className="w-12 h-12 mx-auto mb-2" />
                    <p>Sube una imagen de portada</p>
                  </div>
                </div>
              )}

              {imagePreview && (
                <>
                  {/* Título */}
                  <div
                    className={`absolute cursor-move ${isDraggingTitle ? "ring-2 ring-primary" : ""}`}
                    style={{
                      left: `${titleX}%`,
                      top: `${titleY}%`,
                      transform: "translate(-50%, -50%)",
                      fontSize: `${titleFontSize}px`,
                      color: titleColor,
                      fontWeight: "bold",
                      textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                      pointerEvents: "none",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDraggingTitle(true);
                      setIsDraggingAuthor(false);
                    }}
                  >
                    {title}
                  </div>

                  {/* Autor */}
                  <div
                    className={`absolute cursor-move ${isDraggingAuthor ? "ring-2 ring-primary" : ""}`}
                    style={{
                      left: `${authorX}%`,
                      top: `${authorY}%`,
                      transform: "translate(-50%, -50%)",
                      fontSize: `${authorFontSize}px`,
                      color: authorColor,
                      textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                      pointerEvents: "none",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDraggingAuthor(true);
                      setIsDraggingTitle(false);
                    }}
                  >
                    {author}
                  </div>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              {imagePreview ? "Cambiar Imagen" : "Subir Imagen"}
            </Button>
          </div>

          {/* Controles */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Modo de Edición</Label>
              <div className="flex gap-2">
                <Button
                  variant={isDraggingTitle ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setIsDraggingTitle(true);
                    setIsDraggingAuthor(false);
                  }}
                >
                  Posicionar Título
                </Button>
                <Button
                  variant={isDraggingAuthor ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setIsDraggingAuthor(true);
                    setIsDraggingTitle(false);
                  }}
                >
                  Posicionar Autor
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Haz clic en el modo y luego en la portada para posicionar
              </p>
            </div>

            {/* Controles del título */}
            <div className="space-y-3">
              <h4 className="font-medium">Título</h4>
              
              <div className="space-y-2">
                <Label>Tamaño de Fuente: {titleFontSize}px</Label>
                <Slider
                  value={[titleFontSize]}
                  onValueChange={([value]) => setTitleFontSize(value)}
                  min={24}
                  max={72}
                  step={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={titleColor}
                    onChange={(e) => setTitleColor(e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={titleColor}
                    onChange={(e) => setTitleColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Controles del autor */}
            <div className="space-y-3">
              <h4 className="font-medium">Autor</h4>
              
              <div className="space-y-2">
                <Label>Tamaño de Fuente: {authorFontSize}px</Label>
                <Slider
                  value={[authorFontSize]}
                  onValueChange={([value]) => setAuthorFontSize(value)}
                  min={16}
                  max={48}
                  step={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={authorColor}
                    onChange={(e) => setAuthorColor(e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={authorColor}
                    onChange={(e) => setAuthorColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar Portada</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
