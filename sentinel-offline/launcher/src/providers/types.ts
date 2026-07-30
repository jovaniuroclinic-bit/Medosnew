export type ConnectionState="UNCONFIGURED"|"CONFIGURED"|"AUTHORIZATION_REQUIRED"|"CONNECTING"|"CONNECTED"|"DEGRADED"|"EXPIRED"|"REVOKED"|"ERROR"|"LOCKED";
export type Provider={id:string;name:string;services:string[];oauth:boolean;requiredConfiguration:string[];defaultScopes:string[]};
export type PublicConnection={provider:string;state:ConnectionState;alias?:string;requestedScopes:string[];grantedScopes:string[];lastValidatedAtUtc?:string;expiresAtUtc?:string;actions:string[]};
