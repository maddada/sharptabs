import { beforeEach, describe, expect, it, vi } from "vitest";
import { addToNavigationHistory } from "@/service_worker/navigation/addToNavigationHistory";
import { cleanupNavigationHistory } from "@/service_worker/navigation/cleanupNavigationHistory";
import { getNavigationState } from "@/service_worker/navigation/getNavigationState";
import { handleNavigateBack } from "@/service_worker/navigation/handleNavigateBack";
import { handleNavigateForward } from "@/service_worker/navigation/handleNavigateForward";
import { navigationHistoryByWindow, programmaticNavigationInProgress } from "@/service_worker/navigation/navigationConstants";

const resetNavigationState = () => {
    for (const key of Object.keys(navigationHistoryByWindow)) {
        delete navigationHistoryByWindow[Number(key)];
    }
    programmaticNavigationInProgress.clear();
};

const setupChromeMocks = () => {
    // @ts-expect-error inject global chrome
    globalThis.chrome = {
        tabs: {
            update: vi.fn().mockResolvedValue(undefined),
            get: vi.fn().mockResolvedValue({}),
        },
        runtime: {
            sendMessage: vi.fn().mockResolvedValue(undefined),
        },
    } as unknown as globalThis.chrome;
};

describe("navigation history (back/forward)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetNavigationState();
        setupChromeMocks();
    });

    it("tracks activation history per window and exposes navigation state", async () => {
        addToNavigationHistory(1, 101);
        addToNavigationHistory(1, 102);
        addToNavigationHistory(1, 103);

        expect(navigationHistoryByWindow[1]?.history).toEqual([101, 102, 103]);
        expect(navigationHistoryByWindow[1]?.currentIndex).toBe(2);

        const state = await getNavigationState(1);
        expect(state).toEqual({ canGoBack: true, canGoForward: false });

        addToNavigationHistory(2, 201);
        addToNavigationHistory(2, 202);
        expect(navigationHistoryByWindow[2]?.history).toEqual([201, 202]);
        expect(navigationHistoryByWindow[2]?.currentIndex).toBe(1);
    });

    it("truncates forward history when a new tab is manually activated", () => {
        navigationHistoryByWindow[1] = { history: [1, 2, 3], currentIndex: 1 };

        addToNavigationHistory(1, 4);

        expect(navigationHistoryByWindow[1]?.history).toEqual([1, 2, 4]);
        expect(navigationHistoryByWindow[1]?.currentIndex).toBe(2);
    });

    it("deduplicates existing tabs when re-activated", () => {
        navigationHistoryByWindow[1] = { history: [1, 2, 3], currentIndex: 2 };

        addToNavigationHistory(1, 1);

        expect(navigationHistoryByWindow[1]?.history).toEqual([2, 3, 1]);
        expect(navigationHistoryByWindow[1]?.currentIndex).toBe(2);
    });

    it("skips programmatic activations and clears the flag", () => {
        navigationHistoryByWindow[1] = { history: [1, 2, 3], currentIndex: 2 };
        programmaticNavigationInProgress.add("1-2");

        addToNavigationHistory(1, 2);

        expect(navigationHistoryByWindow[1]?.history).toEqual([1, 2, 3]);
        expect(navigationHistoryByWindow[1]?.currentIndex).toBe(2);
        expect(programmaticNavigationInProgress.has("1-2")).toBe(false);
    });

    it("enforces the max history size", () => {
        for (let id = 1; id <= 31; id++) {
            addToNavigationHistory(1, id);
        }

        expect(navigationHistoryByWindow[1]?.history.length).toBe(30);
        expect(navigationHistoryByWindow[1]?.history[0]).toBe(2);
        expect(navigationHistoryByWindow[1]?.history[29]).toBe(31);
        expect(navigationHistoryByWindow[1]?.currentIndex).toBe(29);
    });

    it("removes closed tabs during cleanup and adjusts current index", async () => {
        navigationHistoryByWindow[1] = { history: [1, 2, 3], currentIndex: 2 };

        (globalThis.chrome.tabs.get as ReturnType<typeof vi.fn>).mockImplementation((tabId: number) => {
            if (tabId === 2) {
                return Promise.reject(new Error("Tab closed"));
            }
            return Promise.resolve({ id: tabId });
        });

        const changed = await cleanupNavigationHistory(1);

        expect(changed).toBe(true);
        expect(navigationHistoryByWindow[1]?.history).toEqual([1, 3]);
        expect(navigationHistoryByWindow[1]?.currentIndex).toBe(1);
    });

    it("navigates back and avoids re-adding programmatic activation", async () => {
        navigationHistoryByWindow[1] = { history: [1, 2, 3], currentIndex: 2 };

        const result = await handleNavigateBack(1);
        expect(result).toBe(true);
        expect(globalThis.chrome.tabs.update).toHaveBeenCalledWith(2, { active: true });
        expect(navigationHistoryByWindow[1]?.currentIndex).toBe(1);
        expect(programmaticNavigationInProgress.has("1-2")).toBe(true);

        addToNavigationHistory(1, 2);
        expect(navigationHistoryByWindow[1]?.history).toEqual([1, 2, 3]);
        expect(navigationHistoryByWindow[1]?.currentIndex).toBe(1);
        expect(programmaticNavigationInProgress.has("1-2")).toBe(false);
    });

    it("navigates forward when possible", async () => {
        navigationHistoryByWindow[1] = { history: [1, 2, 3], currentIndex: 1 };

        const result = await handleNavigateForward(1);

        expect(result).toBe(true);
        expect(globalThis.chrome.tabs.update).toHaveBeenCalledWith(3, { active: true });
        expect(navigationHistoryByWindow[1]?.currentIndex).toBe(2);
        expect(programmaticNavigationInProgress.has("1-3")).toBe(true);
    });

    it("removes invalid target tabs when navigation fails", async () => {
        navigationHistoryByWindow[1] = { history: [1, 2], currentIndex: 1 };
        (globalThis.chrome.tabs.update as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Missing tab"));

        const result = await handleNavigateBack(1);

        expect(result).toBe(false);
        expect(navigationHistoryByWindow[1]?.history).toEqual([2]);
        expect(navigationHistoryByWindow[1]?.currentIndex).toBe(0);
        expect(programmaticNavigationInProgress.has("1-1")).toBe(false);
    });

    it("cleans up closed tabs before navigating back", async () => {
        navigationHistoryByWindow[1] = { history: [1, 2, 3], currentIndex: 2 };
        (globalThis.chrome.tabs.get as ReturnType<typeof vi.fn>).mockImplementation((tabId: number) => {
            if (tabId === 2) {
                return Promise.reject(new Error("Tab closed"));
            }
            return Promise.resolve({ id: tabId });
        });

        const result = await handleNavigateBack(1);

        expect(result).toBe(true);
        expect(globalThis.chrome.tabs.update).toHaveBeenCalledWith(1, { active: true });
        expect(navigationHistoryByWindow[1]?.history).toEqual([1, 3]);
        expect(navigationHistoryByWindow[1]?.currentIndex).toBe(0);
    });
});
