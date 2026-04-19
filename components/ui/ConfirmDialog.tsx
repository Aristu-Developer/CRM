"use client";

import { Modal }  from "./Modal";
import { Button } from "./Button";

interface ConfirmDialogProps {
  isOpen:   boolean;
  onClose:  () => void;
  onConfirm: () => void;
  title:    string;
  message:  string;
  loading?: boolean;
  variant?: "danger" | "primary";
}

export function ConfirmDialog({
  isOpen, onClose, onConfirm,
  title, message, loading, variant = "danger",
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant={variant} onClick={onConfirm} loading={loading}>Confirm</Button>
      </div>
    </Modal>
  );
}
