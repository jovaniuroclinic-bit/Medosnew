export type VaultMetadata={referenceId:string;provider:string;status:string;expiresAtUtc?:string};
export interface VaultAdapter{createReference(provider:string):Promise<string>;resolveForServerUse(referenceId:string):Promise<unknown>;rotateReference(referenceId:string):Promise<string>;revokeReference(referenceId:string):Promise<void>;metadata(referenceId:string):Promise<VaultMetadata>;healthCheck():Promise<boolean>}
export class UnavailableVault implements VaultAdapter{
 private fail():never{throw new Error("VAULT_UNAVAILABLE")}
 async createReference():Promise<string>{return this.fail()} async resolveForServerUse():Promise<unknown>{return this.fail()}
 async rotateReference():Promise<string>{return this.fail()} async revokeReference():Promise<void>{this.fail()}
 async metadata():Promise<VaultMetadata>{return this.fail()} async healthCheck(){return false}
}
