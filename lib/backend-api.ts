// Backend API integration for PocketBoss Parsing Engine
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 
  'http://localhost:8080';

export interface Document {
  fileId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadTimestamp: string;
  processingStatus: 'COMPLETED' | 'PROCESSING' | 'FAILED' | 'PENDING';
  metadata?: {
    chunkCount: number;
    textLength: number;
  };
}

export interface QueryResponse {
  query: string;
  answer: string;
  sources: Array<{
    fileId: string;
    fileName: string;
    pageNumber?: number;
    excerpt?: string;
  }>;
}

export interface UploadResponse {
  fileId: string;
  fileName: string;
  status: string;
  message: string;
}

export interface FileStatus {
  fileId: string;
  status: string;
  progress: number;
  message?: string;
  error?: string;
}

export interface DocumentsResponse {
  documents: Document[];
  total: number;
}

class BackendAPI {
  private baseURL: string;

  constructor(baseUrl: string) {
    this.baseURL = baseUrl;
  }

  // Get all documents (always syncs with S3 by default)
  async getDocuments(syncWithS3: boolean = true): Promise<DocumentsResponse> {
    try {
      const url = syncWithS3 
        ? `${this.baseURL}/api/documents?sync=true`
        : `${this.baseURL}/api/documents`;
        
      console.log(`🌐 Fetching documents from: ${url}${syncWithS3 ? ' (with S3 sync)' : ''}`);
      
      const response = await fetch(url);
      console.log('📡 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📄 Documents data received:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching documents:', error);
      throw error;
    }
  }
  
  // Force sync with S3 storage
  async syncWithS3(): Promise<{ success: boolean; removed: string[]; message: string }> {
    try {
      console.log('🔄 Syncing knowledge base with S3');
      
      const response = await fetch(`${this.baseURL}/api/documents/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to sync with S3: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ S3 sync completed:', result);
      return result;
    } catch (error) {
      console.error('❌ Error syncing with S3:', error);
      throw error;
    }
  }

  // Query the knowledge base
  async queryDocuments(message: string): Promise<QueryResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: message }),
      });

      if (!response.ok) {
        throw new Error(`Chat query failed: ${response.status}`);
      }

      const result = await response.json();
      return {
        query: message,
        answer: result.content,
        sources: result.sources || []
      };
    } catch (error) {
      console.error('Chat query error:', error);
      throw error;
    }
  }

  // Get File Status
  async getFileStatus(fileId: string): Promise<FileStatus> {
    try {
      // Add cache-busting parameter to prevent 304 responses
      const timestamp = Date.now();
      const response = await fetch(`${this.baseURL}/api/file/${fileId}/status?t=${timestamp}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }
      
      const status = await response.json();
      console.log(`📊 File status for ${fileId}:`, status);
      return status;
    } catch (error) {
      console.error('Status check error:', error);
      throw error;
    }
  }

  // Poll File Status
  async pollFileStatus(fileId: string, onStatusUpdate?: (status: FileStatus) => void): Promise<FileStatus> {
    return new Promise((resolve, reject) => {
      let pollCount = 0;
      const maxPolls = 300; // 10 minutes with 2-second intervals
      
      console.log(`🔄 Starting polling for file ${fileId}...`);
      
      const pollInterval = setInterval(async () => {
        pollCount++;
        
        try {
          console.log(`⏱️ Poll attempt ${pollCount}/${maxPolls} for file ${fileId}`);
          const status = await this.getFileStatus(fileId);
          
          if (onStatusUpdate) {
            onStatusUpdate(status);
          }
          
          // Handle different status values (uppercase from backend)
          const normalizedStatus = status.status?.toLowerCase();
          console.log(`📊 File ${fileId} status: ${normalizedStatus}, progress: ${status.progress}%`);
          
          if (normalizedStatus === 'completed' || normalizedStatus === 'failed') {
            console.log(`✅ File ${fileId} processing ${normalizedStatus}`);
            clearInterval(pollInterval);
            resolve(status);
          } else if (pollCount >= maxPolls) {
            console.error(`⏰ Polling timeout for file ${fileId} after ${maxPolls} attempts`);
            clearInterval(pollInterval);
            
            // Instead of rejecting, resolve with a timeout status
            // This prevents the UI from crashing and allows the user to check status later
            resolve({
              fileId,
              status: 'TIMEOUT',
              progress: status.progress || 0,
              message: `Processing is taking longer than expected. The file may still be processing in the background. Please refresh the page later to check status.`
            });
          }
        } catch (error) {
          console.error(`❌ Polling error for file ${fileId}:`, error);
          
          // On error, continue polling rather than rejecting immediately
          // Only reject after 5 consecutive errors
          if (pollCount % 5 === 0) {
            clearInterval(pollInterval);
            reject(error);
          }
        }
      }, 2000);
    });
  }

  // Delete File
  async deleteFile(fileId: string): Promise<{ success: boolean; message: string; fileId: string }> {
    try {
      const response = await fetch(`${this.baseURL}/api/file/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  }

  // File Upload - S3 Direct Upload
  async uploadFile(file: File, projectId: string, uploadedBy: string): Promise<UploadResponse> {
    try {
      // Debug: Log file properties
      console.log('📁 File properties:', {
        name: file.name,
        type: file.type,
        size: file.size,
        projectId,
        uploadedBy
      });

      // Step 1: Get S3 signature
      const signatureResponse = await fetch(`${this.baseURL}/api/s3/upload-signature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || 'application/octet-stream', // Fallback for empty type
          fileSize: file.size,
          projectId,
          uploadedBy
        })
      });

      if (!signatureResponse.ok) {
        const errorText = await signatureResponse.text();
        console.error('❌ Signature request failed:', {
          status: signatureResponse.status,
          statusText: signatureResponse.statusText,
          error: errorText
        });
        throw new Error(`Signature request failed: ${signatureResponse.status} - ${errorText}`);
      }

      const { s3Url, fileId, s3Key, headers } = await signatureResponse.json();

      // Step 2: Upload to S3
      const s3Response = await fetch(s3Url, {
        method: 'PUT',
        body: file,
        headers: {
          ...headers,
          'x-original-filename': file.name
        }
      });

      if (!s3Response.ok) {
        throw new Error(`S3 upload failed: ${s3Response.status}`);
      }

      // Step 3: Confirm upload
      const confirmResponse = await fetch(`${this.baseURL}/api/s3/confirm-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId,
          s3Key,
          fileName: file.name,
          fileType: file.type,
          projectId,
          uploadedBy
        })
      });

      if (!confirmResponse.ok) {
        throw new Error(`Confirm upload failed: ${confirmResponse.status}`);
      }

      return await confirmResponse.json();
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }
}

export const backendAPI = new BackendAPI(BACKEND_BASE_URL);