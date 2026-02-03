const navigationLocksByWindow = new Map<number, Promise<void>>();

export async function withNavigationLock<T>(windowId: number, action: () => Promise<T>): Promise<T> {
    const previous = navigationLocksByWindow.get(windowId) ?? Promise.resolve();
    let release: () => void = () => {};

    const next = new Promise<void>((resolve) => {
        release = resolve;
    });

    const chained = previous.then(() => next).catch(() => next);
    navigationLocksByWindow.set(windowId, chained);

    await previous.catch(() => undefined);

    try {
        return await action();
    } finally {
        release();
        chained.finally(() => {
            if (navigationLocksByWindow.get(windowId) === chained) {
                navigationLocksByWindow.delete(windowId);
            }
        });
    }
}

export function clearNavigationLock(windowId: number) {
    navigationLocksByWindow.delete(windowId);
}
