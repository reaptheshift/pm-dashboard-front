"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare } from "lucide-react";
import { Conversation } from "../_actions";
import { formatDistanceToNow } from "date-fns";

interface ConversationsSidebarProps {
	conversations: Conversation[];
	currentConversationId: string | null;
	onSelectConversation: (id: string) => void;
	onNewConversation: () => void;
	isLoading?: boolean;
	isCreatingConversation?: boolean;
	creatingConversationId?: string | null;
}

export function ConversationsSidebar({
	conversations,
	currentConversationId,
	onSelectConversation,
	onNewConversation,
	isLoading = false,
	isCreatingConversation = false,
	creatingConversationId = null,
}: ConversationsSidebarProps) {
	const formatDate = (dateString: string) => {
		try {
			const date = new Date(dateString);
			return formatDistanceToNow(date, { addSuffix: true });
		} catch {
			return "Unknown";
		}
	};

	return (
		<div className="w-80 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col min-h-[600px]">
			{/* Header */}
			<div className="p-4 border-b border-gray-200">
				<Button
					onClick={onNewConversation}
					className="w-full bg-gray-900 text-white hover:bg-gray-800"
				>
					<Plus className="w-4 h-4 mr-2" />
					New Conversation
				</Button>
			</div>

			{/* Conversations List */}
			<div className="flex-1 overflow-y-auto">
				{isLoading ? (
					<div className="p-4 text-center">
						<div className="flex flex-col items-center gap-2">
							<div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
							<p className="text-sm text-gray-500">
								Loading conversations...
							</p>
						</div>
					</div>
				) : conversations.length === 0 ? (
					<div className="p-4 text-center">
						<MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
						<p className="text-sm text-gray-500">
							No conversations yet
						</p>
						<p className="text-xs text-gray-400 mt-1">
							Start a new conversation to begin
						</p>
					</div>
				) : (
					<div className="p-2 space-y-1">
						{/* Loading conversation placeholder */}
						{isCreatingConversation && creatingConversationId && (
							<div className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
								<div className="flex items-center gap-2">
									<p className="text-sm font-medium text-gray-900 flex items-center gap-1">
										Creating conversation
										<span className="inline-flex items-center gap-0.5">
											<span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
											<span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
											<span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></span>
										</span>
									</p>
								</div>
							</div>
						)}
						{conversations.map((conversation) => {
							const isActive =
								conversation.id === currentConversationId;
							return (
								<button
									key={conversation.id}
									onClick={() =>
										onSelectConversation(conversation.id)
									}
									className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
										isActive
											? "bg-gray-900 text-white"
											: "text-gray-700 hover:bg-gray-50"
									}`}
								>
									<div className="flex items-start justify-between gap-2">
										<div className="flex-1 min-w-0">
											<p
												className={`text-sm font-medium truncate ${
													isActive
														? "text-white"
														: "text-gray-900"
												}`}
											>
												{conversation.name || "New Conversation"}
											</p>
											<p
												className={`text-xs mt-1 ${
													isActive
														? "text-gray-300"
														: "text-gray-500"
												}`}
											>
												{formatDate(conversation.created_at)}
											</p>
											{conversation.messageCount !==
												undefined && (
												<p
													className={`text-xs mt-1 ${
														isActive
															? "text-gray-400"
															: "text-gray-400"
													}`}
												>
													{conversation.messageCount}{" "}
													message
													{conversation.messageCount !==
													1
														? "s"
														: ""}
												</p>
											)}
										</div>
									</div>
								</button>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}

