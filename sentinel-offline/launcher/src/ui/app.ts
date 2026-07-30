let csrfToken = "";

type JsonRecord = Record<string, unknown>;

async function createSession(): Promise<void> {
  const response = await fetch("/api/session", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`No fue posible crear la sesion local: HTTP ${response.status}`);
  }

  const body = (await response.json()) as { csrf?: unknown };

  if (typeof body.csrf !== "string" || body.csrf.length < 16) {
    throw new Error("La sesion local no entrego un token CSRF valido.");
  }

  csrfToken = body.csrf;
}

async function requestJson<T extends JsonRecord>(
  path: string,
  options: RequestInit = {},
  retrySession = true,
): Promise<T> {
  const response = await fetch(path, {
    credentials: "same-origin",
    cache: "no-store",
    ...options,
  });

  if (response.status === 401 && retrySession) {
    await createSession();
    return requestJson<T>(path, options, false);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: unknown;
    };

    const message =
      typeof body.error === "string"
        ? body.error
        : `Solicitud rechazada: HTTP ${response.status}`;

    throw new Error(message);
  }

  return (await response.json()) as T;
}

function replaceWithMessage(element: Element, message: string): void {
  element.replaceChildren();
  const paragraph = document.createElement("p");
  paragraph.textContent = message;
  element.append(paragraph);
}

async function initialize(): Promise<void> {
  const vaults = document.querySelector("#vaults");
  const cards = document.querySelector("#cards");
  const status = document.querySelector("#vault-status");

  if (!vaults || !cards) {
    throw new Error("La interfaz local esta incompleta.");
  }

  try {
    await createSession();

    const [providerData, vaultData] = await Promise.all([
      requestJson<{
        providers?: Array<{
          name?: unknown;
          status?: unknown;
          state?: unknown;
          services?: unknown;
        }>;
      }>("/api/providers"),
      requestJson<{
        candidates?: Array<{
          kind?: unknown;
          available?: unknown;
          reason?: unknown;
        }>;
      }>("/api/vaults"),
    ]);

    vaults.replaceChildren();

    const candidates = Array.isArray(vaultData.candidates)
      ? vaultData.candidates
      : [];

    if (candidates.length === 0) {
      replaceWithMessage(vaults, "No se detectaron opciones de boveda.");
    } else {
      for (const candidate of candidates) {
        const kind =
          typeof candidate.kind === "string" ? candidate.kind : "desconocida";
        const available = candidate.available === true;
        const reason =
          typeof candidate.reason === "string"
            ? candidate.reason
            : "Requiere revision local.";

        const button = document.createElement("button");
        button.type = "button";
        button.textContent = `${kind}: ${
          available ? "Disponible; revisar" : "Configuracion requerida"
        }`;

        button.addEventListener("click", () => {
          window.alert(reason);
        });

        vaults.append(button);
      }
    }

    cards.replaceChildren();

    const providers = Array.isArray(providerData.providers)
      ? providerData.providers
      : [];

    for (const provider of providers) {
      const article = document.createElement("article");

      const heading = document.createElement("h2");
      heading.textContent =
        typeof provider.name === "string"
          ? provider.name
          : "Proveedor sin nombre";

      const providerStatus = document.createElement("p");
      providerStatus.textContent =
        typeof provider.status === "string"
          ? provider.status
          : "Configuracion requerida";

      const state = document.createElement("p");
      state.textContent = `Estado: ${
        typeof provider.state === "string"
          ? provider.state
          : "UNCONFIGURED"
      }`;

      const services = document.createElement("p");
      const serviceList = Array.isArray(provider.services)
        ? provider.services.filter(
            (item): item is string => typeof item === "string",
          )
        : [];

      services.textContent = `Servicios: ${serviceList.join(", ")}`;

      const permissions = document.createElement("button");
      permissions.type = "button";
      permissions.textContent = "Ver permisos";

      article.append(
        heading,
        providerStatus,
        state,
        services,
        permissions,
      );

      cards.append(article);
    }

    if (status) {
      status.textContent = "Sesion local activa.";
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Error local no identificado.";

    replaceWithMessage(
      vaults,
      `No se pudieron cargar las bovedas: ${message}`,
    );

    replaceWithMessage(
      cards,
      "No se pudieron cargar los proveedores.",
    );

    if (status) {
      status.textContent = "Sesion local no disponible.";
    }

    console.error("Launcher initialization failed");
  }
}

document.querySelector("#lock")?.addEventListener("click", async () => {
  const firstConfirmation = window.confirm(
    "Se bloquearan las conexiones locales. Deseas continuar?",
  );

  if (!firstConfirmation) {
    return;
  }

  const exactConfirmation = window.prompt(
    "Escribe exactamente ACEPTAR",
  );

  if (exactConfirmation !== "ACEPTAR") {
    return;
  }

  try {
    await requestJson<{ locked?: boolean }>("/api/lock-all", {
      method: "POST",
      headers: {
        "X-CSRF-Token": csrfToken,
      },
    });

    window.location.reload();
  } catch {
    window.alert("No fue posible bloquear las conexiones.");
  }
});

void initialize();
