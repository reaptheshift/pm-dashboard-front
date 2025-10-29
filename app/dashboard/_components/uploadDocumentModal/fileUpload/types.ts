export interface FileUploadItem {
  file: File;
  progress: number;
  status: "uploading" | "uploaded" | "processing" | "completed" | "error";
  folderPath?: string;
  fileId?: string | null;
}

export interface UploadProgress {
  fileId: string;
  progress: number;
  status: string;
}

export interface UploadOptions {
  projectId: string;
  uploadedBy?: string; // Optional - will be auto-filled by server action if not provided
  onProgress?: (progress: UploadProgress) => void;
}

export interface UploadResult {
  fileId: string;
  fileName: string;
  status: string;
  message: string;
}
