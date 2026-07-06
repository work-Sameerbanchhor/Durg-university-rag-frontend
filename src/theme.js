// ==========================================================================
// COLOR PRESET THEME MANAGEMENT
// ==========================================================================

const themePresets = {
    emerald: {
        name: "Emerald Glow",
        dotGradient: "linear-gradient(135deg, #A3E635 0%, #22C55E 100%)",
        dark: {
            "--accent-blue": "#A3E635",
            "--accent-green": "#22C55E",
            "--accent-grad": "linear-gradient(135deg, #A3E635 0%, #22C55E 100%)",
            "--accent-glow": "rgba(163, 230, 53, 0.2)",
            "--border-glass": "rgba(163, 230, 53, 0.15)",
            "--border-glass-hover": "rgba(163, 230, 53, 0.3)"
        },
        light: {
            "--accent-blue": "#65A30D",
            "--accent-green": "#16A34A",
            "--accent-grad": "linear-gradient(135deg, #65A30D 0%, #16A34A 100%)",
            "--accent-glow": "rgba(101, 163, 0, 0.15)",
            "--border-glass": "rgba(101, 163, 0, 0.2)",
            "--border-glass-hover": "rgba(101, 163, 0, 0.4)"
        }
    },
    ocean: {
        name: "Oceanic Cyber",
        dotGradient: "linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)",
        dark: {
            "--accent-blue": "#06B6D4",
            "--accent-green": "#3B82F6",
            "--accent-grad": "linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)",
            "--accent-glow": "rgba(6, 182, 212, 0.2)",
            "--border-glass": "rgba(6, 182, 212, 0.15)",
            "--border-glass-hover": "rgba(6, 182, 212, 0.3)"
        },
        light: {
            "--accent-blue": "#0891B2",
            "--accent-green": "#2563EB",
            "--accent-grad": "linear-gradient(135deg, #0891B2 0%, #2563EB 100%)",
            "--accent-glow": "rgba(8, 145, 178, 0.15)",
            "--border-glass": "rgba(8, 145, 178, 0.2)",
            "--border-glass-hover": "rgba(8, 145, 178, 0.4)"
        }
    },
    royal: {
        name: "Royal Violet",
        dotGradient: "linear-gradient(135deg, #D946EF 0%, #8B5CF6 100%)",
        dark: {
            "--accent-blue": "#D946EF",
            "--accent-green": "#8B5CF6",
            "--accent-grad": "linear-gradient(135deg, #D946EF 0%, #8B5CF6 100%)",
            "--accent-glow": "rgba(217, 70, 239, 0.2)",
            "--border-glass": "rgba(217, 70, 239, 0.15)",
            "--border-glass-hover": "rgba(217, 70, 239, 0.3)"
        },
        light: {
            "--accent-blue": "#C084FC",
            "--accent-green": "#7C3AED",
            "--accent-grad": "linear-gradient(135deg, #C084FC 0%, #7C3AED 100%)",
            "--accent-glow": "rgba(192, 132, 252, 0.15)",
            "--border-glass": "rgba(192, 132, 252, 0.2)",
            "--border-glass-hover": "rgba(192, 132, 252, 0.4)"
        }
    },
    sunset: {
        name: "Sunset Blaze",
        dotGradient: "linear-gradient(135deg, #F97316 0%, #EF4444 100%)",
        dark: {
            "--accent-blue": "#F97316",
            "--accent-green": "#EF4444",
            "--accent-grad": "linear-gradient(135deg, #F97316 0%, #EF4444 100%)",
            "--accent-glow": "rgba(249, 115, 22, 0.2)",
            "--border-glass": "rgba(249, 115, 22, 0.15)",
            "--border-glass-hover": "rgba(249, 115, 22, 0.3)"
        },
        light: {
            "--accent-blue": "#EA580C",
            "--accent-green": "#DC2626",
            "--accent-grad": "linear-gradient(135deg, #EA580C 0%, #DC2626 100%)",
            "--accent-glow": "rgba(234, 88, 12, 0.15)",
            "--border-glass": "rgba(234, 88, 12, 0.2)",
            "--border-glass-hover": "rgba(234, 88, 12, 0.4)"
        }
    }
};

