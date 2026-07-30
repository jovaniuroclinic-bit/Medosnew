export const health = (vaultAvailable) => ({ ok: true, bind: "127.0.0.1", vaultAvailable, connectionsEnabled: vaultAvailable });
