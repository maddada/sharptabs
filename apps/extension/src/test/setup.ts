import "@testing-library/jest-dom";
import { afterEach, vi, expect } from "vitest";
import { cleanup } from "@testing-library/react";

// Extend expect with jest-dom matchers
import * as matchers from "@testing-library/jest-dom/matchers";
expect.extend(matchers);

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Cleanup after each test case
afterEach(() => {
    cleanup();
});
