/**
 * 订单校验码生成器
 * 用于单独计算订单的校验码
 */

import * as crypto from "crypto";
import * as readline from "readline";

// 配置（与主程序保持一致）
const SALT = "dsy4567_dorm_v1";

/**
 * 生成校验码
 * @param orderId 订单ID
 * @param paidCash 实付现金
 * @param paidPoints 实付积分
 * @param rewardPoints 奖励积分
 * @returns 6位大写校验码
 */
function generateVerifyCode(
    orderId: string,
    paidCash: number,
    paidPoints: number,
    rewardPoints: number,
): string {
    const str = SALT + orderId + paidCash + paidPoints + rewardPoints;
    return crypto
        .createHash("sha1")
        .update(str)
        .digest("hex")
        .substring(0, 6)
        .toUpperCase();
}

/**
 * 从命令行读取输入
 */
function readInput(): Promise<{
    orderId: string;
    paidCash: number;
    paidPoints: number;
    rewardPoints: number;
}> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => {
        rl.question("请输入订单ID: ", orderId => {
            rl.question("请输入实付现金: ", paidCashStr => {
                rl.question("请输入实付积分: ", paidPointsStr => {
                    rl.question("请输入奖励积分: ", rewardPointsStr => {
                        rl.close();
                        resolve({
                            orderId,
                            paidCash: parseFloat(paidCashStr),
                            paidPoints: parseFloat(paidPointsStr),
                            rewardPoints: parseFloat(rewardPointsStr),
                        });
                    });
                });
            });
        });
    });
}

/**
 * 主函数
 */
async function main() {
    console.log("=== 订单校验码生成器 ===");
    try {
        const { orderId, paidCash, paidPoints, rewardPoints } =
            await readInput();

        // 验证输入
        if (!orderId.trim()) {
            console.log("❌ 订单ID不能为空！");
            return;
        }

        if (isNaN(paidCash)) {
            console.log("❌ 实付现金必须是数字！");
            return;
        }

        if (isNaN(paidPoints)) {
            console.log("❌ 实付积分必须是数字！");
            return;
        }

        if (isNaN(rewardPoints)) {
            console.log("❌ 奖励积分必须是数字！");
            return;
        }

        const verifyCode = generateVerifyCode(
            orderId,
            paidCash,
            paidPoints,
            rewardPoints,
        );
        console.log(`\n✅ 校验码计算结果: ${verifyCode}`);
        console.log(
            `📝 计算参数: 订单ID=${orderId}, 实付现金=${paidCash}, 实付积分=${paidPoints}, 奖励积分=${rewardPoints}`,
        );
    } catch (error) {
        console.error("❌ 计算过程中发生错误:", error);
    }
}

// 执行主函数
if (require.main === module) {
    main();
}

// 导出函数以便其他模块使用
export { generateVerifyCode };
