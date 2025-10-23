"use client";

import * as React from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X } from "lucide-react";

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProjectFormData) => void;
}

interface ProjectFormData {
  name: string;
  description: string;
  status: string;
  linkExistingDoc: string;
  picture?: File | null;
  startDate?: string;
  endDate?: string;
}

export function ProjectDialog({
  open,
  onOpenChange,
  onSubmit,
}: ProjectDialogProps) {
  const [formData, setFormData] = React.useState<ProjectFormData>({
    name: "",
    description: "",
    status: "Active",
    linkExistingDoc: "",
    picture: null,
    startDate: "",
    endDate: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    // Reset form
    setFormData({
      name: "",
      description: "",
      status: "Active",
      linkExistingDoc: "",
      picture: null,
      startDate: "",
      endDate: "",
    });
    onOpenChange(false);
  };

  const handleClose = () => {
    // Reset form on close
    setFormData({
      name: "",
      description: "",
      status: "Active",
      linkExistingDoc: "",
      picture: null,
      startDate: "",
      endDate: "",
    });
    onOpenChange(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData({ ...formData, picture: file });
    }
  };

  const handleRemovePicture = () => {
    setFormData({ ...formData, picture: null });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[512px] max-h-[80vh] p-0 gap-0 flex flex-col"
        aria-describedby="project-dialog-description"
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="space-y-1">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Create new project
            </DialogTitle>
            <DialogDescription
              id="project-dialog-description"
              className="text-sm text-gray-600"
            >
              Add a new project to your organization. Fill in the details below
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Content */}
        <form
          onSubmit={handleSubmit}
          className="px-6 py-6 space-y-5 overflow-y-auto flex-1"
        >
          {/* Project Picture Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Project Picture
            </label>
            <div className="flex items-center gap-4">
              {/* Circular Picture Display/Upload */}
              <div className="relative">
                {formData.picture ? (
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-50 flex items-center justify-center">
                      <Image
                        src={URL.createObjectURL(formData.picture)}
                        alt="Project preview"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePicture}
                      className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center hover:border-gray-400 hover:bg-gray-100 transition-colors">
                      <Upload className="w-6 h-6 text-gray-400" />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">
                  {formData.picture
                    ? `Selected: ${formData.picture.name}`
                    : "Click to upload project picture"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: 200x200px, JPG or PNG
                </p>
              </div>
            </div>
          </div>

          {/* Project Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Project Name
            </label>
            <Input
              type="text"
              placeholder="Enter Project Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              placeholder="Describe the project..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              required
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Start Date
              </label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                End Date
              </label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="w-full"
                min={
                  formData.startDate || new Date().toISOString().split("T")[0]
                }
              />
            </div>
          </div>

          {/* Link existing doc */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Link existing doc
            </label>
            <Select
              value={formData.linkExistingDoc}
              onValueChange={(value) =>
                setFormData({ ...formData, linkExistingDoc: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose document" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sheet-s201">Sheet s201</SelectItem>
                <SelectItem value="doc-001">Document 001</SelectItem>
                <SelectItem value="manual-v2">Manual v2</SelectItem>
                <SelectItem value="specs-final">Specs Final</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>

        {/* Footer */}
        <DialogFooter className="px-6 pb-6 pt-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="px-5 py-2"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            className="bg-gray-900 text-white px-5 py-2 hover:bg-gray-800"
          >
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
