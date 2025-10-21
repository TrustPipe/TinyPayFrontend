# TinyPay Solana 迁移指南

## 迁移难度评估: 7/10 (中等偏高)

## 核心差异

### 1. 账户模型
- **以太坊**: 隐式状态管理
- **Solana**: 显式账户传递 + PDA

### 2. 必需实现的函数 (YAGNI)

根据 `tinypay_solana.json` IDL，最小实现需要：

```typescript
// 1. 存入 SOL
deposit(amount: u64, tail: [u8; 64])

// 2. 存入 SPL 代币
deposit_token(amount: u64, tail: [u8; 64])
```

## 示例代码

### 步骤 1: 安装依赖

```bash
npm install @solana/web3.js @coral-xyz/anchor @solana/wallet-adapter-react @solana/wallet-adapter-wallets
```

### 步骤 2: PDA 计算辅助函数

```typescript
// src/utils/solana/pdas.ts
import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from './constants';

export async function getUserAccountPDA(user: PublicKey): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [Buffer.from('user'), user.toBuffer()],
    PROGRAM_ID
  );
}

export async function getStatePDA(): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [Buffer.from('state')],
    PROGRAM_ID
  );
}

export async function getVaultPDA(): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [Buffer.from('vault')],
    PROGRAM_ID
  );
}

export async function getUserTokenAccountPDA(
  user: PublicKey,
  mint: PublicKey
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [Buffer.from('user_token'), user.toBuffer(), mint.toBuffer()],
    PROGRAM_ID
  );
}
```

### 步骤 3: Deposit SOL 函数

```typescript
// src/utils/solana/deposit.ts
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { getUserAccountPDA, getStatePDA, getVaultPDA } from './pdas';
import { TinypaySolana } from './types/tinypay_solana'; // 从IDL生成
import idl from './tinypay_solana.json';

export async function depositSOL(
  provider: AnchorProvider,
  amount: number,
  tailHex: string
): Promise<string> {
  const program = new Program<TinypaySolana>(idl as any, provider);
  const user = provider.wallet.publicKey;

  // 计算 PDAs
  const [userAccount] = await getUserAccountPDA(user);
  const [state] = await getStatePDA();
  const [vault] = await getVaultPDA();

  // 转换 tail 为字节数组 (64 bytes)
  const tailBuffer = Buffer.from(tailHex, 'utf-8');
  const tail = new Uint8Array(64);
  tail.set(tailBuffer.slice(0, 64));

  // 转换金额 (SOL 有 9 位小数)
  const amountLamports = new BN(amount * 1e9);

  console.log('Depositing SOL:', {
    user: user.toString(),
    userAccount: userAccount.toString(),
    amount: amountLamports.toString(),
    tailHex,
  });

  // 调用合约
  const tx = await program.methods
    .deposit(amountLamports, Array.from(tail))
    .accounts({
      userAccount,
      state,
      vault,
      user,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log('Transaction signature:', tx);
  return tx;
}
```

### 步骤 4: Deposit SPL Token 函数

```typescript
// src/utils/solana/deposit.ts (续)
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';

export async function depositToken(
  provider: AnchorProvider,
  mint: PublicKey,
  amount: number,
  decimals: number,
  tailHex: string
): Promise<string> {
  const program = new Program<TinypaySolana>(idl as any, provider);
  const user = provider.wallet.publicKey;

  // 计算 PDAs
  const [userTokenAccount] = await getUserTokenAccountPDA(user, mint);
  const [state] = await getStatePDA();

  // 计算 ATAs
  const userATA = await getAssociatedTokenAddress(mint, user);
  const [vaultTokenAccount] = await PublicKey.findProgramAddress(
    [
      state.toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  // 转换数据
  const tailBuffer = Buffer.from(tailHex, 'utf-8');
  const tail = new Uint8Array(64);
  tail.set(tailBuffer.slice(0, 64));
  const amountTokens = new BN(amount * Math.pow(10, decimals));

  console.log('Depositing Token:', {
    mint: mint.toString(),
    amount: amountTokens.toString(),
    userATA: userATA.toString(),
  });

  // 调用合约
  const tx = await program.methods
    .depositToken(amountTokens, Array.from(tail))
    .accounts({
      userTokenAccount,
      state,
      mint,
      userTokenAccountAta: userATA,
      vaultTokenAccount,
      user,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log('Transaction signature:', tx);
  return tx;
}
```

