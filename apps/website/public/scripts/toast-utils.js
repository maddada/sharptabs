// Extension login success toast utility
// Shared function used across extension-auth.astro and profile-client.js

// Make functions globally available
window.showExtensionLoginSuccessToast = function showExtensionLoginSuccessToast(email) {
    console.log("[EXTENSION TOAST] Showing extension login success toast for:", email);

    try {
        // Create and show auto-login toast
        const toast = document.createElement("div");
        // Use inline styles to ensure visibility
        toast.style.cssText = `
        position: fixed;
        bottom: 32px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        z-index: 9999;
        max-width: 400px;
        width: auto;
        min-width: 320px;
        opacity: 0;
        transition: all 0.5s ease-in-out;
    `;
        console.log("[EXTENSION TOAST] Created toast element with inline styles");

        const toastContent = document.createElement("div");
        toastContent.style.cssText = `
        background: linear-gradient(to right, #059669, #10b981);
        color: white;
        padding: 24px;
        border-radius: 12px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(16, 185, 129, 0.3);
        backdrop-filter: blur(4px);
    `;
        toastContent.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 16px;">
            <div style="flex-shrink: 0; margin-top: 2px;">
                <div style="width: 32px; height: 32px; background: rgba(255, 255, 255, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
            </div>
            <div style="flex: 1; min-width: 0;">
                <div style="font-weight: bold; font-size: 18px; line-height: 1.2;">Extension Signed In Successfully!</div>
                <div style="font-size: 14px; opacity: 0.95; margin-top: 4px;">
                    We've signed you into the Sharp Tabs extension as <strong>${email}</strong>.
                </div>
                <div style="font-size: 14px; opacity: 0.9; margin-top: 8px; color: #d1fae5;">
                    Go back to the extension's settings page to see your account.
                </div>
            </div>
        </div>
    `;

        toast.appendChild(toastContent);
        document.body.appendChild(toast);

        console.log("[EXTENSION TOAST] Toast element added to DOM");
        console.log("[EXTENSION TOAST] Toast position:", {
            position: toast.style.position,
            bottom: toast.style.bottom,
            left: toast.style.left,
            transform: toast.style.transform,
            zIndex: toast.style.zIndex,
            opacity: toast.style.opacity,
        });

        // Animate in
        requestAnimationFrame(() => {
            toast.style.opacity = "1";
            toast.style.transform = "translateX(-50%) translateY(0)";
            console.log("[EXTENSION TOAST] Animation applied, opacity:", toast.style.opacity);
            console.log("[EXTENSION TOAST] Toast should now be visible at bottom center of screen");
        });

        // Start fade out after 6 seconds, complete removal after 7 seconds
        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateX(-50%) translateY(20px)";
            console.log("[EXTENSION TOAST] Fade out animation started");
        }, 6000);

        // Remove from DOM after animation completes
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
                console.log("[EXTENSION TOAST] Toast element removed from DOM");
            }
        }, 7000);
    } catch (error) {
        console.error("[EXTENSION TOAST] Error creating toast:", error);
    }
};

window.showAutoLoginError = function showAutoLoginError() {
    console.log("[EXTENSION TOAST] Showing auto login error toast");

    // Create and show error toast
    const toast = document.createElement("div");
    toast.style.cssText = `
        position: fixed;
        bottom: 32px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        z-index: 9999;
        max-width: 400px;
        width: auto;
        min-width: 320px;
        opacity: 0;
        transition: all 0.5s ease-in-out;
    `;

    const toastContent = document.createElement("div");
    toastContent.style.cssText = `
        background: linear-gradient(to right, #dc2626, #ef4444);
        color: white;
        padding: 24px;
        border-radius: 12px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        border: 1px solid rgba(239, 68, 68, 0.3);
        backdrop-filter: blur(4px);
    `;
    toastContent.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 16px;">
            <div style="flex-shrink: 0; margin-top: 2px;">
                <div style="width: 32px; height: 32px; background: rgba(255, 255, 255, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <svg style="width: 20px; height: 20px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
            </div>
            <div style="flex: 1; min-width: 0;">
                <div style="font-weight: bold; font-size: 18px; line-height: 1.2;">Extension Sign-In Failed</div>
                <div style="font-size: 14px; opacity: 0.95; margin-top: 4px;">
                    Unable to automatically sign you into the extension.
                </div>
                <div style="font-size: 14px; opacity: 0.9; margin-top: 8px; color: #fecaca;">
                    Please try signing in manually from the extension settings.
                </div>
            </div>
        </div>
    `;

    toast.appendChild(toastContent);
    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateX(-50%) translateY(0)";
    });

    // Start fade out after 6 seconds, complete removal after 7 seconds
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(-50%) translateY(20px)";
    }, 6000);

    // Remove from DOM after animation completes
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 7000);
};

// Also expose as regular functions for non-module scripts
function showExtensionLoginSuccessToast(email) {
    return window.showExtensionLoginSuccessToast(email);
}

function showAutoLoginError() {
    return window.showAutoLoginError();
}

// Test function to manually trigger toast (for debugging)
window.testToast = function() {
    console.log("[TEST] Manually triggering toast test");
    window.showExtensionLoginSuccessToast("test@example.com");
};