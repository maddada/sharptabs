export const logDragOperation = (phase: string, data: any) => {
    console.log(`[DRAG-${phase}]`, data);
};

// Enhanced version with context - use this for consistent logging in handleDragEnd
export const logDrag = (phase: string, activeId?: any, overId?: any, extraData?: any) => {
    const baseData = {
        activeId: activeId?.toString() || "unknown",
        overId: overId?.toString() || "null",
        timestamp: Date.now(),
        ...extraData,
    };
    console.log(`[DRAG-${phase}]`, baseData);
};
