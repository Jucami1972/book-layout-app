import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Type,
  List,
  Image as ImageIcon,
  BookOpen,
  FileText,
  Plus,
  Trash2,
  Eye,
  Download,
} from 'lucide-react';

type BlockType = 'h1' | 'h2' | 'h3' | 'paragraph' | 'list' | 'image' | 'reference' | 'pagebreak';

interface ContentBlock {
  id: string;
  type: BlockType;
  content: string;
  level?: number; // para títulos
}

interface Chapter {
  id: string;
  title: string;
  blocks: ContentBlock[];
}

export default function BookEditor() {
  const [chapters, setChapters] = useState<Chapter[]>([
    { id: '1', title: 'Capítulo 1', blocks: [] },
  ]);
  const [selectedChapter, setSelectedChapter] = useState('1');
  const [showPreview, setShowPreview] = useState(false);

  const currentChapter = chapters.find(c => c.id === selectedChapter)!;

  const addBlock = (type: BlockType) => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type,
      content: '',
      level: type === 'h2' ? 2 : type === 'h3' ? 3 : undefined,
    };
    
    const updated = chapters.map(c =>
      c.id === selectedChapter
        ? { ...c, blocks: [...c.blocks, newBlock] }
        : c
    );
    setChapters(updated);
  };

  const updateBlock = (blockId: string, content: string) => {
    const updated = chapters.map(c =>
      c.id === selectedChapter
        ? {
            ...c,
            blocks: c.blocks.map(b =>
              b.id === blockId ? { ...b, content } : b
            ),
          }
        : c
    );
    setChapters(updated);
  };

  const deleteBlock = (blockId: string) => {
    const updated = chapters.map(c =>
      c.id === selectedChapter
        ? { ...c, blocks: c.blocks.filter(b => b.id !== blockId) }
        : c
    );
    setChapters(updated);
  };

  const addChapter = () => {
    const newChapter: Chapter = {
      id: Date.now().toString(),
      title: `Capítulo ${chapters.length + 1}`,
      blocks: [],
    };
    setChapters([...chapters, newChapter]);
    setSelectedChapter(newChapter.id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-screen">
        {/* Sidebar - Capítulos */}
        <div className="lg:col-span-1 bg-white border-r p-4 overflow-y-auto">
          <h2 className="font-bold text-lg mb-4">📚 Capítulos</h2>
          
          <div className="space-y-2 mb-4">
            {chapters.map(ch => (
              <button
                key={ch.id}
                onClick={() => setSelectedChapter(ch.id)}
                className={`w-full text-left p-3 rounded-lg transition ${
                  selectedChapter === ch.id
                    ? 'bg-blue-100 border-l-4 border-blue-600 font-medium'
                    : 'hover:bg-gray-100'
                }`}
              >
                {ch.title}
              </button>
            ))}
          </div>

          <Button
            onClick={addChapter}
            variant="outline"
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" /> Nuevo capítulo
          </Button>
        </div>

        {/* Editor Principal */}
        <div className="lg:col-span-3 flex flex-col">
          {/* Toolbar */}
          <div className="bg-white border-b p-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => addBlock('h1')}
              title="Título principal"
            >
              <BookOpen className="w-4 h-4 mr-2" /> H1
            </Button>
            <Button
              size="sm"
              onClick={() => addBlock('h2')}
              title="Subtítulo"
            >
              <Type className="w-4 h-4 mr-2" /> H2
            </Button>
            <Button
              size="sm"
              onClick={() => addBlock('h3')}
              title="Sub-subtítulo"
            >
              <Type className="w-4 h-4 mr-2" /> H3
            </Button>

            <div className="border-r mx-2" />

            <Button
              size="sm"
              onClick={() => addBlock('paragraph')}
              title="Párrafo"
            >
              <FileText className="w-4 h-4 mr-2" /> Párrafo
            </Button>
            <Button
              size="sm"
              onClick={() => addBlock('list')}
              title="Lista"
            >
              <List className="w-4 h-4 mr-2" /> Lista
            </Button>
            <Button
              size="sm"
              onClick={() => addBlock('image')}
              title="Imagen"
            >
              <ImageIcon className="w-4 h-4 mr-2" /> Imagen
            </Button>
            <Button
              size="sm"
              onClick={() => addBlock('reference')}
              title="Referencia"
            >
              <BookOpen className="w-4 h-4 mr-2" /> Referencia
            </Button>

            <div className="border-r mx-2" />

            <Button
              size="sm"
              onClick={() => addBlock('pagebreak')}
              variant="outline"
              title="Salto de página"
            >
              📄 Página nueva
            </Button>

            <div className="ml-auto flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="w-4 h-4 mr-2" /> {showPreview ? 'Editor' : 'Vista previa'}
              </Button>
              <Button size="sm" className="bg-green-600">
                <Download className="w-4 h-4 mr-2" /> Descargar PDF
              </Button>
            </div>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-6">
            {!showPreview ? (
              // Editor
              <div className="space-y-4 max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">{currentChapter.title}</h1>

                {currentChapter.blocks.length === 0 ? (
                  <Card className="p-8 text-center text-gray-500">
                    <p>Comienza a escribir. Usa los botones arriba para agregar contenido.</p>
                  </Card>
                ) : (
                  currentChapter.blocks.map((block) => (
                    <div key={block.id} className="flex gap-2">
                      <div className="flex-1">
                        {block.type === 'h1' && (
                          <textarea
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, e.target.value)}
                            placeholder="Título principal..."
                            className="w-full text-2xl font-bold p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                          />
                        )}
                        {block.type === 'h2' && (
                          <textarea
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, e.target.value)}
                            placeholder="Subtítulo..."
                            className="w-full text-xl font-bold p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                          />
                        )}
                        {block.type === 'h3' && (
                          <textarea
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, e.target.value)}
                            placeholder="Sub-subtítulo..."
                            className="w-full text-lg font-bold p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={1}
                          />
                        )}
                        {block.type === 'paragraph' && (
                          <textarea
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, e.target.value)}
                            placeholder="Escribe tu párrafo aquí..."
                            className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-24"
                          />
                        )}
                        {block.type === 'list' && (
                          <textarea
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, e.target.value)}
                            placeholder="Ítems de lista (uno por línea)..."
                            className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-24 font-mono text-sm"
                          />
                        )}
                        {block.type === 'image' && (
                          <div className="border-2 border-dashed rounded-lg p-4">
                            <input type="file" accept="image/*" className="w-full" />
                          </div>
                        )}
                        {block.type === 'reference' && (
                          <input
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, e.target.value)}
                            placeholder="Autor, Título, Año..."
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                        {block.type === 'pagebreak' && (
                          <div className="border-t-2 border-dashed py-4 text-center text-gray-400">
                            — Salto de página —
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteBlock(block.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              // Vista previa
              <div className="bg-white rounded-lg shadow-lg p-12 max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">{currentChapter.title}</h1>
                {currentChapter.blocks.map((block) => (
                  <div key={block.id} className="mb-4">
                    {block.type === 'h1' && <h1 className="text-2xl font-bold">{block.content}</h1>}
                    {block.type === 'h2' && <h2 className="text-xl font-bold mt-4 mb-2">{block.content}</h2>}
                    {block.type === 'h3' && <h3 className="text-lg font-bold mt-3 mb-2">{block.content}</h3>}
                    {block.type === 'paragraph' && <p className="text-justify leading-7">{block.content}</p>}
                    {block.type === 'list' && (
                      <ul className="list-disc list-inside space-y-1">
                        {block.content.split('\n').map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    )}
                    {block.type === 'reference' && <p className="italic text-sm text-gray-600">{block.content}</p>}
                    {block.type === 'pagebreak' && <div className="page-break" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
