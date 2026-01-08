"use server";

import { getAuthToken } from "@/lib/auth-server";

const ASSISTANT_API_URL =
  "https://xtvj-bihp-mh8d.n7e.xano.io/api:CcHPK_bl/assistant/chat";
const CONVERSATIONS_API_URL =
  "https://xtvj-bihp-mh8d.n7e.xano.io/api:vJCScL_s/conversation";
const START_CONVERSATION_API_URL =
  "https://xtvj-bihp-mh8d.n7e.xano.io/api:vJCScL_s/conversation/start";
const CONTINUE_CONVERSATION_API_URL =
  "https://xtvj-bihp-mh8d.n7e.xano.io/api:vJCScL_s/conversation/continue";

export interface Conversation {
  id: string;
  name: string;
  model: string;
  user_id: number;
  project_id: number;
  created_at: string;
  messageCount?: number;
}

export interface ReferencedDocument {
  documents: {
    id: string;
    name: string;
    path: string;
    size: number;
    type: string;
    mime: string;
    processing_status: string;
    created_at: number;
    project_id?: number;
    [key: string]: any;
  };
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  refrenced_documents?: ReferencedDocument[];
  role: "user" | "assistant";
  index: number;
  // Content can be a string or an object
  // User message format: {"question":"...","references":[...]}
  // Assistant message format: {"answers":[...]}
  content: string | { question?: string; references?: Array<{ document_id: string }> } | { answers?: AnswerPart[] };
  created_at: string | number;
  // User message format: {"question":"...","references":[...]}
  question?: string;
  references?: Array<{ document_id: string }>;
  // Assistant message format: {"answers":[...]}
  answers?: AnswerPart[];
}

export interface ConversationWithMessages extends Conversation {
  messages: ConversationMessage[];
}

export interface StartConversationResponse {
  llm_answer: LLMAnswer;
  conversation: Conversation;
}

export interface StartConversationParams {
  question: string;
  project_id: string;
  documents_id: string[];
}

export interface ContinueConversationParams {
  conversations_id: string;
  question: string;
  documents_id?: string[];
}

export interface SourceDocument {
  pages: number[];
  document_id: string;
  document_name: string;
}

export interface AnswerReference {
  page: number;
  chunk_id: string;
  document_id: string;
}

export interface AnswerPart {
  text: string;
  answer_id: string;
  references: AnswerReference[];
}

export interface LLMAnswer {
  sources?: SourceDocument[];
  answer_markdown?: string;
  answers?: AnswerPart[];
  id?: string;
  role?: "user" | "assistant";
  index?: number;
  content?: string;
  created_at?: string | number;
  refrenced_documents?: ReferencedDocument[];
}

export interface ContinueConversationResponse {
  llm_answer: LLMAnswer;
}

export async function sendMessage(
  message: string,
  projectId?: number
): Promise<{ message: string }> {
  const authToken = await getAuthToken();

  if (!authToken) {
    throw new Error("Authentication required");
  }

  try {
    const body: { message: string; project_id?: number } = {
      message,
    };

    if (projectId) {
      body.project_id = projectId;
    }

    const response = await fetch(ASSISTANT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
      cache: "no-cache",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Assistant API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });

      throw new Error(
        `Failed to get assistant response: ${response.statusText}`
      );
    }

    const data = await response.json();

    // Handle different response formats
    if (typeof data === "string") {
      return { message: data };
    }

    if (data.message) {
      return { message: data.message };
    }

    if (data.response) {
      return { message: data.response };
    }

    if (data.text) {
      return { message: data.text };
    }

    // Fallback to stringifying the whole response
    return {
      message:
        typeof data === "object" ? JSON.stringify(data, null, 2) : String(data),
    };
  } catch (error: any) {
    console.error("Error sending message to assistant:", error);
    throw new Error(error.message || "Failed to communicate with assistant");
  }
}

