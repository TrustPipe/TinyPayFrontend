import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

/**
 * Create Aptos client instance
 * You can change the network here: MAINNET, TESTNET, DEVNET
 */
export function getAptosClient() {
  const config = new AptosConfig({
    network: Network.TESTNET, // Change to MAINNET for production
  });
  return new Aptos(config);
}

// Singleton instance - reuse across the app
export const aptosClient = getAptosClient();
