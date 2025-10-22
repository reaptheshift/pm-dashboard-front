"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Edit, Trash2, Users, Plus } from "lucide-react";
import { EditUserDialog } from "./EditUserDialog";

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

interface UsersTableProps {
  users: User[];
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
  onCreateUser?: () => void;
  onUpdate?: (userId: string, data: any) => Promise<void>;
}

export function UsersTable({
  users,
  onEdit,
  onDelete,
  onCreateUser,
  onUpdate,
}: UsersTableProps) {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "project_manager":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "field_worker":
        return "bg-red-50 text-red-700 border-red-200";
      case "admin":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "manager":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const formatRoleDisplay = (role: string) => {
    switch (role) {
      case "project_manager":
        return "Project Manager";
      case "field_worker":
        return "Field Worker";
      case "admin":
        return "Admin";
      case "manager":
        return "Manager";
      default:
        return role;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-50 text-green-700 border-green-200";
      case "Invited":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Inactive":
        return "bg-gray-50 text-gray-700 border-gray-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-700">All Users</h2>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        {users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No users yet
            </h3>
            <p className="text-gray-500 mb-4">
              Get started by creating your first user.
            </p>
            <Button
              onClick={onCreateUser}
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-6 py-3">User</TableHead>
                <TableHead className="px-6 py-3">Role</TableHead>
                <TableHead className="px-6 py-3">Status</TableHead>
                <TableHead className="px-6 py-3">Projects</TableHead>
                <TableHead className="px-6 py-3">Last login</TableHead>
                <TableHead className="px-6 py-3">Joined date</TableHead>
                <TableHead className="px-6 py-3"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, index) => (
                <TableRow
                  key={user.id}
                  className={index % 2 === 0 ? "bg-gray-50" : ""}
                >
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-white">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">
                          {user.name}
                        </span>
                        <span className="text-sm text-gray-600">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge
                      className={`${getRoleBadgeColor(
                        user.role
                      )} hover:bg-current`}
                    >
                      {formatRoleDisplay(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge
                      className={`${getStatusBadgeColor(
                        user.status
                      )} hover:bg-current`}
                    >
                      <div className="w-2 h-2 rounded-full bg-current mr-2"></div>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-1 flex-wrap">
                      {user.projects.slice(0, 2).map((project) => (
                        <Badge
                          key={project.id}
                          variant="outline"
                          className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200 hover:bg-current"
                        >
                          {project.name}
                        </Badge>
                      ))}
                      {user.projects.length > 2 && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Badge
                              variant="outline"
                              className="text-xs px-2 py-1 bg-gray-50 text-gray-700 border-gray-200 cursor-pointer hover:bg-current"
                            >
                              +{user.projects.length - 2}
                            </Badge>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-3">
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm text-gray-900">
                                All Projects ({user.projects.length})
                              </h4>
                              <div className="space-y-1">
                                {user.projects.map((project) => (
                                  <div
                                    key={project.id}
                                    className="text-sm text-gray-600 py-1 px-2 bg-gray-50 rounded"
                                  >
                                    {project.name}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">
                      {user.lastLogin}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">
                      {user.joinedDate}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {onUpdate ? (
                        <EditUserDialog user={user} onUpdate={onUpdate} />
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit?.(user)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete?.(user)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

export default UsersTable;
