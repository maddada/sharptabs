if (window.location.href.includes("settings.html")) {
    document.documentElement.classList.add("dark", localStorage.getItem("theme"));
} else {
    document.documentElement.classList.add(localStorage.getItem("themeType"), localStorage.getItem("theme"));
}
