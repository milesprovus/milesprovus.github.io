const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- Theme ---------- */
const themeToggle = $("#themeToggle");

function getPreferredTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("theme", theme);
}

applyTheme(getPreferredTheme());

themeToggle?.addEventListener("click", () => {
  const current = document.documentElement.dataset.theme;
  applyTheme(current === "dark" ? "light" : "dark");
});

/* ---------- Year ---------- */
$("#year").textContent = String(new Date().getFullYear());

/* ---------- Mobile nav ---------- */
const navToggle = $("#navToggle");
const navMenu = $("#navMenu");

navToggle?.addEventListener("click", () => {
  const isOpen = navMenu.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

$$(".nav-link").forEach((a) => {
  a.addEventListener("click", () => {
    navMenu.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
  });
});

document.addEventListener("click", (e) => {
  if (!navMenu || !navToggle) return;
  const clickedInside = navMenu.contains(e.target) || navToggle.contains(e.target);
  if (!clickedInside) {
    navMenu.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }
});

/* ---------- Copy email ---------- */
const copyEmailBtn = $("#copyEmailBtn");
copyEmailBtn?.addEventListener("click", async () => {
  const email = copyEmailBtn.dataset.email || copyEmailBtn.textContent.trim();
  try {
    await navigator.clipboard.writeText(email);
    copyEmailBtn.innerHTML = `${email} <span class="muted">(copied)</span>`;
    setTimeout(() => (copyEmailBtn.innerHTML = `${email} <span class="muted">(copy)</span>`), 1200);
  } catch {
    window.location.href = `mailto:${encodeURIComponent(email)}`;
  }
});

/* ---------- Projects data (from resume) ---------- */
const PROJECTS = [
  {
    id: "monocle-teleprompter",
    title: "Monocle Teleprompter",
    subtitle: "Wearable, hands-free teleprompter device (Independent Project)",
    summary:
      "Wearable teleprompter using an open-source display controlled by an FPGA with a custom Bluetooth protocol and Google Cloud API integration.",
    tags: ["hardware", "fpga", "software"],
    tech: ["FPGA", "Bluetooth Protocol", "Google Cloud API", "Display Control"],
    impact: [
      "Developed a wearable, hands-free teleprompter device.",
      "Controlled an open-source display via FPGA using a custom Bluetooth protocol.",
      "Used Google Cloud API to control and display slide information on the user’s glasses."
    ],
    links: {},
    what:
      "Built a wearable teleprompter prototype. Core components included an FPGA-controlled display, a custom Bluetooth protocol for control, and Google Cloud API integration to manage and display slide information."
  },
  {
    id: "assistive-device-prototype",
    title: "Assistive Device Prototype (Course Project)",
    subtitle: "Intro to Digital and Analog Electronics — Team of 4",
    summary:
      "Client-focused prototype addressing disability constraints; custom hardware and real-time data acquisition/analysis logic.",
    tags: ["hardware"],
    tech: ["Hardware Design", "Real-time Data Acquisition", "Prototyping"],
    impact: [
      "Collaborated with a 4-person team to develop a device for a client’s physical disability.",
      "Considered societal, physical, and economic constraints during design.",
      "Designed custom hardware and device logic for real-time data acquisition and analysis.",
      "Delivered a functional prototype enabling the client to better understand physical limitations."
    ],
    links: {},
    what:
      "Worked with a small team to research client needs and build a solutions-based prototype. Designed custom hardware and logic for real-time data acquisition and analysis, delivering a working device to the client."
  }
];

/* ---------- Project rendering + filtering ---------- */
const projectGrid = $("#projectGrid");
const projectSearch = $("#projectSearch");
const filterButtons = $$(".filter-btn");

let activeFilter = "all";
let activeQuery = "";

function matchesFilter(project) {
  if (activeFilter === "all") return true;
  return project.tags.includes(activeFilter);
}

function matchesQuery(project) {
  if (!activeQuery) return true;
  const q = activeQuery.toLowerCase();
  const hay = [
    project.title,
    project.subtitle,
    project.summary,
    ...(project.tech || []),
    ...(project.tags || [])
  ].join(" ").toLowerCase();
  return hay.includes(q);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderProjects() {
  const visible = PROJECTS.filter((p) => matchesFilter(p) && matchesQuery(p));

  projectGrid.innerHTML = "";

  if (visible.length === 0) {
    const empty = document.createElement("div");
    empty.className = "card";
    empty.innerHTML = `<p class="muted">No projects match your filter/search.</p>`;
    projectGrid.appendChild(empty);
    return;
  }

  visible.forEach((p) => {
    const card = document.createElement("article");
    card.className = "project-card";
    card.innerHTML = `
      <div>
        <h3>${escapeHtml(p.title)}</h3>
        <p class="muted">${escapeHtml(p.subtitle || "")}</p>
      </div>
      <p>${escapeHtml(p.summary || "")}</p>
      <div class="project-meta">
        ${(p.tech || []).slice(0, 4).map(t => `<span class="pill">${escapeHtml(t)}</span>`).join("")}
      </div>
      <div class="project-actions">
        <button class="btn btn-ghost" type="button" data-open="${escapeHtml(p.id)}">Details</button>
        ${p.links?.repo ? `<a class="btn btn-ghost" href="${p.links.repo}" target="_blank" rel="noreferrer">Repo</a>` : ""}
        ${p.links?.demo ? `<a class="btn btn-ghost" href="${p.links.demo}" target="_blank" rel="noreferrer">Demo</a>` : ""}
      </div>
    `;
    projectGrid.appendChild(card);
  });

  $$('button[data-open]').forEach((btn) => {
    btn.addEventListener("click", () => openProject(btn.dataset.open));
  });
}

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    activeFilter = btn.dataset.filter || "all";
    renderProjects();
  });
});

