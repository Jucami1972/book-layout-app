import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';

type Step = 'metadata' | 'cover' | 'chapters' | 'preview';

interface BookData {
  title: string;
  author: string;
  year: number;
  rights: string;
  coverImage?: File;
}

export default function BookWizard() {
  const { user } = useAuth();
  const { limits, isLoading } = usePlanLimits();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>('metadata');
  const [bookData, setBookData] = useState<BookData>({
    title: '',
    author: user?.name || '',
    year: new Date().getFullYear(),
    rights: '',
  });

  if (!user) {
    setLocation('/login');
    return null;
  }

  const canCreateBook = limits?.canCreateBook ?? false;
  const booksRemaining = limits?.booksRemaining ?? 0;
  const maxBooks = limits?.plan === 'FREE' ? 1 : 999;

  if (!canCreateBook) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md p-8">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="w-12 h-12 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold text-center mb-4">Límite alcanzado</h2>
          <p className="text-center text-gray-600 mb-6">
            Ya tienes {maxBooks - booksRemaining} de {maxBooks} libro{maxBooks !== 1 ? 's' : ''} en tu plan.
          </p>
          <Button 
            onClick={() => setLocation('/pricing')}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
          >
            Actualizar a PRO
          </Button>
          <Button 
            variant="outline"
            onClick={() => setLocation('/books')}
            className="w-full mt-3"
          >
            Volver a mis libros
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progreso */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            <span className={`text-sm font-medium ${step === 'metadata' ? 'text-blue-600' : 'text-gray-500'}`}>
              Datos del libro
            </span>
            <span className={`text-sm font-medium ${step === 'cover' ? 'text-blue-600' : 'text-gray-500'}`}>
              Portada
            </span>
            <span className={`text-sm font-medium ${step === 'chapters' ? 'text-blue-600' : 'text-gray-500'}`}>
              Capítulos
            </span>
            <span className={`text-sm font-medium ${step === 'preview' ? 'text-blue-600' : 'text-gray-500'}`}>
              Vista previa
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{
                width: step === 'metadata' ? '25%' : 
                       step === 'cover' ? '50%' : 
                       step === 'chapters' ? '75%' : '100%'
              }}
            />
          </div>
        </div>

        {/* Step: Metadata */}
        {step === 'metadata' && (
          <Card className="p-8">
            <h1 className="text-3xl font-bold mb-6">Crea tu libro</h1>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium mb-2">Título del libro *</label>
                <Input
                  value={bookData.title}
                  onChange={(e) => setBookData({ ...bookData, title: e.target.value })}
                  placeholder="Mi primer libro"
                  className="text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Autor *</label>
                <Input
                  value={bookData.author}
                  onChange={(e) => setBookData({ ...bookData, author: e.target.value })}
                  placeholder="Tu nombre"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Año</label>
                  <Input
                    type="number"
                    value={bookData.year}
                    onChange={(e) => setBookData({ ...bookData, year: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">© Derechos reservados</label>
                  <Input
                    value={bookData.rights}
                    onChange={(e) => setBookData({ ...bookData, rights: e.target.value })}
                    placeholder="Ej: Todos los derechos"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setLocation('/books')}>
                Cancelar
              </Button>
              <Button 
                onClick={() => setStep('cover')}
                disabled={!bookData.title || !bookData.author}
                className="bg-blue-600"
              >
                Siguiente <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step: Cover */}
        {step === 'cover' && (
          <Card className="p-8">
            <h1 className="text-3xl font-bold mb-6">Portada del libro</h1>
            
            <div className="space-y-4 mb-8">
              <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:border-blue-500 transition cursor-pointer">
                <p className="text-gray-600 mb-2">📸 Sube la portada de tu libro</p>
                <p className="text-sm text-gray-500">PNG, JPG (recomendado 800x1000px)</p>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setBookData({ ...bookData, coverImage: e.target.files[0] });
                    }
                  }}
                  className="hidden"
                  id="cover-input"
                />
                <label htmlFor="cover-input" className="cursor-pointer block py-4">
                  {bookData.coverImage ? `✓ ${bookData.coverImage.name}` : 'Haz clic para seleccionar'}
                </label>
              </div>
            </div>

            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={() => setStep('metadata')}>
                <ChevronLeft className="w-4 h-4 mr-2" /> Atrás
              </Button>
              <Button 
                onClick={() => setStep('chapters')}
                className="bg-blue-600"
              >
                Siguiente <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step: Chapters */}
        {step === 'chapters' && (
          <Card className="p-8">
            <h1 className="text-3xl font-bold mb-6">Agrega capítulos</h1>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                ℹ️ Puedes agregar capítulos ahora o después en el editor completo.
              </p>
            </div>

            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={() => setStep('cover')}>
                <ChevronLeft className="w-4 h-4 mr-2" /> Atrás
              </Button>
              <Button 
                onClick={() => setStep('preview')}
                className="bg-blue-600"
              >
                Ver previa <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step: Preview */}
        {step === 'preview' && (
          <Card className="p-8">
            <h1 className="text-3xl font-bold mb-6">Tu libro</h1>
            
            <div className="bg-white border rounded-lg p-8 mb-8 shadow-sm">
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold">{bookData.title}</h2>
                <p className="text-gray-600">{bookData.author}</p>
                <p className="text-sm text-gray-500">{bookData.year}</p>
                {bookData.coverImage && (
                  <img 
                    src={URL.createObjectURL(bookData.coverImage)} 
                    alt="Portada" 
                    className="w-32 h-40 object-cover mx-auto rounded"
                  />
                )}
              </div>
            </div>

            <div className="flex justify-between gap-3">
              <Button variant="outline" onClick={() => setStep('chapters')}>
                <ChevronLeft className="w-4 h-4 mr-2" /> Atrás
              </Button>
              <Button 
                onClick={() => {
                  // TODO: Crear libro en BD y redirigir al editor
                  setLocation('/books');
                }}
                className="bg-green-600"
              >
                ✓ Crear libro
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
