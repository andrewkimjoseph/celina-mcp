export type CarbonToolsOptions = {
  /** When false, omit prepare_carbon_* tools. Default true. */
  prepareEnabled?: boolean;
  /** When false, omit execute_carbon_* tools. Default true. */
  executeEnabled?: boolean;
  /** @deprecated Use prepareEnabled + executeEnabled */
  writesEnabled?: boolean;
};

export function resolveCarbonToolsOptions(
  options: CarbonToolsOptions = {},
): { prepareEnabled: boolean; executeEnabled: boolean } {
  if (
    options.prepareEnabled !== undefined ||
    options.executeEnabled !== undefined
  ) {
    return {
      prepareEnabled: options.prepareEnabled !== false,
      executeEnabled: options.executeEnabled !== false,
    };
  }

  if (options.writesEnabled === false) {
    return { prepareEnabled: false, executeEnabled: false };
  }

  return { prepareEnabled: true, executeEnabled: true };
}
