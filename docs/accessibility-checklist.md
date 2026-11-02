# Accessibility checklist

The M9 exit check ([GDD 17](./gdd/17-scope-and-roadmap.md#milestones)). Items come from
[GDD 15 "Accessibility"](./gdd/15-ui-ux.md) plus the WCAG 2.2 AA items that apply to the panels.
Run it before a release: axe-core on the title screen, the lab with a panel open, and a Challenge,
then the keyboard-only run below.

| Item                            | Check                                                                                                                     | State                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| No serious axe violations       | axe-core (WCAG 2.0/2.1 A and AA, best practices) on the three screens                                                     | Passes                                            |
| Status is not colour alone      | Node cards show a dot, triangle, square, or cross for ok, warn, danger, and down                                          | Passes                                            |
| Text contrast                   | Status text at least 4.5:1 on wells and cards (`--ok`, `--danger` in `styles.css`)                                        | Passes in light; dark not measured by axe         |
| Focus visible                   | Controls show a focus ring; the selected Node has a ring outside its card                                                 | Passes                                            |
| Keyboard reach                  | Arrows select Nodes, Enter enters the Inspector, Esc leaves; panel keys R, T, P, H, G; Space, S, Z, Shift+Z, U, Del, C, M | Partial: placing and linking still need a pointer |
| Hidden content is not focusable | Closed build tray is `inert`                                                                                              | Passes                                            |
| Reduced motion                  | System setting or Settings › Reduce motion: packets hold still, the Bottleneck stops pulsing, panels appear at once       | Passes                                            |
| Sound can be muted              | Settings › Mute sound, or `M`                                                                                             | Passes                                            |
| Text at 150%                    | A text-scale setting for panels and cards                                                                                 | Not built                                         |
| Screen readers                  | A list mirroring the Nodes with status and load                                                                           | Not built                                         |
| Kind shapes                     | A packet shape per request kind                                                                                           | Not built                                         |

Keyboard-only run: from the title, Tab to Continue and press Enter; press an arrow key to select the
first Node, arrows to move, Enter to reach the Inspector, Tab through its controls, Esc to return;
press G to open the Glossary and type in its search; press M and check the setting.
