"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Edit, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  MultiSelect,
  type MultiSelectOption,
} from "@/components/ui/multi-select";
import { getProjects } from "../../_projects/_actions";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  status: "Active" | "Inactive" | "Invited";
  projects: Array<{
    id: string;
    name: string;
    relationId?: number;
  }>;
  lastLogin: string;
  joinedDate: string;
}

interface EditUserDialogProps {
  user: User;
  onUpdate: (userId: string, data: UpdateUserData) => Promise<void>;
}

interface UpdateUserData {
  name?: string;
  email?: string;
  role?: string;
  password?: string;
  projects?: number[];
}

export function EditUserDialog({ user, onUpdate }: EditUserDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: user.name,
    email: user.email,
    role: user.role,
    password: "",
    projectIds: user.projects.map((p) => p.id),
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [projectOptions, setProjectOptions] = React.useState<
    MultiSelectOption[]
  >([]);
  const [isLoadingProjects, setIsLoadingProjects] = React.useState(false);

  // Fetch projects when dialog opens
  React.useEffect(() => {
    if (open) {
      fetchProjects();
    }
  }, [open]);

  const fetchProjects = async () => {
    try {
      setIsLoadingProjects(true);
      const projects = await getProjects();
      const options: MultiSelectOption[] = projects.map((project) => ({
        label: project.name,
        value: project.id.toString(),
      }));
      setProjectOptions(options);
    } catch (error) {
      setProjectOptions([]);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      // Check if projects have changed
      const userProjectIds = user.projects.map((p) => p.id);
      const hasProjectsChanged =
        JSON.stringify(formData.projectIds.sort()) !==
        JSON.stringify(userProjectIds.sort());

      // Only send fields that have changed
      const updateData: UpdateUserData = {};

      if (formData.name !== user.name) {
        updateData.name = formData.name;
      }

      if (formData.email !== user.email) {
        updateData.email = formData.email;
      }

      if (formData.role !== user.role) {
        updateData.role = formData.role;
      }

      if (formData.password) {
        updateData.password = formData.password;
      }

      if (hasProjectsChanged) {
        updateData.projects = formData.projectIds.map((id) => parseInt(id, 10));
      }

      // Only update if there are changes
      if (Object.keys(updateData).length > 0) {
        await onUpdate(user.id, updateData);
        toast.success("User updated successfully");
        setOpen(false);
        setFormData({ ...formData, password: "" }); // Clear password field
      } else {
        toast.info("No changes to update");
      }
    } catch (error: any) {
      toast.error("Failed to update user", {
        description: error.message || "There was an error updating the user",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        password: "",
        projectIds: user.projects.map((p) => p.id),
      });
      setShowPassword(false);
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] p-0 gap-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="space-y-1">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Edit User
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Update user information below
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Content */}
        <form
          onSubmit={handleSubmit}
          className="px-6 py-6 space-y-5 overflow-y-auto flex-1"
        >
          {/* Name */}
          <div className="space-y-2">
            <label
              htmlFor="edit-name"
              className="block text-sm font-medium text-gray-700"
            >
              Name
            </label>
            <Input
              id="edit-name"
              type="text"
              placeholder="Enter name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full"
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label
              htmlFor="edit-email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <Input
              id="edit-email"
              type="email"
              placeholder="Enter email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full"
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label
              htmlFor="edit-password"
              className="block text-sm font-medium text-gray-700"
            >
              Password (optional)
            </label>
            <div className="relative">
              <Input
                id="edit-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <label
              htmlFor="edit-role"
              className="block text-sm font-medium text-gray-700"
            >
              Role
            </label>
            <Select
              value={formData.role}
              onValueChange={(value) =>
                setFormData({ ...formData, role: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="field_worker">Field Worker</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Projects */}
          <div className="space-y-2">
            <label
              htmlFor="edit-projects"
              className="block text-sm font-medium text-gray-700"
            >
              Assign to Projects
            </label>
            <MultiSelect
              options={projectOptions}
              value={formData.projectIds}
              onValueChange={(value) =>
                setFormData({ ...formData, projectIds: value })
              }
              placeholder={
                isLoadingProjects
                  ? "Loading projects..."
                  : projectOptions.length === 0
                  ? "No projects available"
                  : "Select projects"
              }
              disabled={isLoadingProjects || projectOptions.length === 0}
              maxCount={2}
              searchable={true}
            />
            <p className="text-xs text-gray-500">
              Select projects to assign this user to.
            </p>
          </div>
        </form>

        {/* Footer */}
        <DialogFooter className="flex justify-end gap-3 px-6 pb-6">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            type="button"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-gray-900 text-white hover:bg-gray-800"
            onClick={handleSubmit}
          >
            {isLoading ? "Updating..." : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EditUserDialog;
