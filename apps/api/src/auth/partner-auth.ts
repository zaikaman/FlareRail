import type { FastifyRequest, FastifyReply } from "fastify";
import { getPrismaClient } from "@flarerail/core";
import { throwReason } from "../middleware/errors.js";
import crypto from "node:crypto";

export interface AuthenticatedPartner {
  organizationId: string;
  credentialId: string;
  environment: string;
  scopes: string[];
}

/**
 * Hash a partner secret with a pepper using SHA-256.
 */
export function hashPartnerSecret(secret: string, pepper: string): string {
  const hash = crypto.createHash("sha256");
  hash.update(secret + pepper);
  return hash.digest("hex");
}

/**
 * Verify a secret against a stored hash using constant-time comparison.
 */
export function verifyPartnerSecret(secret: string, storedHash: string, pepper: string): boolean {
  const computed = hashPartnerSecret(secret, pepper);
  if (computed.length !== storedHash.length) return false;

  // Constant-time comparison
  let result = 0;
  for (let i = 0; i < computed.length; i++) {
    result |= computed.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Authenticate a partner from the Authorization header.
 * Expected format: `Authorization: Bearer <keyId>.<secret>`
 */
export async function authenticatePartner(request: FastifyRequest): Promise<AuthenticatedPartner> {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    throwReason("MISSING_AUTH");
  }

  if (!authHeader!.startsWith("Bearer ")) {
    throwReason("INVALID_AUTH");
  }

  const token = authHeader!.slice(7).trim();

  const dotIndex = token.indexOf(".");
  if (dotIndex === -1 || dotIndex === 0 || dotIndex === token.length - 1) {
    throwReason("INVALID_AUTH");
  }

  const keyId = token.slice(0, dotIndex);
  const secret = token.slice(dotIndex + 1);

  // Look up credential by keyId
  const prisma = getPrismaClient();
  const credential = await prisma.workspaceCredential.findUnique({
    where: { keyId },
  });

  if (!credential) {
    throwReason("INVALID_AUTH");
  }

  if (credential.status === "revoked") {
    throwReason("REVOKED_CREDENTIAL");
  }

  // Verify the secret
  const pepper = request.server.config.PARTNER_API_KEY_PEPPER;
  if (!verifyPartnerSecret(secret, credential.secretHash, pepper)) {
    throwReason("INVALID_AUTH");
  }

  const requestEnv = (request.headers["x-environment"] as string) ?? credential.environment;

  if (requestEnv !== credential.environment) {
    throwReason("CROSS_ENVIRONMENT_ACCESS");
  }

  return {
    organizationId: credential.organizationId,
    credentialId: credential.id,
    environment: credential.environment,
    scopes: Array.isArray(credential.scopes) ? (credential.scopes as string[]) : [],
  };
}

/**
 * Fastify preHandler hook that authenticates the partner.
 */
export async function partnerAuthHook(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const partner = await authenticatePartner(request);
  request.partner = partner;
}
