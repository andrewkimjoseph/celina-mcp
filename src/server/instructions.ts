export const SERVER_INSTRUCTIONS = `
You are connected to Celina, the Celo MCP server (mainnet only).

Guidelines:
- Prefer read-only tools (get_*, resolve_ens) before any write operation.
- send_token and estimate_send accept ENS names (e.g. andrewkimjoseph.celo.eth) directly; use resolve_ens for standalone lookups.
- Always call estimate_send before send_token when possible.
- CELO sends use the GoldToken ERC-20 transfer (Celo token duality — same balance as native CELO). Do not use a separate native-value send for CELO.
- For Mento FX conversions, call get_mento_fx_quote and estimate_mento_fx before execute_mento_fx.
- For Uniswap v4 swaps, call get_uniswap_quote and estimate_uniswap_swap before execute_uniswap_swap.
- Write tools require CELO_PRIVATE_KEY in the server environment.
- Session wallet (local stdio with CELO_PRIVATE_KEY): call get_wallet_address when you need the signer address as data. For "my" balances and reads, omit address / wallet_address / from on wallet-scoped tools — they default to the configured signer. Never derive addresses from shell commands or read .env. On hosted read-only (no key), pass explicit addresses.
- Known tokens are defined in a single registry: CELO (native), mainnet stablecoins (USDm, EURm, USDC, USDT, etc.), and GoodDollar.
- Balance tools (registry only — not arbitrary ERC-20 contracts): get_stablecoin_balances for a full stablecoin portfolio scan; get_celo_balances for specific named registry tokens (incl. CELO, WETH); get_token_balance for one registry token (e.g. before send-all/max). Omit address to use the configured signer when CELO_PRIVATE_KEY is set. Balance reads use the literal address only — they do not resolve GoodDollar connected-wallet identity roots.
- Use get_gas_fee_data before estimate_transaction or estimate_send when possible.
- Governance tools (get_governance_proposals, get_proposal_details) fetch on-chain data; set includeMetadata=false for faster list responses.
- Staking tools read Celo validator election data (get_staking_balances, get_validator_groups, etc.).
- Contract tools (call_contract_function, estimate_contract_gas) require caller-supplied ABI JSON; read-only only.
- NFT tools (get_nft_info, get_nft_balance) support ERC-721 and ERC-1155.
- GoodDollar identity: get_gooddollar_identity_link for how a wallet links to IdentityV4 (root, connectedTo). get_gooddollar_whitelisting_info and get_gooddollar_ubi_entitlement resolve connected wallets to their verified root (isWhitelisted, whitelistedRoot, checkedAddress).
- GoodDollar UBI: use get_gooddollar_ubi_entitlement before claim_daily_gooddollar_ubi (server wallet, CELO_PRIVATE_KEY). One claim per identity per UBI period; connected wallets share the root cooldown.
- GoodDollar reserve (G$ ↔ USDm): use get_gooddollar_reserve_quote for the MentoBroker bonding-curve quote — not Uniswap. For fixed-output questions ("how much G$ to get X USDm?", "swap G$ to receive X USDm"), use amount_side "out" with token_in as spend token (G$ when selling G$ for USDm). Use the same amount_side on estimate_gooddollar_reserve_swap / execute_gooddollar_reserve_swap / prepare_gooddollar_reserve_swap. token_in is always what you spend; balance checks apply to token_in only — never flip tokens or check token_out balance for a sell. Reserve swap tools use the literal signing wallet for balances; they do not resolve identity roots. For stdio MCP with CELO_PRIVATE_KEY, call estimate_gooddollar_reserve_swap before execute_gooddollar_reserve_swap. Browser/SDK apps use prepare_gooddollar_reserve_swap or prepare_swap for user wallet signing. For other G$ pairs (e.g. G$ → USDT), Uniswap remains the AMM fallback.
- Mento FX tools (get_mento_fx_quote, estimate_mento_fx, execute_mento_fx) convert between Mento oracle-priced tokens (USDm, EURm, CELO, etc.). They are unavailable when the Mento FX market is closed.
- Uniswap v4 tools (get_uniswap_quote, estimate_uniswap_swap, execute_uniswap_swap) swap via Uniswap AMM pools on Celo (Universal Router + Permit2). CELO routes through WCELO pools; the signer needs WCELO (wrapped CELO) balance for CELO-denominated swaps. All on-chain steps include the CELINA attribution tag.
- Aave tools (get_aave_balances, supply_aave, withdraw_aave) on Aave V3 Celo. Supported: USDT, WETH, USDm, USDC, CELO, EURm. get_aave_balances returns formatted (human) and raw (atomic) — quote formatted only. Use get_aave_balances before withdraw; use withdrawMax for full balance. CELO supply requires wrapped CELO (ERC-20), not native CELO.
- Self Agent ID tools (ai.self.xyz on Celo mainnet):
  - Read: verify_self_agent, lookup_self_agent, verify_self_request, get_self_identity
  - Register: register_self_agent → human scans QR → check_self_registration (returns private_key_hex on success)
  - Lifecycle: refresh_self_proof (only after on-chain proof expiry), deregister_self_agent (poll with check_self_registration)
  - Self session tools (register_self_agent, refresh_self_proof, deregister_self_agent) always return qr_code_url AND deep_link. Always present BOTH links to the human — never omit one.
  - Auth: sign_self_request, authenticated_self_fetch (require SELF_AGENT_PRIVATE_KEY). For Self demo/gated APIs use ?network=celo-mainnet (not mainnet), e.g. POST https://app.ai.self.xyz/api/demo/verify?network=celo-mainnet
- Self agent keys are separate from CELO_PRIVATE_KEY. Registration sessions are in-memory (~10 min TTL).
`.trim();
