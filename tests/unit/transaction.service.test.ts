import { describe, expect, it, vi } from "vitest";
import type { CeloClientFactory, CeloClients } from "../../src/clients/celo-client.js";
import { TransactionService } from "../../src/services/transaction.service.js";

const CELO_ADDRESS = "0xC1aC9666aa6704758644ee42c9354ce28a43f878" as const;
const SELF_AGENT_ADDRESS = "0x7C6c7C0DE51f5F2ed56936b568A44c266A255f81" as const;
const RECIPIENT = "0x1111111111111111111111111111111111111111" as const;

const executePreparedFlowMock = vi.fn();

vi.mock("../../src/services/execute-prepared-flow.js", async () => {
  const actual = await vi.importActual<
    typeof import("../../src/services/execute-prepared-flow.js")
  >("../../src/services/execute-prepared-flow.js");
  return {
    ...actual,
    executePreparedFlow: (...args: unknown[]) => executePreparedFlowMock(...args),
  };
});

function clientsFor(address: `0x${string}`): CeloClients {
  return {
    public: {} as CeloClients["public"],
    wallet: {} as NonNullable<CeloClients["wallet"]>,
    accountAddress: address,
  };
}

function buildClientFactory(): CeloClientFactory {
  const getClients = vi.fn((signer?: "celo" | "self_agent") =>
    signer === "self_agent" ? clientsFor(SELF_AGENT_ADDRESS) : clientsFor(CELO_ADDRESS),
  );
  return { getClients } as unknown as CeloClientFactory;
}

function buildSdk(prepareSendMock: ReturnType<typeof vi.fn>) {
  return {
    transaction: {
      estimateSend: vi.fn().mockResolvedValue({ gas: "21000" }),
      prepareSend: prepareSendMock,
    },
    token: {
      resolveToken: vi.fn().mockResolvedValue({ symbol: "CELO" }),
    },
  } as unknown as ConstructorParameters<typeof TransactionService>[1];
}

describe("TransactionService signer selection", () => {
  it("estimateSend resolves clients for the requested signer", async () => {
    const clientFactory = buildClientFactory();
    const sdk = buildSdk(vi.fn());
    const service = new TransactionService(clientFactory, sdk);

    await service.estimateSend(RECIPIENT, "CELO", "1", "self_agent");

    expect((clientFactory.getClients as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
      "self_agent",
    );
    expect(sdk.transaction.estimateSend).toHaveBeenCalledWith(
      SELF_AGENT_ADDRESS,
      RECIPIENT,
      "CELO",
      "1",
    );
  });

  it("estimateSend defaults to the main signer when signer is omitted", async () => {
    const clientFactory = buildClientFactory();
    const sdk = buildSdk(vi.fn());
    const service = new TransactionService(clientFactory, sdk);

    await service.estimateSend(RECIPIENT, "CELO", "1");

    expect(clientFactory.getClients).toHaveBeenCalledWith(undefined);
    expect(sdk.transaction.estimateSend).toHaveBeenCalledWith(
      CELO_ADDRESS,
      RECIPIENT,
      "CELO",
      "1",
    );
  });

  it("sendToken funds the recipient from the requested signer and forwards it to executePreparedFlow", async () => {
    executePreparedFlowMock.mockResolvedValue({ hash: "0xhash", status: "success" });
    const clientFactory = buildClientFactory();
    const prepareSendMock = vi.fn().mockResolvedValue({ steps: [{ to: RECIPIENT }] });
    const sdk = buildSdk(prepareSendMock);
    const service = new TransactionService(clientFactory, sdk);

    const result = await service.sendToken(RECIPIENT, "CELO", "5.2", "celo");

    expect(prepareSendMock).toHaveBeenCalledWith(CELO_ADDRESS, RECIPIENT, "CELO", "5.2");
    expect(executePreparedFlowMock).toHaveBeenCalledWith(
      clientFactory,
      [{ to: RECIPIENT }],
      "celo",
    );
    expect(result).toMatchObject({
      from: CELO_ADDRESS,
      to: RECIPIENT,
      amount: "5.2",
      token: "CELO",
      hash: "0xhash",
      status: "success",
    });
  });

  it("sendToken uses the Self agent address as the sender when signer is self_agent", async () => {
    executePreparedFlowMock.mockResolvedValue({ hash: "0xhash", status: "success" });
    const clientFactory = buildClientFactory();
    const prepareSendMock = vi.fn().mockResolvedValue({ steps: [] });
    const sdk = buildSdk(prepareSendMock);
    const service = new TransactionService(clientFactory, sdk);

    await service.sendToken(RECIPIENT, "CELO", "0.2", "self_agent");

    expect(prepareSendMock).toHaveBeenCalledWith(
      SELF_AGENT_ADDRESS,
      RECIPIENT,
      "CELO",
      "0.2",
    );
    expect(executePreparedFlowMock).toHaveBeenCalledWith(clientFactory, [], "self_agent");
  });
});
