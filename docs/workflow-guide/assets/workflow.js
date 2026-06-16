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
    button.textContent = theme === "light" ? "Dark" : "Light";
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

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      links.forEach((link) => {
        const active = link.getAttribute("href") === `#${visible.target.id}`;
        link.classList.toggle("is-active", active);
        if (active) {
          link.setAttribute("aria-current", "page");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    },
    { rootMargin: "-20% 0px -70% 0px", threshold: [0.1, 0.25, 0.5] },
  );

  sections.forEach((section) => observer.observe(section));
}

window.addEventListener("DOMContentLoaded", () => {
  initializeThemeToggle();
  initializeDrawerToggle();
  initializeActiveLinks();
  void renderMermaid();
});
