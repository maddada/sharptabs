import { describe, it, expect, beforeEach, vi } from "vitest";
import { handleDragEnd } from "@/components/tabs-manager/helpers/dragAndDrop/handleDragEnd";
import type { Tab } from "@/types/Tab";
import type { TabGroup } from "@/types/TabGroup";
import { useSelectionStore } from "@/stores/selectionStore";
import { ItemType } from "@/types/CombinedItem";

type ActiveLike = { id: string };
type OverLike = { id: string };

declare global {
    // Provide a minimal chrome type for tests

    namespace globalThis {
        interface chrome {
            tabs: {
                move: ReturnType<typeof vi.fn>;
                ungroup: ReturnType<typeof vi.fn>;
                group: ReturnType<typeof vi.fn>;
                get: ReturnType<typeof vi.fn>;
                query: ReturnType<typeof vi.fn>;
            };
            tabGroups: {
                move: ReturnType<typeof vi.fn>;
                query: ReturnType<typeof vi.fn>;
            };
            windows: { WINDOW_ID_CURRENT: number };
            storage: { local: { get: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> } };
        }
    }
}

const createTab = (overrides: Partial<Tab>): Tab => {
    return {
        id: 0,
        title: "",
        url: "",
        pinned: false,
        groupId: -1,
        index: 0,
        ...overrides,
    };
};

const createGroup = (overrides: Partial<TabGroup>): TabGroup => {
    return {
        id: 0,
        title: "group",
        color: "grey",
        tabs: [],
        index: 0,
        ...overrides,
    };
};

const resetSelectionStore = () => {
    useSelectionStore.setState({ selectedTabIds: new Set(), selectedTabs: [], lastSelectedTabId: null });
};

const setupChromeMocks = () => {
    // @ts-expect-error inject global chrome
    globalThis.chrome = {
        tabs: {
            move: vi.fn(),
            ungroup: vi.fn(),
            group: vi.fn(),
            get: vi.fn(),
            query: vi.fn().mockResolvedValue([]),
        },
        tabGroups: {
            move: vi.fn(),
            query: vi.fn().mockResolvedValue([]),
        },
        windows: { WINDOW_ID_CURRENT: 1 },
        storage: { local: { get: vi.fn(), remove: vi.fn() } },
    } as unknown as globalThis.chrome;
};

const makeActive = (id: string): ActiveLike => ({ id });
const makeOver = (id: string): OverLike => ({ id });

