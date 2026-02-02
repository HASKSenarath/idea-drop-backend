import { SignJWT } from "jose";
import JWT_SECRET from "./getJwtSecret.js";

/**
 * Generates a JWT token for a given user ID.
 * @param {Object} payload - The payload to include in the token.
 * @param {string} expiresIn - expiration time of the token.
 */

export const generateToken = async (payload, expiresIn = "15m") => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
};
