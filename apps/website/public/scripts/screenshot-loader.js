// Screenshot loader for restore page
console.log("[Screenshot Loader] Loading screenshot-loader.js");

async function loadAndDisplayScreenshot(url, shouldPause) {
    console.log("[Screenshot Loader] loadAndDisplayScreenshot called", { url, shouldPause });

    // Skip if auto-restoring immediately
    if (shouldPause === "0") {
        console.log("[Screenshot Loader] Skipping - shouldPause is 0 (auto-restore)");
        return;
    }

    if (!url) {
        console.warn("[Screenshot Loader] Skipping - no URL provided");
        return;
    }

    console.log("[Screenshot Loader] Checking if screenshotBridge is available:", !!window.screenshotBridge);

    try {
        console.log("[Screenshot Loader] Requesting screenshot from bridge...");
        const screenshot = await window.screenshotBridge.requestScreenshot(url);

        console.log("[Screenshot Loader] Screenshot request completed:", {
            hasScreenshot: !!screenshot,
            size: screenshot ? screenshot.length : 0,
        });

        if (screenshot) {
            console.log("[Screenshot Loader] Displaying screenshot as background");
            displayBackgroundScreenshot(screenshot);
        } else {
            console.log("[Screenshot Loader] No screenshot available, using default background");
        }
    } catch (error) {
        console.error("[Screenshot Loader] Error loading screenshot:", error);
        console.log("[Screenshot Loader] Using default background");
    }
}

function displayBackgroundScreenshot(dataUrl) {
    console.log("[Screenshot Loader] displayBackgroundScreenshot called, dataUrl length:", dataUrl.length);

    // Create overlay
    const overlay = document.createElement("div");
    overlay.className = "screenshot-overlay";
    console.log("[Screenshot Loader] Created overlay element");

    // Create screenshot container
    const bgDiv = document.createElement("div");
    bgDiv.className = "screenshot-background";
    console.log("[Screenshot Loader] Created background container");

    // Create secondary background image (more blurred, fills viewport)
    const img2 = document.createElement("img");
    img2.className = "img2";
    img2.src = dataUrl;
    img2.alt = "Page screenshot background";
    console.log("[Screenshot Loader] Created secondary background image (img2)");

    // Create container for primary screenshot (for border-radius)
    const img1Container = document.createElement("div");
    img1Container.className = "img1-container";
    console.log("[Screenshot Loader] Created primary screenshot container");

    // Create primary screenshot image (less blur, contains)
    const img1 = document.createElement("img");
    img1.className = "img1";
    img1.src = dataUrl;
    img1.alt = "Page screenshot";

    let imagesLoaded = 0;
    const onImageLoad = () => {
        imagesLoaded++;
        console.log("[Screenshot Loader] Image loaded", imagesLoaded, "of 2");
        if (imagesLoaded === 2) {
            console.log("[Screenshot Loader] All images loaded successfully, adding 'loaded' class");
            bgDiv.classList.add("loaded");
        }
    };

    img1.onload = onImageLoad;
    img2.onload = onImageLoad;

    img1.onerror = (error) => {
        console.error("[Screenshot Loader] Primary image (img1) failed to load:", error);
    };

    img2.onerror = (error) => {
        console.error("[Screenshot Loader] Secondary image (img2) failed to load:", error);
    };

    // Append img1 to its container
    img1Container.appendChild(img1);

    // Append both layers - img2 first (background), then img1Container (foreground)
    bgDiv.appendChild(img2);
    bgDiv.appendChild(img1Container);

    // Insert at beginning of body (behind everything)
    document.body.insertBefore(overlay, document.body.firstChild);
    document.body.insertBefore(bgDiv, document.body.firstChild);
    console.log("[Screenshot Loader] Screenshot elements inserted into DOM");

    // Add classes to enable bottom bar layout
    console.log("[Screenshot Loader] Adding 'has-screenshot' class to body and 'bottom-bar' class to restore-container");
    document.body.classList.add("has-screenshot");
    const container = document.querySelector(".restore-container");
    if (container) {
        container.classList.add("bottom-bar");
    }
}

window.loadAndDisplayScreenshot = loadAndDisplayScreenshot;
console.log("[Screenshot Loader] loadAndDisplayScreenshot function attached to window");
