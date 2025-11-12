export type FileType = "DOC" | "PDF" | "CSV" | "PPTX" | "XLS";

/**
 * Get file type from file extension
 * @param fileName - The file name or path
 * @returns FileType based on file extension, defaults to "DOC"
 */
export function getFileTypeFromExtension(fileName: string): FileType {
  if (!fileName) return "DOC";

  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  const extensionMap: Record<string, FileType> = {
    pdf: "PDF",
    doc: "DOC",
    docx: "DOC",
    xls: "XLS",
    xlsx: "XLS",
    csv: "CSV",
    ppt: "PPTX",
    pptx: "PPTX",
  };

  return extensionMap[extension] || "DOC";
}

