"use client";

import * as React from "react";
import {
  UsersHeader,
  UsersMetricsCards,
  UsersSearchFilter,
  UsersTable,
  UsersPagination,
} from "./_components";

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
  const itemsPerPage = 10;

  // Users data - will be fetched from API
  const users: User[] = [];

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

  const handleSubmitUser = (data: any) => {
    // TODO: Implement user creation logic
    console.log("Creating user:", data);
    setIsDialogOpen(false);
  };

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
