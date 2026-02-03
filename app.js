// PIN is a UX privacy boundary, not a cryptographic security guarantee.
// --- CORE ENGINE ---
const STORE_KEY = "oakwood_parentops_v2_2";
const INACTIVITY_LIMIT_MS = 5 * 60 * 1000;
const PIN_LOCKOUT_MS = 30 * 1000;
const ENABLE_CLOUD = false;

const StorageAdapter = {
  save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  load(key) {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  },
  export() {
    return JSON.stringify(localStorage);
  },
  import(payload) {
    const data = JSON.parse(payload);
    Object.keys(data).forEach((key) => localStorage.setItem(key, data[key]));
  },
};

const CloudAdapter = {
  sync() {
    if (!ENABLE_CLOUD) return;
  },
  pull() {
    if (!ENABLE_CLOUD) return null;
    return null;
  },
  push() {
    if (!ENABLE_CLOUD) return;
  },
};

const formatISOToUK = (iso) => {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
};

const createPRNG = (seed) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const seededId = (rand, prefix) => `${prefix}-${Math.floor(rand() * 1e9).toString(36)}`;

const createSeedData = () => {
  const rand = createPRNG("oakwood-v2.2");
  const baseDate = new Date("2025-02-01T00:00:00Z");
  const makeDate = (offsetDays) => {
    const date = new Date(baseDate);
    date.setUTCDate(date.getUTCDate() + offsetDays);
    return date.toISOString().slice(0, 10);
  };

  const children = [
    { id: seededId(rand, "child"), name: "Amelia", yearGroup: "Year Group 5" },
    { id: seededId(rand, "child"), name: "Oliver", yearGroup: "Year Group 7" },
  ];

  const subjectData = [
    { subject: "Maths", scores: [62, 58, 54, 49, 46, 42] },
    { subject: "English", scores: [68, 71, 74, 78, 82, 86] },
    { subject: "Science", scores: [88, 84, 79, 74, 72, 69] },
  ];

  const assessments = subjectData.map((entry) => ({
    id: seededId(rand, "assessment"),
    childId: children[0].id,
    subject: entry.subject,
    scores: entry.scores,
    dates: entry.scores.map((_, index) => makeDate(-120 + index * 20)),
  }));

  const homework = [
    {
      id: seededId(rand, "hw"),
      childId: children[0].id,
      title: "Fractions practice worksheet",
      subject: "Maths",
      dueDate: makeDate(6),
      status: "pending",
    },
    {
      id: seededId(rand, "hw"),
      childId: children[0].id,
      title: "Creative writing paragraph",
      subject: "English",
      dueDate: makeDate(9),
      status: "pending",
    },
    {
      id: seededId(rand, "hw"),
      childId: children[0].id,
      title: "Science experiment summary",
      subject: "Science",
      dueDate: makeDate(13),
      status: "pending",
    },
    {
      id: seededId(rand, "hw"),
      childId: children[0].id,
      title: "Times table recap",
      subject: "Maths",
      dueDate: makeDate(2),
      status: "done",
    },
    {
      id: seededId(rand, "hw"),
      childId: children[0].id,
      title: "Vocabulary quiz prep",
      subject: "English",
      dueDate: makeDate(1),
      status: "done",
    },
  ];

  return {
    auth: {
      loggedIn: true,
      registered: true,
    },
    children,
    activeChild: children[0].id,
    assessments,
    homework,
    pin: {
      hash: null,
      enabled: false,
    },
    ui: {
      parentMode: false,
      pinFailures: 0,
      pinLockedUntil: null,
      lastActive: Date.now(),
    },
    __meta: {
      seedVersion: "v2.2",
    },
  };
};

const ensureSeed = () => {
  const data = StorageAdapter.load(STORE_KEY);
  if (!data || data.__meta?.seedVersion !== "v2.2") {
    StorageAdapter.save(STORE_KEY, createSeedData());
  }
};

const getState = () => StorageAdapter.load(STORE_KEY);

const updateState = (updater) => {
  const current = getState();
  const next = typeof updater === "function" ? updater(current) : updater;
  StorageAdapter.save(STORE_KEY, next);
  return next;
};

const calculateTrend = (current, previous) => {
  if (current > previous) return "Up";
  if (current < previous) return "Down";
  return "Stable";
};

const needsFocusAlgo = (scores) => {
  if (scores.length < 2) return false;
  const lastTwo = scores.slice(-2);
  if (lastTwo.every((score) => score < 50)) return true;
  if (scores.length >= 3) {
    const lastThree = scores.slice(-3);
    return lastThree[0] > lastThree[1] && lastThree[1] > lastThree[2];
  }
  return false;
};

