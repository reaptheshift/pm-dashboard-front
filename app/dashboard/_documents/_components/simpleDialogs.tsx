"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
// Icons removed as they're not used in this component

interface SimpleEditDialogProps {
  trigger: React.ReactNode;
  fileName: string;
  onSave: () => void;
}

export function SimpleEditDialog({
  trigger,
  fileName,
  onSave,
}: SimpleEditDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(fileName);

  const handleSave = () => {
    onSave();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="sm:max-w-[425px]"
        aria-describedby="edit-dialog-description"
      >
        <DialogHeader>
          <DialogTitle>Edit Document</DialogTitle>
          <DialogDescription id="edit-dialog-description">
            Make changes to your document here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="name" className="text-right">
              Name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3 px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SimpleDeleteDialogProps {
  trigger: React.ReactNode;
  fileName: string;
  onDelete: () => void;
}

export function SimpleDeleteDialog({
  trigger,
  fileName,
  onDelete,
}: SimpleDeleteDialogProps) {
  const [open, setOpen] = React.useState(false);

  const handleDelete = () => {
    onDelete();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="sm:max-w-[425px]"
        aria-describedby="delete-dialog-description"
      >
        <DialogHeader>
          <DialogTitle>Delete Document</DialogTitle>
          <DialogDescription id="delete-dialog-description">
            Are you sure you want to delete "{fileName}"? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