export async function getConversations(
  projectId?: number | string
): Promise<Conversation[]> {
  const authToken = await getAuthToken();

  if (!authToken) {
    throw new Error("Authentication required");
  }

  try {
    // Optionally filter by project_id when provided
    const url = projectId
      ? `${CONVERSATIONS_API_URL}?project_id=${encodeURIComponent(
          String(projectId)
        )}`
      : `${CONVERSATIONS_API_URL}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      cache: "no-cache",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Get conversations API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });

      // Return empty array if endpoint doesn't exist yet
      if (response.status === 404) {
        return [];
      }

      throw new Error(`Failed to get conversations: ${response.statusText}`);
    }

    const data = await response.json();

    // Handle different response formats
    if (Array.isArray(data)) {
      return data;
    }

    if (data.conversations && Array.isArray(data.conversations)) {
      return data.conversations;
    }

    if (data.data && Array.isArray(data.data)) {
      return data.data;
    }

    return [];
  } catch (error: any) {
    console.error("Error fetching conversations:", error);
    // Return empty array on error to allow app to continue working
    return [];
  }
}

export async function getConversation(
  conversationId: string
): Promise<ConversationWithMessages | null> {
  const authToken = await getAuthToken();

  if (!authToken) {
    throw new Error("Authentication required");
  }

  try {
    const response = await fetch(`${CONVERSATIONS_API_URL}/${conversationId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      cache: "no-cache",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Get conversation API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });

      if (response.status === 404) {
        return null;
      }

      throw new Error(`Failed to get conversation: ${response.statusText}`);
    }

    const data = await response.json();

    // Ensure messages array exists
    if (!data.messages) {
      data.messages = [];
    }

    // Sort messages by index if available, otherwise by created_at
    if (data.messages.length > 0) {
      data.messages.sort((a: ConversationMessage, b: ConversationMessage) => {
        if (a.index !== undefined && b.index !== undefined) {
          return a.index - b.index;
        }
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
    }

    return data;
  } catch (error: any) {
    console.error("Error fetching conversation:", error);
    throw new Error(error.message || "Failed to fetch conversation");
  }
}

export async function createConversation(title: string): Promise<Conversation> {
  const authToken = await getAuthToken();

  if (!authToken) {
    throw new Error("Authentication required");
  }

  try {
    const response = await fetch(`${CONVERSATIONS_API_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        title,
      }),
      cache: "no-cache",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Create conversation API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });

      throw new Error(`Failed to create conversation: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error creating conversation:", error);
    throw new Error(error.message || "Failed to create conversation");
  }
}

export async function startConversation(
  params: StartConversationParams
): Promise<StartConversationResponse> {
  const authToken = await getAuthToken();

  if (!authToken) {
    throw new Error("Authentication required");
  }

  try {
    const response = await fetch(START_CONVERSATION_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        question: params.question,
        project_id: params.project_id,
        documents_id: params.documents_id,
      }),
      cache: "no-cache",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Start conversation API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });

      throw new Error(`Failed to start conversation: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error starting conversation:", error);
    throw new Error(error.message || "Failed to start conversation");
  }
}

export async function continueConversation(
  params: ContinueConversationParams
): Promise<ContinueConversationResponse> {
  const authToken = await getAuthToken();

  if (!authToken) {
    throw new Error("Authentication required");
  }

  try {
    const body: {
      conversations_id: string;
      question: string;
      documents_id?: string[];
    } = {
      conversations_id: params.conversations_id,
      question: params.question,
    };

    // Only include documents_id if provided and not empty
    if (params.documents_id && params.documents_id.length > 0) {
      body.documents_id = params.documents_id;
    }

    const response = await fetch(CONTINUE_CONVERSATION_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
      cache: "no-cache",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Continue conversation API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });

      throw new Error(
        `Failed to continue conversation: ${response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error continuing conversation:", error);
    throw new Error(error.message || "Failed to continue conversation");
  }
}

export interface ChunkData {
  id: string;
  document_id: string;
  text: string;
  markdown: string;
  type: string;
  annotated_chunk_image_path: string;
  page: number;
  created_at: number;
}

const CHUNK_API_URL =
  "https://xtvj-bihp-mh8d.n7e.xano.io/api:O2ncQBcv/fw/chunks";

export async function getChunkById(chunkId: string): Promise<ChunkData> {
  const authToken = await getAuthToken();

  if (!authToken) {
    throw new Error("Authentication required");
  }

  try {
    const response = await fetch(`${CHUNK_API_URL}/${chunkId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      cache: "no-cache",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Get chunk API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });

      throw new Error(`Failed to get chunk: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error fetching chunk:", error);
    throw new Error(error.message || "Failed to fetch chunk");
  }
}