const trafficLight = (score) => {
  if (score >= 80) return "green";
  if (score >= 50) return "amber";
  return "red";
};

const trafficLightColor = (score) => {
  const level = trafficLight(score);
  if (level === "green") return "var(--success)";
  if (level === "amber") return "var(--warning)";
  return "var(--danger)";
};

const setPinHash = async (pin) => {
  const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

const router = {
  routes: {},
  guards: [],
  add(path, config) {
    this.routes[path] = config;
  },
  use(guardFn) {
    this.guards.push(guardFn);
  },
  async navigate() {
    const hash = window.location.hash || "#/child/dashboard";
    const path = hash.replace("#", "");
    const route = this.routes[path] || this.routes["/child/dashboard"];
    for (const guard of this.guards) {
      const ok = await guard(path, route);
      if (!ok) return;
    }
    render(route.render());
    highlightTab(path);
  },
};

const guardAuth = async (path) => {
  const state = getState();
  if (!state.auth.loggedIn && !["/login", "/register"].includes(path)) {
    window.location.hash = "#/login";
    return false;
  }
  if (state.auth.loggedIn && ["/login", "/register"].includes(path)) {
    window.location.hash = "#/child/dashboard";
    return false;
  }
  return true;
};

const guardChildSelected = async (path) => {
  if (["/login", "/register", "/children/select"].includes(path)) return true;
  const state = getState();
  if (!state.activeChild) {
    window.location.hash = "#/children/select";
    return false;
  }
  return true;
};

const guardPinAndInactivity = async (path, route) => {
  const state = getState();
  const now = Date.now();
  if (state.ui.parentMode && now - state.ui.lastActive > INACTIVITY_LIMIT_MS) {
    exitParentMode();
  }
  if (!route?.requiresParent) return true;
  if (!state.pin.enabled) return true;
  if (state.ui.parentMode) return true;
  showPinModal("unlock");
  return false;
};

const highlightTab = (path) => {
  const routeKey = path.replace("/", "");
  document.querySelectorAll(".tab").forEach((tab) => {
    const isActive = tab.dataset.route === routeKey;
    tab.classList.toggle("active", isActive);
    if (isActive) {
      tab.setAttribute("aria-current", "page");
    } else {
      tab.removeAttribute("aria-current");
    }
  });
};

const render = (viewNode) => {
  const view = document.getElementById("view");
  view.replaceChildren(viewNode);
};

const el = (tag, { className, text, attrs, children } = {}) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  if (attrs) {
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  }
  if (children) {
    children.forEach((child) => node.appendChild(child));
  }
  return node;
};

const renderLogin = () => {
  const container = document.createDocumentFragment();
  container.append(
    el("section", {
      className: "card",
      children: [
        el("h2", { text: "Welcome back" }),
        el("p", { className: "muted", text: "Log in to access your family dashboard." }),
        el("button", {
          className: "primary-btn",
          text: "Continue",
          attrs: { "data-action": "login" },
        }),
      ],
    })
  );
  return container;
};

const renderRegister = () => {
  const container = document.createDocumentFragment();
  container.append(
    el("section", {
      className: "card",
      children: [
        el("h2", { text: "Create your account" }),
        el("p", { className: "muted", text: "Start tracking progress for your children." }),
        el("button", {
          className: "primary-btn",
          text: "Register",
          attrs: { "data-action": "register" },
        }),
      ],
    })
  );
  return container;
};

const renderChildSelect = () => {
  const state = getState();
  const list = el("div", { className: "list" });
  state.children.forEach((child) => {
    list.append(
      el("div", {
        className: "list-item",
        children: [
          el("div", {
            className: "meta",
            children: [
              el("div", { text: child.name }),
              el("div", { className: "muted", text: child.yearGroup }),
            ],
          }),
          el("button", {
            className: "action-btn",
            text: "Select",
            attrs: { "data-action": "select-child", "data-id": child.id },
          }),
        ],
      })
    );
  });

  const container = document.createDocumentFragment();
  container.append(
    el("section", {
      className: "card",
      children: [
        el("h2", { text: "Select child" }),
        el("p", { className: "muted", text: "Choose a child to view their dashboard." }),
      ],
    }),
    el("section", { className: "card", children: [list] })
  );
  return container;
};

