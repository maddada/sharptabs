import { create } from "zustand";
import { RefObject } from "react";

interface SearchState {
    searchTerm: string;
    isSearchBarFocused: boolean;
    searchInputRef: RefObject<HTMLInputElement> | null;

    actions: {
        setSearchTerm: (term: string) => void;
        setIsSearchBarFocused: (focused: boolean) => void;
        setSearchInputRef: (ref: RefObject<HTMLInputElement>) => void;
        clearSearch: () => void;
    };
}

export const useSearchStore = create<SearchState>((set, get) => ({
    searchTerm: "",
    isSearchBarFocused: false,
    searchInputRef: null,

    actions: {
        setSearchTerm: (term: string) => set({ searchTerm: term }),
        setIsSearchBarFocused: (focused: boolean) => set({ isSearchBarFocused: focused }),
        setSearchInputRef: (ref: RefObject<HTMLInputElement>) => set({ searchInputRef: ref }),
        clearSearch: () => {
            set({ searchTerm: "", isSearchBarFocused: false });
            const ref = get().searchInputRef;
            if (ref?.current) {
                ref.current.blur();
            }
        },
    },
}));
