"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { UserDialog } from "./UserDialog";

interface UsersHeaderProps {
  onCreateUser: () => void;
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  onSubmitUser: (data: any) => void;
}

export function UsersHeader({
  onCreateUser,
  isDialogOpen,
  setIsDialogOpen,
  onSubmitUser,
}: UsersHeaderProps) {
  const handleCreateUser = () => {
    onCreateUser();
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Users</h1>
        </div>
        <Button
          onClick={handleCreateUser}
          className="bg-gray-900 text-white hover:bg-gray-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create User
        </Button>
      </div>

      <UserDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={onSubmitUser}
      />
    </>
  );
}

export default UsersHeader;
