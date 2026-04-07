"use strict";

function updateToggleIcon() {
    var toggle = document.getElementById("scheme-toggle");
    if (!toggle) return;

    var isDark = document.documentElement.classList.contains("dark");
    toggle.innerHTML = isDark ? feather.icons.sun.toSvg() : feather.icons.moon.toSvg();
}

function setScheme(scheme) {
    if (scheme === "dark") {
        document.documentElement.classList.add("dark");
    } else {
        document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("scheme", scheme);
    updateToggleIcon();
}

document.addEventListener("DOMContentLoaded", function () {
    var localMode = localStorage.getItem("scheme");

    // On first visit, persist the OS preference that the inline head script already applied
    if (localMode === null) {
        var isDark = document.documentElement.classList.contains("dark");
        localStorage.setItem("scheme", isDark ? "dark" : "light");
    }

    // Set the correct toggle icon for the current state
    updateToggleIcon();

    // Listen for OS-level theme changes
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (event) {
        setScheme(event.matches ? "dark" : "light");
    });

    // Manual click toggle
    var mode = document.getElementById("scheme-toggle");
    if (mode !== null) {
        mode.addEventListener("click", function () {
            var isDark = document.documentElement.classList.contains("dark");
            setScheme(isDark ? "light" : "dark");
        });
    }
});
