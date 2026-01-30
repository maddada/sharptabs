import { Button } from "@/components/ui/button";
import { Settings } from "@/types/Settings";
import { hasAutoSuspendPermissions, requestAutoSuspendPermissions } from "@/utils/permissions";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface HostPermissionRequestProps {
    autoSuspendEnabled: boolean;
    updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

export function HostPermissionRequest({ autoSuspendEnabled, updateSetting }: HostPermissionRequestProps) {
    const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);
    const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);

    // Check current permission status
    const checkPermissions = async () => {
        const hasPermission = await hasAutoSuspendPermissions();
        setHasPermissions(hasPermission);
    };

    // Request host permissions
    const handleRequestPermissions = async () => {
        setIsRequestingPermissions(true);
        try {
            const granted = await requestAutoSuspendPermissions();

            if (granted) {
                console.log("Host permissions have been granted! ✅");
                setHasPermissions(true);
                toast.success(
                    "Permissions granted! Auto tab suspension and screenshot capture are now enabled. Please restart your browser for all features to work correctly."
                );

                // Notify service worker to register content scripts
                chrome.runtime.sendMessage({ type: "PERMISSIONS_GRANTED" });

                // Enable auto suspend since we now have permissions
                updateSetting("autoSuspendEnabled", true);
            } else {
                console.log("Permissions were denied. ❌");
                toast.error("Extra permissions are required to enable automatic tab suspension and screenshot capture.");

                // Disable auto suspend since we don't have permissions
                updateSetting("autoSuspendEnabled", false);
            }
        } catch (error) {
            console.error("Error requesting permissions:", error);
            toast.error("Failed to request permissions. Please try again.");
        } finally {
            setIsRequestingPermissions(false);
        }
    };

    // Remove permissions
    // const handleRemovePermissions = async () => {
    //     const removed = await removeAutoSuspendPermissions();

    //     if (removed) {
    //         setHasPermissions(false);
    //         toast.success("Extra permissions removed. Auto tab suspension is now disabled.");

    //         // Notify service worker to unregister content scripts
    //         chrome.runtime.sendMessage({ type: "PERMISSIONS_REMOVED" });

    //         // Disable auto suspend since we no longer have permissions
    //         updateSetting("autoSuspendEnabled", false);
    //     } else {
    //         toast.error("Failed to remove permissions.");
    //     }
    // };

    // Check permissions on component mount and when auto suspend setting changes
    useEffect(() => {
        checkPermissions();
    }, []);

    // Listen for permission changes
    useEffect(() => {
        const handlePermissionChange = (permissions: chrome.permissions.Permissions) => {
            if (permissions.origins) {
                checkPermissions();
            }
        };

        if (chrome.permissions && chrome.permissions.onAdded) {
            chrome.permissions.onAdded.addListener(handlePermissionChange);
            chrome.permissions.onRemoved.addListener(handlePermissionChange);
        }

        return () => {
            if (chrome.permissions && chrome.permissions.onAdded) {
                chrome.permissions.onAdded.removeListener(handlePermissionChange);
                chrome.permissions.onRemoved.removeListener(handlePermissionChange);
            }
        };
    }, []);

    // If we're still checking permissions, show loading state
    if (hasPermissions === null) {
        return (
            <div className="mt-6 flex flex-row items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 p-3 shadow-sm">
                <div className="space-y-0.5">
                    <div className="text-sm font-semibold text-yellow-800">Checking Permissions...</div>
                    <div className="text-sm text-yellow-700">Verifying host access permissions for auto tab suspension.</div>
                </div>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-yellow-800 border-t-transparent"></div>
            </div>
        );
    }

    // If auto suspend is enabled but we don't have permissions, show warning
    if (autoSuspendEnabled && !hasPermissions) {
        return (
            <div className="mt-6 flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                    <div className="text-foreground-muted text-sm font-semibold">⚠️ Permissions Required ⚠️</div>
                    <div className="text-foreground-muted text-sm">
                        Auto tab suspension requires scripting and host permissions to monitor tab activity across your tabs, suspend inactive ones,
                        and capture screenshots before suspending.
                        <br />
                        Click "Grant Permissions" to enable this feature.
                    </div>
                </div>
                <Button variant="outline" onClick={handleRequestPermissions} disabled={isRequestingPermissions} className="min-w-32">
                    {isRequestingPermissions ? "Requesting..." : "Grant Permissions"}
                </Button>
            </div>
        );
    }

    // If we have permissions, show success state with option to remove
    if (hasPermissions) {
        return (
            <div className="mt-6 flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                    <div className="text-foreground-muted text-sm font-semibold">Permissions Granted</div>
                    <div className="text-foreground-muted text-sm">
                        Auto tab suspension has the required permissions to monitor and suspend inactive tabs, and to capture screenshots before
                        suspending.
                    </div>
                </div>
                {/* <Button variant="outline" onClick={handleRemovePermissions} className="min-w-32">
                You can revoke these permissions at any time.
                    Revoke Permissions
                </Button> */}
            </div>
        );
    }

    // If auto suspend is disabled, show info about permissions
    return (
        <></>
        // <div className="mt-6 flex flex-row items-center justify-between rounded-lg border border-foreground p-3 shadow-sm">
        //     <div className="space-y-0.5">
        //         <div className="text-foreground-muted text-sm font-semibold"> Extra Permissions</div>
        //         <div className="text-foreground-muted text-sm">
        //             When you enable auto tab suspension, you'll be prompted to grant extra permissions.
        //             <br /> These are only used to monitor tab activity for suspension timing.
        //         </div>
        //     </div>
        //     <Button variant="outline" onClick={handleRequestPermissions} disabled={isRequestingPermissions} className="min-w-32">
        //         {isRequestingPermissions ? "Requesting..." : "Grant Now"}
        //     </Button>
        // </div>
    );
}
