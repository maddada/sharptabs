export type Screenshot = {
    url: string;
    dataUrl: string;
    timestamp: number;
    capturedAt: string; // ISO date string
};

export type ScreenshotMetadata = {
    url: string;
    timestamp: number;
    size: number; // in bytes
};
