import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PROMPT_TO_ORGANIZE_MAX_LENGTH } from "@packages/shared/gemini-config";
import { FormEvent, useRef } from "react";

interface PromptToOrganizeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (prompt: string) => void;
}

export function PromptToOrganizeDialog({ open, onOpenChange, onSubmit }: PromptToOrganizeDialogProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen && inputRef.current) inputRef.current.value = "";
        onOpenChange(nextOpen);
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const normalizedPrompt = inputRef.current?.value.trim() ?? "";
        if (!normalizedPrompt) return;

        if (inputRef.current) inputRef.current.value = "";
        onOpenChange(false);
        onSubmit(normalizedPrompt);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
                // Center with layout instead of a transformed animation layer. Chrome
                // popups can repaint that layer when the input caret changes.
                className="inset-0 m-auto h-fit max-h-[calc(100%-2rem)] max-w-[calc(100vw-2rem)] transform-none overflow-y-auto rounded-lg px-4 data-[state=open]:animate-none data-[state=closed]:animate-none sm:w-[440px] sm:max-w-[calc(100vw-2rem)] sm:px-6"
                onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    inputRef.current?.focus({ preventScroll: true });
                }}
                onKeyDown={(event) => event.stopPropagation()}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <DialogHeader>
                        <DialogTitle>Prompt to organize</DialogTitle>
                        <DialogDescription>Describe one quick change. You can review the matching tabs before applying it.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-1.5">
                        <Input
                            ref={inputRef}
                            id="prompt-to-organize"
                            aria-label="Organization prompt"
                            maxLength={PROMPT_TO_ORGANIZE_MAX_LENGTH}
                            placeholder="Create a new group for all YouTube links"
                            autoComplete="off"
                            required
                        />
                        <div className="text-right text-xs text-muted-foreground">{PROMPT_TO_ORGANIZE_MAX_LENGTH} characters maximum</div>
                    </div>

                    <DialogFooter className="gap-1.5">
                        <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Preview organization</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
