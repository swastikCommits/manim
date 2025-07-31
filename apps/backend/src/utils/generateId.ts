import crypto from "crypto"

export const generateId = () => {
  return `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
};
