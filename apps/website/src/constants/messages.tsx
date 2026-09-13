import type * as React from "react";

interface Message {
    messageId: string;
    messageTitle: string;
    messageContent: React.ReactNode;
}

export const messages: Message[] = [
    {
        messageId: "WelcomeToSharpTabs",
        messageTitle: "Sharp Tabs is now free & open source!",
        messageContent: (
            <>
                <p className="mb-3">
                    Great news! Sharp Tabs is now fully <strong>free and open source</strong>. All features are now available to
                    everyone at no cost.
                </p>
                <p className="mb-3">
                    No account is needed. <strong>AI features</strong> (including the new Prompt to Organize) call an AI model,
                    so they use your own free Gemini API key, or an optional AI subscription if you'd rather not manage a key.
                </p>
                <p className="mb-3">If you enjoy Sharp Tabs, here's how you can help:</p>
                <ul className="list-inside list-disc space-y-1 pl-4">
                    <li>
                        ⭐ Star us on{" "}
                        <a
                            href="https://github.com/maddada/sharptabs"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary"
                        >
                            GitHub
                        </a>
                    </li>
                    <li>Get the optional AI subscription if you use AI features and want to support further development</li>
                </ul>
            </>
        ),
    },
    {
        messageId: "CreateHotkeysTip",
        messageTitle: "Create hotkeys for much improved usage",
        messageContent: (
            <>
                <ul className="list-inside list-disc space-y-1 pl-4">
                    <li>Activating Sharp Tabs</li>
                    <li>Showing Sidebar</li>
                    <li>Suspending Current Tab</li>
                    <li>Going to Prev/Next Active Tab</li>
                </ul>
                <p className="mt-3">
                    There's many more functions but these are my most used!
                    <br />
                </p>
            </>
        ),
    },
    {
        messageId: "AutoSuspensionFeature",
        messageTitle: "Enable Auto Suspension to save ram and speed up your PC!",
        messageContent: (
            <>
                <p>
                    I highly recommend that you try out this feature by visiting the 'Auto Suspension' section.
                    <br /> Keep in mind that suspended tabs don't consume any resources.
                </p>
            </>
        ),
    },
];

export type { Message };