### 步骤 5: React 组件集成

```typescript
// src/components/SolanaDepositForm.tsx
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { depositSOL, depositToken } from '@/utils/solana/deposit';
import { completePaymentWorkflow } from '@/utils/hashChain';

export function SolanaDepositForm() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDeposit = async () => {
    if (!wallet) {
      alert('请先连接钱包');
      return;
    }

    setLoading(true);
    try {
      // 1. 生成哈希链 (与以太坊版本相同)
      const workflow = await completePaymentWorkflow(password, 1000);
      const tailHex = workflow.tailHex;

      // 2. 创建 provider
      const provider = new AnchorProvider(connection, wallet, {
        commitment: 'confirmed',
      });

      // 3. 存入 SOL
      const tx = await depositSOL(
        provider,
        parseFloat(amount),
        tailHex
      );

      console.log('✅ Deposit successful:', tx);
      alert(`存入成功！交易签名: ${tx}`);

    } catch (error) {
      console.error('❌ Deposit failed:', error);
      alert(`存入失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="金额 (SOL)"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="密码"
      />
      <button onClick={handleDeposit} disabled={loading}>
        {loading ? '处理中...' : '存入'}
      </button>
    </div>
  );
}
```

## 关键差异对照表

| 方面 | 以太坊 (U2U) | Solana |
|------|-------------|--------|
| **合约地址** | `0x4690cb265bc3c12fd218670dfbdc4571d2c5a6b5` | `88oZkwPMg9iWjPTUqYJXkRE2JYmFEvRraC6vYTcH9CGH` |
| **原生代币** | U2U (18 decimals) | SOL (9 decimals) |
| **代币标准** | ERC20 | SPL Token |
| **Approve 需求** | 需要 (ERC20) | 不需要 (但需要 ATA) |
| **账户传递** | 隐式 | 显式 (5-9个账户) |
| **金额类型** | `uint256` | `u64` (最大值限制) |
| **Tail 类型** | `bytes` (动态) | `[u8; 64]` (固定64字节) |
| **钱包库** | wagmi + viem | @solana/wallet-adapter |
| **合约SDK** | ethers/viem | @coral-xyz/anchor |

## 迁移风险

### 高风险
1. **PDA 计算错误** - 导致账户未找到
2. **账户未初始化** - 需要处理账户创建逻辑
3. **u64 溢出** - 金额超过最大值

### 中风险
1. **ATA 不存在** - SPL 代币需要先创建 ATA
2. **交易费用不足** - Solana 需要 SOL 支付 rent + gas

### 低风险
1. **哈希链逻辑** - 完全相同，无需修改

## 建议

### 遵循 YAGNI 原则
IDL 中有很多函数 (withdraw, complete_payment, pause_system 等)，但初期只需实现：
- ✅ `deposit` (SOL)
- ✅ `deposit_token` (SPL)

其他功能等业务需要时再实现。

### 渐进式迁移
1. **先实现 SOL 存入** (更简单，只需5个账户)
2. **再实现 SPL Token** (需要处理 ATA)
3. **最后实现其他功能** (withdraw, payment 等)

## 估计时间线

| 阶段 | 工作量 | 时间 |
|------|--------|------|
| 环境搭建 | 低 | 1-2天 |
| SOL Deposit | 中 | 2-3天 |
| SPL Token Deposit | 高 | 3-4天 |
| UI 集成 | 中 | 2-3天 |
| 测试优化 | 中 | 2-3天 |
| **总计** | - | **10-15天** |

## 结论

迁移难度为 **7/10**，主要挑战在于：
1. Solana 账户模型的理解和实现
2. PDA 的正确计算
3. SPL Token 的 ATA 处理

但好消息是：
- 核心业务逻辑(哈希链)无需修改
- 合约接口相对简单，只需2个主要函数
- 有完整的 IDL 可以自动生成类型

遵循 YAGNI 原则，先实现最小可用功能，可以在 2 周内完成基础迁移。
