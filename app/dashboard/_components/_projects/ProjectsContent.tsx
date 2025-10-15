"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ProjectsContent() {
  const [loading, setLoading] = React.useState(false);
  const [projects, setProjects] = React.useState<
    Array<{
      id: string;
      name: string;
      client: string;
      status: "Active" | "On Hold" | "Completed";
      updatedAt: string;
    }>
  >([
    {
      id: "p1",
      name: "Riverside Tower Renovation",
      client: "Northshore Dev Co.",
      status: "Active",
      updatedAt: "2025-10-10",
    },
    {
      id: "p2",
      name: "Greenfield Logistics Hub",
      client: "LogiTrans Group",
      status: "On Hold",
      updatedAt: "2025-10-06",
    },
    {
      id: "p3",
      name: "Harborfront Residences",
      client: "Seaside Living",
      status: "Completed",
      updatedAt: "2025-09-28",
    },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-gray-900">Projects</h1>
        <div className="flex items-center gap-3">
          <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
            Export
          </button>
          <button className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
            New Project
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row lg:flex-row gap-4 h-max items-stretch">
          <div className="flex-1">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <Input
                type="text"
                placeholder="Search projects"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex-1 flex">
            <Select>
              <SelectTrigger className="w-full flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 flex">
            <Select>
              <SelectTrigger className="w-full flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <SelectValue placeholder="Owner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="me">Assigned to me</SelectItem>
                <SelectItem value="team">My team</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 flex">
            <Select>
              <SelectTrigger className="w-full flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <SelectValue placeholder="Sort by: Updated" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated-desc">Updated (Newest)</SelectItem>
                <SelectItem value="updated-asc">Updated (Oldest)</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm animate-pulse h-40"
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 shadow-sm text-center text-gray-600">
          No projects found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {project.name}
                  </h3>
                  <p className="text-sm text-gray-600">{project.client}</p>
                </div>
                <span
                  className={`px-2.5 py-1 text-xs rounded-full border ${
                    project.status === "Active"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : project.status === "On Hold"
                      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                      : "bg-gray-100 text-gray-700 border-gray-200"
                  }`}
                >
                  {project.status}
                </span>
              </div>
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-gray-500">
                  Updated {project.updatedAt}
                </p>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                    Open
                  </button>
                  <button className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800">
                    Actions
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectsContent;
