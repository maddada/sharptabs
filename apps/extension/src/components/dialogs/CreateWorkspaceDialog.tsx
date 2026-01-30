import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { createWorkspace } from "@/utils/workspaces/workspaceHandlers";
import { useState } from "react";
import { toast } from "sonner";
import { WorkspaceIconPicker } from "./WorkspaceIconPicker";

interface CreateWorkspaceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateWorkspaceDialog({ open, onOpenChange }: CreateWorkspaceDialogProps) {
    const [name, setName] = useState("");
    const [selectedIcon, setSelectedIcon] = useState("Briefcase");
    const [isCreating, setIsCreating] = useState(false);

    const { actions } = useWorkspaceStore();

    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error("Please enter a workspace name");
            return;
        }

        setIsCreating(true);
        try {
            const workspace = await createWorkspace(name.trim(), selectedIcon);
            actions.addWorkspace(workspace);
            toast.success(`Workspace "${workspace.name}" created`);

            // Reset form
            setName("");
            setSelectedIcon("Briefcase");
            onOpenChange(false);
        } catch (error) {
            console.error("Error creating workspace:", error);
            toast.error("Failed to create workspace");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange} aria-describedby={undefined}>
            <DialogContent
                className="max-w-[calc(100vw-2rem)] rounded-lg px-4 sm:w-[400px] sm:max-w-[calc(100vw-2rem)] sm:px-6"
                aria-describedby={undefined}
            >
                <style>{`button:has(> svg.lucide-x) { display: none; }`}</style>
                <DialogHeader>
                    <DialogTitle>New Workspace</DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="workspace-name">Workspace Name</Label>
                        <Input
                            id="workspace-name"
                            placeholder="e.g., Work, Personal, Project..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleCreate();
                                }
                            }}
                            autoFocus
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Choose Icon</Label>
                        <WorkspaceIconPicker selectedIcon={selectedIcon} onSelectIcon={setSelectedIcon} />
                    </div>
                </div>

                <DialogFooter className="gap-1.5">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={isCreating || !name.trim()}>
                        {isCreating ? "Creating..." : "Create Workspace"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
