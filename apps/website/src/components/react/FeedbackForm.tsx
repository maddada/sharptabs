import { useState } from "react";

export default function FeedbackForm({ page }: { page: string }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState("");
    const [showEmail, setShowEmail] = useState(page === "support");
    const [isTextareaFocused, setIsTextareaFocused] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        const formData = new FormData(e.currentTarget);

        try {
            const response = await fetch("https://submit-form.com/pizr9XVUz", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(Object.fromEntries(formData)),
            });

            if (response.ok) {
                setIsSubmitted(true);
                // Reset form
                (e.target as HTMLFormElement).reset();
            } else {
                throw new Error("Failed to submit form");
            }
        } catch (err) {
            setError("Failed to send message. Please try again or use the email option below.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="rounded-2xl border border-green-200/20 bg-gradient-to-br from-green-950/50 to-emerald-900/30 p-8 shadow-lg">
                <div className="text-left">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                        <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h3 className="mb-3 text-xl font-semibold text-white">Message Sent!</h3>
                    <p className="mb-6 text-green-200">Thank you for your feedback. We'll make sure to take it into account.</p>
                    <button
                        onClick={() => setIsSubmitted(false)}
                        className="text-green-400 transition-colors duration-200 hover:text-green-300"
                    >
                        Send another message
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-blue-200/20 bg-gradient-to-br from-gray-950/50 to-[#000e2b]/80 p-8 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="message" className="mb-2 block text-lg font-medium text-gray-200">
                        Your feedback
                    </label>
                    <textarea
                        id="message"
                        name="message"
                        placeholder=""
                        required
                        rows={6}
                        onFocus={() => setIsTextareaFocused(true)}
                        onChange={(e) => {
                            // Always show the email if the message if we're on the support page
                            if (page === "support") {
                                setShowEmail(true);
                                return;
                            }

                            if (e.target.value.length > 20) {
                                setShowEmail(true);
                            } else {
                                setShowEmail(false);
                            }
                        }}
                        className={`w-full resize-none rounded-lg bg-slate-800/50 px-4 py-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-300 ${
                            isTextareaFocused
                                ? "border border-slate-600 outline-none focus:border-blue-400 focus:outline focus:outline-2 focus:outline-blue-400/60 focus:outline-offset-1"
                                : "animate-pulse border-2 outline outline-4 outline-blue-500/70 [animation-duration:2s] hover:outline-6 focus:outline-8 focus:outline-blue-300 focus:outline-offset-4"
                        }`}
                        style={
                            !isTextareaFocused
                                ? {
                                      animationIterationCount: "infinite",
                                      animationDirection: "alternate",
                                  }
                                : {}
                        }
                    />
                </div>
                {showEmail && (
                    <div>
                        <label htmlFor="email" className="mb-2 block text-lg font-medium text-gray-200">
                            Email (Optional)
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder=""
                            className="w-full rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-200 hover:border-blue-400/50 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
                        />
                    </div>
                )}
                {error && (
                    <div className="rounded-lg border border-red-200/20 bg-red-950/30 p-4">
                        <p className="text-sm text-red-300">{error}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative w-full transform overflow-hidden rounded-2xl px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {/* Button background with gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 transition-all duration-300 group-hover:from-blue-500 group-hover:to-cyan-500 group-disabled:from-gray-600 group-disabled:to-gray-700"></div>
                    <div className="absolute inset-0 -translate-x-full -skew-x-12 transform bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full group-disabled:translate-x-0"></div>

                    <span className="relative flex items-center justify-center">
                        {isSubmitting ? (
                            <>
                                <svg className="mr-3 h-5 w-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                                Sending...
                            </>
                        ) : (
                            <>Send Feedback</>
                        )}
                    </span>
                </button>
            </form>
        </div>
    );
}