const renderChildDashboard = () => {
  const state = getState();
  const child = state.children.find((item) => item.id === state.activeChild);
  const focusSubject = state.assessments.find((item) => needsFocusAlgo(item.scores));
  const latestScores = state.assessments.map((item) => {
    const last = item.scores[item.scores.length - 1];
    const prev = item.scores[item.scores.length - 2] ?? last;
    return { subject: item.subject, score: last, trend: calculateTrend(last, prev) };
  });

  const container = document.createDocumentFragment();
  container.append(
    el("section", {
      className: "card",
      children: [
        el("h2", { text: `Welcome back, ${child.name}` }),
        el("p", { className: "muted", text: `${child.yearGroup} · UK Curriculum` }),
        el("div", { className: "progress-bar", children: [el("span", { attrs: { style: "width: 82%" } })] }),
        el("p", { className: "muted", text: "Overall proficiency: 82%" }),
      ],
    })
  );

  if (focusSubject) {
    container.append(
      el("section", {
        className: "needs-focus",
        attrs: { role: "status", "aria-live": "polite" },
        children: [
          el("div", { className: "icon", text: "⚠️" }),
          el("div", {
            children: [
              el("strong", { text: `Needs Focus: ${focusSubject.subject}` }),
              el("p", { className: "muted", text: "Recent scores show a downward trend." }),
            ],
          }),
        ],
      })
    );
  }

  const list = el("div", { className: "list" });
  latestScores.forEach((item) => {
    list.append(
      el("div", {
        className: "list-item",
        children: [
          el("div", {
            className: "meta",
            children: [
              el("div", { text: item.subject }),
              el("div", { className: "muted", text: `Trend: ${item.trend}` }),
            ],
          }),
          el("div", {
            className: "score-light",
            children: [
              el("span", { attrs: { style: `background:${trafficLightColor(item.score)}` } }),
              el("span", { text: `${item.score}%` }),
            ],
          }),
        ],
      })
    );
  });

  container.append(
    el("section", {
      className: "card",
      children: [el("div", { className: "section-title", text: "Latest Scores" }), list],
    })
  );

  container.append(
    el("section", {
      className: "card",
      children: [
        el("div", { className: "section-title", text: "Parent Mode" }),
        el("p", {
          className: "muted",
          text: state.pin.enabled
            ? "Use Parent Mode to update privacy settings and analytics."
            : "Set a PIN to enable Parent Mode and privacy controls.",
        }),
        el("button", {
          className: "primary-btn",
          text: state.pin.enabled ? "Enter Parent Mode" : "Set up Parent PIN",
          attrs: { "data-action": state.pin.enabled ? "enter-parent" : "set-pin" },
        }),
      ],
    })
  );

  return container;
};

const renderParentDashboard = () => {
  const state = getState();
  const child = state.children.find((item) => item.id === state.activeChild);
  const container = document.createDocumentFragment();
  container.append(
    el("section", {
      className: "card",
      children: [
        el("h2", { text: "Parent Dashboard" }),
        el("p", { className: "muted", text: `${child.name} · ${child.yearGroup}` }),
        el("div", { className: "progress-bar", children: [el("span", { attrs: { style: "width: 86%" } })] }),
        el("p", { className: "muted", text: "Family engagement score: 86%" }),
        el("button", {
          className: "action-btn",
          text: "Exit Parent Mode",
          attrs: { "data-action": "exit-parent" },
        }),
      ],
    })
  );
  return container;
};

const renderHomework = () => {
  const state = getState();
  const pending = state.homework.filter((item) => item.status === "pending");
  const done = state.homework.filter((item) => item.status === "done");

  const pendingList = el("div", { className: "list" });
  pending.forEach((item) => {
    pendingList.append(
      el("div", {
        className: "list-item",
        children: [
          el("div", {
            className: "meta",
            children: [
              el("div", { text: item.title }),
              el("div", { className: "muted", text: `${item.subject} · Due ${formatISOToUK(item.dueDate)}` }),
            ],
          }),
          el("button", {
            className: "checkbox-btn",
            attrs: { "data-action": "toggle-homework", "data-id": item.id, "aria-label": "Mark complete" },
          }),
        ],
      })
    );
  });

  const doneList = el("div", { className: "list" });
  done.forEach((item) => {
    const btn = el("button", {
      className: "checkbox-btn checked",
      attrs: { "data-action": "toggle-homework", "data-id": item.id, "aria-label": "Mark incomplete" },
    });
    doneList.append(
      el("div", {
        className: "list-item",
        children: [
          el("div", {
            className: "meta",
            children: [
              el("div", { text: item.title }),
              el("div", { className: "muted", text: `${item.subject} · Completed ${formatISOToUK(item.dueDate)}` }),
            ],
          }),
          btn,
        ],
      })
    );
  });

  const container = document.createDocumentFragment();
  container.append(
    el("section", {
      className: "card",
      children: [
        el("h2", { text: "Homework" }),
        el("p", { className: "muted", text: `${pending.length} pending · ${done.length} completed` }),
      ],
    }),
    el("section", {
      className: "card",
      children: [el("div", { className: "section-title", text: "Pending" }), pendingList],
    }),
    el("section", {
      className: "card",
      children: [el("div", { className: "section-title", text: "Completed" }), doneList],
    })
  );
  return container;
};

