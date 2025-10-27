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
import { SearchSelect } from "@/components/ui/search-select";
import { DatePicker } from "@/components/ui/date-picker";
import { Upload, X, RotateCcw } from "lucide-react";
import { usaStates } from "@/lib/usa-states";
import { type Project } from "../_actions";

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (formData: ProjectFormData) => void;
  project: Project | null;
}

interface ProjectFormData {
  name: string;
  description: string;
  status: string;
  location: string;
  picture?: File | null;
  startDate?: Date;
  endDate?: Date;
}

export function EditProjectDialog({
  open,
  onOpenChange,
  onSubmit,
  project,
}: EditProjectDialogProps) {
  const [formData, setFormData] = React.useState<ProjectFormData>({
    name: "",
    description: "",
    status: "active",
    location: "",
    picture: null,
    startDate: undefined,
    endDate: undefined,
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Update form data when project changes or dialog opens
  React.useEffect(() => {
    if (project && open) {
      setFormData({
        name: project.name,
        description: project.description || "",
        status: project.status,
        location: project.location || "",
        picture: null, // Don't pre-populate file input
        startDate: project.start_date
          ? new Date(project.start_date)
          : undefined,
        endDate: project.end_date ? new Date(project.end_date) : undefined,
      });
    }
  }, [project, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      // Reset form only after successful submission
      setFormData({
        name: "",
        description: "",
        status: "active",
        location: "",
        picture: null,
        startDate: undefined,
        endDate: undefined,
      });
      onOpenChange(false);
    } catch (error) {
      // Don't close dialog on error, let user try again
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form on close
    setFormData({
      name: "",
      description: "",
      status: "active",
      location: "",
      picture: null,
      startDate: undefined,
      endDate: undefined,
    });
    setIsSubmitting(false);
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

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[512px] max-h-[80vh] p-0 gap-0 flex flex-col"
        aria-describedby="edit-project-dialog-description"
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="space-y-1">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Edit project
            </DialogTitle>
            <DialogDescription
              id="edit-project-dialog-description"
              className="text-sm text-gray-600"
            >
              Update the project details below
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
                    <div
                      title="Click image to change"
                      className="absolute -top-1 -right-1 w-6 h-6 bg-gray-500 text-white rounded-full flex items-center justify-center"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </div>
                  </div>
                ) : project.image ? (
                  <div className="relative">
                    <label className="cursor-pointer">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-50 flex items-center justify-center hover:border-gray-400 hover:bg-gray-100 transition-colors">
                        <Image
                          src={
                            typeof project.image === "object" &&
                            project.image.url
                              ? project.image.url.startsWith("data:")
                                ? project.image.url
                                : project.image.url.startsWith("http")
                                ? project.image.url
                                : `https://xtvj-bihp-mh8d.n7e.xano.io${project.image.url}`
                              : typeof project.image === "string"
                              ? project.image.startsWith("data:")
                                ? project.image
                                : project.image.startsWith("http")
                                ? project.image
                                : `https://xtvj-bihp-mh8d.n7e.xano.io${project.image}`
                              : ""
                          }
                          alt={`${project.name} project image`}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <div
                      title="Click image to change"
                      className="absolute -top-1 -right-1 w-6 h-6 bg-gray-500 text-white rounded-full flex items-center justify-center"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </div>
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
                    : project.image
                    ? "Click to change project picture"
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Location
            </label>
            <SearchSelect
              options={usaStates}
              value={formData.location}
              onValueChange={(value) =>
                setFormData({ ...formData, location: value })
              }
              placeholder="Select location..."
              searchPlaceholder="Search locations..."
              emptyMessage="No location found."
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Start Date
              </label>
              <DatePicker
                value={formData.startDate}
                onChange={(date) =>
                  setFormData({ ...formData, startDate: date })
                }
                placeholder="Select start date"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                End Date
              </label>
              <DatePicker
                value={formData.endDate}
                onChange={(date) => setFormData({ ...formData, endDate: date })}
                placeholder="Select end date"
                disabled={!formData.startDate}
                fromDate={formData.startDate}
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <DialogFooter className="px-6 pb-6 pt-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-gray-900 text-white px-5 py-2 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Updating..." : "Update Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
