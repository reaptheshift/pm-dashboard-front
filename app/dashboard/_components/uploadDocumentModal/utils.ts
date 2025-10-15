export const getFileTypeIcon = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  const iconMap: { [key: string]: { icon: string; alt: string } } = {
    pdf: { icon: "/images/pdf-icon.svg", alt: "PDF" },
    docx: { icon: "/images/docx-icon.svg", alt: "DOCX" },
    doc: { icon: "/images/docx-icon.svg", alt: "DOC" },
    csv: { icon: "/images/csv-icon.svg", alt: "CSV" },
    xlsx: { icon: "/images/csv-icon.svg", alt: "XLSX" },
    xls: { icon: "/images/csv-icon.svg", alt: "XLS" },
  };
  return (
    iconMap[extension || ""] || { icon: "/images/docx-icon.svg", alt: "FILE" }
  );
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

export interface FolderStructure {
  name: string;
  files: File[];
  subfolders: { [key: string]: FolderStructure };
}

export const processFolderStructure = (files: File[]): FolderStructure => {
  // Check if we have folder structure (files with webkitRelativePath containing "/")
  const hasFolderStructure = files.some(
    (file) =>
      (file as any).webkitRelativePath &&
      (file as any).webkitRelativePath.includes("/")
  );

  if (!hasFolderStructure) {
    // No folder structure - return a simple structure with files at root
    return {
      name: "Files",
      files: files,
      subfolders: {},
    };
  }

  // We have folder structure - find the root folder name
  const rootFolderName = files
    .map((file) => (file as any).webkitRelativePath)
    .filter((path) => path && path.includes("/"))
    .map((path) => path.split("/")[0])
    .find((name) => name); // Get the first root folder name

  const structure: FolderStructure = {
    name: rootFolderName || "Uploaded Folder",
    files: [],
    subfolders: {},
  };

  // Ensure structure is properly initialized
  if (!structure.files) {
    structure.files = [];
  }
  if (!structure.subfolders) {
    structure.subfolders = {};
  }

  files.forEach((file) => {
    const webkitPath = (file as any).webkitRelativePath;
    if (webkitPath) {
      const pathParts = webkitPath.split("/");
      if (pathParts.length === 1) {
        // File is directly in the root folder
        if (structure.files) {
          structure.files.push(file);
        }
      } else {
        // File is in a subfolder - create the folder structure
        // Skip the first part since it's the root folder name we already set
        let currentFolder = structure;
        for (let i = 1; i < pathParts.length - 1; i++) {
          const folderName = pathParts[i];
          if (!currentFolder.subfolders[folderName]) {
            currentFolder.subfolders[folderName] = {
              name: folderName,
              files: [],
              subfolders: {},
            };
          }
          currentFolder = currentFolder.subfolders[folderName];
        }
        // Add the file to the final folder - ensure currentFolder exists
        if (currentFolder && currentFolder.files) {
          currentFolder.files.push(file);
        } else {
          // Fallback: add to root if something went wrong
          structure.files.push(file);
        }
      }
    } else {
      // Fallback: if no webkitRelativePath, treat as root file
      if (structure.files) {
        structure.files.push(file);
      }
    }
  });

  return structure;
};
