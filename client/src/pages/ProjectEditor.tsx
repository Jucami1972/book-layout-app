import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookEditor } from "@/components/BookEditor";
import { ChapterList } from "@/components/ChapterList";
import { toast } from "sonner";
import { 
  ArrowLeft, Save, Plus, Download, Settings, Sparkles, Loader2,
  FileDown, BookOpen, Wand2
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function ProjectEditor() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const projectId = parseInt(params.id || "0");

  const [currentChapterId, setCurrentChapterId] = useState<number | null>(null);
  const [chapterContent, setChapterContent] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const utils = trpc.useUtils();
  const { data: project, isLoading: projectLoading } = trpc.projects.get.useQuery({ id: projectId });
  const { data: chapters = [], isLoading: chaptersLoading } = trpc.chapters.list.useQuery({ projectId });
  const { data: currentChapter } = trpc.chapters.get.useQuery(
    { id: currentChapterId! },
    { enabled: !!currentChapterId }
  );

  const updateChapterMutation = trpc.chapters.update.useMutation({
    onSuccess: () => {
      utils.chapters.list.invalidate({ projectId });
      toast.success("Capítulo guardado");
      setHasUnsavedChanges(false);
    },
  });

  const createChapterMutation = trpc.chapters.create.useMutation({
    onSuccess: (data) => {
      utils.chapters.list.invalidate({ projectId });
      setCurrentChapterId(data.id);
      toast.success("Capítulo creado");
    },
    onError: (error: any) => {
      console.error("[ProjectEditor] Create chapter error:", error);
      toast.error(error.message || "Error al crear capítulo");
    },
  });

  const deleteChapterMutation = trpc.chapters.delete.useMutation({
    onSuccess: () => {
      utils.chapters.list.invalidate({ projectId });
      setCurrentChapterId(null);
      toast.success("Capítulo eliminado");
    },
  });

  const reorderChaptersMutation = trpc.chapters.reorder.useMutation({
    onSuccess: () => {
      utils.chapters.list.invalidate({ projectId });
    },
  });

  const generatePDFMutation = trpc.export.toPDF.useMutation({
    onSuccess: (data: any) => {
      window.open(data.downloadUrl, '_blank');
      toast.success("PDF generado exitosamente");
    },
  });

  const generateEPUBMutation = trpc.export.toEPUB.useMutation({
    onSuccess: (data: any) => {
      window.open(data.downloadUrl, '_blank');
      toast.success("EPUB generado exitosamente");
    },
  });

  // TODO: AI features requieren ruta de IA en backend
  // const improveChapterMutation = trpc.ai.improveChapter.useMutation({
  //   onSuccess: (improved) => {
  //     setChapterContent(improved);
  //     setHasUnsavedChanges(true);
  //     toast.success("Contenido mejorado con IA");
  //   },
  // });

  // const generateCoverMutation = trpc.ai.generateCover.useMutation({
  //   onSuccess: () => {
  //     utils.projects.get.invalidate({ id: projectId });
  //     toast.success("Portada generada con IA");
  //   },
  // });

  useEffect(() => {
    if (currentChapter) {
      setChapterContent(currentChapter.content);
      setChapterTitle(currentChapter.title);
      setHasUnsavedChanges(false);
    }
  }, [currentChapter]);

  useEffect(() => {
    if (chapters.length > 0 && !currentChapterId) {
      setCurrentChapterId(chapters[0]?.id || null);
    }
  }, [chapters, currentChapterId]);

  const handleSaveChapter = async () => {
    if (!currentChapterId) return;

    await updateChapterMutation.mutateAsync({
      id: currentChapterId,
      title: chapterTitle,
      content: chapterContent,
    });
  };

  const handleCreateChapter = async () => {
    const newChapter = await createChapterMutation.mutateAsync({
      projectId,
      title: "Nuevo Capítulo",
      content: "<p>Comienza a escribir aquí...</p>",
      type: "chapter",
      orderIndex: chapters.length,
    });
    setCurrentChapterId(newChapter.id);
  };

  const handleDeleteChapter = async (chapterId: number) => {
    if (confirm("¿Estás seguro de eliminar este capítulo?")) {
      await deleteChapterMutation.mutateAsync({ id: chapterId });
    }
  };

  const handleReorderChapters = async (reordered: any[]) => {
    await reorderChaptersMutation.mutateAsync({
      projectId,
      chapterOrders: reordered.map(ch => ({ id: ch.id, orderIndex: ch.orderIndex })),
    });
  };

  // TODO: AI features requieren ruta de IA en backend
  // const handleImproveWithAI = async (type: "grammar" | "style" | "both") => {
  //   if (!chapterContent) {
  //     toast.error("No hay contenido para mejorar");
  //     return;
  //   }
  //
  //   await improveChapterMutation.mutateAsync({
  //     content: chapterContent,
  //     improvementType: type,
  //   });
  // };

  if (projectLoading || chaptersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Proyecto no encontrado</CardTitle>
            <CardDescription>El proyecto que buscas no existe</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/">Volver al inicio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Proyectos
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="font-semibold">{project.title}</h1>
              <p className="text-xs text-muted-foreground">{project.author || 'Sin autor'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <span className="text-xs text-amber-600">Cambios sin guardar</span>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveChapter}
              disabled={!currentChapterId || updateChapterMutation.isPending}
            >
              {updateChapterMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Exportar Libro</DialogTitle>
                  <DialogDescription>
                    Genera tu libro en formato PDF o EPUB
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Button
                    className="w-full"
                    onClick={() => generatePDFMutation.mutate({ projectId })}
                    disabled={generatePDFMutation.isPending}
                  >
                    {generatePDFMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileDown className="h-4 w-4 mr-2" />
                    )}
                    Generar PDF
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => generateEPUBMutation.mutate({ projectId })}
                    disabled={generateEPUBMutation.isPending}
                  >
                    {generateEPUBMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <BookOpen className="h-4 w-4 mr-2" />
                    )}
                    Generar EPUB
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar de capítulos */}
        <aside className="w-80 border-r bg-card overflow-y-auto">
          <div className="p-4 border-b">
            <Button className="w-full" onClick={handleCreateChapter}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Capítulo
            </Button>
          </div>
          <div className="p-4">
            <ChapterList
              chapters={chapters as any}
              selectedChapterId={currentChapterId || undefined}
              onSelectChapter={setCurrentChapterId}
              onReorder={handleReorderChapters}
            />
          </div>
        </aside>

        {/* Área principal de edición */}
        <main className="flex-1 overflow-y-auto">
          {currentChapterId ? (
            <div className="container max-w-4xl py-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="chapter-title">Título del Capítulo</Label>
                  <Input
                    id="chapter-title"
                    value={chapterTitle}
                    onChange={(e) => {
                      setChapterTitle(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="text-2xl font-bold border-0 focus-visible:ring-0 px-0"
                  />
                </div>

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Wand2 className="h-4 w-4 mr-2" />
                        Mejorar con IA
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Mejorar Capítulo con IA</DialogTitle>
                        <DialogDescription>
                          Esta función será habilitada en la siguiente versión
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3">
                        <Button
                          className="w-full"
                          onClick={() => {}}
                          disabled={true}
                        >
                          Corrección Ortográfica y Gramatical
                        </Button>
                        <Button
                          className="w-full"
                          onClick={() => {}}
                          disabled={true}
                        >
                          Mejorar Estilo Literario
                        </Button>
                        <Button
                          className="w-full"
                          onClick={() => {}}
                          disabled={true}
                        >
                          Corrección Completa
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <BookEditor
                content={chapterContent}
                onChange={(newContent) => {
                  setChapterContent(newContent);
                  setHasUnsavedChanges(true);
                }}
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Selecciona un capítulo para comenzar a editar</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
