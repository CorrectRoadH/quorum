// The Anatomy light theme, re-inked in the Quorum blueprint palette.
// Paper is the card white, ink is the navy foreground, and the one lit part
// takes the blueprint accent, so every figure sits inside the game's UI.
// The dark theme is the title screen's night shift: Graphite dark surfaces,
// pale linework, and the page's --signal accent for lit parts and traffic.

export const QUORUM_CSS = `
.iso[data-theme="light"]{
  --anatomy-page:#f7f9fc;--anatomy-card:#ffffff;--anatomy-text:#5c6b85;--anatomy-strong:#16233d;--anatomy-muted:#8794ab;
  --anatomy-paper:#ffffff;--anatomy-face:#ffffff;--anatomy-top:#ffffff;
  --anatomy-shade-0:#c9d3e3;--anatomy-shade-1:#d7dfec;--anatomy-shade-2:#e4eaf4;--anatomy-shade-3:#f0f4fa;
  --anatomy-lit-top:#e6eefd;--anatomy-lit-shade:#c8d8f7;
  --anatomy-hi:#16233d;--anatomy-mid:#6a7892;--anatomy-lo:#9ba8bf;--anatomy-faint:#cad3e2;--anatomy-lit:#4f7fe0;
  --anatomy-halo:#5c6b85;--anatomy-halo-opacity:.28;--anatomy-dot:#26365a;
  --anatomy-red:#c72e2b;--anatomy-green:#1a8a51;--anatomy-blue:#4f7fe0;
  --anatomy-mono:"JetBrains Mono",ui-monospace,Menlo,monospace;
}
.iso[data-theme="dark"]{
  --anatomy-page:#151618;--anatomy-card:#1c1d20;--anatomy-text:#9aa0a9;--anatomy-strong:#e8eaee;--anatomy-muted:#6b717b;
  --anatomy-paper:#1c1d20;--anatomy-face:#25272b;--anatomy-top:#2b2e33;
  --anatomy-shade-0:#151618;--anatomy-shade-1:#191a1d;--anatomy-shade-2:#1d1f22;--anatomy-shade-3:#212327;
  --anatomy-lit-top:#1d3a48;--anatomy-lit-shade:#16303c;
  --anatomy-hi:#c9ced6;--anatomy-mid:#7a818c;--anatomy-lo:#4d525a;--anatomy-faint:#33363c;--anatomy-lit:var(--signal,#5cc3ee);
  --anatomy-halo:#000000;--anatomy-halo-opacity:.6;--anatomy-dot:#e8eaee;
  --anatomy-red:#ff6b6b;--anatomy-green:#6be0a0;--anatomy-blue:var(--signal,#5cc3ee);
  --anatomy-mono:"Geist Mono",ui-monospace,Menlo,monospace;
}
`
