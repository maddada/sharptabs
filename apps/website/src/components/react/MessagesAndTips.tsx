import { messages } from "../../constants/messages";
import { useCallback, useEffect, useMemo, useState } from "react";
import type * as React from "react";

function cn(...classes: (string | undefined | null | false)[]): string {
    return classes.filter(Boolean).join(" ");
}

// Simple button component styled for dark theme
function Button({
    children,
    onClick,
    variant = "default",
    size = "sm",
    className,
}: {
    children: React.ReactNode;
    onClick: () => void;
    variant?: "default" | "outline";
    size?: "sm";
    className?: string;
}) {
    const baseClasses =
        "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    const sizeClasses = size === "sm" ? "h-9 px-3 text-sm" : "";
    const variantClasses =
        variant === "outline"
            ? "border border-neutral-600 bg-neutral-800 hover:bg-neutral-700 hover:text-white text-neutral-200"
            : "bg-primary text-white hover:bg-primary-light";

    return (
        <button className={cn(baseClasses, sizeClasses, variantClasses, className)} onClick={onClick}>
            {children}
        </button>
    );
}

// Simple icons as SVG components
function Check() {
    return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20,6 9,17 4,12"></polyline>
        </svg>
    );
}

export function MessagesAndTips() {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const [seenMessages, setSeenMessages] = useState<string[]>([]);

    // Load seen messages from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("sharptabs-seen-messages");
        if (saved) {
            try {
                setSeenMessages(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse seen messages from localStorage:", e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("sharptabs-seen-messages", JSON.stringify(seenMessages));
    }, [seenMessages]);

    // Sort messages with unread first, then read
    const sortedMessages = messages.sort((a, b) => {
        const aRead = seenMessages.includes(a.messageId);
        const bRead = seenMessages.includes(b.messageId);
        return aRead === bRead ? 0 : aRead ? 1 : -1;
    });

    const unreadCount = useMemo(() => messages.filter((msg) => !seenMessages.includes(msg.messageId)).length, [seenMessages]);
    const hasUnreadMessages = unreadCount > 0;
    const currentMessage = sortedMessages[currentMessageIndex];
    const isCurrentMessageRead = seenMessages.includes(currentMessage?.messageId);
    const isLastMessage = currentMessageIndex === sortedMessages.length - 1;

    const handleNext = useCallback(() => {
        // If current message is unread, mark it as read
        if (currentMessage && !isCurrentMessageRead) {
            const newSeenMessages = [...seenMessages, currentMessage.messageId];
            setSeenMessages(newSeenMessages);
        }

        // Move to next message
        const nextIndex = (currentMessageIndex + 1) % sortedMessages.length;
        setCurrentMessageIndex(nextIndex);
    }, [seenMessages, currentMessageIndex, sortedMessages, currentMessage, isCurrentMessageRead]);

    if (sortedMessages.length === 0) {
        return null;
    }

    return (
        <section
            id="messages-tips"
            className={cn(
                "scroll-mt-24 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900  shadow-2xl transition-all duration-500 py-4 px-6 min-h-[430px] flex flex-col min-w-[700px] w-full select-none border border-neutral-700/50"
                // hasUnreadMessages && "border-2 border-primary ring-2 ring-primary/20 shadow-primary/10"
            )}
        >
            <div className="mb-2 flex items-start justify-between">
                <div className="flex flex-row items-center gap-6">
                    <h2 className="items-center justify-center align-middle text-2xl font-bold tracking-tight text-white">
                        Messages & Tips
                    </h2>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                    {hasUnreadMessages && (
                        <div className="flex items-center gap-2 text-sm">
                            <span className="rounded-full border border-primary/30 bg-gradient-to-r from-primary/30 to-primary/20 px-3 py-1.5 text-xs font-semibold text-primary backdrop-blur-sm">
                                {unreadCount} unread
                            </span>
                            <span className="text-neutral-400">/ {sortedMessages.length} total</span>
                        </div>
                    )}
                    {!hasUnreadMessages && sortedMessages.length > 0 && (
                        <span className="rounded-full border border-neutral-600/50 bg-neutral-800/50 px-3 py-1.5 text-sm text-neutral-400">
                            {sortedMessages.length} total
                        </span>
                    )}
                </div>
            </div>

            <div className="from-neutral-850 flex flex-1 flex-row rounded-xl border border-neutral-600/50 bg-gradient-to-b to-neutral-900 p-6 shadow-inner">
                <div className="relative flex-1 overflow-hidden">
                    {currentMessage && (
                        <div
                            className={cn(
                                "h-full flex flex-col transition-opacity duration-300 relative",
                                isCurrentMessageRead ? "opacity-75" : "opacity-100"
                            )}
                        >
                            <div className="scrollbar-hide mb-4 flex-1 overflow-y-auto pr-4 font-medium leading-relaxed text-neutral-100">
                                <div className="space-y-3 text-lg">
                                    <h2 className="text-2xl font-bold">{currentMessage.messageTitle}</h2>
                                    {currentMessage.messageContent}
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="absolute bottom-0 right-0">
                        <Button
                            onClick={handleNext}
                            variant={isCurrentMessageRead ? "outline" : "default"}
                            size="sm"
                            className="flex items-center gap-2 rounded-lg px-4 py-2 shadow-lg backdrop-blur-sm transition-all duration-200 hover:shadow-xl"
                        >
                            {isCurrentMessageRead ? (
                                <>{isLastMessage ? "Go to start" : "Next"}</>
                            ) : (
                                <>
                                    {isLastMessage ? "Go to start" : "Next"}
                                    {!isLastMessage && <Check />}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
