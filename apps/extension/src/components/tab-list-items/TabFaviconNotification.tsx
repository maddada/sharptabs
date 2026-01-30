import { Tab } from "@/types/Tab";
import { TabItemState } from "./TabItem";

type TabFaviconNotificationProps = {
    tabState: TabItemState;
    tab: Tab;
};

export const TabFaviconNotification = ({ tab }: TabFaviconNotificationProps) => {
    // Check if title starts with bullet point (Discord unread indicator)
    const hasUnreadIndicator = tab.title?.trim().startsWith("•");

    // Extract notification count from tab title
    const getNotificationCount = (title: string | undefined): string | null => {
        if (!title) return null;

        const trimmedTitle = title.trim();
        // Match (number) or (number+) at the start of the title
        const match = trimmedTitle.match(/^\((\d+\+?)\)/);

        return match ? match[1] : null;
    };

    let notificationCount = getNotificationCount(tab.title);

    // Determine what to display
    let displayContent: string | null = null;

    if (hasUnreadIndicator) {
        displayContent = " ";
    } else if (notificationCount && notificationCount !== "0") {
        if (parseInt(notificationCount) >= 99) {
            displayContent = "99";
        } else {
            displayContent = notificationCount;
        }
    }

    if (!displayContent) {
        return null;
    }

    return (
        <div
            className="favicon-notification-count absolute flex items-center justify-center"
            style={{
                minWidth: "15px",
                minHeight: "15px",
                borderRadius: "99px",
                fontSize: "8px",
                fontWeight: "bold",
                pointerEvents: "none",
                background: "linear-gradient(143deg, rgb(227, 29, 29), rgb(34, 0, 0))",
                color: "rgba(255, 255, 255, 0.9)",
                textAlign: "center",
                padding: "1px 0px 0px",
                lineHeight: 1.2,
                right: "-6px",
                top: "8px",
            }}
        >
            {displayContent}
        </div>
    );
};
