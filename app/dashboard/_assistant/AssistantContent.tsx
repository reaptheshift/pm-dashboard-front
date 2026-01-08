"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Loader2, Bot, User, Paperclip, X, Check, FileText, Link2, ZoomIn, ZoomOut, Type, Table, Image, ImageIcon, CreditCard, ShieldCheck, QrCode } from "lucide-react";
import {
  getConversations,
  getConversation,
  startConversation,
  continueConversation,
  getChunkById,
  type Conversation,
  type AnswerPart,
  type ChunkData,
  type ReferencedDocument,
} from "./_actions";
import { ConversationsSidebar } from "./_components/ConversationsSidebar";
import { getProjects, type Project } from "../_projects/_actions";
import {
  getDocuments,
  getDocumentById,
  type Document,
} from "../_documents/_actions";
import { FileTypeIcon } from "../_documents/_components/fileTypeIcon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ReferencedDocumentInfo {
  id: string;
  name: string;
  type: string;
  path?: string;
  size?: number;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  referencedDocuments?: ReferencedDocumentInfo[]; // Full document info referenced in this message
  answerParts?: AnswerPart[]; // Answer parts with references for assistant messages
}

// Component to display chunk details in a dialog
function ChunkDetailsDialog({
	chunkData,
	open,
	onOpenChange,
}: {
	chunkData: ChunkData | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [imageZoom, setImageZoom] = React.useState(1);
	const [imagePosition, setImagePosition] = React.useState({ x: 0, y: 0 });
	const [isDragging, setIsDragging] = React.useState(false);
	const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
	const [imageLoading, setImageLoading] = React.useState(true);
	const [imageError, setImageError] = React.useState(false);

	const handleZoomIn = () => {
		setImageZoom((prev) => Math.min(prev + 0.25, 3));
	};

	const handleZoomOut = () => {
		setImageZoom((prev) => Math.max(prev - 0.25, 0.5));
	};

	const handleResetZoom = () => {
		setImageZoom(1);
		setImagePosition({ x: 0, y: 0 });
	};

	const handleMouseDown = (e: React.MouseEvent) => {
		if (imageZoom > 1) {
			setIsDragging(true);
			setDragStart({
				x: e.clientX - imagePosition.x,
				y: e.clientY - imagePosition.y,
			});
		}
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		if (isDragging && imageZoom > 1) {
			setImagePosition({
				x: e.clientX - dragStart.x,
				y: e.clientY - dragStart.y,
			});
		}
	};

	const handleMouseUp = () => {
		setIsDragging(false);
	};

	// Reset zoom and loading state when dialog closes or chunk data changes
	React.useEffect(() => {
		if (!open) {
			setImageZoom(1);
			setImagePosition({ x: 0, y: 0 });
			setImageLoading(true);
			setImageError(false);
		}
		if (chunkData?.annotated_chunk_image_path) {
			setImageLoading(true);
			setImageError(false);
		}
	}, [open, chunkData?.annotated_chunk_image_path]);

	if (!chunkData) return null;

	// Get icon for chunk type
	const getTypeIcon = (type: string) => {
		const typeLower = type.toLowerCase();
		switch (typeLower) {
			case "text":
				return <Type className="w-4 h-4" />;
			case "table":
				return <Table className="w-4 h-4" />;
			case "figure":
				return <Image className="w-4 h-4" />;
			case "logo":
				return <ImageIcon className="w-4 h-4" />;
			case "marginalia":
				return <FileText className="w-4 h-4" />;
			case "card":
				return <CreditCard className="w-4 h-4" />;
			case "attestation":
				return <ShieldCheck className="w-4 h-4" />;
			case "scan_code":
				return <QrCode className="w-4 h-4" />;
			default:
				return <FileText className="w-4 h-4" />;
		}
	};

	// Convert markdown to HTML (basic conversion)
	const markdownToHtml = (markdown: string) => {
		// Remove the anchor tag wrapper if present
		let html = markdown.replace(/<a id='[^']*'><\/a>\n\n/, "");
		
		// Convert **bold** to <strong>
		html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
		
		// Convert - list items to <li> (handle nested lists)
		const lines = html.split("\n");
		const processedLines: string[] = [];
		let inList = false;
		
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			if (line.trim().startsWith("- ")) {
				if (!inList) {
					processedLines.push("<ul>");
					inList = true;
				}
				processedLines.push(`<li>${line.replace(/^- /, "").trim()}</li>`);
			} else {
				if (inList) {
					processedLines.push("</ul>");
					inList = false;
				}
				if (line.trim()) {
					processedLines.push(line);
				}
			}
		}
		if (inList) {
			processedLines.push("</ul>");
		}
		
		html = processedLines.join("\n");
		
		// Convert ::text:: to <em>text</em>
		html = html.replace(/::(.*?)::/g, "<em>$1</em>");
		
		// Convert line breaks (but preserve existing HTML)
		html = html.split("\n").map((line) => {
			if (line.trim() && !line.match(/^<\/?(ul|li|strong|em)/)) {
				return line + "<br />";
			}
			return line;
		}).join("\n");
		
		return html;
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Chunk Details</DialogTitle>
					<DialogDescription>
						View chunk content and annotated image
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Annotated Image - Show First */}
					{chunkData.annotated_chunk_image_path && (
						<div className="space-y-2 w-full">
							<div className="flex items-center justify-between px-6 -mx-6">
								<h3 className="text-sm font-semibold text-gray-900">
									Annotated Image
								</h3>
								<div className="flex items-center gap-2">
									<button
										onClick={handleZoomOut}
										disabled={imageZoom <= 0.5}
										className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
										title="Zoom Out"
									>
										<ZoomOut className="w-4 h-4" />
									</button>
									<span className="text-xs text-gray-600 min-w-[60px] text-center">
										{Math.round(imageZoom * 100)}%
									</span>
									<button
										onClick={handleZoomIn}
										disabled={imageZoom >= 3}
										className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
										title="Zoom In"
									>
										<ZoomIn className="w-4 h-4" />
									</button>
									{imageZoom > 1 && (
										<button
											onClick={handleResetZoom}
											className="px-2 py-1 text-xs rounded hover:bg-gray-100"
											title="Reset Zoom"
										>
											Reset
										</button>
									)}
								</div>
							</div>
							<div
								className="border-x-0 border-y border-gray-200 rounded-none overflow-auto bg-gray-50 relative w-full -mx-6"
								style={{
									maxHeight: "600px",
									cursor: imageZoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
									aspectRatio: "4/3",
									minHeight: "400px",
									width: "calc(100% + 3rem)",
								}}
								onMouseDown={handleMouseDown}
								onMouseMove={handleMouseMove}
								onMouseUp={handleMouseUp}
								onMouseLeave={handleMouseUp}
							>
								{imageLoading && (
									<div className="absolute inset-0 flex items-center justify-center bg-gray-50">
										<div className="flex flex-col items-center gap-2">
											<Loader2 className="w-6 h-6 animate-spin text-gray-400" />
											<span className="text-xs text-gray-500">Loading image...</span>
										</div>
									</div>
								)}
								{imageError && (
									<div className="absolute inset-0 flex items-center justify-center bg-gray-50">
										<div className="flex flex-col items-center gap-2">
											<Image className="w-6 h-6 text-gray-400" />
											<span className="text-xs text-gray-500">Failed to load image</span>
										</div>
									</div>
								)}
								<div
									className="w-full"
									style={{
										transform: `scale(${imageZoom})`,
										transformOrigin: "top left",
										transition: isDragging ? "none" : "transform 0.2s",
										position: "relative",
										left: imagePosition.x,
										top: imagePosition.y,
										opacity: imageLoading ? 0 : 1,
									}}
								>
									<img
										src={chunkData.annotated_chunk_image_path}
										alt="Annotated chunk"
										className="block w-full"
										style={{
											width: "100%",
											height: "auto",
										}}
										onLoad={() => setImageLoading(false)}
										onError={() => {
											setImageLoading(false);
											setImageError(true);
										}}
									/>
								</div>
							</div>
						</div>
					)}

					{/* Chunk Metadata */}
					<div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg text-sm">
						<div className="flex items-center gap-2">
							<span className="font-medium text-gray-700">Chunk ID:</span>
							<span className="text-gray-900 font-mono text-xs">
								{chunkData.id}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="font-medium text-gray-700">Page:</span>
							<span className="text-gray-900">{chunkData.page + 1}</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="font-medium text-gray-700">Document ID:</span>
							<span className="text-gray-900 font-mono text-xs">
								{chunkData.document_id}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="font-medium text-gray-700">Type:</span>
							<div className="flex items-center gap-1.5">
								{getTypeIcon(chunkData.type)}
								<span className="text-gray-900 capitalize">
									{chunkData.type}
								</span>
							</div>
						</div>
					</div>

					{/* Markdown Content */}
					{chunkData.markdown && (
						<div className="prose prose-sm max-w-none">
							<div
								className="text-sm text-gray-700 leading-relaxed"
								dangerouslySetInnerHTML={{
									__html: markdownToHtml(chunkData.markdown),
								}}
							/>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

// Component to render answer text with inline references
function AnswerWithReferences({
	answerParts,
	onDocumentClick,
	onChunkClick,
	documentNames,
}: {
	answerParts: AnswerPart[];
	onDocumentClick: (documentId: string, chunkId?: string, page?: number) => void;
	onChunkClick: (chunkId: string, documentId: string, page: number) => void;
	documentNames?: Record<string, string>; // Map of document_id to document name
}) {

	// Helper to get display name for document
	const getDocumentDisplayName = (documentId: string) => {
		return documentNames?.[documentId] || documentId.substring(0, 8) + "...";
	};

	// Collect all unique references from all answer parts
	const allReferences = new Map<string, { documentId: string; page: number; name: string }>();
	answerParts.forEach((part) => {
		part.references?.forEach((ref) => {
			const refKey = `${ref.document_id}-${ref.page}`;
			if (!allReferences.has(refKey)) {
				allReferences.set(refKey, {
					documentId: ref.document_id,
					page: ref.page,
					name: getDocumentDisplayName(ref.document_id),
				});
			}
		});
	});

	// Collect all citations with sequential numbering
	const allCitations: Array<{ chunkId: string; documentId: string; page: number; citationNumber: number }> = [];
	let citationCounter = 1;
	answerParts.forEach((part) => {
		part.references?.forEach((ref) => {
			allCitations.push({
				chunkId: ref.chunk_id,
				documentId: ref.document_id,
				page: ref.page,
				citationNumber: citationCounter++,
			});
		});
	});

	// Create a map for quick lookup of citation numbers
	const citationNumberMap = new Map<string, number>();
	allCitations.forEach((citation) => {
		const key = `${citation.documentId}-${citation.chunkId}`;
		if (!citationNumberMap.has(key)) {
			citationNumberMap.set(key, citation.citationNumber);
		}
	});

	return (
		<div className="text-sm space-y-2">
			{/* Answer Text with Inline Citations and References */}
			<div>
				{answerParts.map((part, partIndex) => {
					const hasReferences = part.references && part.references.length > 0;
					return (
						<span key={part.answer_id || partIndex} className="inline">
							<span className="whitespace-pre-wrap">{part.text}</span>
							{hasReferences && (
								<span className="inline-flex items-center gap-1.5 ml-2 align-middle flex-wrap">
									{part.references!.map((ref, refIdx) => {
										const citationKey = `${ref.document_id}-${ref.chunk_id}`;
										const citationNumber = citationNumberMap.get(citationKey) || refIdx + 1;
										return (
											<span
												key={`${ref.document_id}-${ref.chunk_id}-${refIdx}`}
												className="inline-flex items-center gap-1"
											>
												{/* Citation Reference */}
												<button
													onClick={(e) => {
														e.preventDefault();
														// Open chunk details dialog
														onChunkClick(ref.chunk_id, ref.document_id, ref.page);
													}}
													className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors border border-blue-200 hover:border-blue-300 shadow-sm"
													title={`Citation ${citationNumber} | Page ${ref.page} | Click to view source in document`}
												>
													<Link2 className="w-3 h-3 flex-shrink-0" />
													<span className="whitespace-nowrap">Citation {citationNumber}</span>
												</button>
												{/* Document Reference */}
												<button
													onClick={(e) => {
														e.preventDefault();
														onDocumentClick(ref.document_id, undefined, ref.page);
													}}
													className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors border border-green-200 hover:border-green-300 shadow-sm"
													title={`${getDocumentDisplayName(ref.document_id)} | Page: ${ref.page} | Click to open PDF at page ${ref.page}`}
												>
													<FileText className="w-3 h-3 flex-shrink-0" />
													<span className="whitespace-nowrap">{getDocumentDisplayName(ref.document_id)}</span>
												</button>
											</span>
										);
									})}
								</span>
							)}
							{partIndex < answerParts.length - 1 && <span className="mx-1"> </span>}
						</span>
					);
				})}
			</div>

			{/* References Section - Compact */}
			{allReferences.size > 0 && (
				<div className="pt-2 border-t border-gray-200">
					<div className="flex items-center gap-2 flex-wrap">
						<span className="text-xs font-medium text-gray-600">References:</span>
						{Array.from(allReferences.values()).map((ref, idx) => (
							<button
								key={`ref-${ref.documentId}-${ref.page}-${idx}`}
								onClick={(e) => {
									e.preventDefault();
									onDocumentClick(ref.documentId, undefined, ref.page);
								}}
								className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors border border-green-200 hover:border-green-300"
								title={`${ref.name} | Page: ${ref.page} | Click to open PDF at page ${ref.page}`}
							>
								<FileText className="w-3 h-3 flex-shrink-0" />
								<span className="whitespace-nowrap">{ref.name}</span>
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

export function AssistantContent() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = React.useState<
    string | null
  >(null);
  const [isLoadingConversations, setIsLoadingConversations] =
    React.useState(true);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = React.useState<
    string | undefined
  >(undefined);
  const [isLoadingProjects, setIsLoadingProjects] = React.useState(false);
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = React.useState(false);
  const [selectedDocuments, setSelectedDocuments] = React.useState<string[]>(
    []
  );
  const [isDocumentsPopoverOpen, setIsDocumentsPopoverOpen] =
    React.useState(false);
  const [isCreatingConversation, setIsCreatingConversation] =
    React.useState(false);
  const [creatingConversationId, setCreatingConversationId] = React.useState<
    string | null
  >(null);
  const [loadingMessage, setLoadingMessage] = React.useState("Thinking");
  const [chunkDialogOpen, setChunkDialogOpen] = React.useState(false);
  const [selectedChunkData, setSelectedChunkData] = React.useState<ChunkData | null>(null);
  const [isLoadingChunk, setIsLoadingChunk] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Rotate loading messages while waiting for API response
  React.useEffect(() => {
    if (!isLoading) {
      setLoadingMessage("Thinking");
      return;
    }

    const messages = [
      "Thinking",
      "Analyzing",
      "Fetching",
      "Brewing coffee",
      "Drinking coffee",
      "Finishing",
    ];
    setLoadingMessage(messages[0]);

    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % messages.length;
      setLoadingMessage(messages[currentIndex]);
    }, 2000); // Change message every 2 seconds

    return () => clearInterval(interval);
  }, [isLoading]);

  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load conversations only when project is selected (not on initial mount)
  React.useEffect(() => {
    // Don't load if no project is selected - keep loading state until project is selected
    if (!selectedProjectId) {
      setConversations([]);
      setIsLoadingConversations(true); // Keep loading state
      return;
    }

    const loadConversations = async () => {
      try {
        setIsLoadingConversations(true);
        const data = await getConversations(Number(selectedProjectId));
        setConversations(data);
      } catch (error: any) {
        setConversations([]);
        // Don't show toast for this as it's a background operation
      } finally {
        setIsLoadingConversations(false);
      }
    };

    loadConversations();
  }, [selectedProjectId]);

  // Load projects on mount and auto-select first project
  React.useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoadingProjects(true);
        const fetchedProjects = await getProjects();
        setProjects(fetchedProjects);

        // Auto-select first project if available (triggers conversations load)
        if (fetchedProjects.length > 0) {
          setSelectedProjectId(String(fetchedProjects[0].id));
        }
      } catch (error: any) {
        toast.error("Failed to load projects", {
          description: "Projects could not be loaded",
        });
      } finally {
        setIsLoadingProjects(false);
      }
    };

    loadProjects();
  }, []);

  // Load documents when project is selected or popover opens
  React.useEffect(() => {
    const loadDocuments = async () => {
      if (!selectedProjectId || !isDocumentsPopoverOpen) return;

      try {
        setIsLoadingDocuments(true);
        const response = await getDocuments();
        // Filter documents by selected project and only completed documents
        const projectId = parseInt(selectedProjectId, 10);
        const filteredDocs = response.documents.filter(
          (doc) =>
            doc.projectId === projectId && doc.processingStatus === "COMPLETED"
        );
        setDocuments(filteredDocs);
      } catch (error: any) {
        toast.error("Failed to load documents", {
          description: "Documents could not be loaded",
        });
      } finally {
        setIsLoadingDocuments(false);
      }
    };

    loadDocuments();
  }, [selectedProjectId, isDocumentsPopoverOpen]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Get file type for FileTypeIcon
  const getFileType = (
    fileType: string,
    fileName: string
  ): "DOC" | "PDF" | "CSV" | "PPTX" | "XLS" => {
    const type = fileType?.toLowerCase() || "";
    const name = fileName?.toLowerCase() || "";

    if (type.includes("pdf") || name.endsWith(".pdf")) return "PDF";
    if (
      type.includes("doc") ||
      type.includes("docx") ||
      name.endsWith(".doc") ||
      name.endsWith(".docx")
    )
      return "DOC";
    if (
      type.includes("csv") ||
      type.includes("xlsx") ||
      type.includes("xls") ||
      name.endsWith(".csv") ||
      name.endsWith(".xlsx") ||
      name.endsWith(".xls")
    )
      return "XLS";
    if (
      type.includes("ppt") ||
      type.includes("pptx") ||
      name.endsWith(".ppt") ||
      name.endsWith(".pptx")
    )
      return "PPTX";
    return "DOC"; // Default fallback
  };


  const handleDocumentToggle = (documentId: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(documentId)
        ? prev.filter((id) => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleRemoveDocument = (documentId: string) => {
    setSelectedDocuments((prev) => prev.filter((id) => id !== documentId));
  };

  // Helper function to format messages from API response
  const formatMessages = React.useCallback((messages: any[]): Message[] => {
    // Use messages exactly as they come from API (already in correct order)
    return messages.map(
            (msg) => {
              // Extract referenced documents from API response
              const referencedDocs: ReferencedDocumentInfo[] | undefined =
                msg.refrenced_documents?.map((refDoc: ReferencedDocument) => ({
                  id: refDoc.documents.id,
                  name: refDoc.documents.name,
                  type: refDoc.documents.type || "doc",
                  path: refDoc.documents.path,
                  size: refDoc.documents.size,
                }));

              // Handle user messages with question format
              let content: string = "";
              let userReferencedDocs = referencedDocs;

              if (msg.role === "user") {
                // Content can be a string or an object with question/references format
                if (typeof msg.content === "string") {
                  // Try to parse as JSON string
                  try {
                    const parsedContent = JSON.parse(msg.content);
                    if (parsedContent.question) {
                      content = parsedContent.question;
                    } else {
                      content = msg.content; // Fallback to original string
                    }
                    // Extract references from user message only if refrenced_documents is not available
                    if (!userReferencedDocs && parsedContent.references && Array.isArray(parsedContent.references)) {
                      userReferencedDocs = parsedContent.references.map((ref: { document_id: string }) => ({
                        id: ref.document_id,
                        name: ref.document_id, // Use document_id as fallback name
                        type: "doc",
                      }));
                    }
                  } catch {
                    // If parsing fails, use content as-is
                    content = msg.content;
                  }
                } else if (typeof msg.content === "object" && msg.content !== null) {
                  // Content is already an object (new API format)
                  const contentObj = msg.content as { question?: string; references?: Array<{ document_id: string }> };
                  if (contentObj.question) {
                    content = contentObj.question;
                  }
                  // Extract references from user message only if refrenced_documents is not available
                  if (!userReferencedDocs && contentObj.references && Array.isArray(contentObj.references)) {
                    userReferencedDocs = contentObj.references.map((ref) => ({
                      id: ref.document_id,
                      name: ref.document_id, // Use document_id as fallback name
                      type: "doc",
                    }));
                  }
                } else {
                  content = String(msg.content);
                }
              }

              // Handle assistant messages with answers format
              let answerParts: AnswerPart[] | undefined;
              if (msg.role === "assistant") {
                // Content can be a string or an object with answers format
                if (typeof msg.content === "string") {
                  // Try to parse as JSON string
                  try {
                    const parsedContent = JSON.parse(msg.content);
                    if (parsedContent.answers && Array.isArray(parsedContent.answers)) {
                      answerParts = parsedContent.answers;
                      // Combine all answer parts into one content string
                      content = parsedContent.answers.map((part: AnswerPart) => part.text).join(" ");
                    } else {
                      content = msg.content; // Fallback to original string
                    }
                  } catch {
                    // If parsing fails, check if answers is already in the message object
                    if (msg.answers && Array.isArray(msg.answers)) {
                      answerParts = msg.answers;
                      content = msg.answers.map((part: AnswerPart) => part.text).join(" ");
                    } else {
                      content = msg.content; // Fallback to original string
                    }
                  }
                } else if (typeof msg.content === "object" && msg.content !== null) {
                  // Content is already an object (new API format)
                  const contentObj = msg.content as { answers?: AnswerPart[] };
                  if (contentObj.answers && Array.isArray(contentObj.answers)) {
                    answerParts = contentObj.answers;
                    // Combine all answer parts into one content string
                    content = contentObj.answers.map((part: AnswerPart) => part.text).join(" ");
                  }
                } else {
                  // Check if answers is already in the message object
                  if (msg.answers && Array.isArray(msg.answers)) {
                    answerParts = msg.answers;
                    content = msg.answers.map((part: AnswerPart) => part.text).join(" ");
                  } else {
                    content = String(msg.content);
                  }
                }
              }

              // Ensure content is always a string
              const finalContent = content || (typeof msg.content === "string" ? msg.content : "");

              return {
                id: msg.id,
                role: msg.role,
                content: finalContent,
                timestamp: new Date(
                  typeof msg.created_at === "number"
                    ? msg.created_at
                    : msg.created_at
                ),
                referencedDocuments:
                  userReferencedDocs && userReferencedDocs.length > 0
                    ? userReferencedDocs
                    : undefined,
                answerParts,
              };
    });
  }, []);

  // Load conversation when selected
  const handleSelectConversation = React.useCallback(
    async (conversationId: string) => {
      try {
        setIsLoading(true);
        const conversation = await getConversation(conversationId);

        if (conversation && conversation.messages) {
          const formattedMessages = formatMessages(conversation.messages);
          setMessages(formattedMessages);
          setCurrentConversationId(conversationId);
        }
      } catch (error: any) {
        toast.error("Failed to load conversation", {
          description: error.message || "Could not load conversation",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [formatMessages]
  );

  const handleNewConversation = React.useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
    setInput("");
    setSelectedDocuments([]);
    textareaRef.current?.focus();
  }, []);

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    if (!selectedProjectId) {
      toast.error("No project selected", {
        description: "Please select a project to continue",
      });
      return;
    }

    // Store selected documents before clearing - convert IDs to full document info
    const documentsToReference: ReferencedDocumentInfo[] = documents
      .filter((doc) => selectedDocuments.includes(doc.fileId))
      .map((doc) => ({
        id: doc.fileId,
        name: doc.fileName,
        type: doc.fileType.toLowerCase(),
        size: doc.fileSize,
      }));

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmedInput,
      timestamp: new Date(),
      referencedDocuments:
        documentsToReference.length > 0 ? documentsToReference : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    // Clear selected documents immediately after adding to message
    setSelectedDocuments([]);
    setIsLoading(true);

    try {
      const projectId = selectedProjectId;

      // If this is a new conversation (no currentConversationId), use startConversation
      if (!currentConversationId) {
        // Create a temporary conversation ID for the loading state
        const tempConversationId = `temp-${Date.now()}`;
        setCreatingConversationId(tempConversationId);
        setIsCreatingConversation(true);

        const startResponse = await startConversation({
          question: trimmedInput,
          project_id: projectId,
          documents_id: documentsToReference.map((doc) => doc.id),
        });

        // Set the actual conversation ID from the conversation object
        setCurrentConversationId(startResponse.conversation.id);
        setIsCreatingConversation(false);
        setCreatingConversationId(null);

        // Extract referenced documents from sources (new format)
        const assistantReferencedDocs: ReferencedDocumentInfo[] | undefined =
          startResponse.llm_answer.sources?.map((source) => ({
            id: source.document_id,
            name: source.document_name,
            type: "doc", // Default type, could be enhanced if API provides it
          }));

        // Process answers array if available, otherwise use answer_markdown
        let content = "";
        let answerParts: AnswerPart[] | undefined;

        if (startResponse.llm_answer.answers && Array.isArray(startResponse.llm_answer.answers)) {
          // Combine all answer parts into one content string
          answerParts = startResponse.llm_answer.answers;
          content = answerParts.map((part: AnswerPart) => part.text).join(" ");
        } else {
          content =
            startResponse.llm_answer.answer_markdown ||
            startResponse.llm_answer.content ||
            "";
        }

        const assistantMessage: Message = {
          id: startResponse.llm_answer.id || Date.now().toString(),
          role: "assistant",
          content,
          timestamp: new Date(
            typeof startResponse.llm_answer.created_at === "number"
              ? startResponse.llm_answer.created_at
              : startResponse.llm_answer.created_at || Date.now()
          ),
          referencedDocuments:
            assistantReferencedDocs && assistantReferencedDocs.length > 0
              ? assistantReferencedDocs
              : undefined,
          answerParts,
        };

        // Reload the conversation to ensure correct message order from API
        if (startResponse.conversation?.id) {
          setCurrentConversationId(startResponse.conversation.id);
          try {
            const reloadedConversation = await getConversation(startResponse.conversation.id);
            if (reloadedConversation && reloadedConversation.messages) {
              const formattedMessages = formatMessages(reloadedConversation.messages);
              setMessages(formattedMessages);
            }
          } catch (error) {
            // Fallback to adding message directly if reload fails
            setTimeout(() => {
              setMessages((prev) => [...prev, assistantMessage]);
            }, 100);
          }
        } else {
          // Fallback if no conversation_id
          setTimeout(() => {
            setMessages((prev) => [...prev, assistantMessage]);
          }, 100);
        }

        // Refresh conversations list to include the new conversation with chat_title
        try {
          const updatedConversations = await getConversations(
            selectedProjectId ? Number(selectedProjectId) : undefined
          );
          setConversations(updatedConversations);
        } catch {
          // Silently fail - conversations refresh is not critical
        }
      } else {
        // For existing conversations, use continueConversation
        const continueResponse = await continueConversation({
          conversations_id: currentConversationId,
          question: trimmedInput,
          documents_id:
            documentsToReference.length > 0
              ? documentsToReference.map((doc) => doc.id)
              : undefined,
        });

        // Extract referenced documents from sources (new format)
        const assistantReferencedDocs: ReferencedDocumentInfo[] | undefined =
          continueResponse.llm_answer.sources?.map((source) => ({
            id: source.document_id,
            name: source.document_name,
            type: "doc", // Default type, could be enhanced if API provides it
          }));

        // Process answers array if available, otherwise use answer_markdown
        let content = "";
        let answerParts: AnswerPart[] | undefined;

        if (continueResponse.llm_answer.answers && Array.isArray(continueResponse.llm_answer.answers)) {
          // Combine all answer parts into one content string
          answerParts = continueResponse.llm_answer.answers;
          content = answerParts.map((part: AnswerPart) => part.text).join(" ");
        } else {
          content =
            continueResponse.llm_answer.answer_markdown ||
            continueResponse.llm_answer.content ||
            "";
        }

        const assistantMessage: Message = {
          id: continueResponse.llm_answer.id || Date.now().toString(),
          role: "assistant",
          content,
          timestamp: new Date(
            typeof continueResponse.llm_answer.created_at === "number"
              ? continueResponse.llm_answer.created_at
              : continueResponse.llm_answer.created_at || Date.now()
          ),
          referencedDocuments:
            assistantReferencedDocs && assistantReferencedDocs.length > 0
              ? assistantReferencedDocs
              : undefined,
          answerParts,
        };

        // Reload the conversation to ensure correct message order from API
        if (currentConversationId) {
          try {
            const reloadedConversation = await getConversation(currentConversationId);
            if (reloadedConversation && reloadedConversation.messages) {
              const formattedMessages = formatMessages(reloadedConversation.messages);
              setMessages(formattedMessages);
            }
          } catch (error) {
            // Fallback to adding message directly if reload fails
            setTimeout(() => {
              setMessages((prev) => [...prev, assistantMessage]);
            }, 100);
          }
        } else {
          // Fallback if no conversation_id
          setTimeout(() => {
            setMessages((prev) => [...prev, assistantMessage]);
          }, 100);
        }

        // Refresh conversations list after sending a message
        try {
          const updatedConversations = await getConversations(
            selectedProjectId ? Number(selectedProjectId) : undefined
          );
          setConversations(updatedConversations);
        } catch {
          // Silently fail - conversations refresh is not critical
        }
      }
    } catch (error: any) {
      // Clear creating state on error
      setIsCreatingConversation(false);
      setCreatingConversationId(null);

      toast.error("Failed to send message", {
        description:
          error.message ||
          "There was an error communicating with the assistant",
      });

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Show blocking message if no projects
  if (!isLoadingProjects && projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Projects Available
          </h2>
          <p className="text-gray-600 mb-6">
            You need to create at least one project before you can use the AI
            Assistant. The assistant requires a project context to provide
            relevant answers.
          </p>
          <Button
            onClick={() => {
              // Navigate to projects tab via hash
              window.location.hash = "#Projects";
            }}
            className="bg-gray-900 text-white hover:bg-gray-800"
          >
            Go to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">AI Assistant</h1>
          <p className="text-gray-600 mt-2">
            Ask questions about your projects and documents
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-64">
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
              disabled={isLoadingProjects || projects.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    isLoadingProjects ? "Loading projects..." : "Select Project"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={String(project.id)}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex-1 flex gap-4">
        {/* Conversations Sidebar */}
        <ConversationsSidebar
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          isLoading={isLoadingConversations}
          isCreatingConversation={isCreatingConversation}
          creatingConversationId={creatingConversationId}
        />

        {/* Chat Container */}
        <div className="flex-1 h-full flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Messages Area */}
          <div className="max-h-[750px] h-full overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Bot className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Start a conversation
                </h3>
                <p className="text-gray-600 max-w-md">
                  Ask me anything about your projects, documents, or workflows.
                  I'm here to help!
                </p>
              </div>
            ) : (
              messages.map((message, index) => {
                // Use referenced documents from message (already extracted from API)
                const referencedDocs = message.referencedDocuments || [];
                const isLastMessage = index === messages.length - 1;
                const isAssistant = message.role === "assistant";

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    } ${
                      isLastMessage && isAssistant
                        ? "animate-in fade-in slide-in-from-bottom-4 duration-500"
                        : ""
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-3 ${
                        message.role === "user"
                          ? "bg-gray-100 text-gray-900"
                          : "bg-blue-50 text-gray-900"
                      }`}
                    >
                      {referencedDocs.length > 0 && (
                        <div className="mb-2 pb-2 border-b border-gray-300">
                          <p className="text-xs text-gray-600 mb-1">
                            Referenced documents:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {referencedDocs.map((doc) => {
                              const displayName = doc.name || doc.id.substring(0, 8) + "...";
                              return (
                                <button
                                  key={doc.id}
                                  onClick={async () => {
                                    const toastId = toast.loading(
                                      "Loading document...",
                                      {
                                        duration: Infinity,
                                      }
                                    );

                                    try {
                                      const result = await getDocumentById(
                                        doc.id
                                      );

                                      // Extract download URL
                                      const downloadUrl =
                                        result?.file?.url ||
                                        result?.file_metadata?.download_url ||
                                        result?.file_metadata?.s3_url ||
                                        result?.file_metadata?.presigned_url ||
                                        result?.download_url ||
                                        result?.s3_url ||
                                        result?.presigned_url;

                                      if (downloadUrl) {
                                        // Check expiration if available
                                        const expiresAt =
                                          result?.file?.expires_at;
                                        if (expiresAt) {
                                          const expirationTime = parseInt(
                                            String(expiresAt)
                                          );
                                          const currentTime = Date.now();
                                          if (currentTime >= expirationTime) {
                                            toast.error("Download link expired", {
                                              id: toastId,
                                              description:
                                                "The download link has expired. Please try again.",
                                              duration: 4000,
                                            });
                                            return;
                                          }
                                        }

                                        // Open in new window
                                        window.open(downloadUrl, "_blank");
                                        toast.success("Document opened", {
                                          id: toastId,
                                          duration: 2000,
                                        });
                                      } else {
                                        toast.error("No file URL found", {
                                          id: toastId,
                                          description:
                                            "Unable to retrieve document URL",
                                          duration: 4000,
                                        });
                                      }
                                    } catch (error: any) {
                                      toast.error("Failed to load document", {
                                        id: toastId,
                                        description:
                                          error?.message ||
                                          "An error occurred while loading the document",
                                        duration: 4000,
                                      });
                                    }
                                  }}
                                  className="flex items-center gap-1 bg-gray-200 hover:bg-gray-300 rounded px-2 py-0.5 cursor-pointer transition-colors"
                                  title={`Click to view ${displayName}`}
                                >
                                  <FileText className="w-3 h-3 flex-shrink-0" />
                                  <span className="text-xs text-gray-700">
                                    {displayName}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {message.answerParts && message.answerParts.length > 0 ? (
                        <AnswerWithReferences
                          answerParts={message.answerParts}
                          documentNames={
                            message.referencedDocuments
                              ? Object.fromEntries(
                                  message.referencedDocuments.map((doc) => [doc.id, doc.name || doc.id])
                                )
                              : undefined
                          }
                          onChunkClick={async (chunkId, documentId, page) => {
                            const toastId = toast.loading("Loading chunk details...", {
                              duration: Infinity,
                            });
                            setIsLoadingChunk(true);
                            try {
                              const chunkData = await getChunkById(chunkId);
                              setSelectedChunkData(chunkData);
                              setChunkDialogOpen(true);
                              toast.dismiss(toastId);
                            } catch (error: any) {
                              toast.error("Failed to load chunk", {
                                id: toastId,
                                description:
                                  error?.message ||
                                  "An error occurred while loading the chunk details",
                                duration: 4000,
                              });
                            } finally {
                              setIsLoadingChunk(false);
                            }
                          }}
                          onDocumentClick={async (documentId, chunkId, page) => {
                            const toastId = toast.loading("Loading document...", {
                              description: chunkId
                                ? `Chunk: ${chunkId.substring(0, 8)}...`
                                : "Opening document",
                              duration: Infinity,
                            });

                            try {
                              const result = await getDocumentById(documentId);

                              // Extract file name
                              const fileName =
                                result?.file_metadata?.file_name ||
                                result?.file?.name ||
                                result?.name ||
                                documentId;

                              // Extract download URL
                              const downloadUrl =
                                result?.file?.url ||
                                result?.file_metadata?.download_url ||
                                result?.file_metadata?.s3_url ||
                                result?.file_metadata?.presigned_url ||
                                result?.download_url ||
                                result?.s3_url ||
                                result?.presigned_url;

                              if (downloadUrl) {
                                // Check expiration if available
                                const expiresAt = result?.file?.expires_at;
                                if (expiresAt) {
                                  const expirationTime = parseInt(String(expiresAt));
                                  const currentTime = Date.now();
                                  if (currentTime >= expirationTime) {
                                    toast.error("Download link expired", {
                                      id: toastId,
                                      description:
                                        "The download link has expired. Please try again.",
                                      duration: 4000,
                                    });
                                    return;
                                  }
                                }

                                // Add page parameter if available
                                const urlWithPage = page
                                  ? `${downloadUrl}#page=${page}`
                                  : downloadUrl;

                                // Open in new window
                                window.open(urlWithPage, "_blank");
                                toast.success("Document opened", {
                                  id: toastId,
                                  description: chunkId
                                    ? `${fileName} - Chunk ${chunkId.substring(0, 8)}...`
                                    : fileName,
                                  duration: 2000,
                                });
                              } else {
                                toast.error("No file URL found", {
                                  id: toastId,
                                  description: "Unable to retrieve document URL",
                                  duration: 4000,
                                });
                              }
                            } catch (error: any) {
                              toast.error("Failed to load document", {
                                id: toastId,
                                description:
                                  error?.message ||
                                  "An error occurred while loading the document",
                                duration: 4000,
                              });
                            }
                          }}
                        />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                      )}
                      <p
                        className={`text-xs mt-2 ${
                          message.role === "user"
                            ? "text-gray-600"
                            : "text-gray-600"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
            {isLoading && (
              <div className="flex gap-3 justify-start animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center gap-2">
                  <span className="text-sm text-gray-700">
                    {loadingMessage}
                  </span>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chunk Details Dialog */}
          <ChunkDetailsDialog
            chunkData={selectedChunkData}
            open={chunkDialogOpen}
            onOpenChange={setChunkDialogOpen}
          />

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            {/* Selected Documents */}
            {selectedDocuments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {documents
                  .filter((doc) => selectedDocuments.includes(doc.fileId))
                  .map((doc) => (
                    <div
                      key={doc.fileId}
                      className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 text-sm"
                    >
                      <FileTypeIcon
                        type={getFileType(doc.fileType, doc.fileName)}
                        className="w-4 h-4"
                      />
                      <span className="text-gray-700 truncate max-w-[150px]">
                        {doc.fileName}
                      </span>
                      <button
                        onClick={() => handleRemoveDocument(doc.fileId)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
              </div>
            )}

            <div className="flex gap-2">
              <Popover
                open={isDocumentsPopoverOpen}
                onOpenChange={setIsDocumentsPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="border-gray-300"
                    disabled={isLoading || !selectedProjectId}
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96 p-0" align="start" side="top">
                  <div className="max-h-[400px] overflow-y-auto">
                    {isLoadingDocuments ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                        Loading documents...
                      </div>
                    ) : documents.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        No documents available for this project
                      </div>
                    ) : (
                      <div className="p-2">
                        {documents
                          .filter((doc) => doc.processingStatus === "COMPLETED")
                          .map((doc) => {
                            const isSelected = selectedDocuments.includes(
                              doc.fileId
                            );
                            return (
                              <button
                                key={doc.fileId}
                                onClick={() => handleDocumentToggle(doc.fileId)}
                                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${
                                  isSelected
                                    ? "bg-gray-100"
                                    : "hover:bg-gray-50"
                                }`}
                              >
                                <FileTypeIcon
                                  type={getFileType(doc.fileType, doc.fileName)}
                                  className="w-8 h-8 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {doc.fileName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatFileSize(doc.fileSize)}
                                  </p>
                                </div>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-gray-900 flex-shrink-0" />
                                )}
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                className="min-h-[80px] resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-gray-900 text-white hover:bg-gray-800 self-end"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssistantContent;
