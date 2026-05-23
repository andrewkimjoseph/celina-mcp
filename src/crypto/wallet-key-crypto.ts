import {
  createPrivateKey,
  createPublicKey,
  privateDecrypt,
  publicEncrypt,
  type KeyObject,
} from "node:crypto";

const RSA_OAEP = {
  oaepHash: "sha256" as const,
  padding: 4, // RSA_PKCS1_OAEP_PADDING
};

const PRIVATE_KEY_PATTERN = /^0x[0-9a-fA-F]{64}$/;

let cachedPrivateKey: KeyObject | undefined;

function loadPrivateKey(): KeyObject {
  if (cachedPrivateKey) {
    return cachedPrivateKey;
  }

  const pem = process.env.WALLET_ENCRYPTION_PRIVATE_KEY;
  if (!pem) {
    throw new Error(
      "Wallet encryption is not configured. Set WALLET_ENCRYPTION_PRIVATE_KEY.",
    );
  }

  cachedPrivateKey = createPrivateKey(pem);
  return cachedPrivateKey;
}

export function isWalletEncryptionConfigured(): boolean {
  return Boolean(process.env.WALLET_ENCRYPTION_PRIVATE_KEY);
}

export function getPublicKeyPem(): string {
  const privateKey = loadPrivateKey();
  return createPublicKey(privateKey).export({ type: "spki", format: "pem" }) as string;
}

export function getEncryptionInfo() {
  return {
    algorithm: "RSA-OAEP",
    hash: "sha256",
    encoding: "base64",
    publicKey: getPublicKeyPem(),
    instructions:
      "Encrypt your 0x-prefixed private key locally with this public key, then pass the base64 ciphertext as encryptedPrivateKey.",
  };
}

export function encryptPrivateKey(
  publicKeyPem: string,
  privateKey: string,
): string {
  if (!PRIVATE_KEY_PATTERN.test(privateKey)) {
    throw new Error("Invalid private key format. Expected 0x followed by 64 hex chars.");
  }

  const encrypted = publicEncrypt(
    { key: publicKeyPem, ...RSA_OAEP },
    Buffer.from(privateKey, "utf8"),
  );

  return encrypted.toString("base64");
}

export function decryptPrivateKey(encryptedBase64: string): `0x${string}` {
  const privateKey = loadPrivateKey();
  let decrypted: Buffer;

  try {
    decrypted = privateDecrypt(
      { key: privateKey, ...RSA_OAEP },
      Buffer.from(encryptedBase64, "base64"),
    );
  } catch {
    throw new Error(
      "Failed to decrypt private key. Ensure it was encrypted with this server's public key.",
    );
  }

  const value = decrypted.toString("utf8");
  if (!PRIVATE_KEY_PATTERN.test(value)) {
    throw new Error("Decrypted value is not a valid private key.");
  }

  return value as `0x${string}`;
}
