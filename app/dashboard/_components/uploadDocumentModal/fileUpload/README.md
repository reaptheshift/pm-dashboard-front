# File Upload Components

This folder contains separated upload handlers for different upload scenarios.

## Structure

```
fileUpload/
├── index.ts                      # Main exports
├── types.ts                       # TypeScript interfaces
├── uploadHandlers.ts             # Core upload logic
├── SingleFileUpload.tsx          # Single file upload component
├── MultiFileUpload.tsx           # Multiple file upload component
├── FolderUpload.tsx              # Folder upload component
├── UploadOrchestrator.tsx        # Orchestrates all upload types
└── README.md                     # This file
```

## Components

### 1. **uploadHandlers.ts**

Core upload functions that handle the actual S3 upload process:

- `uploadSingleFile()` - Uploads a single file to S3
- `uploadMultipleFiles()` - Uploads multiple files sequentially
- `uploadFolderFiles()` - Uploads files from a folder structure

All functions:

- Accept file(s), projectId, and uploadedBy parameters
- Support progress callbacks
- Handle S3 pre-signed URL workflow
- Poll for processing status

### 2. **SingleFileUpload.tsx**

Component for uploading a single file:

```typescript
<SingleFileUpload
  file={file}
  options={{ projectId, uploadedBy }}
  onSuccess={(result) => console.log(result)}
  onError={(error) => console.error(error)}
  onProgress={(progress) => updateUI(progress)}
/>
```

### 3. **MultiFileUpload.tsx**

Component for uploading multiple files:

```typescript
<MultiFileUpload
  files={filesArray}
  options={{ projectId, uploadedBy }}
  onSuccess={(results) => console.log(results)}
  onFileProgress={(index, progress) => updateProgress(index, progress)}
  onFileComplete={(index, result) => handleComplete(index, result)}
/>
```

### 4. **FolderUpload.tsx**

Component for uploading entire folder structures:

```typescript
<FolderUpload
  folderStructure={folderStructure}
  options={{ projectId, uploadedBy }}
  onSuccess={(results) => console.log(results)}
/>
```

### 5. **UploadOrchestrator.tsx**

Orchestrates all upload types and manages state:

- Automatically determines upload type (single/multiple/folder)
- Manages upload state and progress
- Handles errors gracefully
- Calls appropriate success/error callbacks

## Upload Flow

1. **File Selection** → Files accumulated in state
2. **Upload Type Detection** → Single / Multiple / Folder
3. **S3 Upload** → Direct to S3 using pre-signed URLs
4. **Status Polling** → Poll backend every 2 seconds
5. **Progress Updates** → Update UI with current status
6. **Completion** → Close modal and refresh document list

## Usage

```typescript
import {
  uploadSingleFile,
  uploadMultipleFiles,
  uploadFolderFiles,
} from "./fileUpload";

// Single file
await uploadSingleFile(file, { projectId, uploadedBy });

// Multiple files
await uploadMultipleFiles([file1, file2], { projectId, uploadedBy });

// Folder
await uploadFolderFiles(files, { projectId, uploadedBy });
```

## Types

- `FileUploadItem` - Represents an upload item with progress tracking
- `UploadProgress` - Progress information for a single file
- `UploadOptions` - Options for upload (projectId, uploadedBy, callbacks)
- `UploadResult` - Result of an upload operation
