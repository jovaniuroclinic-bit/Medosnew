export class UnavailableVault {
    fail() { throw new Error("VAULT_UNAVAILABLE"); }
    async createReference() { return this.fail(); }
    async resolveForServerUse() { return this.fail(); }
    async rotateReference() { return this.fail(); }
    async revokeReference() { this.fail(); }
    async metadata() { return this.fail(); }
    async healthCheck() { return false; }
}
