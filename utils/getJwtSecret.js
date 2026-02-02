import dotenv from "dotenv";
dotenv.config();

// Convert the secret key to a Uint8Array
const rawSecret = process.env.JWT_SECRET;
if (!rawSecret) {
  throw new Error("JWT_SECRET is not set in the environment");
}

const JWT_SECRET = new TextEncoder().encode(rawSecret);
export default JWT_SECRET;
