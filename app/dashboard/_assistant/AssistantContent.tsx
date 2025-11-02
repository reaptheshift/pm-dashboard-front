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
import { Send, Loader2, Bot, User, Paperclip, X, Check } from "lucide-react";
import {
  sendMessage,
  getConversations,
  getConversation,
  startConversation,
  type Conversation,
} from "./_actions";
import { ConversationsSidebar } from "./_components/ConversationsSidebar";
import { getProjects, type Project } from "../_projects/_actions";
import { getDocuments, type Document } from "../_documents/_actions";
import { FileTypeIcon } from "../_documents/_components/fileTypeIcon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  referencedDocuments?: string[]; // Document IDs referenced in this message
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
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load conversations on mount
  React.useEffect(() => {
    const loadConversations = async () => {
      try {
        setIsLoadingConversations(true);
        const data = await getConversations();
        setConversations(data);
      } catch (error: any) {
        console.error("Failed to load conversations:", error);
        // Don't show toast for this as it's a background operation
      } finally {
        setIsLoadingConversations(false);
      }
    };

    loadConversations();
  }, []);

  // Load projects on mount
  React.useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoadingProjects(true);
        const fetchedProjects = await getProjects();
        setProjects(fetchedProjects);

        // Always auto-select the first project if available
        if (fetchedProjects.length > 0) {
          setSelectedProjectId(String(fetchedProjects[0].id));
        }
      } catch (error: any) {
        console.error("Failed to load projects:", error);
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
        console.error("Failed to load documents:", error);
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

  // Load conversation when selected
  const handleSelectConversation = React.useCallback(
    async (conversationId: string) => {
      try {
        setIsLoading(true);
        const conversation = await getConversation(conversationId);

        if (conversation && conversation.messages) {
          const formattedMessages: Message[] = conversation.messages.map(
            (msg) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.created_at),
            })
          );
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
    []
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

    // Store selected documents before clearing
    const documentsToReference = [...selectedDocuments];

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
          documents_id: documentsToReference,
        });

        // Set the actual conversation ID
        setCurrentConversationId(startResponse.Conversation.id);
        setIsCreatingConversation(false);
        setCreatingConversationId(null);

        // Add the assistant's response
        const assistantMessage: Message = {
          id: startResponse.llm_answer.id,
          role: "assistant",
          content: startResponse.llm_answer.content,
          timestamp: new Date(startResponse.llm_answer.created_at),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Refresh conversations list to include the new conversation
        try {
          const updatedConversations = await getConversations();
          setConversations(updatedConversations);
        } catch {
          // Silently fail - conversations refresh is not critical
        }
      } else {
        // For existing conversations, use sendMessage
        const projectIdNum = parseInt(projectId, 10);
        const response = await sendMessage(trimmedInput, projectIdNum);

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            response.message || "I'm sorry, I couldn't generate a response.",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Refresh conversations list after sending a message
        try {
          const updatedConversations = await getConversations();
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
      <div className="flex-1 flex gap-4 h-full">
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
        <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
              messages.map((message) => {
                const referencedDocs =
                  message.referencedDocuments &&
                  message.referencedDocuments.length > 0
                    ? documents.filter((doc) =>
                        message.referencedDocuments?.includes(doc.fileId)
                      )
                    : [];

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
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
                            {referencedDocs.map((doc) => (
                              <div
                                key={doc.fileId}
                                className="flex items-center gap-1 bg-gray-200 rounded px-2 py-0.5"
                              >
                                <FileTypeIcon
                                  type={getFileType(doc.fileType, doc.fileName)}
                                  className="w-3 h-3"
                                />
                                <span className="text-xs text-gray-700 truncate max-w-[120px]">
                                  {doc.fileName}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
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
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-50 rounded-lg px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

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
