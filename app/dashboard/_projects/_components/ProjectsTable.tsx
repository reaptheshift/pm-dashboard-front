"use client";

import * as React from "react";
import Image from "next/image";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  FolderOpen,
  Activity,
  CheckCircle,
  Users,
} from "lucide-react";
import { ProjectDialog } from "./ProjectDialog";
import { createProject, type Project } from "../_actions";
import { toast } from "sonner";

interface ProjectsTableProps {
  projects?: Project[];
  isLoading?: boolean;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onCreateNew?: () => void;
  onRefreshProjects?: () => Promise<void>;
}

export function ProjectsTable({
  projects = [],
  isLoading = false,
  onEdit,
  onDelete,
  onCreateNew,
  onRefreshProjects,
}: ProjectsTableProps) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const itemsPerPage = 10;
  const totalPages = Math.ceil((projects?.length || 0) / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = (projects || []).slice(startIndex, endIndex);

  // Calculate metrics
  const totalProjects = projects?.length || 0;
  const activeProjects = (projects || []).filter(
    (p) => p.status === "active"
  ).length;
  const completedProjects = (projects || []).filter(
    (p) => p.status === "completed"
  ).length;
  const totalMembers = 0; // API doesn't provide members data

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "completed":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-50 text-green-700 border-green-200";
      case "completed":
        return "bg-gray-50 text-gray-700 border-gray-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file); // yields: data:<mime>;base64,<data>
    });

  const handleCreateProject = async (data: any) => {
    try {
      const projectImageBase64 = data.picture
        ? await fileToDataUrl(data.picture)
        : null;

      await createProject({
        name: data.name,
        description: data.description || null,
        status: "active",
        start_date: data.startDate || null,
        end_date: data.endDate || null,
        project_image: projectImageBase64,
      });

      // Show success toast
      toast.success("Project created successfully", {
        description: `${data.name} has been added to your projects`,
      });

      // Refresh the projects list
      if (onRefreshProjects) {
        await onRefreshProjects();
      }

      // Close the modal
      setIsCreateModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to create project", {
        description: err.message || "There was an error creating the project",
      });
    }
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Projects</h1>
        </div>
        <Button
          onClick={handleOpenCreateModal}
          className="bg-gray-900 text-white hover:bg-gray-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create new
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">
                Total Projects
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {totalProjects}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
              <FolderOpen className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">
                Active Projects
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {activeProjects}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">
                Completed Projects
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {completedProjects}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-50 border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
              <CheckCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">
                Team Members
              </p>
              <p className="text-2xl font-bold text-gray-900">{totalMembers}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <Filter className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Search & Filter
          </h3>
        </div>

        <div className="flex flex-col md:flex-row lg:flex-row gap-4 h-max items-stretch">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                type="text"
                placeholder="Search by any key"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex-1 flex">
            <Select>
              <SelectTrigger className="w-full flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 flex">
            <Select>
              <SelectTrigger className="w-full flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <SelectValue placeholder="All members" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All members</SelectItem>
                <SelectItem value="assigned">Assigned to me</SelectItem>
                <SelectItem value="team">My team</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 flex">
            <Select>
              <SelectTrigger className="w-full flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <SelectValue placeholder="Sort by: Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 flex">
            <Select>
              <SelectTrigger className="w-full flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <SelectValue placeholder="Last modified date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This week</SelectItem>
                <SelectItem value="month">This month</SelectItem>
                <SelectItem value="year">This year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-700">All Projects</h2>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Loading projects...
              </h3>
              <p className="text-gray-500">
                Please wait while we fetch your projects
              </p>
            </div>
          ) : (projects || []).length === 0 ? (
            <div className="p-12 text-center">
              <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No projects yet
              </h3>
              <p className="text-gray-500 mb-4">
                Get started by creating your first project.
              </p>
              <Button
                onClick={handleOpenCreateModal}
                className="bg-gray-900 text-white hover:bg-gray-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-6 py-3">Project</TableHead>
                  <TableHead className="px-6 py-3">Status</TableHead>
                  <TableHead className="px-6 py-3">Start Date</TableHead>
                  <TableHead className="px-6 py-3">End Date</TableHead>
                  <TableHead className="px-6 py-3">Created</TableHead>
                  <TableHead className="px-6 py-3"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(currentData || []).map((project, index) => (
                  <TableRow
                    key={project.id}
                    className={index % 2 === 0 ? "bg-gray-50" : ""}
                  >
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {project.image &&
                        typeof project.image === "object" &&
                        project.image.url ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-50 flex items-center justify-center">
                            <Image
                              src={
                                project.image.url.startsWith("data:")
                                  ? project.image.url
                                  : project.image.url.startsWith("http")
                                  ? project.image.url
                                  : `https://xtvj-bihp-mh8d.n7e.xano.io${project.image.url}`
                              }
                              alt={`${project.name} project image`}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : project.image &&
                          typeof project.image === "string" ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-50 flex items-center justify-center">
                            <Image
                              src={
                                project.image.startsWith("data:")
                                  ? project.image
                                  : project.image.startsWith("http")
                                  ? project.image
                                  : `https://xtvj-bihp-mh8d.n7e.xano.io${project.image}`
                              }
                              alt={`${project.name} project image`}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-white">
                              {project.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {project.name}
                          </span>
                          <span className="text-sm text-gray-600">
                            {project.description}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge
                        variant={getStatusBadgeVariant(project.status)}
                        className={getStatusBadgeColor(project.status)}
                      >
                        <div className="w-2 h-2 rounded-full bg-current mr-2"></div>
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {project.start_date
                          ? new Date(project.start_date).toLocaleDateString()
                          : "Not set"}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {project.end_date
                          ? new Date(project.end_date).toLocaleDateString()
                          : "Not set"}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit?.(project)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete?.(project)}
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

        {/* Pagination */}
        {(projects || []).length > 0 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Project Dialog */}
      <ProjectDialog
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}

export default ProjectsTable;