const createLineChart = (scores) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 120 60");
  svg.setAttribute("class", "chart");
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const range = Math.max(max - min, 1);
  const points = scores
    .map((score, index) => {
      const x = (index / (scores.length - 1)) * 120;
      const y = 60 - ((score - min) / range) * 50 - 5;
      return `${x},${y}`;
    })
    .join(" ");

  const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  polyline.setAttribute("fill", "none");
  polyline.setAttribute("stroke", "#ff7a1a");
  polyline.setAttribute("stroke-width", "3");
  polyline.setAttribute("points", points);
  svg.appendChild(polyline);
  return svg;
};

const renderAnalytics = () => {
  const state = getState();
  const container = document.createDocumentFragment();
  container.append(
    el("section", {
      className: "card",
      children: [
        el("h2", { text: "Analytics" }),
        el("p", { className: "muted", text: "Subject performance and trends" }),
      ],
    })
  );

  const grid = el("section", { className: "grid-2" });
  state.assessments.forEach((item) => {
    const latest = item.scores[item.scores.length - 1];
    const trend = calculateTrend(latest, item.scores[item.scores.length - 2] ?? latest);
    const card = el("div", {
      className: "card",
      children: [
        el("div", { className: "pill", text: trend }),
        el("h2", { text: item.subject }),
        el("p", { className: "muted", text: `Latest score: ${latest}%` }),
      ],
    });
    card.appendChild(createLineChart(item.scores));
    grid.appendChild(card);
  });
  container.append(grid);
  return container;
};

const renderSettings = () => {
  const state = getState();
  const child = state.children.find((item) => item.id === state.activeChild);
  const container = document.createDocumentFragment();
  container.append(
    el("section", {
      className: "card",
      children: [
        el("h2", { text: "Settings" }),
        el("p", { className: "muted", text: "Manage privacy, PIN, and child profiles." }),
      ],
    }),
    el("section", {
      className: "card",
      children: [
        el("div", { className: "section-title", text: "Child Profile" }),
        el("div", {
          className: "list-item",
          children: [
            el("div", {
              className: "meta",
              children: [el("div", { text: child.name }), el("div", { className: "muted", text: child.yearGroup })],
            }),
            el("span", { className: "chip", text: "Active" }),
          ],
        }),
      ],
    }),
    el("section", {
      className: "card",
      children: [
        el("div", { className: "section-title", text: "PIN" }),
        el("p", {
          className: "muted",
          text: state.pin.enabled
            ? "Update or remove your 4-digit PIN."
            : "Enable a 4-digit PIN to lock Parent Mode after inactivity.",
        }),
        el("button", {
          className: "primary-btn",
          text: state.pin.enabled ? "Update PIN" : "Set PIN",
          attrs: { "data-action": "set-pin" },
        }),
      ],
    })
  );
  return container;
};

// --- PARENTING DOMAIN ---
const addHomework = (item) => {
  updateState((state) => ({
    ...state,
    homework: [...state.homework, item],
  }));
};

const toggleHomeworkStatus = (id) => {
  updateState((state) => ({
    ...state,
    homework: state.homework.map((item) =>
      item.id === id
        ? { ...item, status: item.status === "pending" ? "done" : "pending" }
        : item
    ),
  }));
};

const recordAssessment = (assessmentId, score) => {
  updateState((state) => ({
    ...state,
    assessments: state.assessments.map((item) =>
      item.id === assessmentId
        ? { ...item, scores: [...item.scores, score] }
        : item
    ),
  }));
};

const selectChild = (childId) => {
  updateState((state) => ({
    ...state,
    activeChild: childId,
  }));
};

const enterParentMode = () => {
  updateState((state) => ({
    ...state,
    ui: { ...state.ui, parentMode: true, lastActive: Date.now() },
  }));
};

