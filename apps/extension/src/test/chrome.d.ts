type ChromeMockFn = (...args: any[]) => any;

declare global {
    namespace globalThis {
        interface chrome {
            tabs: {
                move: ChromeMockFn;
                ungroup: ChromeMockFn;
                group: ChromeMockFn;
                get: ChromeMockFn;
                query: ChromeMockFn;
                update: ChromeMockFn;
            };
            tabGroups: {
                move: ChromeMockFn;
                query: ChromeMockFn;
            };
            windows: { WINDOW_ID_CURRENT: number };
            storage: { local: { get: ChromeMockFn; remove: ChromeMockFn } };
            runtime: { sendMessage: ChromeMockFn };
        }
    }
}

export {};
