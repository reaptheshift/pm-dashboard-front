"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  UsersHeader,
  UsersMetricsCards,
  UsersSearchFilter,
  UsersTable,
  UsersPagination,
} from "./_components";
import {
  createUser,
  getUsers,
  updateUser,
  type User as ApiUser,
} from "./_actions";

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
  }>;
  lastLogin: string;
  joinedDate: string;
}

interface UserContentProps {
  onCreateUser?: () => void;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
}

export function UserContent({
  onCreateUser,
  onEdit,
  onDelete,
}: UserContentProps) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("date-desc");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [users, setUsers] = React.useState<User[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isHydrated, setIsHydrated] = React.useState(false);
  const itemsPerPage = 10;

  // Handle hydration
  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Fetch users on component mount
  React.useEffect(() => {
    async function fetchUsers() {
      try {
        setIsLoading(true);
        const apiUsers = await getUsers();

        // Transform API users to match our User interface
        const transformedUsers: User[] = apiUsers.map((apiUser: ApiUser) => ({
          id: apiUser.id.toString(),
          name: apiUser.name,
          email: apiUser.email,
          role: apiUser.role,
          status: "Active" as const, // Default status for now
          projects: [], // Empty for now
          lastLogin: apiUser.last_login
            ? new Date(apiUser.last_login).toLocaleString()
            : "Never",
          joinedDate: new Date(apiUser.created_at).toLocaleString(),
        }));

        setUsers(transformedUsers);
      } catch (error: any) {
        toast.error("Failed to fetch users", {
          description: error.message || "There was an error loading users",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsers();
  }, []);

  const totalPages = Math.ceil(users.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = users.slice(startIndex, endIndex);

  // Calculate metrics
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === "Active").length;
  const invitedUsers = users.filter((u) => u.status === "Invited").length;
  const inactiveUsers = users.filter((u) => u.status === "Inactive").length;

  // Dialog handlers
  const handleCreateUser = () => {
    setIsDialogOpen(true);
    onCreateUser?.();
  };

  const handleSubmitUser = async (data: any) => {
    try {
      // Call the createUser server action
      const newUser = await createUser({
        name: data.fullName,
        email: data.email,
        role: data.role,
        password: data.password,
      });

      // Transform the new user to match our User interface
      const transformedUser: User = {
        id: newUser.id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: "Active" as const,
        projects: [],
        lastLogin: newUser.last_login
          ? new Date(newUser.last_login).toLocaleString()
          : "Never",
        joinedDate: new Date(newUser.created_at).toLocaleString(),
      };

      // Add the new user to the existing users list
      setUsers((prevUsers) => [transformedUser, ...prevUsers]);

      // Show success message
      toast.success("User created successfully", {
        description: `${newUser.name} has been added to the team`,
      });

      // Close the dialog
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error("Failed to create user", {
        description: error.message || "There was an error creating the user",
      });
    }
  };

  const handleUpdateUser = async (userId: string, data: any) => {
    try {
      // Call the updateUser server action
      const updatedUser = await updateUser(parseInt(userId), data);

      // Transform the updated user to match our User interface
      const transformedUser: User = {
        id: updatedUser.id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: "Active" as const,
        projects: [],
        lastLogin: updatedUser.last_login
          ? new Date(updatedUser.last_login).toLocaleString()
          : "Never",
        joinedDate: new Date(updatedUser.created_at).toLocaleString(),
      };

      // Update the user in the existing users list
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user.id === userId ? transformedUser : user))
      );
    } catch (error: any) {
      throw new Error(error.message || "Failed to update user");
    }
  };

  // Show loading state until hydrated to prevent hydration mismatch
  if (!isHydrated || isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <UsersHeader
        onCreateUser={handleCreateUser}
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        onSubmitUser={handleSubmitUser}
      />

      {/* Metrics Cards */}
      <UsersMetricsCards
        totalUsers={totalUsers}
        activeUsers={activeUsers}
        invitedUsers={invitedUsers}
        inactiveUsers={inactiveUsers}
      />

      {/* Search & Filter Section */}
      <UsersSearchFilter
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        sortBy={sortBy}
        onSearchChange={setSearchTerm}
        onStatusFilterChange={setStatusFilter}
        onSortChange={setSortBy}
      />

      {/* Users Table */}
      <UsersTable
        users={currentData}
        onEdit={onEdit}
        onDelete={onDelete}
        onCreateUser={handleCreateUser}
        onUpdate={handleUpdateUser}
      />

      {/* Pagination - only show if there are users */}
      {users.length > 0 && (
        <UsersPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

export default UserContent;