const exitParentMode = () => {
  updateState((state) => ({
    ...state,
    ui: { ...state.ui, parentMode: false },
  }));
};

let pinMode = "unlock";

const showPinModal = (mode) => {
  pinMode = mode;
  const modal = document.getElementById("pin-modal");
  const title = document.getElementById("pin-title");
  const status = document.getElementById("pin-status");
  title.textContent = mode === "set" ? "Set PIN" : "Enter PIN";
  status.textContent = "";
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
};

const hidePinModal = () => {
  const modal = document.getElementById("pin-modal");
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
};

const handlePinSubmit = async () => {
  const pinInput = document.getElementById("pin-input");
  const status = document.getElementById("pin-status");
  const state = getState();
  const now = Date.now();

  if (state.ui.pinLockedUntil && now < state.ui.pinLockedUntil) {
    const remaining = Math.ceil((state.ui.pinLockedUntil - now) / 1000);
    status.textContent = `Locked. Try again in ${remaining}s.`;
    return;
  }

  if (!pinInput.value || pinInput.value.length !== 4) {
    status.textContent = "Enter a 4-digit PIN.";
    return;
  }

  if (pinMode === "set") {
    const hash = await setPinHash(pinInput.value);
    updateState((prev) => ({
      ...prev,
      pin: { hash, enabled: true },
      ui: { ...prev.ui, pinFailures: 0, pinLockedUntil: null },
    }));
    pinInput.value = "";
    hidePinModal();
    enterParentMode();
    router.navigate();
    return;
  }

  const attempt = await setPinHash(pinInput.value);
  if (attempt === state.pin.hash) {
    updateState((prev) => ({
      ...prev,
      ui: { ...prev.ui, parentMode: true, pinFailures: 0, pinLockedUntil: null, lastActive: Date.now() },
    }));
    pinInput.value = "";
    hidePinModal();
    router.navigate();
    return;
  }

  const failures = state.ui.pinFailures + 1;
  const lockedUntil = failures >= 3 ? now + PIN_LOCKOUT_MS : null;
  updateState((prev) => ({
    ...prev,
    ui: { ...prev.ui, pinFailures: failures, pinLockedUntil: lockedUntil },
  }));
  status.textContent = lockedUntil ? "Too many attempts. Try again shortly." : "Incorrect PIN.";
};

const initEvents = () => {
  document.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]");
    if (!action) return;
    const { action: actionName, id } = action.dataset;
    if (actionName === "login" || actionName === "register") {
      updateState((state) => ({
        ...state,
        auth: { ...state.auth, loggedIn: true, registered: true },
      }));
      window.location.hash = "#/child/dashboard";
    }
    if (actionName === "select-child") {
      selectChild(id);
      window.location.hash = "#/child/dashboard";
    }
    if (actionName === "toggle-homework") {
      toggleHomeworkStatus(id);
      router.navigate();
    }
    if (actionName === "enter-parent") {
      if (getState().pin.enabled) {
        showPinModal("unlock");
      }
    }
    if (actionName === "exit-parent") {
      exitParentMode();
      router.navigate();
    }
    if (actionName === "set-pin") {
      showPinModal("set");
    }
  });

  document.getElementById("pin-submit").addEventListener("click", handlePinSubmit);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && document.getElementById("pin-modal").classList.contains("active")) {
      handlePinSubmit();
    }
  });

  ["click", "keydown", "mousemove", "touchstart"].forEach((eventName) => {
    document.addEventListener(eventName, () => {
      updateState((state) => ({
        ...state,
        ui: { ...state.ui, lastActive: Date.now() },
      }));
    });
  });
};

const initRouter = () => {
  router.add("/login", { render: renderLogin });
  router.add("/register", { render: renderRegister });
  router.add("/children/select", { render: renderChildSelect });
  router.add("/child/dashboard", { render: renderChildDashboard });
  router.add("/parent/dashboard", { render: renderParentDashboard, requiresParent: true });
  router.add("/homework", { render: renderHomework });
  router.add("/analytics", { render: renderAnalytics, requiresParent: true });
  router.add("/settings", { render: renderSettings, requiresParent: true });
  router.use(guardAuth);
  router.use(guardChildSelected);
  router.use(guardPinAndInactivity);
  window.addEventListener("hashchange", () => router.navigate());
  router.navigate();
};

const init = () => {
  ensureSeed();
  initEvents();
  initRouter();
};

init();
