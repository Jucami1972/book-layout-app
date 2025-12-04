import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BookOpen, Plus, Download, Edit2, Trash2 } from 'lucide-react';
import { useLocation } from 'wouter';

interface DemoBook {
  id: string;
  title: string;
  author: string;
  year: number;
  createdAt: string;
}

export default function Demo() {
  const [, setLocation] = useLocation();
  const [books, setBooks] = useState<DemoBook[]>([]);
  const [userPlan, setUserPlan] = useState<'FREE' | 'PRO_MONTHLY' | 'PRO_YEARLY'>('FREE');

  // Cargar datos del localStorage
  useEffect(() => {
    const saved = localStorage.getItem('demo_books');
    const savedPlan = localStorage.getItem('demo_plan');
    if (saved) setBooks(JSON.parse(saved));
    if (savedPlan) setUserPlan(JSON.parse(savedPlan));
  }, []);

  // Guardar libros
  useEffect(() => {
    localStorage.setItem('demo_books', JSON.stringify(books));
  }, [books]);

  const canCreateBook = userPlan !== 'FREE' || books.length === 0;
  const maxBooks = userPlan === 'FREE' ? 1 : 999;

  const addBook = () => {
    if (!canCreateBook) {
      alert('Límite de libros alcanzado. Actualiza a PRO');
      return;
    }

    const newBook: DemoBook = {
      id: Date.now().toString(),
      title: 'Nuevo Libro',
      author: 'Tu Nombre',
      year: new Date().getFullYear(),
      createdAt: new Date().toISOString(),
    };

    setBooks([...books, newBook]);
    setLocation(`/book/${newBook.id}/edit`);
  };

  const deleteBook = (id: string) => {
    setBooks(books.filter(b => b.id !== id));
  };

  const upgradePlan = (plan: 'PRO_MONTHLY' | 'PRO_YEARLY') => {
    setUserPlan(plan);
    localStorage.setItem('demo_plan', JSON.stringify(plan));
    alert(`✅ Actualizado a ${plan === 'PRO_MONTHLY' ? 'PRO Mensual' : 'PRO Anual'}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold">📚 BookMaster</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">
              Plan: <span className="text-blue-600">{userPlan === 'FREE' ? 'GRATUITO' : 'PRO'}</span>
            </span>
            <span className="text-sm">
              Libros: <span className="font-bold">{books.length}/{maxBooks}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Planes */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Planes disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free */}
            <Card className={`p-6 ${userPlan === 'FREE' ? 'border-blue-500 border-2' : ''}`}>
              <h3 className="text-xl font-bold mb-2">GRATUITO</h3>
              <p className="text-gray-600 mb-4">1 libro máximo</p>
              <ul className="text-sm space-y-2 mb-6">
                <li>✅ 1 libro</li>
                <li>✅ 5 capítulos máximo</li>
                <li>❌ Sin descargas PDF</li>
              </ul>
              {userPlan === 'FREE' ? (
                <Button disabled className="w-full">Plan actual</Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setUserPlan('FREE');
                    localStorage.setItem('demo_plan', JSON.stringify('FREE'));
                  }}
                  className="w-full"
                >
                  Cambiar
                </Button>
              )}
            </Card>

            {/* Pro Monthly */}
            <Card className={`p-6 border-green-500 ${userPlan === 'PRO_MONTHLY' ? 'border-2' : ''}`}>
              <h3 className="text-xl font-bold mb-2">PRO MENSUAL</h3>
              <p className="text-2xl font-bold text-green-600 mb-4">$9.99/mes</p>
              <ul className="text-sm space-y-2 mb-6">
                <li>✅ Libros ilimitados</li>
                <li>✅ Capítulos ilimitados</li>
                <li>✅ Descargar PDF/EPUB</li>
              </ul>
              <Button 
                onClick={() => upgradePlan('PRO_MONTHLY')}
                disabled={userPlan === 'PRO_MONTHLY'}
                className="w-full bg-green-600"
              >
                {userPlan === 'PRO_MONTHLY' ? 'Plan actual' : 'Activar'}
              </Button>
            </Card>

            {/* Pro Yearly */}
            <Card className={`p-6 border-purple-500 ${userPlan === 'PRO_YEARLY' ? 'border-2' : ''}`}>
              <h3 className="text-xl font-bold mb-2">PRO ANUAL</h3>
              <p className="text-2xl font-bold text-purple-600 mb-4">$79.99/año</p>
              <ul className="text-sm space-y-2 mb-6">
                <li>✅ Libros ilimitados</li>
                <li>✅ Capítulos ilimitados</li>
                <li>✅ Descargar PDF/EPUB</li>
                <li>✅ 33% descuento</li>
              </ul>
              <Button 
                onClick={() => upgradePlan('PRO_YEARLY')}
                disabled={userPlan === 'PRO_YEARLY'}
                className="w-full bg-purple-600"
              >
                {userPlan === 'PRO_YEARLY' ? 'Plan actual' : 'Activar'}
              </Button>
            </Card>
          </div>
        </div>

        {/* Mis Libros */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Mis libros</h2>
            <Button 
              onClick={addBook}
              disabled={!canCreateBook}
              className="bg-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" /> Nuevo libro
            </Button>
          </div>

          {!canCreateBook && (
            <Card className="p-4 mb-6 bg-orange-50 border-orange-200">
              <p className="text-sm text-orange-800">
                📌 Has alcanzado el límite de libros para tu plan. Actualiza a PRO para crear más.
              </p>
            </Card>
          )}

          {books.length === 0 ? (
            <Card className="p-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No tienes libros aún. ¡Crea uno para empezar!</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {books.map(book => (
                <Card key={book.id} className="p-6 hover:shadow-lg transition">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold">{book.title}</h3>
                    <p className="text-sm text-gray-600">{book.author}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setLocation(`/book/${book.id}/edit`)}
                      className="flex-1 bg-blue-600"
                    >
                      <Edit2 className="w-4 h-4 mr-2" /> Editar
                    </Button>
                    
                    {userPlan !== 'FREE' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" /> PDF
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteBook(book.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
