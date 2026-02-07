/**
 * 计算所有正式会员降级时间的独立程序
 * 作者: dsy4567
 * 功能: 分析所有正式会员的订单数据，计算他们可能的降级时间
 */

import * as fs from "fs";
import * as path from "path";

// 配置文件路径
const DATA_DIR = path.resolve(__dirname, "../data");
const CONFIG_PATH = path.join(DATA_DIR, "config.json");
const STORE_DATA_PATH = path.join(DATA_DIR, "store_data.json");
const MEMBER_CONFIG_PATH = path.join(DATA_DIR, "member_config.json");

// 读取配置文件
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
const storeData = JSON.parse(fs.readFileSync(STORE_DATA_PATH, "utf-8"));
const memberConfig = JSON.parse(fs.readFileSync(MEMBER_CONFIG_PATH, "utf-8"));

// 会员类型定义
type MemberLevel = "SPECIAL" | "TRAINEE" | "OFFICIAL";

// 接口定义
interface Order {
    id: string;
    timestamp: Date;
    userShortName: string;
    productId: string;
    productName: string;
    quantity: number;
    cost: number; // 快照：下单时成本
    paidCash: number; // 实付现金（仅记录）
    paidPoints: number; // 实付积分
    rewardPoints: number; // 买就送的积分
    type: "cash" | "points";
    note?: string; // 备注等
}

interface RefundOrder {
    id: string;
    originalOrderId: string;
    timestamp: Date;
    userShortName: string;
    quantity: number; // 本次退款数量
    refundCash: number; // 记录退还了多少现金
    refundPoints: number; // 记录退还了多少积分
    deductPoints: number; // 记录扣除了多少赠送积分
    reason: string;
}

interface User {
    shortName: string;
    points: number; // 可为负数
    debt: number; // 欠款(正数=欠我, 负数=我欠)
}

interface StoreData {
    users: User[];
    products: any[];
    orders: Order[];
    refunds: RefundOrder[];
    otherLogs: any[]; // 替换 budgetLogs，记录所有手动操作
    promotions: any[];
}

// 计算用户在滑动窗口内的总消费额（扣除退款）
function getUserTotalSpendInWindow(
    userShortName: string,
    referenceDate: Date = new Date(),
): number {
    // 计算滑动窗口的起始日期
    const lookbackDate = new Date(referenceDate);
    lookbackDate.setDate(
        referenceDate.getDate() - config.MEMBER.NEW_RULE.LOOKBACK_DAYS,
    );

    // 获取用户在这段时间内的所有现金订单
    const userOrdersInPeriod = (storeData as StoreData).orders.filter(
        (o: Order) =>
            o.userShortName === userShortName &&
            o.type === "cash" &&
            new Date(o.timestamp) >= lookbackDate &&
            new Date(o.timestamp) <= referenceDate,
    );

    // 计算这些订单的总金额（扣除退款）
    let totalSpendInPeriod = userOrdersInPeriod.reduce(
        (total: number, order: Order) => {
            // 找到该订单的所有退款
            const orderRefunds = (storeData as StoreData).refunds.filter(
                (r: RefundOrder) => r.originalOrderId === order.id,
            );

            // 计算该订单的总退款金额
            const totalRefund = orderRefunds.reduce(
                (refundTotal: number, r: RefundOrder) =>
                    refundTotal + (r.refundCash || 0),
                0,
            );

            // 计算该订单的实际有效金额
            const effectiveAmount = Math.max(0, order.paidCash - totalRefund);

            return total + effectiveAmount;
        },
        0,
    );

    return totalSpendInPeriod;
}

// 检查用户当前是否是会员
function isUserMember(
    userShortName: string,
    referenceDate: Date = new Date(),
): boolean {
    // 首先检查是否为特殊用户或手动指定的会员
    if (memberConfig.specialUsers.includes(userShortName)) {
        return true;
    }

    // 检查是否为手动指定的正式会员
    if (memberConfig.members[userShortName]) {
        const manualExpiryDate = new Date(memberConfig.members[userShortName]);
        if (manualExpiryDate > referenceDate) {
            return true;
        }
    }

    // 基于滑动窗口消费额判断会员身份
    if (config.MEMBER.NEW_RULE.ENABLED) {
        const totalSpend = getUserTotalSpendInWindow(
            userShortName,
            referenceDate,
        );
        return totalSpend >= config.MEMBER.NEW_RULE.TRIGGER_AMOUNT;
    }

    return false;
}

