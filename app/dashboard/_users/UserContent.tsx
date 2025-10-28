"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  UsersHeader,
  UsersMetricsCards,
  UsersSearchFilter,
  UsersTable,
  UsersPagination,
  DeleteUserDialog,
} from "./_components";
import { UsersSkeleton } from "./_components/UsersSkeleton";
import {
  createFieldWorker,
  getFieldWorkers,
  updateUser,
  deleteUser,
  type FieldWorker as ApiUser,
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
    relationId?: number;
  }>;
  lastLogin: string;
  joinedDate: string;
}

interface UserContentProps {
  onCreateUser?: () => void;
  onEdit?: () => void;
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [users, setUsers] = React.useState<User[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCreatingUser, setIsCreatingUser] = React.useState(false);
  const itemsPerPage = 10;

  // Fetch users on component mount
  React.useEffect(() => {
    async function fetchUsers() {
      try {
        setIsLoading(true);
        const apiUsers = await getFieldWorkers();

        // Transform API users to match our User interface
        const transformedUsers: User[] = apiUsers
          .map((apiUser: ApiUser) => {
            // Defensive programming - ensure all required fields exist
            if (
              !apiUser ||
              typeof apiUser.id === "undefined" ||
              !apiUser.name ||
              !apiUser.email
            ) {
              // Invalid user data received
              return null;
            }

            // Ensure projects is always an array
            const projects =
              apiUser.projects_relations &&
              Array.isArray(apiUser.projects_relations)
                ? apiUser.projects_relations.map((relation: any) => ({
                    id: relation.project?.id?.toString() || "unknown",
                    name: relation.project?.name || "Unnamed Project",
                    relationId: relation.relation_id,
                  }))
                : [];

            return {
              id: apiUser.id.toString(),
              name: apiUser.name || "Unknown",
              email: apiUser.email || "No email",
              role: apiUser.role || "field_worker",
              status: "Active" as const, // Default status for now
              projects,
              lastLogin: apiUser.last_login
                ? new Date(apiUser.last_login).toLocaleString()
                : "Never",
              joinedDate: apiUser.created_at
                ? new Date(apiUser.created_at).toLocaleString()
                : new Date().toLocaleString(),
            };
          })
          .filter((user) => user !== null) as User[];

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
    // Prevent multiple simultaneous requests
    if (isCreatingUser) {
      toast.warning("Please wait", {
        description: "A user is already being created",
      });
      return;
    }

    try {
      setIsCreatingUser(true);

      // Convert project IDs from string array to integer array
      const projects = data.projectIds
        ? data.projectIds.map((id: string) => parseInt(id, 10))
        : [];

      // Call the createFieldWorker server action
      const response = await createFieldWorker({
        name: data.fullName,
        email: data.email,
        role: data.role,
        password: data.password,
        projects,
      });

      // Extract user and projects from response
      const newUser = response.user;
      const userProjects = response.projects;

      // Transform the new user to match our User interface
      const transformedUser: User = {
        id: newUser.id.toString(),
        name: newUser.name || "Unknown",
        email: newUser.email || "No email",
        role: newUser.role || "field_worker",
        status: "Active" as const,
        projects: Array.isArray(userProjects)
          ? userProjects.map((project, index) => ({
              id: project?.id?.toString() || "unknown",
              name: project?.name || "Unnamed Project",
              relationId: index + 1, // Temporary relation_id, will be updated on refresh
            }))
          : [],
        lastLogin: newUser.last_login
          ? new Date(newUser.last_login).toLocaleString()
          : "Never",
        joinedDate: newUser.created_at
          ? new Date(newUser.created_at).toLocaleString()
          : new Date().toLocaleString(),
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
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleUpdateUser = async (userId: string, data: any) => {
    try {
      // Call the updateUser server action
      const updatedUser = await updateUser(parseInt(userId), data);

      // Transform the updated user to match our User interface
      const transformedUser: User = {
        id: updatedUser.id.toString(),
        name: updatedUser.name || "Unknown",
        email: updatedUser.email || "No email",
        role: updatedUser.role || "field_worker",
        status: "Active" as const,
        projects: Array.isArray(
          updatedUser.project_relations || updatedUser.projects_relations
        )
          ? (
              updatedUser.project_relations ||
              updatedUser.projects_relations ||
              []
            ).map((relation: any) => ({
              id: relation.project?.id?.toString() || "unknown",
              name: relation.project?.name || "Unnamed Project",
              relationId: relation.relation_id,
            }))
          : [],
        lastLogin: updatedUser.last_login
          ? new Date(updatedUser.last_login).toLocaleString()
          : "Never",
        joinedDate: updatedUser.created_at
          ? new Date(updatedUser.created_at).toLocaleString()
          : new Date().toLocaleString(),
      };

      // Update the user in the existing users list
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user.id === userId ? transformedUser : user))
      );
    } catch (error: any) {
      throw new Error(error.message || "Failed to update user");
    }
  };

  const handleDeleteUser = async (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await deleteUser(parseInt(selectedUser.id));

      // Remove the user from the list
      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.id !== selectedUser.id)
      );

      toast.success("User deleted successfully", {
        description: `${selectedUser.name} has been removed`,
      });

      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      toast.error("Failed to delete user", {
        description: error.message || "There was an error deleting the user",
      });
      throw error;
    }
  };

  // Show loading state while fetching data
  if (isLoading) {
    return <UsersSkeleton />;
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
        onDelete={onDelete || handleDeleteUser}
        onCreateUser={handleCreateUser}
        onUpdate={handleUpdateUser}
      />

      {/* Delete Dialog */}
      <DeleteUserDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDeleteUser}
        user={selectedUser}
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
