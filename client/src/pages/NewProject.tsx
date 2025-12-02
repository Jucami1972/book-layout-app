import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Upload, Loader2, Sparkles } from "lucide-react";
import { Link } from "wouter";

export default function NewProject() {
  const [, setLocation] = useLocation();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");
  const [publicationType, setPublicationType] = useState<"print" | "digital" | "both">("both");
  const [pageSize, setPageSize] = useState("6x9");
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createProjectMutation = trpc.projects.create.useMutation();
  // TODO: Import features requieren ruta de import en backend
  // const analyzeWordMutation = trpc.import.analyzeWord.useMutation();
  // const importToProjectMutation = trpc.import.importToProject.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Por favor ingresa un título para el proyecto");
      return;
    }

    try {
      const result = await createProjectMutation.mutateAsync({
        title,
        subtitle: subtitle || undefined,
        author: author || undefined,
        genre: genre || undefined,
        publicationType,
        pageSize,
      });

      toast.success("Proyecto creado exitosamente");
      setLocation(`/project/${result.id}`);
    } catch (error) {
      toast.error("Error al crear el proyecto");
      console.error(error);
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      toast.error("Por favor selecciona un archivo .docx");
      return;
    }

    setIsImporting(true);

    try {
      // Leer archivo como base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const base64Data = base64.split(',')[1] || base64;

        try {
          // TODO: Analizar documento con IA (requiere ruta de import en backend)
          // toast.info("Analizando documento...");
          // const analysis = await analyzeWordMutation.mutateAsync({
          //   fileData: base64Data,
          // });

          // // Crear proyecto con información detectada
          // const projectResult = await createProjectMutation.mutateAsync({
          //   title: title || "Libro Importado",
          //   author: author || undefined,
          //   genre: analysis.analysis.genre || undefined,
          //   publicationType,
          //   pageSize,
          // });

          // // Importar capítulos
          // toast.info("Importando capítulos...");
          // await importToProjectMutation.mutateAsync({
          //   projectId: projectResult.id,
          //   chapters: analysis.chapters,
          // });

          // toast.success(`Libro importado exitosamente con ${analysis.chapters.length} capítulos`);
          // setLocation(`/project/${projectResult.id}`);
          
          toast.info("La importación de archivos será habilitada en la siguiente versión");
          setIsImporting(false);
        } catch (error) {
          toast.error("Error al procesar el archivo");
          console.error(error);
          setIsImporting(false);
        }
      };

      reader.onerror = () => {
        toast.error("Error al leer el archivo");
        setIsImporting(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Error al importar el archivo");
      console.error(error);
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4">
          <Button variant="ghost" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>
        </div>
      </header>

      <main className="container py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Nuevo Proyecto</h1>
          <p className="text-muted-foreground">
            Crea un proyecto desde cero o importa un documento Word
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-2 border-dashed hover:border-primary transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <CardHeader>
              <Upload className="h-12 w-12 text-primary mb-2" />
              <CardTitle>Importar desde Word</CardTitle>
              <CardDescription>
                Sube un archivo .docx y detectaremos automáticamente la estructura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx"
                onChange={handleFileImport}
                className="hidden"
                disabled={isImporting}
              />
              <Button variant="outline" className="w-full" disabled={isImporting}>
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Seleccionar Archivo
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <Sparkles className="h-12 w-12 text-primary mb-2" />
              <CardTitle>Crear Desde Cero</CardTitle>
              <CardDescription>
                Configura tu proyecto manualmente y añade contenido después
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información del Proyecto</CardTitle>
            <CardDescription>
              Completa los detalles básicos de tu libro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título del Libro *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Mi Primera Novela"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtítulo</Label>
                <Input
                  id="subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Ej: Una historia de superación"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author">Autor</Label>
                <Input
                  id="author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Nombre del autor"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="genre">Género</Label>
                <Input
                  id="genre"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="Ej: Novela, Ensayo, Autoayuda"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="publicationType">Tipo de Publicación</Label>
                  <Select value={publicationType} onValueChange={(v: any) => setPublicationType(v)}>
                    <SelectTrigger id="publicationType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="print">Impreso</SelectItem>
                      <SelectItem value="digital">Digital</SelectItem>
                      <SelectItem value="both">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pageSize">Tamaño de Página</Label>
                  <Select value={pageSize} onValueChange={setPageSize}>
                    <SelectTrigger id="pageSize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6x9">6" × 9" (Novela estándar)</SelectItem>
                      <SelectItem value="5.5x8.5">5.5" × 8.5" (Libro pequeño)</SelectItem>
                      <SelectItem value="8.5x11">8.5" × 11" (Libro grande)</SelectItem>
                      <SelectItem value="A4">A4 (210mm × 297mm)</SelectItem>
                      <SelectItem value="A5">A5 (148mm × 210mm)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={createProjectMutation.isPending} className="flex-1">
                  {createProjectMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Crear Proyecto"
                  )}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/">Cancelar</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
