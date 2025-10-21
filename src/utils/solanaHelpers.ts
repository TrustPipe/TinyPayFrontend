/**
 * Solana 合约交互辅助函数
 */

import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { PROGRAM_ID } from '@/config/solana';
import idl from '../../tinypay_solana.json';

/**
 * 存入 SOL 到 TinyPay
 */
export async function depositSOL(
  provider: AnchorProvider,
  amount: number,
  tailBytes: number[]
): Promise<string> {
  try {
    // 创建程序实例
    const program = new Program(idl as any, provider);
    const user = provider.wallet.publicKey;

    // 计算 PDA 账户地址
    const [userAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from('user'), user.toBuffer()],
      PROGRAM_ID
    );

    const [state] = PublicKey.findProgramAddressSync(
      [Buffer.from('state')],
      PROGRAM_ID
    );

    const [vault] = PublicKey.findProgramAddressSync(
      [Buffer.from('vault')],
      PROGRAM_ID
    );

    console.log('📝 Deposit parameters:', {
      user: user.toString(),
      userAccount: userAccount.toString(),
      state: state.toString(),
      vault: vault.toString(),
      amount,
      tailBytesLength: tailBytes.length,
    });

    // 检查账户是否存在
    const connection = provider.connection;
    const userAccountInfo = await connection.getAccountInfo(userAccount);
    console.log('User account exists:', !!userAccountInfo);

    // 转换金额为 lamports (SOL 有 9 位小数)
    const amountLamports = new BN(Math.floor(amount * 1e9));

    // tailBytes 应该是 hex 字符串的 ASCII bytes (64 字节)
    // 例如: SHA256 hash "a1b2..." 的每个字符转成 ASCII: [97, 49, 98, 50, ...]
    if (tailBytes.length !== 64) {
      throw new Error(`tailBytes must be 64 bytes (hex string ASCII), got ${tailBytes.length}`);
    }

    // Anchor 需要 Buffer 类型
    const tail = Buffer.from(tailBytes);

    console.log('💰 Calling deposit:', {
      amountLamports: amountLamports.toString(),
      tailLength: tail.length,
      tailType: tail.constructor.name,
    });

    // 调用合约的 deposit 函数
    const tx = await program.methods
      .deposit(amountLamports, tail)
      .accounts({
        userAccount,
        state,
        vault,
        user,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log('✅ Transaction signature:', tx);
    return tx;

  } catch (error: any) {
    console.error('❌ Deposit failed:', error);

    // 提供更友好的错误信息
    if (error.message?.includes('already been processed')) {
      throw new Error('Transaction was rejected. This might be because:\n1. The user account needs to be initialized first\n2. Or the transaction was submitted multiple times\n\nPlease try again or contact support.');
    }

    if (error.logs) {
      console.error('Transaction logs:', error.logs);
    }

    throw error;
  }
}
