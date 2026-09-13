import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileSection } from "@/components/settings/ProfileSection";

vi.mock("@/stores/authStore", () => ({
    useAuthStore: Object.assign(
        (selector?: (state: { user: null; actions: object }) => unknown) => {
            const state = { user: null, actions: {} };
            return selector ? selector(state) : state;
        },
        { getState: () => ({ user: null }) },
    ),
}));
vi.mock("@/utils/convex", () => ({ convex: {}, isConvexAvailable: false }));
vi.mock("@/utils/firebase", () => ({ auth: null }));
vi.mock("convex/react", () => ({ useQuery: () => undefined }));

beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("chrome", { storage: { onChanged: { addListener: vi.fn(), removeListener: vi.fn() } } });
});

afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe("signed-out settings header", () => {
    it("separates the login action from wrapping text and stacks on narrow screens", () => {
        render(<ProfileSection user={null} loading={false} error={null} />);
        const button = screen.getByRole("button", { name: "Sign In" });
        expect(button.parentElement).toHaveClass("gap-5", "flex-col", "sm:flex-row");
        expect(button).toHaveClass("shrink-0", "w-full", "sm:w-auto");
        expect(screen.getByText(/The extension is fully free/)).toHaveClass("text-muted-foreground");
    });

    it("keeps the sign-in action working while waiting for authentication", () => {
        const open = vi.spyOn(window, "open").mockReturnValue(null);
        render(<ProfileSection user={null} loading={false} error={null} />);
        fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
        expect(open).toHaveBeenCalledWith("https://sharptabs.com/profile?from=extension", "_blank");
        expect(screen.getByRole("button", { name: "Sign In on Website..." })).toBeDisabled();
    });
});
