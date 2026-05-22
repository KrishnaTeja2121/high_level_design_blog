const markdownPath = "high-level-design-blog.md";
const colorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
let currentMarkdown = "";

initializeMermaid();

marked.use({
  renderer: {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      const plain = text.replace(/<[^>]+>/g, "");
      const id = slugify(plain);
      return `<h${depth} id="${id}">${text}</h${depth}>`;
    },
    code({ text, lang }) {
      if (lang === "mermaid") {
        return `<div class="mermaid">${escapeHtml(text)}</div>`;
      }

      const language = lang ? ` class="language-${escapeHtml(lang)}"` : "";
      return `<pre><code${language}>${escapeHtml(text)}</code></pre>`;
    }
  }
});

loadGuide();
colorSchemeQuery.addEventListener("change", () => {
  initializeMermaid();
  renderGuide(currentMarkdown);
});

async function loadGuide() {
  const content = document.querySelector("#content");

  try {
    const response = await fetch(markdownPath);

    if (!response.ok) {
      throw new Error(`Unable to load ${markdownPath}`);
    }

    const markdown = await response.text();
    currentMarkdown = markdown;
    await renderGuide(markdown);
  } catch (error) {
    content.innerHTML = `
      <div class="loading">
        Could not load the Markdown file. Serve this folder with a local web server or publish it with GitHub Pages.
      </div>
    `;
    console.error(error);
  }
}

async function renderGuide(markdown) {
  if (!markdown) return;

  const content = document.querySelector("#content");
  content.innerHTML = marked.parse(markdown);
  buildToc(content);
  await mermaid.run({ querySelector: ".mermaid" });
  observeSections();
}

function initializeMermaid() {
  mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    securityLevel: "loose",
    themeVariables: getMermaidThemeVariables()
  });
}

function getMermaidThemeVariables() {
  const isDark = colorSchemeQuery.matches;

  return {
    primaryColor: isDark ? "#1d1d1f" : "#f5f5f7",
    primaryTextColor: isDark ? "#f5f5f7" : "#1d1d1f",
    primaryBorderColor: isDark ? "#6e6e73" : "#d2d2d7",
    lineColor: isDark ? "#a1a1a6" : "#6e6e73",
    secondaryColor: isDark ? "#0f2f4f" : "#eaf3ff",
    tertiaryColor: isDark ? "#161617" : "#ffffff",
    background: isDark ? "#161617" : "#ffffff",
    mainBkg: isDark ? "#1d1d1f" : "#f5f5f7",
    secondBkg: isDark ? "#0f2f4f" : "#eaf3ff",
    tertiaryBkg: isDark ? "#161617" : "#ffffff",
    textColor: isDark ? "#f5f5f7" : "#1d1d1f",
    nodeTextColor: isDark ? "#f5f5f7" : "#1d1d1f",
    titleColor: isDark ? "#f5f5f7" : "#1d1d1f",
    edgeLabelBackground: isDark ? "#161617" : "#ffffff",
    clusterBkg: isDark ? "#111418" : "#fbfbfd",
    clusterBorder: isDark ? "#424245" : "#d2d2d7",
    actorBkg: isDark ? "#1d1d1f" : "#f5f5f7",
    actorBorder: isDark ? "#6e6e73" : "#d2d2d7",
    actorTextColor: isDark ? "#f5f5f7" : "#1d1d1f",
    activationBkgColor: isDark ? "#0f2f4f" : "#eaf3ff",
    activationBorderColor: isDark ? "#2997ff" : "#0066cc",
    sequenceNumberColor: isDark ? "#000000" : "#ffffff",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif'
  };
}

function buildToc(content) {
  const toc = document.querySelector("#toc");
  const headings = [...content.querySelectorAll("h2, h3")];

  toc.innerHTML = headings
    .map((heading) => {
      const label = heading.textContent.replace(/^\d+\.\s*/, "");
      const level = heading.tagName === "H2" ? 2 : 3;
      return `<a href="#${heading.id}" data-level="${level}">${label}</a>`;
    })
    .join("");
}

function observeSections() {
  const links = [...document.querySelectorAll(".toc a")];
  const byId = new Map(links.map((link) => [link.getAttribute("href").slice(1), link]));
  const headings = [...document.querySelectorAll(".content h2, .content h3")];

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

      if (!visible) return;

      links.forEach((link) => link.classList.remove("active"));
      byId.get(visible.target.id)?.classList.add("active");
    },
    {
      rootMargin: "-96px 0px -70% 0px",
      threshold: 0.01
    }
  );

  headings.forEach((heading) => observer.observe(heading));
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