// 获取用户的会员等级
function getUserMemberLevel(
    userShortName: string,
    referenceDate: Date = new Date(),
): MemberLevel {
    // 首先检查是否为特殊用户
    if (memberConfig.specialUsers.includes(userShortName)) {
        return "SPECIAL";
    }

    // 然后检查是否为正式会员
    if (isUserMember(userShortName, referenceDate)) {
        return "OFFICIAL";
    }

    // 否则为见习会员（所有用户都有见习会员权限）
    return "TRAINEE";
}

// 计算两个日期之间的天数差
function daysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000; // 一天的毫秒数
    return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
}

// 计算用户降级时间
function calculateDemotionDate(userShortName: string): {
    date: Date | null;
    daysLeft: number;
} {
    const now = new Date();

    // 如果当前不是正式会员，则返回null
    if (getUserMemberLevel(userShortName, now) !== "OFFICIAL") {
        return { date: null, daysLeft: -1 };
    }

    // 如果是手动指定的正式会员，则返回有效期截止日期
    if (memberConfig.members[userShortName]) {
        const manualExpiryDate = new Date(memberConfig.members[userShortName]);
        const daysLeft = daysBetween(now, manualExpiryDate);
        return { date: manualExpiryDate, daysLeft };
    }

    // 对于基于消费额的正式会员，计算降级日期
    // 从明天开始，逐天检查直到不再满足会员条件
    let checkDate = new Date(now);
    checkDate.setDate(now.getDate() + 1);

    // 最多检查365天后的情况
    const maxCheckDate = new Date(now);
    maxCheckDate.setDate(now.getDate() + 365);

    while (checkDate <= maxCheckDate) {
        if (!isUserMember(userShortName, checkDate)) {
            const daysLeft = daysBetween(now, checkDate);
            return { date: checkDate, daysLeft };
        }
        // 检查下一天
        checkDate.setDate(checkDate.getDate() + 1);
    }

    // 如果在365天内都不会降级，则返回null
    return { date: null, daysLeft: -1 };
}

// 主函数：计算所有正式会员的降级时间
function calculateAllDemotionDates(): void {
    const results: {
        [shortName: string]: {
            date: string;
            daysLeft: number;
            memberType: string;
            currentSpend: number;
        };
    } = {};

    console.log("正在计算所有正式会员的降级时间...\n");

    // 遍历所有用户
    for (const user of (storeData as StoreData).users) {
        const demotionResult = calculateDemotionDate(user.shortName);

        if (demotionResult.date) {
            const formattedDate = demotionResult.date
                .toISOString()
                .split("T")[0];

            // 获取当前消费额
            const currentSpend = getUserTotalSpendInWindow(user.shortName);

            // 判断是手动指定的还是基于消费的会员
            const isManualMember =
                memberConfig.members[user.shortName] !== undefined;
            const memberType = isManualMember ? "手动指定" : "基于消费";

            results[user.shortName] = {
                date: formattedDate,
                daysLeft: demotionResult.daysLeft,
                memberType: memberType,
                currentSpend: currentSpend,
            };

            console.log(
                `用户 ${user.shortName} (${memberType}): 降级时间 ${formattedDate}, 距离降级 ${demotionResult.daysLeft} 天, 当前消费额 ￥${currentSpend.toFixed(2)}`,
            );
        }
    }

    // 保存结果到文件（覆盖写入）
    const outputPath = path.join(DATA_DIR, "会员降级时间.txt");
    let outputContent = "正式会员降级时间计算结果\n";
    outputContent += `计算时间: ${new Date().toISOString()}\n`;
    outputContent += `会员门槛: ￥${config.MEMBER.NEW_RULE.TRIGGER_AMOUNT} (近${config.MEMBER.NEW_RULE.LOOKBACK_DAYS}天)\n\n`;

    for (const [shortName, result] of Object.entries(results)) {
        outputContent += `${shortName} (${result.memberType}): ${result.date}, 距离降级 ${result.daysLeft} 天, 当前消费额 ￥${result.currentSpend.toFixed(2)}\n`;
    }

    fs.writeFileSync(outputPath, outputContent, "utf-8");
    console.log(`\n结果已保存到: ${outputPath}`);
}

// 执行主函数
calculateAllDemotionDates();
