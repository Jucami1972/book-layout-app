import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookEditor } from "@/components/BookEditor";
import { ChapterList } from "@/components/ChapterList";
import { ContextualActions } from "@/components/ContextualActions";
import { CoverEditor, type CoverData } from "@/components/CoverEditor";
import { FrontMatterDialog } from "@/components/FrontMatterDialog";
import { AddChapterDialog, type ChapterData } from "@/components/AddChapterDialog";
import { toast } from "sonner";
import { 
  ArrowLeft, Save, Download, Loader2, FileDown, BookOpen
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function ProjectEditorNew() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const projectId = parseInt(params.id || "0");

  // State for current chapter
  const [currentChapterId, setCurrentChapterId] = useState<number | null>(null);
  const [chapterContent, setChapterContent] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Dialog states
  const [coverEditorOpen, setCoverEditorOpen] = useState(false);
  const [frontMatterDialogOpen, setFrontMatterDialogOpen] = useState(false);
  const [frontMatterType, setFrontMatterType] = useState<"biography" | "dedication" | "acknowledgments" | "copyright">("biography");
  const [addChapterDialogOpen, setAddChapterDialogOpen] = useState(false);

  const utils = trpc.useUtils();
  const { data: project, isLoading: projectLoading } = trpc.projects.get.useQuery({ id: projectId });
  const { data: chapters = [], isLoading: chaptersLoading } = trpc.chapters.list.useQuery({ projectId });
  const { data: currentChapter } = trpc.chapters.get.useQuery(
    { id: currentChapterId! },
    { enabled: !!currentChapterId }
  );

  // Update chapter content when selected chapter changes
  useEffect(() => {
    if (currentChapter) {
      setChapterContent(currentChapter.content || "");
      setChapterTitle(currentChapter.title || "");
      setHasUnsavedChanges(false);
    }
  }, [currentChapter]);

  // Mutations
  const updateProjectMutation = trpc.projects.update.useMutation({
    onSuccess: () => {
      utils.projects.get.invalidate({ id: projectId });
      toast.success("Proyecto actualizado");
    },
  });

  const updateChapterMutation = trpc.chapters.update.useMutation({
    onSuccess: () => {
      utils.chapters.list.invalidate({ projectId });
      toast.success("Capítulo guardado");
      setHasUnsavedChanges(false);
    },
  });

  const createChapterMutation = trpc.chapters.create.useMutation({
    onSuccess: (chapterId) => {
      utils.chapters.list.invalidate({ projectId });
      setCurrentChapterId(chapterId.id);
      toast.success("Capítulo creado");
    },
  });

  const generatePDFMutation = trpc.export.toPDF.useMutation({
    onSuccess: (data: any) => {
      window.open(data.downloadUrl, "_blank");
      toast.success("PDF generado exitosamente");
    },
  });

  const generateEPUBMutation = trpc.export.toEPUB.useMutation({
    onSuccess: (data: any) => {
      window.open(data.downloadUrl, "_blank");
      toast.success("EPUB generado exitosamente");
    },
  });

  // Handlers for contextual actions
  const handleContextualAction = (action: string) => {
    switch (action) {
      case "add-cover":
        setCoverEditorOpen(true);
        break;
      case "add-biography":
        setFrontMatterType("biography");
        setFrontMatterDialogOpen(true);
        break;
      case "add-dedication":
        setFrontMatterType("dedication");
        setFrontMatterDialogOpen(true);
        break;
      case "add-acknowledgments":
        setFrontMatterType("acknowledgments");
        setFrontMatterDialogOpen(true);
        break;
      case "add-chapter":
        setAddChapterDialogOpen(true);
        break;
      case "add-title":
        // Focus on title input
        toast.info("Edita el título del capítulo en el panel derecho");
        break;
      case "add-text":
        // Focus on editor
        toast.info("Escribe el contenido en el editor de texto");
        break;
      case "add-subchapter-h2":
        // Insert H2 in editor
        setChapterContent((prev) => prev + "\n\n## Nuevo Subcapítulo\n\n");
        setHasUnsavedChanges(true);
        break;
      case "add-subtitle-h3":
        // Insert H3 in editor
        setChapterContent((prev) => prev + "\n\n### Nuevo Subtítulo\n\n");
        setHasUnsavedChanges(true);
        break;
      case "add-example":
        // Insert example block
        setChapterContent((prev) => prev + "\n\n> **Ejemplo:**\n> \n> Escribe tu ejemplo aquí...\n\n");
        setHasUnsavedChanges(true);
        break;
      case "add-reference":
        // Insert reference
        setChapterContent((prev) => prev + "\n\n[^1]: Referencia bibliográfica\n\n");
        setHasUnsavedChanges(true);
        break;
    }
  };

  // Handle cover save
  const handleCoverSave = async (coverData: CoverData) => {
    try {
      // TODO: Upload image to S3 first
      // const formData = new FormData();
      // formData.append("file", coverData.imageFile);
      // const uploadResponse = await fetch("/api/upload", { method: "POST", body: formData });
      // const { url, key } = await uploadResponse.json();

      await updateProjectMutation.mutateAsync({
        id: projectId,
        coverTitleX: coverData.titleX as any,
        coverTitleY: coverData.titleY as any,
        coverAuthorX: coverData.authorX as any,
        coverAuthorY: coverData.authorY as any,
        coverTitleFontSize: coverData.titleFontSize as any,
        coverAuthorFontSize: coverData.authorFontSize as any,
        coverTitleColor: coverData.titleColor as any,
        coverAuthorColor: coverData.authorColor as any,
      } as any);

      setCoverEditorOpen(false);
      toast.success("Portada guardada");
    } catch (error) {
      toast.error("Error al guardar la portada");
    }
  };

  // Handle front matter save
  const handleFrontMatterSave = async (content: string) => {
    const updates: any = {};
    updates[frontMatterType] = content;

    await updateProjectMutation.mutateAsync({
      id: projectId,
      ...updates,
    });
  };

  // Handle add chapter
  const handleAddChapter = async (data: ChapterData) => {
    const chapterNumber = chapters.filter(ch => ch.type === "chapter").length + 1;
    let finalTitle = data.title;

    if (data.autoNumber && data.type === "chapter") {
      const format = project?.chapterNumberFormat || "Capítulo {n}";
      const numberPrefix = format.replace("{n}", chapterNumber.toString());
      finalTitle = data.title ? `${numberPrefix}: ${data.title}` : numberPrefix;
    }

    await createChapterMutation.mutateAsync({
      projectId,
      title: finalTitle,
      content: "",
      type: data.type,
      level: data.level,
      orderIndex: chapters.length,
    });
  };

  // Handle save current chapter
  const handleSaveChapter = async () => {
    if (!currentChapterId) return;

    await updateChapterMutation.mutateAsync({
      id: currentChapterId,
      title: chapterTitle,
      content: chapterContent,
    });
  };

  // Handle chapter selection
  const handleChapterSelect = (chapterId: number) => {
    if (hasUnsavedChanges) {
      if (!confirm("Tienes cambios sin guardar. ¿Deseas continuar?")) {
        return;
      }
    }
    setCurrentChapterId(chapterId);
  };

  // Handle export
  const handleExportPDF = () => {
    generatePDFMutation.mutate({ projectId });
  };

  const handleExportEPUB = () => {
    generateEPUBMutation.mutate({ projectId });
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="pt-6">
            <p>Proyecto no encontrado</p>
            <Button asChild className="mt-4">
              <Link href="/">Volver al inicio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{project.title}</h1>
                {project.subtitle && (
                  <p className="text-muted-foreground">{project.subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={generatePDFMutation.isPending}
              >
                {generatePDFMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <FileDown className="w-4 h-4 mr-2" />
                )}
                Exportar PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportEPUB}
                disabled={generateEPUBMutation.isPending}
              >
                {generateEPUBMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <BookOpen className="w-4 h-4 mr-2" />
                )}
                Exportar EPUB
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Chapter List */}
          <div className="col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estructura del Libro</CardTitle>
              </CardHeader>
              <CardContent>
                <ChapterList
                  chapters={chapters}
                  selectedChapterId={currentChapterId}
                  onSelectChapter={handleChapterSelect}
                  onReorder={(reorderedChapters) => {
                    // TODO: Implement reordering
                    console.log("Reorder:", reorderedChapters);
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Center - Editor */}
          <div className="col-span-6 space-y-4">
            {/* Contextual Actions */}
            <ContextualActions
              context={currentChapterId ? "chapter" : "project"}
              selectedChapter={currentChapterId}
              onAction={handleContextualAction}
            />

            {/* Editor */}
            {currentChapterId ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={chapterTitle}
                      onChange={(e) => {
                        setChapterTitle(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="text-xl font-bold bg-transparent border-none outline-none w-full"
                      placeholder="Título del capítulo"
                    />
                    <Button
                      size="sm"
                      onClick={handleSaveChapter}
                      disabled={!hasUnsavedChanges || updateChapterMutation.isPending}
                    >
                      {updateChapterMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Guardar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <BookEditor
                    content={chapterContent}
                    onChange={(content) => {
                      setChapterContent(content);
                      setHasUnsavedChanges(true);
                    }}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No hay capítulo seleccionado</p>
                  <p className="text-sm">
                    Selecciona un capítulo de la lista o crea uno nuevo usando los botones arriba
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar - Project Info */}
          <div className="col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información del Proyecto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Autor</p>
                  <p className="font-medium">{project.author || "Sin autor"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Género</p>
                  <p className="font-medium">{project.genre || "Sin género"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Capítulos</p>
                  <p className="font-medium">{chapters.length}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-2">Estado</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      project.status === "published" ? "bg-green-500" :
                      project.status === "ready" ? "bg-blue-500" :
                      project.status === "formatting" ? "bg-yellow-500" :
                      "bg-gray-500"
                    }`} />
                    <span className="text-sm capitalize">{project.status}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <CoverEditor
        open={coverEditorOpen}
        onOpenChange={setCoverEditorOpen}
        projectId={projectId}
        title={project.title}
        author={project.author || ""}
        onSave={handleCoverSave}
      />

      <FrontMatterDialog
        open={frontMatterDialogOpen}
        onOpenChange={setFrontMatterDialogOpen}
        type={frontMatterType}
        initialValue={project[frontMatterType] || ""}
        onSave={handleFrontMatterSave}
      />

      <AddChapterDialog
        open={addChapterDialogOpen}
        onOpenChange={setAddChapterDialogOpen}
        projectId={projectId}
        chapterCount={chapters.filter(ch => ch.type === "chapter").length}
        autoNumbering={project.autoNumberChapters === true}
        numberFormat={project.chapterNumberFormat || "Capítulo {n}"}
        onSave={handleAddChapter}
      />
    </div>
  );
}
