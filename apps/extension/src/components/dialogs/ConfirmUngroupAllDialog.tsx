import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface ConfirmUngroupAllProps {
    isUngroupDialogOpen: boolean;
    setIsUngroupDialogOpen: (open: boolean) => void;
    onConfirmUngroup: () => void;
    isUngrouping: boolean;
    setIsPopoverOpen: (open: boolean) => void;
}

export function ConfirmUngroupAllDialog({
    isUngroupDialogOpen,
    setIsUngroupDialogOpen,
    onConfirmUngroup,
    isUngrouping,
    setIsPopoverOpen,
}: ConfirmUngroupAllProps) {
    return (
        <Dialog open={isUngroupDialogOpen} onOpenChange={setIsUngroupDialogOpen} aria-describedby={undefined}>
            <DialogContent
                aria-describedby={undefined}
                className="max-h-[55vh] max-w-[calc(100vw-1rem)] rounded-lg sm:w-[400px] sm:max-w-[calc(100vw-1rem)]"
            >
                <style>{`button:has(> svg.lucide-x) { display: none; }`}</style>
                <DialogHeader>
                    <DialogTitle>Are you absolutely sure?</DialogTitle>
                    <DialogDescription>This action cannot be undone. This will ungroup all tabs in this window.</DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-1.5">
                    <Button variant="secondary" onClick={onConfirmUngroup} disabled={isUngrouping} autoFocus>
                        {isUngrouping ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
                    </Button>
                    <Button
                        variant="outline"
                        disabled={isUngrouping}
                        onClick={() => {
                            setIsUngroupDialogOpen(false);
                            setIsPopoverOpen(false);
                        }}
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
