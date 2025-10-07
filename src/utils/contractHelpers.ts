/**
 * TinyPay 合约交互辅助函数
 */

import { 
  PublicClient, 
  WalletClient, 
  parseUnits,
  Hex,
  encodeFunctionData
} from 'viem';
import { ethers } from 'ethers';
import {
  TINYPAY_CONTRACT_ADDRESS,
  TINYPAY_ABI,
  ERC20_ABI,
  SUPPORTED_TOKENS,
  amountToWei,
} from '@/config/u2u';

/**
 * 检查 ERC20 代币的 allowance 是否足够
 */
export async function checkAllowance(
  publicClient: PublicClient,
  tokenAddress: `0x${string}`,
  ownerAddress: `0x${string}`,
  spenderAddress: `0x${string}`,
  requiredAmount: bigint
): Promise<boolean> {
  try {
    const allowance = await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [ownerAddress, spenderAddress],
    }) as bigint;

    console.log(`Current allowance: ${allowance.toString()}, Required: ${requiredAmount.toString()}`);
    return allowance >= requiredAmount;
  } catch (error) {
    console.error('Failed to check allowance:', error);
    return false;
  }
}

/**
 * Approve ERC20 代币给 TinyPay 合约
 */
export async function approveToken(
  walletClient: WalletClient,
  tokenAddress: `0x${string}`,
  amount: bigint
): Promise<Hex> {
  if (!walletClient.account) {
    throw new Error('Wallet not connected');
  }

  console.log(`Approving ${amount.toString()} tokens...`);

  const hash = await walletClient.writeContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [TINYPAY_CONTRACT_ADDRESS, amount],
    account: walletClient.account,
  });

  console.log(`Approve transaction sent: ${hash}`);
  return hash;
}

/**
 * 等待交易确认
 */
export async function waitForTransaction(
  publicClient: PublicClient,
  hash: Hex,
  confirmations: number = 1
): Promise<void> {
  console.log(`Waiting for transaction ${hash}...`);
  await publicClient.waitForTransactionReceipt({
    hash,
    confirmations,
  });
  console.log(`Transaction ${hash} confirmed!`);
}

/**
 * 调用 TinyPay deposit 函数
 */
export async function depositToTinyPay(
  walletClient: WalletClient,
  tokenSymbol: string,
  amount: number,
  tailHexString: string
): Promise<Hex> {
  if (!walletClient.account) {
    throw new Error('Wallet not connected');
  }

  const token = SUPPORTED_TOKENS[tokenSymbol];
  if (!token) {
    throw new Error(`Unsupported token: ${tokenSymbol}`);
  }

  const amountWei = amountToWei(amount, tokenSymbol);
  
  // 使用 ethers 将 hex 字符串转换为 UTF-8 bytes
  const tailBytes = ethers.hexlify(ethers.toUtf8Bytes(tailHexString)) as Hex;
  
  console.log(`Depositing ${amount} ${tokenSymbol}...`);
  console.log(`Token address: ${token.address}`);
  console.log(`Amount (wei): ${amountWei.toString()}`);
  console.log(`Tail hex string: ${tailHexString}`);
  console.log(`Tail bytes (UTF-8): ${tailBytes}`);

  // 构造交易参数
  const txParams: {
    address: `0x${string}`;
    abi: typeof TINYPAY_ABI;
    functionName: 'deposit';
    args: [`0x${string}`, bigint, Hex];
    account: typeof walletClient.account;
    value?: bigint;
  } = {
    address: TINYPAY_CONTRACT_ADDRESS,
    abi: TINYPAY_ABI,
    functionName: 'deposit',
    args: [
      token.address,
      amountWei,
      tailBytes,
    ],
    account: walletClient.account,
  };

  // 如果是原生代币，需要发送 value
  if (token.isNative) {
    txParams.value = amountWei;
  }

  const hash = await walletClient.writeContract(txParams);

  console.log(`Deposit transaction sent: ${hash}`);
  return hash;
}

/**
 * 完整的 deposit 流程（包含 approve）
 */
export async function completeDepositFlow(
  publicClient: PublicClient,
  walletClient: WalletClient,
  tokenSymbol: string,
  amount: number,
  tailHexString: string,
  onProgress?: (status: string) => void
): Promise<Hex> {
  const token = SUPPORTED_TOKENS[tokenSymbol];
  if (!token) {
    throw new Error(`Unsupported token: ${tokenSymbol}`);
  }

  if (!walletClient.account) {
    throw new Error('Wallet not connected');
  }

  const amountWei = amountToWei(amount, tokenSymbol);

  // 如果不是原生代币，需要先 approve
  if (!token.isNative) {
    onProgress?.('⏳ Checking allowance...');
    
    const hasAllowance = await checkAllowance(
      publicClient,
      token.address,
      walletClient.account.address,
      TINYPAY_CONTRACT_ADDRESS,
      amountWei
    );

    if (!hasAllowance) {
      onProgress?.('⏳ Please approve token in wallet...');
      const approveHash = await approveToken(walletClient, token.address, amountWei);
      
      onProgress?.('⏳ Waiting for approval confirmation...');
      await waitForTransaction(publicClient, approveHash);
      
      onProgress?.('✅ Approval complete!');
    } else {
      onProgress?.('✅ Sufficient allowance already approved');
    }
  }

  // 执行 deposit
  onProgress?.('⏳ Please confirm deposit transaction in wallet...');
  const depositHash = await depositToTinyPay(
    walletClient,
    tokenSymbol,
    amount,
    tailHexString
  );

  onProgress?.('⏳ Waiting for deposit confirmation...');
  await waitForTransaction(publicClient, depositHash);

  return depositHash;
}