let currentPresetKey = localStorage.getItem("color-preset") || "emerald";

// Get key of active preset
function getCurrentPresetKey() {
    return currentPresetKey;
}

// Apply selected preset variables to root document styles
function applyThemePreset(presetKey) {
    if (!themePresets[presetKey]) return;
    currentPresetKey = presetKey;
    localStorage.setItem("color-preset", presetKey);

    const isLightMode = document.body.getAttribute("data-theme") === "light";
    const properties = isLightMode ? themePresets[presetKey].light : themePresets[presetKey].dark;

    // Set custom properties on the body element to override data-theme stylesheet variables
    const targetElement = document.body || document.documentElement;
    Object.keys(properties).forEach(prop => {
        targetElement.style.setProperty(prop, properties[prop]);
    });

    // Update active class state on the preset buttons
    const buttons = document.querySelectorAll(".preset-btn");
    buttons.forEach(btn => {
        const key = btn.getAttribute("data-preset");
        btn.classList.toggle("active", key === presetKey);
    });
}

// Render dynamic color selection buttons in the Left Sidebar
function initThemePresets() {
    const grid = document.getElementById("color-presets-grid");
    if (!grid) return;

    grid.innerHTML = "";

    Object.keys(themePresets).forEach(key => {
        const preset = themePresets[key];
        const btn = document.createElement("button");
        btn.className = `preset-btn ${key === currentPresetKey ? 'active' : ''}`;
        btn.setAttribute("data-preset", key);
        btn.title = preset.name;
        btn.onclick = () => {
            applyThemePreset(key);
            if (typeof showToast === 'function') {
                showToast(`Applied ${preset.name} Accent`);
            }
        };

        const dot = document.createElement("span");
        dot.className = "preset-dot";
        dot.style.background = preset.dotGradient;

        btn.appendChild(dot);
        grid.appendChild(btn);
    });

    // Apply the active preset variables
    applyThemePreset(currentPresetKey);
}

// ==========================================================================
// INTERFACE SCALE / DPI CONFIGURATION
// ==========================================================================

// const scaleSizes = {
//     small: { desktop: "14px", mobile: "12px" },
//     normal: { desktop: "16px", mobile: "13px" },
//     large: { desktop: "18px", mobile: "15px" }
// };

const scaleSizes = {
  small: { desktop: "10px", mobile: "8px" },
  normal: { desktop: "12px", mobile: "10px" },
  large: { desktop: "14px", mobile: "12px" }
};

let currentScale = localStorage.getItem("interface-scale") || "normal";

// Get active scale preset
function getCurrentScale() {
    return currentScale;
}

// Apply scale preset base font-size
function applyScalePreset(scaleKey) {
    if (!scaleSizes[scaleKey]) return;
    currentScale = scaleKey;
    localStorage.setItem("interface-scale", scaleKey);

    const isMobile = window.innerWidth <= 768;
    const fontSize = isMobile ? scaleSizes[scaleKey].mobile : scaleSizes[scaleKey].desktop;

    document.documentElement.style.fontSize = fontSize;

    // Update active class on scale selection buttons
    const buttons = document.querySelectorAll(".scale-btn");
    buttons.forEach(btn => {
        const isActive = btn.id === `scale-btn-${scaleKey}`;
        btn.classList.toggle("active", isActive);
    });
}

// Initialize theme presets and scale after the DOM loads
document.addEventListener("DOMContentLoaded", () => {
    initThemePresets();
    applyScalePreset(currentScale);
    
    // Adjust base font-size dynamically when user resizes viewport
    window.addEventListener("resize", () => {
        applyScalePreset(currentScale);
    });
});

// Export/bind to window scope for compatibility with ES Modules in Vite
window.getCurrentPresetKey = getCurrentPresetKey;
window.applyThemePreset = applyThemePreset;
window.initThemePresets = initThemePresets;
window.getCurrentScale = getCurrentScale;
window.applyScalePreset = applyScalePreset;

export {
    getCurrentPresetKey,
    applyThemePreset,
    initThemePresets,
    getCurrentScale,
    applyScalePreset
};
