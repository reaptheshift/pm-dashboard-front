"use client";

import * as React from "react";
import { ProjectsTable } from "./_components/ProjectsTable";
import { ProjectsSkeleton } from "./_components/ProjectsSkeleton";
import { getProjects, type Project } from "./_actions";

export function ProjectsContent() {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Fetch projects on component mount
  React.useEffect(() => {
    async function fetchProjects() {
      try {
        setIsLoading(true);
        const fetchedProjects = await getProjects();
        setProjects(fetchedProjects);
      } catch (error: any) {
        // Failed to fetch projects
      } finally {
        setIsLoading(false);
      }
    }

    fetchProjects();
  }, []);

  const handleCreateNew = () => {
    // TODO: Implement create new project functionality
  };

  const handleEdit = () => {
    // TODO: Implement edit project functionality
  };

  const handleDelete = () => {
    // TODO: Implement delete project functionality
  };

  const handleRefreshProjects = async () => {
    try {
      const fetchedProjects = await getProjects();
      setProjects(fetchedProjects);
    } catch (error: any) {
      // Failed to refresh projects
    }
  };

  if (isLoading) {
    return <ProjectsSkeleton />;
  }

  return (
    <ProjectsTable
      projects={projects}
      isLoading={isLoading}
      onCreateNew={handleCreateNew}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onRefreshProjects={handleRefreshProjects}
    />
  );
}

export default ProjectsContent;
