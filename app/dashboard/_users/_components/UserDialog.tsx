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
} from "@/components/ui/dialog";
import { Eye, EyeOff } from "lucide-react";
import {
  MultiSelect,
  type MultiSelectOption,
} from "@/components/ui/multi-select";
import { getProjects } from "../../_projects/_actions";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UserFormData) => void;
}

interface UserFormData {
  fullName: string;
  email: string;
  role: string;
  password: string;
  confirmPassword: string;
  projectIds: string[];
}

export function UserDialog({ open, onOpenChange, onSubmit }: UserDialogProps) {
  const [formData, setFormData] = React.useState<UserFormData>({
    fullName: "",
    email: "",
    role: "field_worker",
    password: "",
    confirmPassword: "",
    projectIds: [],
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
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

      // Fetch projects using server action
      const projects = await getProjects();
      const options: MultiSelectOption[] = projects.map((project) => ({
        label: project.name,
        value: project.id.toString(),
      }));
      setProjectOptions(options);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      setProjectOptions([]);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.fullName.trim()) {
      alert("Full name is required");
      return;
    }
    if (!formData.email.trim()) {
      alert("Email is required");
      return;
    }
    if (!formData.password.trim()) {
      alert("Password is required");
      return;
    }
    if (!formData.confirmPassword.trim()) {
      alert("Confirm password is required");
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert("Please enter a valid email address");
      return;
    }

    console.log("Submitting form data:", formData);
    onSubmit(formData);
    // Reset form
    setFormData({
      fullName: "",
      email: "",
      role: "field_worker",
      password: "",
      confirmPassword: "",
      projectIds: [],
    });
    onOpenChange(false);
  };

  const handleClose = () => {
    // Reset form on close
    setFormData({
      fullName: "",
      email: "",
      role: "field_worker",
      password: "",
      confirmPassword: "",
      projectIds: [],
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[512px] max-h-[80vh] p-0 gap-0 flex flex-col"
        aria-describedby="create-user-dialog-description"
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="space-y-1">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Create User
            </DialogTitle>
            <DialogDescription
              id="create-user-dialog-description"
              className="text-sm text-gray-600"
            >
              Add a new user to your organization.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Content */}
        <form
          onSubmit={handleSubmit}
          className="px-6 py-6 space-y-5 overflow-y-auto flex-1"
          autoComplete="off"
        >
          {/* Full Name */}
          <div className="space-y-2">
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-700"
            >
              Full name <span className="text-red-500">*</span>
            </label>
            <Input
              id="fullName"
              type="text"
              placeholder="Enter name"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              className="w-full"
              autoComplete="off"
              required
            />
          </div>

          {/* Email Address */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              E-mail address <span className="text-red-500">*</span>
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter e-mail address"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full"
              autoComplete="off"
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full pr-10"
                autoComplete="new-password"
                required
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

          {/* Confirm Password */}
          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className="w-full pr-10"
                autoComplete="new-password"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
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
              htmlFor="role"
              className="block text-sm font-medium text-gray-700"
            >
              Role (Fixed)
            </label>
            <Select value={formData.role} disabled={true}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="field_worker">Field Worker</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              All new users are created as Field Workers by default.
            </p>
          </div>

          {/* Projects */}
          <div className="space-y-2">
            <label
              htmlFor="projects"
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
                  : "Select projects (optional)"
              }
              disabled={isLoadingProjects || projectOptions.length === 0}
              maxCount={2}
              searchable={true}
            />
            <p className="text-xs text-gray-500">
              Select projects to assign this user to. You can leave this empty
              and assign projects later.
            </p>
          </div>
        </form>

        {/* Footer */}
        <DialogFooter className="flex justify-end gap-3 px-6 pb-6">
          <Button variant="outline" onClick={handleClose} type="button">
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-gray-900 text-white hover:bg-gray-800"
            onClick={handleSubmit}
          >
            Create User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default UserDialog;