projectSearch?.addEventListener("input", () => {
  activeQuery = projectSearch.value.trim();
  renderProjects();
});

/* ---------- Modal ---------- */
const modal = $("#projectModal");
const modalClose = $("#modalClose");

function openProject(id) {
  const p = PROJECTS.find(x => x.id === id);
  if (!p || !modal) return;

  $("#modalTitle").textContent = p.title;
  $("#modalSubtitle").textContent = p.subtitle || "";
  $("#modalWhat").textContent = p.what || "";

  const impact = $("#modalImpact");
  impact.innerHTML = "";
  (p.impact || []).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    impact.appendChild(li);
  });

  const tech = $("#modalTech");
  tech.innerHTML = "";
  (p.tech || []).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    tech.appendChild(li);
  });

  const links = $("#modalLinks");
  links.innerHTML = "";
  const linkDefs = [
    ["Repo", p.links?.repo],
    ["Demo", p.links?.demo],
    ["Write-up", p.links?.writeup]
  ].filter(([, url]) => url);

  linkDefs.forEach(([label, url]) => {
    const a = document.createElement("a");
    a.className = "btn btn-ghost";
    a.href = url;
    a.target = url.startsWith("http") ? "_blank" : "_self";
    a.rel = "noreferrer";
    a.textContent = label;
    links.appendChild(a);
  });

  modal.showModal();
}

modalClose?.addEventListener("click", () => modal?.close());
modal?.addEventListener("click", (e) => {
  const rect = modal.getBoundingClientRect();
  const inDialog =
    e.clientX >= rect.left && e.clientX <= rect.right &&
    e.clientY >= rect.top && e.clientY <= rect.bottom;
  if (!inDialog) modal.close();
});

/* ---------- Active section highlight ---------- */
const sections = ["about", "skills", "projects", "experience", "education", "contact"]
  .map(id => document.getElementById(id))
  .filter(Boolean);

const navLinks = new Map($$(".nav-link").map(a => [a.getAttribute("href")?.slice(1), a]));

const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const id = entry.target.id;
    navLinks.forEach((link, key) => link.classList.toggle("is-active", key === id));
  });
}, { rootMargin: "-30% 0px -60% 0px", threshold: 0.01 });

sections.forEach(sec => io.observe(sec));

/* ---------- Contact form (mailto) ---------- */
const contactForm = $("#contactForm");
const formStatus = $("#formStatus");

contactForm?.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = $("#name").value.trim();
  const email = $("#email").value.trim();
  const message = $("#message").value.trim();

  if (!name || !email || !message) return;

  const to = "milesprovus@gmail.com";
  const subject = `Portfolio inquiry from ${name}`;
  const body = [
    `Name: ${name}`,
    `Email: ${email}`,
    ``,
    message
  ].join("\n");

  const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;

  if (formStatus) {
    formStatus.textContent = "Opened your email client.";
    setTimeout(() => (formStatus.textContent = ""), 2000);
  }

  contactForm.reset();
});

/* ---------- Init ---------- */
renderProjects();
