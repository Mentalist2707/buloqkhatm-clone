"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  icon?: React.ReactNode;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  loading = false,
  title,
  description,
  confirmLabel = "Tasdiqlash",
  cancelLabel  = "Bekor qilish",
  variant      = "default",
  icon,
}: ConfirmModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm rounded-2xl">
        <DialogHeader className="text-center sm:text-left">
          {icon && (
            <div className="flex justify-center sm:justify-start mb-2">
              {icon}
            </div>
          )}
          <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <DialogFooter className="flex gap-2 sm:flex-row flex-col-reverse">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "emerald"}
            onClick={onConfirm}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
