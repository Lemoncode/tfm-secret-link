import { checkHealth, type HealthState } from "./health.ts";

const TEXT: Record<HealthState, string> = {
  up: "Servidor operativo",
  down: "Servidor no disponible",
};

const element = document.getElementById("health");

if (element) {
  void checkHealth(() => fetch("/api/health")).then((state) => {
    element.textContent = TEXT[state];
    element.dataset["state"] = state;
  });
}
