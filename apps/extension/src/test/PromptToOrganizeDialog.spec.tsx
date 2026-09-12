import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PromptToOrganizeDialog } from "@/components/dialogs/PromptToOrganizeDialog";

describe("PromptToOrganizeDialog", () => {
    it("keeps the same focused input while typing and isolates tab shortcuts", () => {
        const onOpenChange = vi.fn();
        const onSubmit = vi.fn();
        const globalKeyDown = vi.fn();
        window.addEventListener("keydown", globalKeyDown);
        const { rerender } = render(<PromptToOrganizeDialog open onOpenChange={onOpenChange} onSubmit={onSubmit} />);
        const input = screen.getByRole("textbox", { name: "Organization prompt" });

        try {
            let value = "";
            for (const key of "group youtube links") {
                fireEvent.keyDown(input, { key });
                value += key;
                fireEvent.input(input, { target: { value } });
                rerender(<PromptToOrganizeDialog open onOpenChange={onOpenChange} onSubmit={onSubmit} />);
                expect(screen.getByRole("textbox")).toBe(input);
                expect(input).toHaveFocus();
                expect(input).toHaveValue(value);
            }
            expect(globalKeyDown).not.toHaveBeenCalled();
            expect(onOpenChange).not.toHaveBeenCalled();
        } finally {
            window.removeEventListener("keydown", globalKeyDown);
        }
    });

    it("submits a trimmed prompt once and starts empty when reopened", () => {
        const onOpenChange = vi.fn();
        const onSubmit = vi.fn();
        const { rerender } = render(<PromptToOrganizeDialog open onOpenChange={onOpenChange} onSubmit={onSubmit} />);
        fireEvent.input(screen.getByRole("textbox"), { target: { value: "  group youtube links  " } });
        fireEvent.click(screen.getByRole("button", { name: "Preview organization" }));
        expect(onSubmit).toHaveBeenCalledExactlyOnceWith("group youtube links");
        expect(onOpenChange).toHaveBeenCalledWith(false);
        rerender(<PromptToOrganizeDialog open={false} onOpenChange={onOpenChange} onSubmit={onSubmit} />);
        rerender(<PromptToOrganizeDialog open onOpenChange={onOpenChange} onSubmit={onSubmit} />);
        expect(screen.getByRole("textbox")).toHaveValue("");
    });
});
