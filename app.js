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
  return {
    primaryColor: "#f5f5f7",
    primaryTextColor: "#1d1d1f",
    primaryBorderColor: "#d2d2d7",
    lineColor: "#6e6e73",
    secondaryColor: "#eaf3ff",
    tertiaryColor: "#ffffff",
    background: "#ffffff",
    mainBkg: "#f5f5f7",
    secondBkg: "#eaf3ff",
    tertiaryBkg: "#ffffff",
    textColor: "#1d1d1f",
    nodeTextColor: "#1d1d1f",
    titleColor: "#1d1d1f",
    edgeLabelBackground: "#ffffff",
    clusterBkg: "#fbfbfd",
    clusterBorder: "#d2d2d7",
    actorBkg: "#f5f5f7",
    actorBorder: "#d2d2d7",
    actorTextColor: "#1d1d1f",
    activationBkgColor: "#eaf3ff",
    activationBorderColor: "#0066cc",
    sequenceNumberColor: "#ffffff",
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
