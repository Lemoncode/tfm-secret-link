// The handoff's icon set (design-system/secretlink.mjs), as data: each icon is
// the list of SVG elements, with their attributes, drawn in a 24×24 viewBox.
type Shape = readonly [
  tag: "path" | "rect" | "circle",
  attributes: Readonly<Record<string, string>>,
];

export const ICON_SHAPES = {
  lock: [
    ["rect", { x: "5", y: "11", width: "14", height: "10", rx: "2" }],
    ["path", { d: "M8 11V7a4 4 0 0 1 8 0v4" }],
    ["path", { d: "M12 15v2" }],
  ],
  "lock-open": [
    ["rect", { x: "5", y: "11", width: "14", height: "10", rx: "2" }],
    ["path", { d: "M8 11V7a4 4 0 0 1 7.6-1.7" }],
    ["path", { d: "M12 15v2" }],
  ],
  shield: [["path", { d: "M12 3l7 3v5c0 4.6-3 8.3-7 10-4-1.7-7-5.4-7-10V6z" }]],
  "shield-check": [
    ["path", { d: "M12 3l7 3v5c0 4.6-3 8.3-7 10-4-1.7-7-5.4-7-10V6z" }],
    ["path", { d: "M9 12l2 2 4-4" }],
  ],
  "shield-alert": [
    ["path", { d: "M12 3l7 3v5c0 4.6-3 8.3-7 10-4-1.7-7-5.4-7-10V6z" }],
    ["path", { d: "M12 8v4.5" }],
    ["path", { d: "M12 16h.01" }],
  ],
  eye: [
    ["path", { d: "M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" }],
    ["circle", { cx: "12", cy: "12", r: "3" }],
  ],
  "eye-off": [
    [
      "path",
      { d: "M10.6 5.1Q11.3 5 12 5c6 0 9.5 7 9.5 7a16 16 0 0 1-2.7 3.6" },
    ],
    [
      "path",
      { d: "M6.6 6.6C4 8.4 2.5 12 2.5 12S6 19 12 19a9 9 0 0 0 5.2-1.6" },
    ],
    ["path", { d: "M9.9 9.9a3 3 0 0 0 4.2 4.2" }],
    ["path", { d: "M3 3l18 18" }],
  ],
  clock: [
    ["circle", { cx: "12", cy: "12", r: "9" }],
    ["path", { d: "M12 7v5l3 2" }],
  ],
  link: [
    [
      "path",
      { d: "M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" },
    ],
    [
      "path",
      { d: "M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" },
    ],
  ],
  copy: [
    ["rect", { x: "9", y: "9", width: "11", height: "11", rx: "2" }],
    [
      "path",
      {
        d: "M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5",
      },
    ],
  ],
  check: [["path", { d: "M5 12.5l4.5 4.5L19 7.5" }]],
  key: [
    ["circle", { cx: "8", cy: "15", r: "4.5" }],
    ["path", { d: "M11.2 11.8L20 3" }],
    ["path", { d: "M16.5 6.5l2.5 2.5" }],
    ["path", { d: "M14.5 8.5l2 2" }],
  ],
  "server-off": [
    ["path", { d: "M7 3h12a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-4" }],
    ["path", { d: "M3 5v3a2 2 0 0 0 2 2h4" }],
    ["path", { d: "M5 14h4m6 0h4a2 2 0 0 1 2 2v1" }],
    ["path", { d: "M3 16v3a2 2 0 0 0 2 2h12" }],
    ["path", { d: "M3 3l18 18" }],
  ],
  user: [
    ["circle", { cx: "12", cy: "8", r: "4" }],
    ["path", { d: "M4.5 20.5a7.5 7.5 0 0 1 15 0" }],
  ],
  users: [
    ["circle", { cx: "9", cy: "8", r: "3.5" }],
    ["path", { d: "M2.5 20a6.5 6.5 0 0 1 13 0" }],
    ["path", { d: "M15.5 4.6a3.5 3.5 0 0 1 0 6.8" }],
    ["path", { d: "M18 14.3a6.5 6.5 0 0 1 3.5 5.7" }],
  ],
  send: [
    ["path", { d: "M21 3L10.5 13.5" }],
    ["path", { d: "M21 3l-6.5 18-4-7.5L3 9.5z" }],
  ],
  file: [
    [
      "path",
      { d: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" },
    ],
    ["path", { d: "M14 3v5h5" }],
  ],
  "file-text": [
    [
      "path",
      { d: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" },
    ],
    ["path", { d: "M14 3v5h5" }],
    ["path", { d: "M9 13h6M9 17h4" }],
  ],
  upload: [
    ["path", { d: "M12 15V4" }],
    ["path", { d: "M7 9l5-5 5 5" }],
    ["path", { d: "M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" }],
  ],
  download: [
    ["path", { d: "M12 4v11" }],
    ["path", { d: "M7 10l5 5 5-5" }],
    ["path", { d: "M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" }],
  ],
  info: [
    ["circle", { cx: "12", cy: "12", r: "9" }],
    ["path", { d: "M12 11v5" }],
    ["path", { d: "M12 7.5h.01" }],
  ],
  "alert-circle": [
    ["circle", { cx: "12", cy: "12", r: "9" }],
    ["path", { d: "M12 7.5v5.5" }],
    ["path", { d: "M12 16.5h.01" }],
  ],
  "alert-triangle": [
    [
      "path",
      {
        d: "M10.3 4.2L2.7 17.5a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z",
      },
    ],
    ["path", { d: "M12 9.5v4" }],
    ["path", { d: "M12 17h.01" }],
  ],
  trash: [
    ["path", { d: "M4 7h16" }],
    ["path", { d: "M10 11v6M14 11v6" }],
    ["path", { d: "M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" }],
    ["path", { d: "M9 7V4h6v3" }],
  ],
  x: [["path", { d: "M6 6l12 12M18 6L6 18" }]],
  "arrow-right": [
    ["path", { d: "M5 12h14" }],
    ["path", { d: "M13 6l6 6-6 6" }],
  ],
  chip: [
    ["rect", { x: "6", y: "6", width: "12", height: "12", rx: "2" }],
    ["rect", { x: "9.5", y: "9.5", width: "5", height: "5", rx: "1" }],
    [
      "path",
      {
        d: "M9 2.5V6M15 2.5V6M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5",
      },
    ],
  ],
  maximize: [
    ["path", { d: "M15 3h6v6" }],
    ["path", { d: "M9 21H3v-6" }],
    ["path", { d: "M21 3l-7 7" }],
    ["path", { d: "M3 21l7-7" }],
  ],
  refresh: [
    ["path", { d: "M20 11a8 8 0 0 0-14.3-4.9L4 8" }],
    ["path", { d: "M4 3.5V8h4.5" }],
    ["path", { d: "M4 13a8 8 0 0 0 14.3 4.9L20 16" }],
    ["path", { d: "M20 20.5V16h-4.5" }],
  ],
  "help-circle": [
    ["circle", { cx: "12", cy: "12", r: "9" }],
    ["path", { d: "M9.5 9.3a2.6 2.6 0 0 1 5 .9c0 1.8-2.5 2.3-2.5 4" }],
    ["path", { d: "M12 17h.01" }],
  ],
  sun: [
    ["circle", { cx: "12", cy: "12", r: "4" }],
    [
      "path",
      {
        d: "M12 2.5v2M12 19.5v2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M2.5 12h2M19.5 12h2M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4",
      },
    ],
  ],
  moon: [
    [
      "path",
      { d: "M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a6.8 6.8 0 0 0 10.7 10.7z" },
    ],
  ],
  monitor: [
    ["rect", { x: "3", y: "4", width: "18", height: "12", rx: "2" }],
    ["path", { d: "M8 20h8" }],
    ["path", { d: "M12 16v4" }],
  ],
} as const satisfies Record<string, readonly Shape[]>;
