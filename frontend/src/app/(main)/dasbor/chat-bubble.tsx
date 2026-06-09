import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatBotProps } from './chatbot';

export function ChatBubble({ chat }: { chat: ChatBotProps }) {
    const isUser = chat.ChatRole === 'user';
    
    return (
        <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
            {isUser ? (
                <div className="max-w-[85%] px-4 py-2.5 text-sm leading-relaxed rounded-2xl rounded-tr-sm bg-gradient-to-t from-[#2BBAEE]/20 to-transparent text-neutral-900 shadow-sm">
                    <span className="flex flex-col gap-2 break-words [&>p]:m-0 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&_strong]:font-semibold [&>h3]:font-bold [&>h3]:text-base">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {chat.ChatMessages}
                        </ReactMarkdown>
                    </span>
                </div>
            ) : (
                <div className="flex gap-3 w-full max-w-full px-1 py-2 text-sm leading-relaxed text-gray-800">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-[#2BBAEE]/30">
                        <img src="/LogoIcon.svg" alt="BeeZ" className="size-4 object-contain" />
                    </div>
                    <div className="flex-1 min-w-0 mt-0.5">
                        <span className="flex flex-col gap-2 break-words [&>p]:m-0 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&_strong]:font-semibold [&>h3]:font-bold [&>h3]:text-base">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {chat.ChatMessages}
                            </ReactMarkdown>
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}