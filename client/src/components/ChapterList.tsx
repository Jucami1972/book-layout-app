import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from './ui/button';
import { GripVertical, Trash2, FileText, BookOpen, List, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Chapter {
  id: number;
  title: string;
  orderIndex: number;
  type: 'frontmatter' | 'part' | 'chapter' | 'subchapter' | 'backmatter';
  level: number;
}

interface ChapterListProps {
  chapters: Chapter[];
  selectedChapterId?: number | null;
  onSelectChapter: (chapterId: number) => void;
  onReorder: (chapters: Chapter[]) => void;
}

function SortableChapterItem({ chapter, isActive, onClick, onDelete }: { 
  chapter: Chapter; 
  isActive: boolean; 
  onClick: () => void; 
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Determine icon and styling based on chapter type and level
  const getIcon = () => {
    switch (chapter.type) {
      case "part":
        return <FolderOpen className="h-5 w-5" />;
      case "frontmatter":
      case "backmatter":
        return <FileText className="h-4 w-4" />;
      case "subchapter":
        return <List className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getIndentation = () => {
    // Level 1 = parts, no indent
    // Level 2 = chapters, small indent
    // Level 3+ = subchapters, larger indent
    if (chapter.level === 1) return "ml-0";
    if (chapter.level === 2) return "ml-4";
    return "ml-8";
  };

  const getTextStyle = () => {
    if (chapter.level === 1) return "font-semibold text-base";
    if (chapter.level === 2) return "font-medium";
    return "text-sm";
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors group",
        isActive && "bg-accent border-primary",
        getIndentation()
      )}
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      
      <button
        onClick={onClick}
        className="flex-1 text-left flex items-center gap-2 min-w-0"
      >
        <span className="flex-shrink-0 text-muted-foreground">{getIcon()}</span>
        <div className="flex-1 min-w-0">
          <div className={cn("truncate", getTextStyle())}>{chapter.title}</div>
          <div className="text-xs text-muted-foreground capitalize">
            {chapter.type === 'frontmatter' && 'Preliminares'}
            {chapter.type === 'part' && 'Parte'}
            {chapter.type === 'chapter' && 'Capítulo'}
            {chapter.type === 'subchapter' && 'Subcapítulo'}
            {chapter.type === 'backmatter' && 'Material final'}
          </div>
        </div>
      </button>

      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

export function ChapterList({ chapters, selectedChapterId, onSelectChapter, onReorder }: ChapterListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = chapters.findIndex((ch) => ch.id === active.id);
      const newIndex = chapters.findIndex((ch) => ch.id === over.id);
      
      const reordered = arrayMove(chapters, oldIndex, newIndex).map((ch, index) => ({
        ...ch,
        orderIndex: index,
      }));
      
      onReorder(reordered);
    }
  };

  if (chapters.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No hay capítulos aún</p>
        <p className="text-sm mt-1">Importa un archivo Word o crea un capítulo nuevo</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={chapters.map(ch => ch.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {chapters.map((chapter) => (
            <SortableChapterItem
              key={chapter.id}
              chapter={chapter}
              isActive={chapter.id === selectedChapterId}
              onClick={() => onSelectChapter(chapter.id)}
              onDelete={() => {}}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
