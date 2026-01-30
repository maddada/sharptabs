export function disableConsoleLogging(mode = "default") {
    if (mode === "service-worker") {
        console.log = () => {};
        console.error = () => {};
        console.debug = () => {};
        return;
    }

    if (mode !== "service-worker" && typeof window !== "undefined" && window.console) {
        window.console.log = () => {};
        window.console.error = () => {};
        window.console.debug = () => {};
    } else if (mode !== "service-worker" && typeof console !== "undefined") {
        console.log = () => {};
        console.error = () => {};
        console.debug = () => {};
    }
}
