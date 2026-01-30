import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { RefreshCcw, BrushCleaning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { handleDeleteSession } from "./sessionHandlers";
import { SavedSession } from "@/types/SavedSession";
import { SessionRestoreDetailDialog } from "./SessionRestoreDetailDialog";

type SessionManagementDialogProps = {
    isRestoreDialogOpen: boolean;
    setIsRestoreDialogOpen: (isOpen: boolean) => void;
    savedSessions: SavedSession[];
    setSavedSessions: (sessions: SavedSession[]) => void;
};

// Helper to format time without seconds
function formatTimeNoSeconds(time: string) {
    // Matches formats like '7:12:46 PM' or '07:12:46 AM'
    const match = time.match(/^(\d{1,2}:\d{2})(?::\d{2})?\s?(AM|PM)$/i);
    if (match) {
        return `${match[1]} ${match[2]}`;
    }
    return time;
}

export function SessionManagementDialog({
    isRestoreDialogOpen,
    setIsRestoreDialogOpen,
    savedSessions,
    setSavedSessions,
}: SessionManagementDialogProps) {
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [selectedSession, setSelectedSession] = useState<SavedSession | null>(null);

    const openDetailDialog = (session: SavedSession) => {
        setSelectedSession(session);
        setIsDetailDialogOpen(true);
    };

    const closeDetailDialog = () => {
        setIsDetailDialogOpen(false);
        setSelectedSession(null);
    };

    // Custom handler to prevent all automatic closing - dialog should only close via explicit close actions
    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            return;
        }
    };

    return (
        <>
            <Dialog modal={true} open={isRestoreDialogOpen} onOpenChange={handleOpenChange}>
                <DialogContent
                    aria-describedby={undefined}
                    className="max-w-[calc(100vw-2rem)] rounded-lg px-4 sm:w-[400px] sm:max-w-[calc(100vw-2rem)] sm:px-6"
                >
                    <style>{`button:has(> svg.lucide-x) { display: none; }`}</style>
                    <DialogHeader>
                        <DialogTitle>Manage Saved Sessions</DialogTitle>
                        <DialogDescription>
                            Select a previously saved session to view its contents or delete it.
                            <br />
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto p-1">
                        {savedSessions.length === 0 ? (
                            <p className="text-center text-muted-foreground">No saved sessions found.</p>
                        ) : (
                            <ul className="space-y-2">
                                {savedSessions.map((session, index) => (
                                    <React.Fragment key={session.timestamp.toString() + index.toString()}>
                                        <li
                                            id={session.timestamp.toString() + index.toString()}
                                            className="flex flex-col items-center justify-center gap-3 p-3 align-middle sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div className="flex flex-col items-center sm:items-start">
                                                <p className="flex max-w-[300px] flex-wrap justify-center gap-x-2 gap-y-1 font-medium sm:justify-normal">
                                                    <span>{session.date}</span>
                                                    <span>{formatTimeNoSeconds(session.time)}</span>
                                                </p>
                                                <p className="flex max-w-[213px] flex-wrap justify-center gap-x-2 gap-y-1 text-sm text-muted-foreground sm:justify-normal">
                                                    <span>{session.isAuto ? "Auto save" : "Manual save"}</span>
                                                    <span>Pinned: {session.pinnedTabs.length}</span>
                                                    <span>Groups: {session.tabGroups.length}</span>
                                                    <span>
                                                        Tabs:
                                                        {session.regularTabs.length +
                                                            (session.tabGroups.reduce((acc, group) => acc + group.tabs.length, 0) || 0)}
                                                    </span>
                                                </p>
                                            </div>
                                            <div className="min-w-150px mt-1.5 flex max-w-[150px] flex-row gap-2 sm:mt-0 sm:flex-col">
                                                <Button
                                                    title="View & Restore Items"
                                                    variant="default"
                                                    size="sm"
                                                    onClick={() => openDetailDialog(session)}
                                                    className="px-3"
                                                >
                                                    <RefreshCcw className="mr-1 h-4 w-4" />
                                                </Button>
                                                <Button
                                                    title="Delete Session"
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDeleteSession(session.timestamp, setSavedSessions)}
                                                    className="px-3"
                                                >
                                                    <BrushCleaning className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </li>
                                        {savedSessions.length > 0 && savedSessions.indexOf(session) !== savedSessions.length - 1 && (
                                            <li className="border-t"></li>
                                        )}
                                    </React.Fragment>
                                ))}
                            </ul>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRestoreDialogOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <SessionRestoreDetailDialog session={selectedSession} isOpen={isDetailDialogOpen} onClose={closeDetailDialog} />
        </>
    );
}
