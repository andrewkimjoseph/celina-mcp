import { encodeFunctionData, erc20Abi, parseEther } from "viem";
import type { CeloNetwork } from "../config/env.js";
import type { CeloClientFactory } from "../clients/celo-client.js";
import { TokenService } from "./token.service.js";

export class TransactionService {
  private readonly tokenService: TokenService;

  constructor(
    private readonly clientFactory: CeloClientFactory,
    private readonly walletAddress?: `0x${string}`,
  ) {
    this.tokenService = new TokenService(clientFactory);
  }

  requireWallet(): `0x${string}` {
    if (!this.walletAddress) {
      throw new Error(
        "No wallet configured. Set CELO_PRIVATE_KEY to enable write tools.",
      );
    }
    return this.walletAddress;
  }

  async estimateSend(
    network: CeloNetwork,
    to: `0x${string}`,
    token: string,
    amount: string,
  ) {
    const from = this.requireWallet();
    const { public: client } = this.clientFactory.getClients(network);
    const resolved = this.tokenService.resolveToken(network, token);

    if (resolved.address === "native") {
      const value = parseEther(amount);
      const gas = await client.estimateGas({
        account: from,
        to,
        value,
      });

      return {
        network,
        from,
        to,
        token: resolved.symbol,
        amount,
        gas: gas.toString(),
      };
    }

    const tokenAmount = this.tokenService.parseAmount(amount, resolved.decimals);
    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [to, tokenAmount],
    });

    const gas = await client.estimateGas({
      account: from,
      to: resolved.address,
      data,
    });

    return {
      network,
      from,
      to,
      token: resolved.symbol,
      amount,
      gas: gas.toString(),
    };
  }

  async sendToken(
    network: CeloNetwork,
    to: `0x${string}`,
    token: string,
    amount: string,
  ) {
    const from = this.requireWallet();
    const { public: client, wallet } = this.clientFactory.getClients(network);

    if (!wallet) {
      throw new Error(
        "Wallet client unavailable. Set CELO_PRIVATE_KEY to send transactions.",
      );
    }

    const resolved = this.tokenService.resolveToken(network, token);
    const chain = client.chain;
    if (!chain) {
      throw new Error("Chain configuration missing");
    }

    if (resolved.address === "native") {
      const hash = await wallet.sendTransaction({
        chain,
        account: from,
        to,
        value: parseEther(amount),
      });

      const receipt = await client.waitForTransactionReceipt({ hash });
      return {
        network,
        hash,
        status: receipt.status,
        from,
        to,
        token: resolved.symbol,
        amount,
      };
    }

    const tokenAmount = this.tokenService.parseAmount(amount, resolved.decimals);
    const hash = await wallet.writeContract({
      chain,
      account: from,
      address: resolved.address,
      abi: erc20Abi,
      functionName: "transfer",
      args: [to, tokenAmount],
    });

    const receipt = await client.waitForTransactionReceipt({ hash });
    return {
      network,
      hash,
      status: receipt.status,
      from,
      to,
      token: resolved.symbol,
      amount,
    };
  }

  async getSwapQuote(
    network: CeloNetwork,
    fromToken: string,
    toToken: string,
    amount: string,
  ) {
    const from = this.tokenService.resolveToken(network, fromToken);
    const to = this.tokenService.resolveToken(network, toToken);

    return {
      network,
      status: "not_implemented",
      message:
        "On-chain swap routing (Mento/Uniswap) is not wired yet. Use this tool to validate token pairs before execute_swap ships.",
      fromToken: from.symbol,
      toToken: to.symbol,
      amount,
      nextStep:
        "Add a SwapService with Mento broker/router quotes, then implement execute_swap.",
    };
  }
}
