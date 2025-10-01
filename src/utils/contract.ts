/**
 * TinyPay 合约配置和工具函数
 */

// ==================== 合约地址配置 ====================

// 合约地址
export const CONTRACT_ADDRESS = '0x5877584f4dbd72b5d101f32be3bea1eb67e96020ded3943919ddc80927c88893';

// Test USDC 代币地址
export const TEST_USDC_ADDRESS = '0x5877584f4dbd72b5d101f32be3bea1eb67e96020ded3943919ddc80927c88893::tinypay::usdc';

// USDC Asset Metadata 地址
export const USDC_METADATA = '0x331ebb81b96e2b0114a68a070d433ac9659361f1eab45f831a437df1fde51fde';

// APT (Aptos Coin) Asset Type
export const APT_ASSET_TYPE = '0x1::aptos_coin::AptosCoin';

// 资产配置
export interface AssetConfig {
  name: string;
  symbol: string;
  decimals: number;
  metadataAddress?: string;
  assetType?: string;
}

export const ASSETS: Record<string, AssetConfig> = {
  APT: {
    name: 'Aptos Coin',
    symbol: 'APT',
    decimals: 8,
    // APT FA Metadata 地址 (Aptos 官方标准地址)
    // 注意：APT 的 metadata 对象地址通常是 0xa (10 in decimal)
    metadataAddress: '0x000000000000000000000000000000000000000000000000000000000000000a',
    assetType: '0x1::aptos_coin::AptosCoin',
  },
  USDC: {
    name: 'Test USDC',
    symbol: 'USDC',
    decimals: 8,
    metadataAddress: '0x331ebb81b96e2b0114a68a070d433ac9659361f1eab45f831a437df1fde51fde',
  }
};

/**
 * 将用户输入的金额转换为合约所需的整数金额
 * @param amount 用户输入的金额（例如：10.5）
 * @param assetSymbol 资产符号（例如：'APT' 或 'USDC'）
 * @returns 合约所需的整数金额（例如：1050000000）
 */
export function amountToContractUnits(amount: number, assetSymbol: string = 'APT'): number {
  const asset = ASSETS[assetSymbol];
  if (!asset) {
    throw new Error(`Unknown asset: ${assetSymbol}`);
  }
  return Math.floor(amount * Math.pow(10, asset.decimals));
}

/**
 * 将合约返回的整数金额转换为用户可读的金额
 * @param contractAmount 合约返回的整数金额（例如：1050000000）
 * @param assetSymbol 资产符号（例如：'APT' 或 'USDC'）
 * @returns 用户可读的金额（例如：10.5）
 */
export function contractUnitsToAmount(contractAmount: number, assetSymbol: string = 'APT'): number {
  const asset = ASSETS[assetSymbol];
  if (!asset) {
    throw new Error(`Unknown asset: ${assetSymbol}`);
  }
  return contractAmount / Math.pow(10, asset.decimals);
}

/**
 * 获取资产的 Metadata 地址或 Asset Type
 * @param assetSymbol 资产符号（例如：'APT' 或 'USDC'）
 */
export function getAssetMetadata(assetSymbol: string): string {
  const asset = ASSETS[assetSymbol];
  if (!asset) {
    throw new Error(`Unknown asset: ${assetSymbol}`);
  }
  // 优先返回 metadataAddress，如果没有则返回 assetType
  return asset.metadataAddress || asset.assetType || '';
}

/**
 * 获取 APT FA Metadata 地址（需要从链上查询）
 * 这个函数会动态查询 APT 的 FA metadata 地址
 */
export async function getAPTMetadata(): Promise<string> {
  try {
    const { Aptos, AptosConfig, Network } = await import("@aptos-labs/ts-sdk");
    const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));
    const meta = await aptos.getFungibleAssetMetadataByAssetType({
      assetType: APT_ASSET_TYPE,
    });
    console.log("📝 APT FA Metadata:", meta);
    return String(meta); // 返回 metadata 地址
  } catch (error) {
    console.error("Failed to get APT metadata:", error);
    // Fallback: 返回 asset type
    return APT_ASSET_TYPE;
  }
}
