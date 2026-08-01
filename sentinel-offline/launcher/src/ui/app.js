type Provider = {
  name: string;
  status: string;
  state: string;
  services: string[];
};

type VaultCandidate = {
  kind: string;
  available: boolean;
  reason: string;
};

type SessionResponse = {
  csrf: string;
};

const requireElement = <T extends Element>(
  selector: string,
): T => {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Elemento requerido ausente: ${selector}`);
  }

  return element;
};

const fetchJson = async <T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(input, {
    credentials: "same-origin",
    cache: "no-store",
    ...init,
  });

  if (!response.ok) {
    throw new Error(
      `Solicitud fallida: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<T>;
};

const session = await fetchJson<SessionResponse>(
  "/api/session",
  { method: "POST" },
);

const providerData = await fetchJson<{
  providers: Provider[];
}>("/api/providers");

const vaultData = await fetchJson<{
  candidates: VaultCandidate[];
}>("/api/vaults");

const vaults = requireElement<HTMLElement>("#vaults");
const cards = requireElement<HTMLElement>("#cards");
const lockButton = requireElement<HTMLButtonElement>("#lock");

for (const vault of vaultData.candidates) {
  const button = document.createElement("button");

  button.type = "button";
  button.textContent =
    `${vault.kind}: ${
      vault.available
        ? "Disponible; revisar"
        : "Configuración requerida"
    }`;

  button.addEventListener("click", () => {
    window.alert(vault.reason);
  });

  vaults.append(button);
}

for (const provider of providerData.providers) {
  const article = document.createElement("article");
  const title = document.createElement("h2");
  const status = document.createElement("p");
  const state = document.createElement("p");
  const services = document.createElement("p");
  const permissions = document.createElement("button");

  title.textContent = provider.name;
  status.textContent = provider.status;
  state.textContent = `Estado: ${provider.state}`;
  services.textContent =
    `Servicios: ${provider.services.join(", ")}`;

  permissions.type = "button";
  permissions.textContent = "Ver permisos";

  article.append(
    title,
    status,
    state,
    services,
    permissions,
  );

  cards.append(article);
}

lockButton.addEventListener("click", async () => {
  const firstConfirmation = window.confirm(
    "Esta acción bloqueará todas las conexiones. ¿Continuar?",
  );

  if (!firstConfirmation) {
    return;
  }

  const phrase = window.prompt(
    "Escriba exactamente ACEPTAR para confirmar.",
  );

  if (phrase !== "ACEPTAR") {
    window.alert("Operación cancelada.");
    return;
  }

  lockButton.disabled = true;

  try {
    await fetchJson("/api/lock-all", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": session.csrf,
      },
      body: JSON.stringify({
        confirmation: "ACEPTAR",
      }),
    });

    window.location.reload();
  } catch (error) {
    lockButton.disabled = false;

    window.alert(
      error instanceof Error
        ? error.message
        : "No fue posible bloquear las conexiones.",
    );
  }
});

export {};
