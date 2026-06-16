let mermaidModule;
let renderingMermaid = false;
let pendingMermaidRender = false;
const compactDrawerQuery = window.matchMedia("(max-width: 980px)");

function currentTheme() {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function preferredTheme() {
  try {
    const saved = localStorage.getItem("designs-workflow-guide-theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // Storage can be blocked in private or restricted browsing contexts.
  }
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function resetMermaidNodes(nodes, hasError = false) {
  for (const node of nodes) {
    if (!node.dataset.source) node.dataset.source = node.textContent.trim();
    node.textContent = node.dataset.source;
    node.removeAttribute("data-processed");
    node.toggleAttribute("data-render-error", hasError);
  }
}

async function renderMermaid() {
  if (renderingMermaid) {
    pendingMermaidRender = true;
    return;
  }
  const nodes = [...document.querySelectorAll(".mermaid")];
  if (nodes.length === 0) return;

  renderingMermaid = true;
  pendingMermaidRender = false;
  try {
    resetMermaidNodes(nodes);
    mermaidModule = mermaidModule ?? (await import("https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs"));
    const mermaid = mermaidModule.default;
    const theme = currentTheme();

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      theme: theme === "light" ? "base" : "dark",
      themeVariables:
        theme === "light"
          ? {
              background: "transparent",
              primaryColor: "#fffaf2",
              primaryTextColor: "#211a15",
              primaryBorderColor: "#c94b16",
              lineColor: "#c94b16",
              secondaryColor: "#f0e4d4",
              tertiaryColor: "#fffdf8",
            }
          : {
              background: "transparent",
              primaryColor: "#22201d",
              primaryTextColor: "#f6f0e8",
              primaryBorderColor: "#ff6422",
              lineColor: "#ff6422",
              secondaryColor: "#1a1815",
              tertiaryColor: "#0c0b0a",
            },
      flowchart: { curve: "basis" },
      sequence: { showSequenceNumbers: true },
    });

    await mermaid.run({ nodes });
  } catch {
    resetMermaidNodes(nodes, true);
  } finally {
    renderingMermaid = false;
    if (pendingMermaidRender) void renderMermaid();
  }
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("designs-workflow-guide-theme", theme);
  } catch {
    // Continue without persistence when storage is unavailable.
  }
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    const label = theme === "light" ? "Use dark theme" : "Use light theme";
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
    button.innerHTML =
      theme === "light"
        ? `<svg class="theme-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`
        : `<svg class="theme-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor"/>
            <path d="M12 2.5v2.1M12 19.4v2.1M4.6 4.6l1.5 1.5M17.9 17.9l1.5 1.5M2.5 12h2.1M19.4 12h2.1M4.6 19.4l1.5-1.5M17.9 6.1l1.5-1.5" fill="none" stroke="currentColor" stroke-linecap="round"/>
          </svg>`;
  });
  void renderMermaid();
}

function initializeThemeToggle() {
  setTheme(preferredTheme());
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      setTheme(currentTheme() === "light" ? "dark" : "light");
    });
  });
}

function setDrawerFocusability(drawer, open) {
  drawer.querySelectorAll("a, button, input, textarea, select, details, [tabindex]").forEach((element) => {
    if (open) {
      if (element.dataset.drawerManagedTabindex === "true") {
        if (element.dataset.drawerHadTabindex === "true") {
          element.setAttribute("tabindex", element.dataset.drawerPreviousTabindex ?? "");
        } else {
          element.removeAttribute("tabindex");
        }
        delete element.dataset.drawerManagedTabindex;
        delete element.dataset.drawerHadTabindex;
        delete element.dataset.drawerPreviousTabindex;
      }
      return;
    }

    if (element.dataset.drawerManagedTabindex !== "true") {
      const hadTabindex = element.hasAttribute("tabindex");
      element.dataset.drawerManagedTabindex = "true";
      element.dataset.drawerHadTabindex = String(hadTabindex);
      if (hadTabindex) element.dataset.drawerPreviousTabindex = element.getAttribute("tabindex") ?? "";
    }
    element.setAttribute("tabindex", "-1");
  });
}

function setDrawerOpen(open) {
  const drawer = document.querySelector(".drawer[data-drawer]");
  document.body.dataset.drawer = open ? "open" : "closed";
  document.body.classList.toggle("drawer-lock", open && compactDrawerQuery.matches);
  if (drawer) {
    drawer.setAttribute("aria-hidden", String(!open));
    if ("inert" in drawer) drawer.inert = !open;
    drawer.toggleAttribute("inert", !open);
    setDrawerFocusability(drawer, open);
  }
  document.querySelectorAll("[data-drawer-toggle]").forEach((button) => {
    const label = open ? "Hide contents" : "Show contents";
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
    button.textContent = open ? "Hide" : "Contents";
  });
}

function initializeDrawerToggle() {
  const drawer = document.querySelector(".drawer[data-drawer]");
  const toggles = [...document.querySelectorAll("[data-drawer-toggle]")];
  if (!drawer || toggles.length === 0) return;

  const syncDrawerForViewport = () => setDrawerOpen(!compactDrawerQuery.matches);
  syncDrawerForViewport();
  compactDrawerQuery.addEventListener("change", syncDrawerForViewport);

  toggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      setDrawerOpen(document.body.dataset.drawer !== "open");
    });
  });

  drawer.querySelectorAll("a[href^='#']").forEach((link) => {
    link.addEventListener("click", () => {
      if (compactDrawerQuery.matches) setDrawerOpen(false);
    });
  });
}

function initializeActiveLinks() {
  const links = [...document.querySelectorAll(".scenario-card[href^='#']")];
  const sections = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (sections.length === 0) return;

  const markActive = (sectionId) => {
    links.forEach((link) => {
      const active = link.getAttribute("href") === `#${sectionId}`;
      link.classList.toggle("is-active", active);
      if (active) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  links.forEach((link) => {
    link.addEventListener("click", () => markActive(link.getAttribute("href").slice(1)));
  });

  const updateActiveFromScroll = () => {
    const marker = 140;
    const activeSection =
      [...sections].reverse().find((section) => section.getBoundingClientRect().top <= marker) ?? sections[0];
    markActive(activeSection.id);
  };

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      updateActiveFromScroll();
      ticking = false;
    });
  });
  window.addEventListener("resize", updateActiveFromScroll);
  updateActiveFromScroll();
}

window.addEventListener("DOMContentLoaded", () => {
  initializeThemeToggle();
  initializeDrawerToggle();
  initializeActiveLinks();
  void renderMermaid();
});
