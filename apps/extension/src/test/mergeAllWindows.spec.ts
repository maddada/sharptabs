import { beforeEach, describe, expect, it, vi } from "vitest";
import { mergeAllWindows } from "@/components/tabs-manager/helpers/mergeAllWindows";

const moveTabs = vi.fn();
const moveGroup = vi.fn();
const getCurrentWindow = vi.fn();
const getAllWindows = vi.fn();
const queryTabs = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("chrome", {
        windows: {
            getCurrent: getCurrentWindow,
            getAll: getAllWindows,
        },
        tabs: {
            move: moveTabs,
            query: queryTabs,
        },
        tabGroups: {
            TAB_GROUP_ID_NONE: -1,
            move: moveGroup,
        },
    });
});

describe("mergeAllWindows", () => {
    it("does nothing when every tab is already in the current window", async () => {
        const currentWindow = {
            id: 1,
            type: "normal",
            tabs: [{ id: 10, index: 0, pinned: false, groupId: -1 }],
        };
        getCurrentWindow.mockResolvedValue(currentWindow);
        getAllWindows.mockResolvedValue([currentWindow]);

        await expect(mergeAllWindows()).resolves.toBe(0);
        expect(moveTabs).not.toHaveBeenCalled();
        expect(moveGroup).not.toHaveBeenCalled();
    });

    it("preserves pinned order, groups, and ungrouped tab order", async () => {
        getCurrentWindow.mockResolvedValue({
            id: 1,
            type: "normal",
            tabs: [{ id: 10, index: 0, pinned: true, groupId: -1 }],
        });
        getAllWindows.mockResolvedValue([
            { id: 1, type: "normal" },
            {
                id: 2,
                type: "normal",
                tabs: [
                    { id: 20, index: 0, pinned: true, groupId: -1 },
                    { id: 21, index: 1, pinned: false, groupId: -1 },
                    { id: 22, index: 2, pinned: false, groupId: 7 },
                    { id: 23, index: 3, pinned: false, groupId: 7 },
                    { id: 24, index: 4, pinned: false, groupId: -1 },
                    { id: 25, index: 5, pinned: false, groupId: -1 },
                ],
            },
        ]);

        await expect(mergeAllWindows()).resolves.toBe(6);
        expect(moveTabs).toHaveBeenNthCalledWith(1, [20], { windowId: 1, index: 1 });
        expect(moveTabs).toHaveBeenNthCalledWith(2, [21], { windowId: 1, index: -1 });
        expect(moveGroup).toHaveBeenCalledWith(7, { windowId: 1, index: -1 });
        expect(moveTabs).toHaveBeenNthCalledWith(3, [24, 25], { windowId: 1, index: -1 });
    });

    it("rejects a non-normal target window before moving tabs", async () => {
        getCurrentWindow.mockResolvedValue({ id: 1, type: "popup" });

        await expect(mergeAllWindows()).rejects.toThrow("normal browser window");
        expect(getAllWindows).not.toHaveBeenCalled();
    });
});
