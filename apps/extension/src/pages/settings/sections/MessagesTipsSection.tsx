import { Settings } from "@/types/Settings";

interface MessagesTipsSectionProps {
    settings: Settings;
}

export const MessagesTipsSection = ({ settings }: MessagesTipsSectionProps) => (
    <section id="messages-tips" className="scroll-mt-24 rounded-2xl bg-neutral-900 shadow transition-all duration-300">
        <iframe
            src={`https://sharptabs.com/messages-and-tips?color=${settings.theme}`}
            style={{
                width: "100%",
                height: "430px",
                border: "none",
                borderRadius: "8px",
                overflow: "hidden",
            }}
            title="Messages & Tips"
        />
    </section>
);
