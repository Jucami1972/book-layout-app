import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { BookOpen, Plus, FileText, Calendar, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function Home() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { data: projects, isLoading: projectsLoading } = trpc.projects.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <BookOpen className="h-20 w-20 mx-auto text-primary mb-4" />
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                BookMaster
              </h1>
              <p className="text-xl text-muted-foreground">
                Maquetación Profesional de Libros con IA
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 my-12">
              <Card>
                <CardHeader>
                  <FileText className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Importa Word</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Sube tu borrador en formato .docx y detectamos automáticamente la estructura de capítulos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="h-10 w-10 text-primary mb-2 flex items-center justify-center text-2xl">✨</div>
                  <CardTitle>IA Automática</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Nuestra IA analiza tu contenido y aplica el formato profesional ideal según el género
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="h-10 w-10 text-primary mb-2 flex items-center justify-center text-2xl">📖</div>
                  <CardTitle>Exporta PDF/EPUB</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Genera archivos listos para imprenta o publicación digital con un solo clic
                  </p>
                </CardContent>
              </Card>
            </div>

            <Button size="lg" asChild className="text-lg px-8 py-6">
              <a href={getLoginUrl()}>
                Comenzar Ahora
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">BookMaster</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user && (user.name || user.email)}
            </span>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Mis Proyectos</h2>
            <p className="text-muted-foreground mt-1">
              Gestiona tus libros en proceso de maquetación
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/project/new">
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Proyecto
            </Link>
          </Button>
        </div>

        {projectsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="line-clamp-1">{project.title}</CardTitle>
                  <CardDescription className="line-clamp-1">
                    {project.author || 'Sin autor'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {project.genre && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Género:</span>
                        <span className="font-medium capitalize">{project.genre}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {formatDistanceToNow(new Date(project.updatedAt), { 
                          addSuffix: true,
                          locale: es 
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        project.status === 'ready' ? 'bg-green-100 text-green-800' :
                        project.status === 'formatting' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status === 'draft' && 'Borrador'}
                        {project.status === 'formatting' && 'Formateando'}
                        {project.status === 'ready' && 'Listo'}
                        {project.status === 'published' && 'Publicado'}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={`/project/${project.id}`}>
                      Abrir Proyecto
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No tienes proyectos aún</h3>
              <p className="text-muted-foreground mb-6">
                Crea tu primer proyecto para comenzar a maquetar tu libro
              </p>
              <Button asChild size="lg">
                <Link href="/project/new">
                  <Plus className="h-5 w-5 mr-2" />
                  Crear Primer Proyecto
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
