import Ai03 from "@/components/ai-03";
import { ChatBubble } from "./chat-bubble";
import { AttachedType } from "@/types";

export interface ChatBotProps {
    ChatMessages: string;
    ChatRole: string;
    Model?: string;
}

export interface ChatBotListProps {
    chats: ChatBotProps[];
    onSendMessage: (message: string, attachedType: AttachedType) => void;
    isLoading?: boolean;
}

export default function ChatBot({ chats, onSendMessage, isLoading }: ChatBotListProps) {
    return (
        <div className="relative flex flex-col h-full w-full">
            {/* Chat area takes absolute full height so messages scroll *under* the input */}
            <div className="absolute inset-0 overflow-y-auto px-1 pt-10 pb-32 flex flex-col gap-3">
                {chats.map((chat, index) => (
                    <ChatBubble key={index} chat={chat} />
                ))}
            </div>
            
            <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-white via-white/95 to-white/10 pt-12 pb-1 px-1 pointer-events-none">
                <div className="pointer-events-auto rounded-2xl">
                    <Ai03 onSendMessage={onSendMessage} isLoading={isLoading} />
                </div>
            </div>
        </div>
    )
}