// The Anatomy light theme, re-inked in the Quorum blueprint palette.
// Paper is the card white, ink is the navy foreground, and the one lit part
// takes the blueprint accent, so every figure sits inside the game's UI.

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
`
