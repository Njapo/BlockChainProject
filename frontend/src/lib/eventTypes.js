// Event types. Under the hood every event is "pick one option index"; the type
// only controls how options are entered, labeled, and displayed.

export const MAX_OPTIONS = 16;

export const EVENT_TYPES = {
  yesno: {
    key: "yesno",
    name: "Yes / No",
    icon: "✓✗",
    desc: "A simple approve or reject vote.",
    fixedOptions: ["Yes", "No"],
    inputKind: null, // no editor; options are fixed
    addLabel: "",
    placeholder: "",
  },
  choice: {
    key: "choice",
    name: "Multiple choice",
    icon: "≣",
    desc: "Vote for one of several named choices (candidates, proposals…).",
    fixedOptions: null,
    inputKind: "text",
    addLabel: "Add choice",
    placeholder: "e.g. Alice",
  },
  date: {
    key: "date",
    name: "Pick a date",
    icon: "📅",
    desc: "Choose between candidate dates.",
    fixedOptions: null,
    inputKind: "date",
    addLabel: "Add date",
    placeholder: "",
  },
  amount: {
    key: "amount",
    name: "Pick an amount",
    icon: "$",
    desc: "Choose between candidate amounts or budgets.",
    fixedOptions: null,
    inputKind: "number",
    addLabel: "Add amount",
    placeholder: "e.g. 1000",
  },
};

export const EVENT_TYPE_LIST = Object.values(EVENT_TYPES);

// Per-event color palette (assigned round-robin by creation order).
export const EVENT_COLORS = [
  "#7c5cff",
  "#2fbf71",
  "#ff8a3d",
  "#3da5ff",
  "#ff5d8f",
  "#f2b705",
  "#15c1c8",
  "#b06bff",
];

export function colorForIndex(i) {
  return EVENT_COLORS[i % EVENT_COLORS.length];
}

// Formats a stored option label for display (e.g. amounts get a $ prefix).
export function formatOptionLabel(type, label) {
  if (type === "amount") {
    const n = Number(label);
    return Number.isFinite(n) ? `$${n.toLocaleString()}` : label;
  }
  return label;
}
