import { useEffect } from "react";
import { disableConsoleLogging } from "@/utils/disableConsoleLogging";

export const useConsoleLoggingDisabler = () => {
    useEffect(() => {
        chrome.storage.local
            .get("enableConsoleLogging")
            .then((result) => result.enableConsoleLogging)
            .then((enableConsoleLogging) => {
                if (enableConsoleLogging !== true && enableConsoleLogging !== "1" && enableConsoleLogging !== "true" && enableConsoleLogging !== 1) {
                    disableConsoleLogging("default");
                    const interval = setInterval(() => {
                        disableConsoleLogging("default");
                    }, 30000);
                    return () => clearInterval(interval);
                }
            });
    }, []);
};
