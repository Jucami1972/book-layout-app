/**
 * Downgrade Confirmation Dialog
 * Shows confirmation before downgrading from PRO to FREE
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DowngradeConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DowngradeConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: DowngradeConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿Cambiar a plan Gratuito?</DialogTitle>
          <DialogDescription>
            Esto cancelará tu suscripción actual.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Al cambiar a Gratuito:</strong>
              <ul className="mt-2 ml-4 list-disc space-y-1 text-sm">
                <li>Pierdes acceso a todas las características PRO</li>
                <li>Se reduce tu límite de proyectos a 1</li>
                <li>Se reduce tu límite de capítulos a 5</li>
                <li>No puedes exportar a PDF/EPUB</li>
                <li>Tu suscripción se cancela inmediatamente</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Procesando...' : 'Cambiar a Gratuito'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
