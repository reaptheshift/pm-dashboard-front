"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { backendAPI, Document } from '@/lib/backend-api';
import { Send, Bot, User, FileText, X, RefreshCw } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  sources?: Array<{
    fileId: string;
    fileName: string;
    pageNumber?: number;
    excerpt?: string;
  }>;
}

interface ChatInterfaceProps {
  documents: Document[];
  isUploadingFiles?: boolean;
  uploadStatus?: 'idle' | 'success' | 'error' | 'partial' | 'processing';
}

export function ChatInterface({ documents, isUploadingFiles = false, uploadStatus = 'idle' }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMentions, setSelectedMentions] = useState<string[]>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [caretPos, setCaretPos] = useState(0);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [persistentDocuments, setPersistentDocuments] = useState<Document[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const justInsertedRef = useRef(false);

  // Load persistent documents from backend
  const loadPersistentDocuments = useCallback(async () => {
    try {
      setIsLoadingDocuments(true);
      console.log('🔄 Loading persistent documents from backend...');
      const response = await backendAPI.getDocuments();
      console.log('✅ Loaded persistent documents:', response.documents);
      setPersistentDocuments(response.documents);
    } catch (error) {
      console.error('❌ Error loading persistent documents:', error);
      setPersistentDocuments([]);
    } finally {
      setIsLoadingDocuments(false);
    }
  }, []);

  // Load persistent documents on component mount
  useEffect(() => {
    loadPersistentDocuments();
  }, [loadPersistentDocuments]);

  // Combine current session files with persistent documents
  const allAvailableFiles = [...(documents || []), ...(persistentDocuments || [])];
  const availableFiles = useMemo(() => {
    // Deduplicate files by fileId
    const seen = new Set<string>();
    return allAvailableFiles.filter(file => {
      if (seen.has(file.fileId)) return false;
      seen.add(file.fileId);
      return true;
    });
  }, [documents, persistentDocuments]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Show welcome message when component mounts
  useEffect(() => {
    if (messages.length === 0) {
      const showWelcomeMessage = () => {
        let welcomeMessage = 'Hello! I\'m your AI assistant. I can help you with:';
        welcomeMessage += '\n• General questions about construction and architecture';
        welcomeMessage += '\n• Analysis of uploaded documents';
        welcomeMessage += '\n• Technical explanations and definitions';
        
        if (availableFiles.length > 0) {
          const persistentCount = persistentDocuments.length;
          const sessionCount = availableFiles.length - persistentCount;
          
          welcomeMessage += `\n\nI have access to ${availableFiles.length} document(s):`;
          if (persistentCount > 0) {
            welcomeMessage += `\n• ${persistentCount} previously uploaded document(s) (persistent)`;
          }
          if (sessionCount > 0) {
            welcomeMessage += `\n• ${sessionCount} document(s) from this session`;
          }
          
          welcomeMessage += '\n\nYou can:';
          welcomeMessage += '\n• Use @filename to ask about specific documents';
          welcomeMessage += '\n• Ask questions about any document\'s content';
          welcomeMessage += '\n• Compare multiple documents if you have more than one';
          welcomeMessage += '\n• Ask general questions (I\'ll search all documents)';
        } else if (persistentDocuments.length > 0) {
          welcomeMessage += `\n\nI have access to ${persistentDocuments.length} previously uploaded document(s). You can:`;
          welcomeMessage += '\n• Use @filename to ask about specific documents';
          welcomeMessage += '\n• Ask questions about any document\'s content';
          welcomeMessage += '\n• Ask general questions (I\'ll search all documents)';
        }
        
        setMessages([{
          id: '1',
          text: welcomeMessage,
          sender: 'bot',
          timestamp: new Date()
        }]);
      };
      
      showWelcomeMessage();
    }
  }, [availableFiles, persistentDocuments, messages.length]);

  // Helper functions for mention handling
  const MENTION_REGEX = /(^|\s)@([^\s@]*)$/;                // only last token
  const SCAN_MENTIONS_REGEX = /@([^\s@][^@\n]*?)(?=\s|$)/g; // scan whole input

  const findMentionsInText = (s: string) =>
    Array.from(s.matchAll(SCAN_MENTIONS_REGEX), m => m[1]);

  const getActiveMention = (value: string, caret: number): string | null => {
    const upToCaret = value.slice(0, caret);
    const m = MENTION_REGEX.exec(upToCaret);
    return m ? (m[2] ?? '') : null;
  };

  const stripActiveMentionFromInput = (value: string, caret: number) => {
    const before = value.slice(0, caret);
    const after = value.slice(caret);
    const newBefore = before.replace(MENTION_REGEX, '').trimEnd();
    // add a trailing space so you keep typing normally
    return `${newBefore}${newBefore ? ' ' : ''}${after}`.replace(/\s{2,}/g, ' ');
  };

  // Filter documents for mentions
  const filteredFiles = useMemo(() => {
    const q = mentionFilter.trim().toLowerCase();
    const base = availableFiles || [];
    
    if (!q) return base;
    return base.filter(f => {
      const name = f.fileName || '';
      return name.toLowerCase().includes(q);
    });
  }, [availableFiles, mentionFilter]);

  // Handle input changes and caret position
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const caret = e.target.selectionStart || 0;

    setInputText(value);
    setCaretPos(caret);

    if (justInsertedRef.current) {
      // prevent "space then dropdown reopens"
      justInsertedRef.current = false;
      setShowMentionDropdown(false);
      setMentionFilter('');
      return;
    }

    const active = getActiveMention(value, caret);
    if (active !== null) {
      setShowMentionDropdown(true);
      setMentionFilter(active);
    } else {
      setShowMentionDropdown(false);
      setMentionFilter('');
    }
  };

  // Insert mention into input
  const insertMention = (fileName: string) => {
    setSelectedMentions(prev => Array.from(new Set([...prev, fileName])));
    setInputText(prev => {
      const caret = inputRef.current?.selectionStart ?? prev.length;
      const stripped = stripActiveMentionFromInput(prev, caret);
      return stripped; // we already add trailing space there
    });
    justInsertedRef.current = true; // <- key to suppress dropdown once
    setShowMentionDropdown(false);
    setMentionFilter('');
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      const p = inputRef.current?.value.length ?? 0;
      inputRef.current?.setSelectionRange(p, p);
    });
  };

  // Remove mention chip
  const removeMention = (fileName: string) => {
    setSelectedMentions(prev => prev.filter(name => name !== fileName));
  };

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (showMentionDropdown && filteredFiles.length > 0) {
        e.preventDefault();
        insertMention(filteredFiles[0].fileName);
        return;
      }
      if (!e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    } else if (e.key === 'Escape') {
      if (showMentionDropdown) {
        setShowMentionDropdown(false);
        setMentionFilter('');
        e.preventDefault();
      }
    } else if (e.key === ' ') {
      // If no active '@...' token, ensure menu is shut
      const caret = (e.currentTarget as HTMLInputElement).selectionStart || 0;
      if (!getActiveMention(inputText, caret)) setShowMentionDropdown(false);
    } else if (e.key === 'Backspace') {
      if (!inputText.trim() && selectedMentions.length > 0) {
        e.preventDefault();
        removeMention(selectedMentions[selectedMentions.length - 1]);
      }
    }
  };

  // Resolve target file IDs from chips + typed mentions
  const resolveMentionedFileIds = (names: string[]): string[] => {
    const canon = (s: string) => s.trim().toLowerCase();
    const pool = availableFiles.map(f => ({
      id: f.fileId,
      name: canon(f.fileName || '')
    }));
    return names.map(n => canon(n))
      .map(n => pool.find(p => p.name === n || p.name.includes(n) || n.includes(p.name))?.id)
      .filter((id): id is string => !!id);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && selectedMentions.length === 0) return;

    const userMessage = inputText.trim();
    const typedMentions = findMentionsInText(userMessage);
    const mentionNames = Array.from(new Set([...selectedMentions, ...typedMentions]));
    // Keep the mentions in the message text
    const messageText = userMessage.trim() || `Analyze these documents: ${mentionNames.join(', ')}`;
    
    // Only resolve fileIds if we have files available and mentions
    const fileIds = (availableFiles.length > 0 && mentionNames.length > 0) 
      ? resolveMentionedFileIds(mentionNames) 
      : [];

    // Add user message to chat with mentions appended
    const displayText = mentionNames.length > 0
      ? `${messageText}\n@${mentionNames.join(' @')}`
      : messageText;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      text: displayText,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    setSelectedMentions([]); // Clear selected mentions after sending
    setShowMentionDropdown(false);
    setMentionFilter('');
    setIsLoading(true);

    // Always use API if we have files available, regardless of mentions
    const hasFiles = availableFiles.length > 0;
    
    try {
      let botResponseText: string;
      
      if (!hasFiles) {
        // Handle general questions without files
        console.log('No files available, using general knowledge...');
        const response = await backendAPI.queryDocuments(messageText);
        botResponseText = response.answer || "I'll do my best to help! While I don't see any uploaded documents to analyze, I can still answer general questions about construction, architecture, and related topics. What would you like to know?";
      } else {
        // Use ALL available files by default, or specific ones if mentioned
        const targetFileIds = fileIds.length > 0 ? fileIds : availableFiles.map(f => f.fileId);
        
        // Add context about whether user mentioned specific files
        const queryContext = fileIds.length > 0 
          ? `Focus on these specific documents: ${mentionNames.join(', ')}. ${messageText}`
          : `You have access to all uploaded documents. ${messageText}`;

        console.log('Sending query to backend:', {
          query: queryContext,
          targetFileIds,
          hasSpecificMentions: fileIds.length > 0
        });

        const response = await backendAPI.queryDocuments(queryContext);
        botResponseText = response.answer || "I couldn't find an answer to your question.";
      }

      // Add bot response
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponseText,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Provide more helpful error message
      let errorText = 'Sorry, I encountered an error. Please try again.';
      
      if (mentionNames.length > 0) {
        const foundFileIds = resolveMentionedFileIds(mentionNames);
        if (foundFileIds.length === 0) {
          errorText = `I couldn't find the documents you mentioned: ${mentionNames.join(', ')}. Please check the document names and try again.`;
        } else if (foundFileIds.length < mentionNames.length) {
          const foundMentions = mentionNames.filter(name => resolveMentionedFileIds([name]).length > 0);
          const missingMentions = mentionNames.filter(name => resolveMentionedFileIds([name]).length === 0);
          errorText = `I found some of the mentioned documents (${foundMentions.join(', ')}) but couldn't locate: ${missingMentions.join(', ')}. Please check the document names.`;
        }
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl shadow-sm flex flex-col h-96">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-900">Ask Questions</h3>
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
              {availableFiles.length} document{availableFiles.length !== 1 ? 's' : ''} available
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadPersistentDocuments}
              disabled={isLoadingDocuments || isUploadingFiles || isLoading}
              className="hover:bg-gray-200 rounded p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                isUploadingFiles 
                  ? "Please wait while files are processing..." 
                  : isLoading 
                  ? "Please wait while AI is responding..."
                  : "Refresh document list"
              }
            >
              <RefreshCw size={16} className={isLoadingDocuments ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Upload Status Banner */}
      {isUploadingFiles && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-blue-700">
              {uploadStatus === 'processing' ? 'Processing files...' : 'Uploading files...'}
            </span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Chat will be available once upload completes.
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.sender === 'bot' && (
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
            )}
            
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
              
              {message.sources && message.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Sources:</p>
                  <div className="space-y-1">
                    {message.sources.map((source, idx) => (
                      <div key={idx} className="text-xs text-gray-500">
                        📄 {source.fileName}
                        {source.pageNumber && ` (page ${source.pageNumber})`}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {message.sender === 'user' && (
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-blue-600" />
            </div>
            <div className="bg-gray-100 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
        <div className="flex flex-col space-y-2">
          {/* @ Mentioned files above input */}
          {selectedMentions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedMentions.map((fileName, index) => (
                <span key={index} className="inline-flex items-center gap-1 bg-gray-200 text-gray-800 rounded px-2 py-1 text-xs">
                  @{fileName}
                  <button onClick={() => removeMention(fileName)} className="text-gray-500 hover:text-gray-700">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              {/* Text input field */}
              <div className="px-3 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 bg-white">
                <input
                  type="text"
                  ref={inputRef}
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={isUploadingFiles ? "Please wait while files are processing..." : "Ask about document(s)... (use @filename to reference specific files)"}
                  className={`w-full outline-none text-sm placeholder:text-gray-400 ${isUploadingFiles ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                  disabled={isLoading || isUploadingFiles}
                />
              </div>

              {/* @ Mention Dropdown */}
              {showMentionDropdown && (
                <div className="absolute z-10 left-0 right-0 bottom-full mb-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-[200px] w-full">
                  <div className="p-2 border-b border-gray-200">
                    <input
                      type="text"
                      value={mentionFilter}
                      onChange={(e) => setMentionFilter(e.target.value)}
                      placeholder="Filter documents..."
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>
                  <div className="overflow-y-auto max-h-[150px]">
                    {filteredFiles.length > 0 ? (
                      filteredFiles.map((file, index) => (
                        <button
                          key={index}
                          onClick={() => insertMention(file.fileName)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-sm"
                        >
                          <div className="font-medium truncate">@{file.fileName}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {file.fileType?.toUpperCase()} • {file.fileSize ? `${(file.fileSize / 1024).toFixed(1)} KB` : 'Unknown size'}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">No documents found</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleSendMessage}
              disabled={(!inputText.trim() && selectedMentions.length === 0) || isUploadingFiles || isLoading}
              size="sm"
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              <Send className="w-4 h-4" />
              {isUploadingFiles ? 'Processing...' : 'Send'}
            </Button>
          </div>
        </div>
        
        {availableFiles.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            {availableFiles.length} documents available
          </div>
        )}
      </div>
    </div>
  );
}
