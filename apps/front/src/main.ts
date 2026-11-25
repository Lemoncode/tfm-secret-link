// Entry module shared by every page (/, /como-funciona, /s/).
import { hydrateIcons } from "./design-system/icons.ts";
import { defineThemeSwitch } from "./theme-switch.ts";

hydrateIcons(document);
defineThemeSwitch();
