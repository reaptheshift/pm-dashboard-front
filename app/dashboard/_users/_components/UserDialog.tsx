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

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UserFormData) => void;
}

interface UserFormData {
  fullName: string;
  email: string;
  role: string;
  welcomeMessage: string;
}

export function UserDialog({ open, onOpenChange, onSubmit }: UserDialogProps) {
  const [formData, setFormData] = React.useState<UserFormData>({
    fullName: "",
    email: "",
    role: "PM",
    welcomeMessage: "Welcome to our Team",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    // Reset form
    setFormData({
      fullName: "",
      email: "",
      role: "PM",
      welcomeMessage: "Welcome to our Team",
    });
    onOpenChange(false);
  };

  const handleClose = () => {
    // Reset form on close
    setFormData({
      fullName: "",
      email: "",
      role: "PM",
      welcomeMessage: "Welcome to our Team",
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
        >
          {/* Full Name */}
          <div className="space-y-2">
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-gray-700"
            >
              Full name
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
              required
            />
          </div>

          {/* Email Address */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              E-mail address
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
              required
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <label
              htmlFor="role"
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
                <SelectItem value="PM">PM</SelectItem>
                <SelectItem value="Field Worker">Field Worker</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Welcome Message */}
          <div className="space-y-2">
            <label
              htmlFor="welcomeMessage"
              className="block text-sm font-medium text-gray-700"
            >
              Welcome Message (Optional)
            </label>
            <textarea
              id="welcomeMessage"
              placeholder="Welcome to our Team"
              value={formData.welcomeMessage}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData({ ...formData, welcomeMessage: e.target.value })
              }
              className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
            />
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
