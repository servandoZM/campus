const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };

export const Home = (p) => (
  <svg {...base} {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.6V21h14V9.6" /></svg>
);
export const Compass = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></svg>
);
export const Users = (p) => (
  <svg {...base} {...p}><path d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19" /><circle cx="10" cy="8" r="3.2" /><path d="M20 19v-1.5a3.5 3.5 0 0 0-2.6-3.4M15.5 5.2a3.2 3.2 0 0 1 0 5.6" /></svg>
);
export const User = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="8" r="3.6" /><path d="M5 20v-1a4.5 4.5 0 0 1 4.5-4.5h5A4.5 4.5 0 0 1 19 19v1" /></svg>
);
export const Heart = ({ filled, ...p }) => (
  <svg {...base} {...p} fill={filled ? "currentColor" : "none"} width={18} height={18}>
    <path d="M12 20s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.8C19 15.6 12 20 12 20z" />
  </svg>
);
export const Bubble = (p) => (
  <svg {...base} {...p} width={18} height={18}><path d="M20 12a7 7 0 0 1-7 7H8l-4 2.5V12a7 7 0 0 1 7-7h2a7 7 0 0 1 7 7z" /></svg>
);
export const Trash = (p) => (
  <svg {...base} {...p} width={17} height={17}><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></svg>
);
export const Bell = (p) => (
  <svg {...base} {...p}><path d="M18 9a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" /><path d="M13.7 20a1.9 1.9 0 0 1-3.4 0" /></svg>
);
export const Flag = (p) => (
  <svg {...base} {...p} width={17} height={17}><path d="M5 21V4M5 5h11l-1.6 3.2L16 12H5" /></svg>
);
export const Shield = (p) => (
  <svg {...base} {...p}><path d="M12 3l7 3v5.5c0 4.2-2.9 7.6-7 8.5-4.1-.9-7-4.3-7-8.5V6z" /></svg>
);