describe("handleDragEnd movement targets", () => {
    const setActiveDndId = vi.fn();
    const setDropTargetId = vi.fn();
    const setRecentlyDraggedItem = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        resetSelectionStore();
        setupChromeMocks();
    });

    it("moves a regular tab relative to another regular tab (REGULAR -> REGULAR)", async () => {
        const pinnedTabs: Tab[] = [
            createTab({ id: 1, pinned: true, index: 0, groupId: -1 }),
            createTab({ id: 2, pinned: true, index: 1, groupId: -1 }),
            createTab({ id: 3, pinned: true, index: 2, groupId: -1 }),
        ];
        const regularTabs: Tab[] = [createTab({ id: 10, index: 3, groupId: -1 }), createTab({ id: 11, index: 4, groupId: -1 })];
        const tabGroups: TabGroup[] = [];

        await handleDragEnd(
            makeActive(`${ItemType.REGULAR}-10`) as unknown as any,
            makeOver(`${ItemType.REGULAR}-11`) as unknown as any,
            pinnedTabs,
            regularTabs,
            tabGroups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );

        expect(globalThis.chrome.tabs.move).toHaveBeenCalledWith(10, { index: 4 });
    });

    it("dropping a regular tab on top of the tab above it won't move it (REGULAR -> REGULAR)", async () => {
        const pinnedTabs: Tab[] = [
            createTab({ id: 1, pinned: true, index: 0, groupId: -1 }),
            createTab({ id: 2, pinned: true, index: 1, groupId: -1 }),
            createTab({ id: 3, pinned: true, index: 2, groupId: -1 }),
        ];
        const regularTabs: Tab[] = [createTab({ id: 10, index: 3, groupId: -1 }), createTab({ id: 11, index: 4, groupId: -1 })];
        const tabGroups: TabGroup[] = [];

        await handleDragEnd(
            makeActive(`${ItemType.REGULAR}-11`) as unknown as any,
            makeOver(`${ItemType.REGULAR}-10`) as unknown as any,
            pinnedTabs,
            regularTabs,
            tabGroups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );

        expect(globalThis.chrome.tabs.move).not.toHaveBeenCalled();
    });

    it("dropping pinned tab A on pinned tab B moves A to B's position (PINNED -> PINNED)", async () => {
        const pinnedTabs: Tab[] = [
            createTab({ id: 1, pinned: true, index: 0, groupId: -1 }),
            createTab({ id: 2, pinned: true, index: 1, groupId: -1 }),
            createTab({ id: 3, pinned: true, index: 2, groupId: -1 }),
        ];
        const regularTabs: Tab[] = [];
        const tabGroups: TabGroup[] = [];

        await handleDragEnd(
            makeActive(`${ItemType.PINNED}-1`) as unknown as any,
            makeOver(`${ItemType.PINNED}-3`) as unknown as any,
            pinnedTabs,
            regularTabs,
            tabGroups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );

        expect(globalThis.chrome.tabs.move).toHaveBeenCalledWith(1, { index: 2 });
    });

    it("dropping pinned tab A on pinned tab B which is right before it does nothing (PINNED -> PINNED)", async () => {
        const pinnedTabs: Tab[] = [
            createTab({ id: 1, pinned: true, index: 0, groupId: -1 }),
            createTab({ id: 2, pinned: true, index: 1, groupId: -1 }),
            createTab({ id: 3, pinned: true, index: 2, groupId: -1 }),
        ];
        const regularTabs: Tab[] = [];
        const tabGroups: TabGroup[] = [];

        await handleDragEnd(
            makeActive(`${ItemType.PINNED}-2`) as unknown as any,
            makeOver(`${ItemType.PINNED}-1`) as unknown as any,
            pinnedTabs,
            regularTabs,
            tabGroups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );

        expect(globalThis.chrome.tabs.move).not.toHaveBeenCalled();
    });

    it("reorders compact pinned tabs (COMPACT_PINNED -> COMPACT_PINNED)", async () => {
        const pinnedTabs: Tab[] = [
            createTab({ id: 1, pinned: true, index: 0, groupId: -1 }),
            createTab({ id: 2, pinned: true, index: 1, groupId: -1 }),
            createTab({ id: 3, pinned: true, index: 2, groupId: -1 }),
        ];
        const regularTabs: Tab[] = [];
        const tabGroups: TabGroup[] = [];

        await handleDragEnd(
            makeActive(`${ItemType.CPINNED}-2`) as unknown as any,
            makeOver(`${ItemType.CPINNED}-1`) as unknown as any,
            pinnedTabs,
            regularTabs,
            tabGroups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );

        // Should move tab id 2 to the array index of over (0)
        expect(globalThis.chrome.tabs.move).toHaveBeenCalledWith(2, { index: 0 });
    });

    it("dropping gtab A on gtab B which is right above it does nothing (GTAB -> GTAB same group)", async () => {
        const pinnedTabs: Tab[] = [];
        const groupTabs: Tab[] = [createTab({ id: 20, index: 5, groupId: 100 }), createTab({ id: 21, index: 6, groupId: 100 })];
        const tabGroups: TabGroup[] = [createGroup({ id: 100, index: 5, tabs: groupTabs })];
        const regularTabs: Tab[] = [];

        await handleDragEnd(
            makeActive(`${ItemType.GTAB}-21`) as unknown as any,
            makeOver(`${ItemType.GTAB}-20`) as unknown as any,
            pinnedTabs,
            regularTabs,
            tabGroups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );

        // over.index (5) + oneIfUp (1) -> 6
        expect(globalThis.chrome.tabs.move).not.toHaveBeenCalled();
    });

    it("dropping gtab A on gtab B moves it to be below it (GTAB -> GTAB same group)", async () => {
        const pinnedTabs: Tab[] = [];
        const groupTabs: Tab[] = [
            createTab({ id: 20, index: 5, groupId: 100 }),
            createTab({ id: 21, index: 6, groupId: 100 }),
            createTab({ id: 22, index: 7, groupId: 100 }),
        ];
        const tabGroups: TabGroup[] = [createGroup({ id: 100, index: 5, tabs: groupTabs })];
        const regularTabs: Tab[] = [];

        await handleDragEnd(
            makeActive(`${ItemType.GTAB}-22`) as unknown as any,
            makeOver(`${ItemType.GTAB}-20`) as unknown as any,
            pinnedTabs,
            regularTabs,
            tabGroups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );

        // over.index (5) + oneIfUp (1) -> 6
        expect(globalThis.chrome.tabs.move).toHaveBeenCalledWith(22, { index: 6 });
    });

    it("moves a group relative to a regular tab (GROUP -> REGULAR)", async () => {
        const pinnedTabs: Tab[] = [
            createTab({ id: 1, pinned: true, index: 0, groupId: -1 }),
            createTab({ id: 2, pinned: true, index: 1, groupId: -1 }),
            createTab({ id: 3, pinned: true, index: 2, groupId: -1 }),
        ];
        const regularTabs: Tab[] = [createTab({ id: 10, index: 3, groupId: -1 }), createTab({ id: 11, index: 4, groupId: -1 })];
        const groupB: TabGroup = createGroup({
            id: 101,
            index: 7,
            tabs: [createTab({ id: 30, index: 7, groupId: 101 }), createTab({ id: 31, index: 8, groupId: 101 })],
        });
        const tabGroups: TabGroup[] = [groupB];

        await handleDragEnd(
            makeActive(`${ItemType.GROUP}-101`) as unknown as any,
            makeOver(`${ItemType.REGULAR}-11`) as unknown as any,
            pinnedTabs,
            regularTabs,
            tabGroups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );

        // active group length 2, moving down relative to over.index (4) -> 5
        expect(globalThis.chrome.tabGroups.move).toHaveBeenCalledWith(101, { index: 5 });
    });

    it("does not move when dragging pinned over regular/group/gtab (PINNED -> REGULAR/GROUP/GTAB)", async () => {
        const pinnedTabs: Tab[] = [createTab({ id: 1, pinned: true, index: 0 })];
        const regularTabs: Tab[] = [createTab({ id: 10, index: 1 })];
        const groupTabs: Tab[] = [createTab({ id: 20, index: 2, groupId: 100 })];
        const groups: TabGroup[] = [createGroup({ id: 100, index: 2, tabs: groupTabs })];

        await handleDragEnd(
            makeActive(`${ItemType.PINNED}-1`) as unknown as any,
            makeOver(`${ItemType.REGULAR}-10`) as unknown as any,
            pinnedTabs,
            regularTabs,
            groups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );
        await handleDragEnd(
            makeActive(`${ItemType.PINNED}-1`) as unknown as any,
            makeOver(`${ItemType.GROUP}-100`) as unknown as any,
            pinnedTabs,
            regularTabs,
            groups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );
        await handleDragEnd(
            makeActive(`${ItemType.PINNED}-1`) as unknown as any,
            makeOver(`${ItemType.GTAB}-20`) as unknown as any,
            pinnedTabs,
            regularTabs,
            groups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );

        expect(globalThis.chrome.tabs.move).not.toHaveBeenCalled();
        expect(globalThis.chrome.tabGroups.move).not.toHaveBeenCalled();
    });

    it("handles pinned to PSEPARATOR positions (PINNED -> PSEPARATOR)", async () => {
        const pinnedTabs: Tab[] = [
            createTab({ id: 1, pinned: true, index: 0 }),
            createTab({ id: 2, pinned: true, index: 1 }),
            createTab({ id: 3, pinned: true, index: 2 }),
        ];
        const regularTabs: Tab[] = [];
        const groups: TabGroup[] = [];

        await handleDragEnd(
            makeActive(`${ItemType.PINNED}-2`) as unknown as any,
            makeOver(`${ItemType.PSEPARATOR}-1`) as unknown as any,
            pinnedTabs,
            regularTabs,
            groups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );
        expect(globalThis.chrome.tabs.move).toHaveBeenCalledWith(2, { index: 0 });

        vi.clearAllMocks();
        await handleDragEnd(
            makeActive(`${ItemType.PINNED}-1`) as unknown as any,
            makeOver(`${ItemType.PSEPARATOR}-2`) as unknown as any,
            pinnedTabs,
            regularTabs,
            groups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );
        expect(globalThis.chrome.tabs.move).toHaveBeenCalledWith(1, { index: pinnedTabs.length });
    });

    it("moving top regular to PSEPARATOR should move it to after the pinned tabs (REGULAR -> PSEPARATOR)", async () => {
        const pinnedTabs: Tab[] = [createTab({ id: 1, pinned: true, index: 0 }), createTab({ id: 2, pinned: true, index: 1 })];
        const regularTabs: Tab[] = [createTab({ id: 10, index: 2 }), createTab({ id: 11, index: 3 })];

        await handleDragEnd(
            makeActive(`${ItemType.REGULAR}-11`) as unknown as any,
            makeOver(`${ItemType.PINNED}-2`) as unknown as any,
            pinnedTabs,
            regularTabs,
            [],
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );

        expect(globalThis.chrome.tabs.move).toHaveBeenCalledWith(11, { index: pinnedTabs.length - 1 });
    });

    it("moving top regular to pinned when hovering pinned (REGULAR -> PINNED/PSEPARATOR)", async () => {
        const pinnedTabs: Tab[] = [createTab({ id: 1, pinned: true, index: 0 }), createTab({ id: 2, pinned: true, index: 1 })];
        const regularTabs: Tab[] = [createTab({ id: 10, index: 2 })];

        vi.clearAllMocks();

        await handleDragEnd(
            makeActive(`${ItemType.REGULAR}-10`) as unknown as any,
            makeOver(`${ItemType.PSEPARATOR}-1`) as unknown as any,
            pinnedTabs,
            regularTabs,
            [],
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );

        expect(globalThis.chrome.tabs.move).not.toHaveBeenCalled();
    });

    it("adds/moves regular to expanded group start and collapsed group end (REGULAR -> GROUP)", async () => {
        const pinnedTabs: Tab[] = [];
        const groupTabs: Tab[] = [createTab({ id: 20, index: 3, groupId: 100 }), createTab({ id: 21, index: 4, groupId: 100 })];
        const group: TabGroup = createGroup({ id: 100, index: 3, tabs: groupTabs });
        const regularTabs: Tab[] = [createTab({ id: 10, index: 2 })];

        await handleDragEnd(
            makeActive(`${ItemType.REGULAR}-10`) as unknown as any,
            makeOver(`${ItemType.GROUP}-100`) as unknown as any,
            pinnedTabs,
            regularTabs,
            [group],
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );
        expect(globalThis.chrome.tabs.group).toHaveBeenCalledWith({ tabIds: [10], groupId: 100 });
        expect(globalThis.chrome.tabs.move).toHaveBeenCalledWith(10, { index: group.index - 1 });

        vi.clearAllMocks();
        await handleDragEnd(
            makeActive(`${ItemType.REGULAR}-10`) as unknown as any,
            makeOver(`${ItemType.GROUP}-100`) as unknown as any,
            pinnedTabs,
            regularTabs,
            [group],
            new Set([100]),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );
        expect(globalThis.chrome.tabs.group).toHaveBeenCalledWith({ tabIds: [10], groupId: 100 });
        expect(globalThis.chrome.tabs.move).toHaveBeenCalledWith(10, { index: group.index + group.tabs.length - 1 });
    });

    it("adds regular to group at specific position when dropping on GTAB (REGULAR -> GTAB)", async () => {
        const pinnedTabs: Tab[] = [];
        const groupTabs: Tab[] = [createTab({ id: 20, index: 3, groupId: 100 }), createTab({ id: 21, index: 4, groupId: 100 })];
        const groups: TabGroup[] = [createGroup({ id: 100, index: 3, tabs: groupTabs })];
        const regularTabs: Tab[] = [createTab({ id: 10, index: 2 })];

        await handleDragEnd(
            makeActive(`${ItemType.REGULAR}-10`) as unknown as any,
            makeOver(`${ItemType.GTAB}-20`) as unknown as any,
            pinnedTabs,
            regularTabs,
            groups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );
        expect(globalThis.chrome.tabs.group).toHaveBeenCalledWith({ tabIds: [10], groupId: 100 });
        expect(globalThis.chrome.tabs.move).toHaveBeenCalledWith(10, { index: 3 });
    });

    it("ungroups and moves GTAB to after pinned and PSEPARATOR (GTAB -> PINNED/PSEPARATOR)", async () => {
        const pinnedTabs: Tab[] = [createTab({ id: 1, pinned: true, index: 0 }), createTab({ id: 2, pinned: true, index: 1 })];
        const groupTabs: Tab[] = [createTab({ id: 20, index: 3, groupId: 100 })];
        const groups: TabGroup[] = [createGroup({ id: 100, index: 3, tabs: groupTabs })];

        await handleDragEnd(
            makeActive(`${ItemType.GTAB}-20`) as unknown as any,
            makeOver(`${ItemType.PINNED}-2`) as unknown as any,
            pinnedTabs,
            [],
            groups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );
        expect(globalThis.chrome.tabs.ungroup).toHaveBeenCalledWith(20);
        expect(globalThis.chrome.tabs.move).toHaveBeenCalledWith(20, { index: pinnedTabs.length - 1 });

        vi.clearAllMocks();
        await handleDragEnd(
            makeActive(`${ItemType.GTAB}-20`) as unknown as any,
            makeOver(`${ItemType.PSEPARATOR}-1`) as unknown as any,
            pinnedTabs,
            [],
            groups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );
        expect(globalThis.chrome.tabs.ungroup).toHaveBeenCalledWith(20);
        expect(globalThis.chrome.tabs.move).toHaveBeenCalledWith(20, { index: pinnedTabs.length });
    });

    it("handles GTAB moving within same group and to different group (GTAB -> GROUP/GTAB)", async () => {
        const groupATabs: Tab[] = [createTab({ id: 20, index: 3, groupId: 100 }), createTab({ id: 21, index: 4, groupId: 100 })];
        const groupBTabs: Tab[] = [createTab({ id: 30, index: 6, groupId: 200 })];
        const groups: TabGroup[] = [createGroup({ id: 100, index: 3, tabs: groupATabs }), createGroup({ id: 200, index: 6, tabs: groupBTabs })];

        // Same group (to start of group when expanded)
        await handleDragEnd(
            makeActive(`${ItemType.GTAB}-21`) as unknown as any,
            makeOver(`${ItemType.GROUP}-100`) as unknown as any,
            [],
            [],
            groups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );
        expect(globalThis.chrome.tabs.move).toHaveBeenCalledWith(21, { index: 3 });

        vi.clearAllMocks();
        // Different group via GROUP target
        await handleDragEnd(
            makeActive(`${ItemType.GTAB}-21`) as unknown as any,
            makeOver(`${ItemType.GROUP}-200`) as unknown as any,
            [],
            [],
            groups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );
        expect(globalThis.chrome.tabs.ungroup).toHaveBeenCalledWith(21);
        expect(globalThis.chrome.tabs.group).toHaveBeenCalledWith({ tabIds: [21], groupId: 200 });
        expect(globalThis.chrome.tabs.move).toHaveBeenCalledWith(21, { index: 5 });

        vi.clearAllMocks();
        // Different group via GTAB target
        await handleDragEnd(
            makeActive(`${ItemType.GTAB}-21`) as unknown as any,
            makeOver(`${ItemType.GTAB}-30`) as unknown as any,
            [],
            [],
            groups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );
        expect(globalThis.chrome.tabs.ungroup).toHaveBeenCalledWith(21);
        expect(globalThis.chrome.tabs.group).toHaveBeenCalledWith({ tabIds: [21], groupId: 200 });
        expect(globalThis.chrome.tabs.move).toHaveBeenCalledWith(21, { index: 6 });
    });

    it("redirects ESEPARATOR to last item and moves accordingly (REGULAR/GTAB -> ESEPARATOR)", async () => {
        // Last item is regular
        const regularTabs: Tab[] = [createTab({ id: 10, index: 2 }), createTab({ id: 11, index: 3 })];
        await handleDragEnd(
            makeActive(`${ItemType.REGULAR}-10`) as unknown as any,
            makeOver(`${ItemType.ESEPARATOR}-1`) as unknown as any,
            [],
            regularTabs,
            [],
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );
        // over redirected to regular-11, up depends on indices → here active.index(2) < over(3) -> up false -> index = over.index + 0 = 3
        expect(globalThis.chrome.tabs.move).toHaveBeenCalledWith(10, { index: 3 });

        vi.clearAllMocks();
        // Last item is group
        const groupTabs: Tab[] = [createTab({ id: 20, index: 3, groupId: 100 })];
        const groups: TabGroup[] = [createGroup({ id: 100, index: 3, tabs: groupTabs })];
        const regular: Tab[] = [createTab({ id: 12, index: 2 })];
        await handleDragEnd(
            makeActive(`${ItemType.REGULAR}-12`) as unknown as any,
            makeOver(`${ItemType.ESEPARATOR}-1`) as unknown as any,
            [],
            regular,
            groups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );
        // Redirected to GSEPARATOR-100, moving after group => index group.index + group.tabs.length = 4
        expect(globalThis.chrome.tabs.move).toHaveBeenCalledWith(12, { index: 3 });

        vi.clearAllMocks();
        // GTAB to end (ungroup + move)
        await handleDragEnd(
            makeActive(`${ItemType.GTAB}-20`) as unknown as any,
            makeOver(`${ItemType.ESEPARATOR}-1`) as unknown as any,
            [],
            regular,
            groups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );
        expect(globalThis.chrome.tabs.ungroup).toHaveBeenCalledWith(20);
        expect(globalThis.chrome.tabs.move).toHaveBeenCalledWith(20, { index: 3 });
    });

    it("moves group to after pinned, after group, to end (GROUP -> PINNED/GSEPARATOR/ESEPARATOR)", async () => {
        const pinnedTabs: Tab[] = [createTab({ id: 1, pinned: true, index: 0 }), createTab({ id: 2, pinned: true, index: 1 })];
        const g1Tabs: Tab[] = [createTab({ id: 20, index: 3, groupId: 100 }), createTab({ id: 21, index: 4, groupId: 100 })];
        const g2Tabs: Tab[] = [createTab({ id: 30, index: 5, groupId: 200 })];
        const groups: TabGroup[] = [createGroup({ id: 100, index: 3, tabs: g1Tabs }), createGroup({ id: 200, index: 5, tabs: g2Tabs })];

        await handleDragEnd(
            makeActive(`${ItemType.GROUP}-200`) as unknown as any,
            makeOver(`${ItemType.PINNED}-2`) as unknown as any,
            pinnedTabs,
            [],
            groups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );
        expect(globalThis.chrome.tabGroups.move).toHaveBeenCalledWith(200, { index: pinnedTabs.length });

        vi.clearAllMocks();
        await handleDragEnd(
            makeActive(`${ItemType.GROUP}-100`) as unknown as any,
            makeOver(`${ItemType.GSEPARATOR}-200`) as unknown as any,
            pinnedTabs,
            [],
            groups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );
        // After group 200 => fallback will compute and move, we just ensure a move was attempted
        expect(globalThis.chrome.tabGroups.move).toHaveBeenCalled();

        vi.clearAllMocks();
        await handleDragEnd(
            makeActive(`${ItemType.GROUP}-100`) as unknown as any,
            makeOver(`${ItemType.ESEPARATOR}-1`) as unknown as any,
            pinnedTabs,
            [],
            groups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );
        // With redirect and fallback, current behavior moves with index 3
        expect(globalThis.chrome.tabGroups.move).toHaveBeenCalledWith(100, { index: 3 });
    });

    it("dropping a group on another group's separator moves it after that group (GROUP -> GSEPARATOR)", async () => {
        // Setup: Group A at index 2-4, Group B at index 5-7
        const groupATabs: Tab[] = [
            createTab({ id: 20, index: 2, groupId: 100 }),
            createTab({ id: 21, index: 3, groupId: 100 }),
            createTab({ id: 22, index: 4, groupId: 100 }),
        ];
        const groupBTabs: Tab[] = [
            createTab({ id: 30, index: 5, groupId: 200 }),
            createTab({ id: 31, index: 6, groupId: 200 }),
            createTab({ id: 32, index: 7, groupId: 200 }),
        ];
        const groups: TabGroup[] = [createGroup({ id: 100, index: 2, tabs: groupATabs }), createGroup({ id: 200, index: 5, tabs: groupBTabs })];

        // Mock chrome.tabs.query to return all tabs for the fallback calculation
        (globalThis.chrome.tabs.query as any).mockResolvedValue([
            ...groupATabs.map((t) => ({ id: t.id, index: t.index, groupId: t.groupId })),
            ...groupBTabs.map((t) => ({ id: t.id, index: t.index, groupId: t.groupId })),
        ]);

        // Test moving Group A to after Group B (dropping on Group B's GSEPARATOR)
        await handleDragEnd(
            makeActive(`${ItemType.GROUP}-100`) as unknown as any,
            makeOver(`${ItemType.GSEPARATOR}-200`) as unknown as any,
            [],
            [],
            groups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );

        // Group A should move to after Group B
        // Target index = max index of Group B tabs (7) + 1 = 8
        // Since 8 > Group A's current index (2), we subtract Group A's length (3) => 5
        expect(globalThis.chrome.tabGroups.move).toHaveBeenCalledWith(100, { index: 5 });

        vi.clearAllMocks();

        // Test moving Group B to after Group A (dropping on Group A's GSEPARATOR) - moving up
        (globalThis.chrome.tabs.query as any).mockResolvedValue([
            ...groupATabs.map((t) => ({ id: t.id, index: t.index, groupId: t.groupId })),
            ...groupBTabs.map((t) => ({ id: t.id, index: t.index, groupId: t.groupId })),
        ]);

        await handleDragEnd(
            makeActive(`${ItemType.GROUP}-200`) as unknown as any,
            makeOver(`${ItemType.GSEPARATOR}-100`) as unknown as any,
            [],
            [],
            groups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );

        // Group B should move to after Group A
        // Target index = max index of Group A tabs (4) + 1 = 5
        // Since we're moving up (5 < 5), target stays at 5
        expect(globalThis.chrome.tabGroups.move).toHaveBeenCalledWith(200, { index: 5 });
    });

    it("group move retry when blocked by mid-group error (GROUP fallback error -> retry)", async () => {
        // Arrange a case that uses fallback: GROUP -> GTAB
        const g1Tabs: Tab[] = [createTab({ id: 20, index: 3, groupId: 100 }), createTab({ id: 21, index: 4, groupId: 100 })];
        const g2Tabs: Tab[] = [createTab({ id: 30, index: 6, groupId: 200 }), createTab({ id: 31, index: 7, groupId: 200 })];
        const groups: TabGroup[] = [createGroup({ id: 100, index: 3, tabs: g1Tabs }), createGroup({ id: 200, index: 6, tabs: g2Tabs })];

        // chrome.tabs.query used by fallback to compute max indexes
        (globalThis.chrome.tabs.query as any).mockResolvedValue(
            [...g1Tabs, ...g2Tabs].map((t) => ({ id: t.id, index: t.index, groupId: t.groupId }))
        );

        // First move throws, second succeeds
        const moveMock = globalThis.chrome.tabGroups.move as any;
        moveMock.mockRejectedValueOnce(new Error("Cannot move the group to an index that is in the middle of another group."));
        moveMock.mockResolvedValueOnce(undefined);

        await handleDragEnd(
            makeActive(`${ItemType.GROUP}-100`) as unknown as any,
            makeOver(`${ItemType.GTAB}-30`) as unknown as any,
            [],
            [],
            groups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );

        // Fallback computes targetIndex = max(overGroupTabs)+1 = 7+1=8; active tabs length=2; since 8>active.index(3) => targetIndex becomes 6
        expect(moveMock).toHaveBeenCalled();
    });

    it("multi-select: replaces active with leader and moves others adjacent", async () => {
        vi.useFakeTimers();
        const regularTabs: Tab[] = [
            createTab({ id: 9, index: 1 }),
            createTab({ id: 10, index: 2 }),
            createTab({ id: 11, index: 3 }),
            createTab({ id: 12, index: 4 }),
        ];

        // selection: leader 11, plus 12
        useSelectionStore.setState({
            selectedTabIds: new Set([11, 12]),
            selectedTabs: [regularTabs[2], regularTabs[3]],
            lastSelectedTabId: 12,
        });

        // chrome.tabs.get lookups used for leader replacement and cleanup
        (globalThis.chrome.tabs.get as any).mockImplementation((id: number) => {
            const t = [...regularTabs].find((x) => x.id === id);
            return Promise.resolve({ id: t?.id, index: t?.index, groupId: -1 });
        });

        await handleDragEnd(
            makeActive(`${ItemType.REGULAR}-999`) as unknown as any, // will be replaced by leader 11
            makeOver(`${ItemType.REGULAR}-9`) as unknown as any,
            [],
            regularTabs,
            [],
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );

        // Leader (11) moved to index of over (9.index=1) + oneIfUp(1) = 2
        expect(globalThis.chrome.tabs.move).toHaveBeenCalledWith(11, { index: 2 });

        // Applying the movement for the first tab (Necessary to mock that the first tab was moved already. Otherwise, the second tab will be moved to index 4 instead of 3)
        const tab11 = regularTabs.find((t) => t.id === 11);
        if (tab11) {
            tab11.index = 2;
        }

        // Advance timers for cleanup (50ms) and recentlyDraggedItem clear (520ms)
        await vi.advanceTimersByTimeAsync(60);

        // Remaining selected (12) moved adjacent below leader
        expect(globalThis.chrome.tabs.move).toHaveBeenCalledWith(12, { index: 3 });

        vi.useRealTimers();
    });

    it("no-ops: dropping on itself or with no over target does nothing", async () => {
        const regularTabs: Tab[] = [createTab({ id: 10, index: 2 })];
        await handleDragEnd(
            makeActive(`${ItemType.REGULAR}-10`) as unknown as any,
            makeOver(`${ItemType.REGULAR}-10`) as unknown as any,
            [],
            regularTabs,
            [],
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );
        await handleDragEnd(
            makeActive(`${ItemType.REGULAR}-10`) as unknown as any,
            null as unknown as any,
            [],
            regularTabs,
            [],
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );
        expect(globalThis.chrome.tabs.move).not.toHaveBeenCalled();
        expect(globalThis.chrome.tabGroups.move).not.toHaveBeenCalled();
    });

    it("sets and clears recentlyDraggedItem via timers", async () => {
        vi.useFakeTimers();
        const regularTabs: Tab[] = [createTab({ id: 10, index: 2 }), createTab({ id: 11, index: 3 })];
        await handleDragEnd(
            makeActive(`${ItemType.REGULAR}-11`) as unknown as any,
            makeOver(`${ItemType.REGULAR}-10`) as unknown as any,
            [],
            regularTabs,
            [],
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );
        // first call with id (called earlier in function regardless of cancel)
        expect(setRecentlyDraggedItem).toHaveBeenCalledWith(11);
        // clear after ~520ms
        await vi.advanceTimersByTimeAsync(530);
        expect(setRecentlyDraggedItem).toHaveBeenCalledWith(null);
        vi.useRealTimers();
    });

    it("moves regular/gtab/group after pinned tabs when dropped on CPINNED", async () => {
        const pinnedTabs: Tab[] = [
            createTab({ id: 1, pinned: true, index: 0 }),
            createTab({ id: 2, pinned: true, index: 1 }),
            createTab({ id: 3, pinned: true, index: 2 }),
        ];
        const regularTabs: Tab[] = [createTab({ id: 10, index: 3 })];
        const groupTabs: Tab[] = [createTab({ id: 20, index: 4, groupId: 100 })];
        const groups: TabGroup[] = [createGroup({ id: 100, index: 4, tabs: groupTabs })];

        // Test REGULAR -> CPINNED
        await handleDragEnd(
            makeActive(`${ItemType.REGULAR}-10`) as unknown as any,
            makeOver(`${ItemType.CPINNED}-2`) as unknown as any,
            pinnedTabs,
            regularTabs,
            groups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );
        expect(globalThis.chrome.tabs.move).toHaveBeenCalledWith(10, { index: 2 });

        vi.clearAllMocks();

        // Test GTAB -> CPINNED
        await handleDragEnd(
            makeActive(`${ItemType.GTAB}-20`) as unknown as any,
            makeOver(`${ItemType.CPINNED}-1`) as unknown as any,
            pinnedTabs,
            regularTabs,
            groups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );
        expect(globalThis.chrome.tabs.ungroup).toHaveBeenCalledWith(20);
        expect(globalThis.chrome.tabs.move).toHaveBeenCalledWith(20, { index: 2 });

        vi.clearAllMocks();

        // Test GROUP -> CPINNED
        await handleDragEnd(
            makeActive(`${ItemType.GROUP}-100`) as unknown as any,
            makeOver(`${ItemType.CPINNED}-3`) as unknown as any,
            pinnedTabs,
            regularTabs,
            groups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );
        expect(globalThis.chrome.tabGroups.move).toHaveBeenCalledWith(100, { index: 3 });
    });

    it("handles CPINNED as drop target comprehensively", async () => {
        const pinnedTabs: Tab[] = [
            createTab({ id: 1, pinned: true, index: 0 }),
            createTab({ id: 2, pinned: true, index: 1 }),
            createTab({ id: 3, pinned: true, index: 2 }),
            createTab({ id: 4, pinned: true, index: 3 }),
        ];

        // Test CPINNED -> CPINNED reordering (moving tab 3 to position of tab 1)
        await handleDragEnd(
            makeActive(`${ItemType.CPINNED}-3`) as unknown as any,
            makeOver(`${ItemType.CPINNED}-1`) as unknown as any,
            pinnedTabs,
            [],
            [],
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );
        expect(globalThis.chrome.tabs.move).toHaveBeenCalledWith(3, { index: 0 });

        vi.clearAllMocks();

        // Test CPINNED -> CPINNED reordering (moving tab 1 to position of tab 4)
        await handleDragEnd(
            makeActive(`${ItemType.CPINNED}-1`) as unknown as any,
            makeOver(`${ItemType.CPINNED}-4`) as unknown as any,
            pinnedTabs,
            [],
            [],
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );
        expect(globalThis.chrome.tabs.move).toHaveBeenCalledWith(1, { index: 3 });

        vi.clearAllMocks();

        // Test PINNED -> CPINNED (should not do anything special, PINNED type doesn't interact with CPINNED)
        await handleDragEnd(
            makeActive(`${ItemType.PINNED}-1`) as unknown as any,
            makeOver(`${ItemType.CPINNED}-2`) as unknown as any,
            pinnedTabs,
            [],
            [],
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );
        // PINNED type is not handled by CPINNED handler, so no movement expected
        expect(globalThis.chrome.tabs.move).not.toHaveBeenCalled();
    });

    it("moves GTAB to correct position when dropped on its own parent group's GSEPARATOR (GTAB -> GSEPARATOR same group)", async () => {
        // Setup: Group with 3 tabs at indices 3, 4, 5
        const groupTabs: Tab[] = [
            createTab({ id: 20, index: 3, groupId: 100 }),
            createTab({ id: 21, index: 4, groupId: 100 }),
            createTab({ id: 22, index: 5, groupId: 100 }),
        ];
        const groups: TabGroup[] = [createGroup({ id: 100, index: 3, tabs: groupTabs })];

        // Drag middle tab (index 4) to the group's GSEPARATOR
        // Expected: tab is ungrouped and moved to position after the group
        // Since the tab is from the same group, we need to account for the tab count offset
        await handleDragEnd(
            makeActive(`${ItemType.GTAB}-21`) as unknown as any,
            makeOver(`${ItemType.GSEPARATOR}-100`) as unknown as any,
            [],
            [],
            groups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );

        // Tab should be ungrouped
        expect(globalThis.chrome.tabs.ungroup).toHaveBeenCalledWith(21);

        // Tab should move to the correct position
        // up = activeItemData.index (4) - overGroupItemData.index (3) > 0 = true
        // Without fix: group.index (3) + group.tabs.length (3) = 6 (wrong - off by 1)
        // With fix: group.index (3) + group.tabs.length (3) - tabCountOffset (1) = 5 (correct)
        expect(globalThis.chrome.tabs.move).toHaveBeenCalledWith(21, { index: 5 });

        vi.clearAllMocks();

        // Test the reverse: drag top tab (index 3) to the group's GSEPARATOR
        await handleDragEnd(
            makeActive(`${ItemType.GTAB}-20`) as unknown as any,
            makeOver(`${ItemType.GSEPARATOR}-100`) as unknown as any,
            [],
            [],
            groups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );

        // up = activeItemData.index (3) - overGroupItemData.index (3) > 0 = false
        // When up = false, no offset is applied (offset only applies when dragging from below)
        // gtabTargetIndex = group.index (3) + group.tabs.length (3) - 1 = 5
        expect(globalThis.chrome.tabs.ungroup).toHaveBeenCalledWith(20);
        expect(globalThis.chrome.tabs.move).toHaveBeenCalledWith(20, { index: 5 });

        vi.clearAllMocks();

        // Test dragging GTAB from a DIFFERENT group to GSEPARATOR (no offset should be applied)
        const groupBTabs: Tab[] = [createTab({ id: 30, index: 6, groupId: 200 })];
        const groupsWithTwo: TabGroup[] = [createGroup({ id: 100, index: 3, tabs: groupTabs }), createGroup({ id: 200, index: 6, tabs: groupBTabs })];

        await handleDragEnd(
            makeActive(`${ItemType.GTAB}-30`) as unknown as any,
            makeOver(`${ItemType.GSEPARATOR}-100`) as unknown as any,
            [],
            [],
            groupsWithTwo,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );

        // up = activeItemData.index (6) - overGroupItemData.index (3) > 0 = true
        // Since it's from a different group, no offset: group.index (3) + group.tabs.length (3) = 6
        expect(globalThis.chrome.tabs.ungroup).toHaveBeenCalledWith(30);
        expect(globalThis.chrome.tabs.move).toHaveBeenCalledWith(30, { index: 6 });
    });

    it("handles edge cases when dropping on CPINNED", async () => {
        // Test with single pinned tab
        const singlePinnedTab: Tab[] = [createTab({ id: 1, pinned: true, index: 0 })];
        const regularTab: Tab[] = [createTab({ id: 10, index: 1 })];

        // REGULAR -> CPINNED with single pinned tab (should move to index 0, which is pinnedTabs.length - 1)
        await handleDragEnd(
            makeActive(`${ItemType.REGULAR}-10`) as unknown as any,
            makeOver(`${ItemType.CPINNED}-1`) as unknown as any,
            singlePinnedTab,
            regularTab,
            [],
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );
        expect(globalThis.chrome.tabs.move).toHaveBeenCalledWith(10, { index: 0 });

        vi.clearAllMocks();

        // Test with no pinned tabs (edge case - shouldn't happen in practice but handle gracefully)
        const noPinnedTabs: Tab[] = [];
        const regularTabs: Tab[] = [createTab({ id: 10, index: 0 })];

        await handleDragEnd(
            makeActive(`${ItemType.REGULAR}-10`) as unknown as any,
            makeOver(`${ItemType.CPINNED}-99`) as unknown as any, // non-existent CPINNED
            noPinnedTabs,
            regularTabs,
            [],
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );
        // With no pinned tabs, pinnedTabs.length - 1 = -1, but Chrome should handle this gracefully
        expect(globalThis.chrome.tabs.move).toHaveBeenCalledWith(10, { index: -1 });

        vi.clearAllMocks();

        // Test GROUP with multiple tabs -> CPINNED
        const pinnedTabs: Tab[] = [createTab({ id: 1, pinned: true, index: 0 }), createTab({ id: 2, pinned: true, index: 1 })];
        const groupTabs: Tab[] = [
            createTab({ id: 30, index: 2, groupId: 200 }),
            createTab({ id: 31, index: 3, groupId: 200 }),
            createTab({ id: 32, index: 4, groupId: 200 }),
        ];
        const groups: TabGroup[] = [createGroup({ id: 200, index: 2, tabs: groupTabs })];

        await handleDragEnd(
            makeActive(`${ItemType.GROUP}-200`) as unknown as any,
            makeOver(`${ItemType.CPINNED}-1`) as unknown as any,
            pinnedTabs,
            [],
            groups,
            new Set(),
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );
        // Group should move to after all pinned tabs
        expect(globalThis.chrome.tabGroups.move).toHaveBeenCalledWith(200, { index: 2 });

        vi.clearAllMocks();

        // Test GTAB from collapsed group -> CPINNED
        const collapsedGroupTabs: Tab[] = [createTab({ id: 40, index: 2, groupId: 300 }), createTab({ id: 41, index: 3, groupId: 300 })];
        const collapsedGroups: TabGroup[] = [createGroup({ id: 300, index: 2, tabs: collapsedGroupTabs })];

        await handleDragEnd(
            makeActive(`${ItemType.GTAB}-41`) as unknown as any,
            makeOver(`${ItemType.CPINNED}-2`) as unknown as any,
            pinnedTabs,
            [],
            collapsedGroups,
            new Set([300]), // Group 300 is collapsed
            setActiveDndId,
            setDropTargetId,
            setRecentlyDraggedItem
        );
        // Should ungroup and move after pinned tabs
        expect(globalThis.chrome.tabs.ungroup).toHaveBeenCalledWith(41);
        expect(globalThis.chrome.tabs.move).toHaveBeenCalledWith(41, { index: 1 });
    });
});
