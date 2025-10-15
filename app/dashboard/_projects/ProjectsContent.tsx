"use client";

import * as React from "react";
import { ProjectsTable } from "./_components/ProjectsTable";

export function ProjectsContent() {
  const handleCreateNew = () => {
    // TODO: Implement create new project functionality
  };

  const handleEdit = (_project: any) => {
    // TODO: Implement edit project functionality
  };

  const handleDelete = (_project: any) => {
    // TODO: Implement delete project functionality
  };

  return (
    <ProjectsTable
      onCreateNew={handleCreateNew}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}

export default ProjectsContent;
