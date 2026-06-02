import { z } from "zod";

export const addressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address");

export const optionalWalletAddressSchema = addressSchema
  .optional()
  .describe("Defaults to the CELO_PRIVATE_KEY signer when configured");

export const addressOrEnsSchema = z
  .string()
  .min(3)
  .describe(
    "Recipient 0x address or ENS name (e.g. andrewkimjoseph.celo.eth, celina.eth)",
  );

export const blockIdSchema = z
  .union([
    z.number().int().nonnegative(),
    z.string().regex(/^0x[a-fA-F0-9]+$/, "Invalid block hash"),
    z.literal("latest"),
    z.literal("pending"),
  ])
  .describe("Block number, hash, or latest/pending");

export const tokenSymbolSchema = z
  .string()
  .describe("Celo mainnet token symbol (e.g. CELO, USDm, USDC, USDT)");

export const ensNameSchema = z
  .string()
  .min(3)
  .describe("ENS name, e.g. celina.eth or vitalik.eth");

export const tokenIdSchema = z
  .string()
  .describe("NFT token ID (decimal string)");

export const abiSchema = z
  .array(z.record(z.unknown()))
  .min(1)
  .describe("Contract ABI as a JSON array");

export const paginationSchema = {
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).optional(),
  offset: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(100).optional(),
} as const;

export const hexDataSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]*$/)
  .optional()
  .describe("Optional transaction calldata (hex)");
