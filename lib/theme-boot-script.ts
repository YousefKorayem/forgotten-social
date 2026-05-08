/**
 * Blocking theme init so `html.dark` / `html.light` match Tailwind (`@custom-variant dark`).
 * Keep in sync with `components/theme-provider.tsx`.
 */
export const THEME_BOOT_SCRIPT = `
(function () {
  try {
    var attribute = "class";
    var storageKey = "theme";
    var defaultTheme = "system";
    var forcedTheme = null;
    var themes = ["light", "dark"];
    var value = null;
    var enableSystem = true;
    var enableColorScheme = true;
    var el = document.documentElement;
    var systemThemes = ["light", "dark"];

    function setColorScheme(theme) {
      if (enableColorScheme && systemThemes.indexOf(theme) !== -1) {
        el.style.colorScheme = theme;
      }
    }

    function updateDOM(theme) {
      var attributes = Array.isArray(attribute) ? attribute : [attribute];
      attributes.forEach(function (attr) {
        var isClass = attr === "class";
        var classes = isClass && value ? themes.map(function (t) { return value[t] || t; }) : themes;
        if (isClass) {
          el.classList.remove.apply(el, classes);
          el.classList.add(value && value[theme] ? value[theme] : theme);
        } else {
          el.setAttribute(attr, theme);
        }
      });
      setColorScheme(theme);
    }

    function getSystemTheme() {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    if (forcedTheme) {
      updateDOM(forcedTheme);
    } else {
      var themeName = localStorage.getItem(storageKey) || defaultTheme;
      var isSystem = enableSystem && themeName === "system";
      var theme = isSystem ? getSystemTheme() : themeName;
      updateDOM(theme);
    }
  } catch (e) {}
})();
`.trim();
