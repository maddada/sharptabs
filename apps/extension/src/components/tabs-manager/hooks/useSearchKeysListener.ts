import { useEffect } from "react";

export function useSearchKeysListener(
    searchInputRef: React.RefObject<HTMLInputElement | null>,
    handleSearchClear: () => void,
    setIsSearchBarFocused: (focused: boolean) => void,
    handleSearchTermUpdate: (newSearchTerm: string) => void
) {
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                handleSearchClear();
                return;
            }

            // Handle up arrow in search field - focus last item
            if (e.key === "ArrowUp" && e.target === searchInputRef.current) {
                console.log("🔼 Up arrow in search field - focusing last item");
                e.preventDefault();

                // Get all focusable tab elements (both tab items and group headers)
                const tabElements = document.querySelectorAll("div[data-tab-id], button[id^='group-']");
                const focusableElements = Array.from(tabElements).filter((el) => {
                    const element = el as HTMLElement;
                    return (
                        element.offsetParent !== null && // Element is visible
                        !element.hasAttribute("disabled") &&
                        element.getAttribute("tabindex") !== "-1"
                    );
                });

                if (focusableElements.length > 0) {
                    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
                    console.log("✅ Focusing last element:", {
                        element: lastElement,
                        id: lastElement.id,
                        textContent: lastElement.textContent?.slice(0, 30),
                    });

                    lastElement.focus();
                    lastElement.scrollIntoView({
                        behavior: "smooth",
                        block: "nearest",
                    });
                } else {
                    console.log("❌ No focusable elements found");
                }

                return;
            }

            // Make space open tab groups
            if (e.key === " ") {
                return;
            }

            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                e.ctrlKey ||
                e.altKey ||
                e.metaKey ||
                (e.key.length !== 1 && e.key !== "Backspace")
            ) {
                console.log("🔍 [useSearchKeysListener] Not focusing search - key ignored:", {
                    key: e.key,
                    isInput: e.target instanceof HTMLInputElement,
                    isTextArea: e.target instanceof HTMLTextAreaElement,
                    ctrlKey: e.ctrlKey,
                    altKey: e.altKey,
                    metaKey: e.metaKey,
                });
                return;
            }
            console.log("🔍 [useSearchKeysListener] Attempting to focus search input for key:", e.key);
            if (searchInputRef.current) {
                console.log("🔍 [useSearchKeysListener] searchInputRef.current exists, making visible first...");

                // Prevent the default behavior to capture the key
                e.preventDefault();

                // Get the current search term value
                const currentValue = searchInputRef.current.value;

                // Calculate the new value based on the key pressed
                let newValue = currentValue;
                if (e.key === "Backspace") {
                    newValue = currentValue.slice(0, -1);
                } else if (e.key.length === 1) {
                    newValue = currentValue + e.key;
                }

                console.log("🔍 [useSearchKeysListener] Updating search term from", currentValue, "to", newValue);

                // Make the search bar visible BEFORE trying to focus
                setIsSearchBarFocused(true);

                // Update the search term with the new character
                handleSearchTermUpdate(newValue);

                // Use setTimeout to ensure the display change happens before focus
                setTimeout(() => {
                    if (searchInputRef.current) {
                        console.log("🔍 [useSearchKeysListener] Now focusing after display change...");
                        searchInputRef.current.focus();
                        // Set cursor to end of input
                        searchInputRef.current.setSelectionRange(newValue.length, newValue.length);
                        console.log("🔍 [useSearchKeysListener] Focus called. Active element:", document.activeElement?.id);
                    }
                }, 0);
            } else {
                console.log("🔍 [useSearchKeysListener] ERROR: searchInputRef.current is null!");
            }
        };
        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, [searchInputRef, handleSearchClear, setIsSearchBarFocused, handleSearchTermUpdate]);
}
