/**
 * 宿舍小卖部营销系统 - Node.js + TypeScript
 * 作者: dsy4567
 * 版本: v3.0
 * 功能: 现金/积分销售、库存管理、财务预算、隐私保护、手动记账
 */

// ===================== 代码大纲 =====================
// 1. 导入模块
//    - fs: 文件系统操作
//    - path: 路径处理
//    - readline: 命令行交互
//    - crypto: 加密功能
//
// 2. 配置与类型定义
//    - Config 接口: 系统配置
//    - ProductShelf 枚举: 商品货架类型 (CASH/POINTS)
//    - Promotion 接口: 促销活动
//    - Product 接口: 商品信息
//    - User 接口: 用户信息
//    - OtherLog 接口: 其他日志（替换BudgetLog，记录所有手动操作）
//    - Order 接口: 订单信息
//    - RefundOrder 接口: 退款订单
//    - StoreData 接口: 系统数据结构
//    - PrivacyMap 接口: 隐私映射
//
// 3. 核心类 DormStoreSystem
//    - 构造函数: 初始化系统
//    - 初始化方法
//      - init(): 异步初始化系统
//    - 数据加载与保存方法
//      - loadAllData(): 异步加载所有数据，包含JSON读取错误时的二次确认机制
//      - getEmptyData(): 获取空数据结构
//      - saveData(): 保存主数据
//      - saveProductsData(): 保存商品数据
//      - savePromotionsData(): 保存促销数据
//      - savePrivacyMap(): 保存隐私映射
//      - saveChangeLog(): 保存变更日志
//    - 辅助方法
//      - calculateCurrentStock(): 计算当前库存
//      - getRealName(): 获取真实姓名
//      - generateId(): 生成唯一ID
//      - ask(): 命令行提问
//    - 核心业务逻辑
//      - getActivityBudget(): 计算活动预算
//      - getLastSunday(): 获取上周日日期
//      - getUserTotalSpendInWindow(): 计算用户在滑动窗口内的总消费额（扣除退款）
//      - isUserMember(): 检查用户是否为会员
//      - checkAndNotifyMembershipChange(): 检查并通知会员状态变化
//      - checkMembershipStatus(): 检查会员状态
//      - generateVerifyCode(): 生成校验码
//      - showRevenueOverview(): 显示收入情况分析
//      - calculateRewardPoints(): 计算奖励积分（保留完整小数，但用户总积分有上限5）
//      - showCurrentSessionCashRevenue(): 显示当前会话累计实付现金（扣除退款）
//    - reverseLookupVerifyCode(): 校验码反查订单（从最晚订单向前遍历）
//    - exportDebtorList(): 在控制台输出赊账名单（包含最后消费时间）
//    - manageInventory(): 库存管理（支持上架新品、调整库存、修改优惠策略、修改价格）
//
// 4. 关键变量
//    - config: 系统配置
//    - DormStoreSystem: 系统主类
//
// 注意: 修改代码后请更新此大纲
// ===================================================

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import * as crypto from "crypto";

interface Config {
    DATA_DIR: string;
    SALT: string;
    MEMBER: {
        TRIGGER_AMOUNT: number;
        REWARD_DAYS: number;
        MAX_DAYS: number;
        ALERT_DAYS: number;
        NEW_RULE: {
            ENABLED: boolean;
            LOOKBACK_DAYS: number;
            TRIGGER_AMOUNT: number;
            REWARD_DAYS: number;
        };
    };
    REFUND_LIMIT_DAYS: number;
    MAX_POINTS: number; // 积分上限配置
}

// 读取配置文件
const config: Config = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../data/config.json"), "utf-8"),
);

// 为了防止报错，这里模拟一个 config 对象，实际使用请取消上面 import 并注释掉这个
// const config = {
//     DATA_DIR: "./data",
//     SALT: "dsy4567_dorm_v1",
//     MEMBER: {
//         TRIGGER_AMOUNT: 10,
//         REWARD_DAYS: 14,
//         MAX_DAYS: 21,
//         ALERT_DAYS: 3
//     },
//     REFUND_LIMIT_DAYS: 7,
//     NEWBIE_POOL_ID: "pool_newbie_01"
// };

// ===================== 类型定义 =====================

// 会员类型定义
type MemberLevel = "SPECIAL" | "TRAINEE" | "OFFICIAL";

// 积分倍率配置
const rateMap: Record<MemberLevel, number> = {
    SPECIAL: 0, // 死党不给积分
    TRAINEE: 0.2, // 见习 20%
    OFFICIAL: 1.0, // 正式 100%
};

interface MemberConfig {
    description: string;
    members: { [shortName: string]: string }; // 手动指定的正式会员有效期
    specialUsers: string[]; // 特殊用户列表
    pointRates: { [key in MemberLevel]: number }; // 积分倍率配置
}

enum ProductShelf {
    CASH = "cash",
    POINTS = "points",
}

interface Promotion {
    id: string;
    name: string;
    type: "quantity_based" | "amount_based";
    threshold: number;
    rewardPoints: number;
    weeklyLimitPerProduct: number;
    isMemberOnly: boolean;
}

interface Product {
    id: string;
    name: string;
    cost: number; // 统一成本（人民币元）
    initialStock: number; // 初始库存
    prices: {
        [ProductShelf.CASH]?: number; // 现金售价
        [ProductShelf.POINTS]?: number; // 积分售价
    };
    promoIds?: string[]; // 绑定的促销活动ID数组
}

interface User {
    shortName: string;
    points: number; // 可为负数
    debt: number; // 欠款(正数=欠我, 负数=我欠)
}

interface OtherLog {
    id: string;
    timestamp: Date;
    type:
        | "budget_adjust"
        | "debt_adjust"
        | "points_adjust"
        | "inventory_adjust";
    amount: number;
    reason: string;
    userShortName?: string; // 用户相关操作的用户名
    productId?: string; // 库存相关操作的商品ID
}

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

interface StoreData {
    users: User[];
    products: Product[];
    orders: Order[];
    refunds: RefundOrder[];
    otherLogs: OtherLog[]; // 替换 budgetLogs，记录所有手动操作
    promotions: Promotion[];
}

interface PrivacyMap {
    [shortName: string]: string; // shortName -> RealName
}

// ===================== 系统主类 =====================

class DormStoreSystem {
    private data!: StoreData;
    private privacyMap!: PrivacyMap;
    private memberConfig!: MemberConfig;
    private rl: readline.Interface;
    private dataPath: string;
    private privacyPath: string;
    private memberConfigPath: string;
    private logPath: string;
    private productsPath: string;
    private promotionsPath: string;
    private systemStartTime: Date;

    constructor() {
        // 记录系统启动时间，用于会话统计
        this.systemStartTime = new Date();

        this.dataPath = path.resolve(
            process.cwd(),
            config.DATA_DIR,
            "store_data.json",
        );
        this.privacyPath = path.resolve(
            process.cwd(),
            config.DATA_DIR,
            "privacy_map.json",
        );
        this.memberConfigPath = path.resolve(
            process.cwd(),
            config.DATA_DIR,
            "member_config.json",
        );
        this.logPath = path.resolve(
            process.cwd(),
            config.DATA_DIR,
            "change_logs.json",
        );
        this.productsPath = path.resolve(
            process.cwd(),
            config.DATA_DIR,
            "products.json",
        );

        this.promotionsPath = path.resolve(
            process.cwd(),
            config.DATA_DIR,
            "promotions.json",
        );
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        this.init();
    }

    private async init(): Promise<void> {
        await this.loadAllData();
    }

    // --- 数据加载与保存 ---

    private async loadAllData(): Promise<void> {
        try {
            if (fs.existsSync(this.dataPath)) {
                const raw = fs.readFileSync(this.dataPath, "utf-8");
                this.data = JSON.parse(raw);
                // 日期数据恢复
                this.data.orders.forEach(
                    o => (o.timestamp = new Date(o.timestamp)),
                );
                this.data.refunds.forEach(
                    r => (r.timestamp = new Date(r.timestamp)),
                );
                if (this.data.otherLogs) {
                    this.data.otherLogs.forEach(
                        l => (l.timestamp = new Date(l.timestamp)),
                    );
                }
                // 不再需要处理memberExpiryDate，因为我们不再存储它
                this.data.users.forEach(u => {
                    // 清理可能存在的旧字段
                    delete (u as any).isMember;
                    delete (u as any).memberExpiryDate;
                    delete (u as any).lastRenewalDate;
                });
            } else {
                this.data = this.getEmptyData();
                this.saveData();
            }

            // 从单独文件加载products数据
            if (fs.existsSync(this.productsPath)) {
                const productsRaw = fs.readFileSync(this.productsPath, "utf-8");
                const productsData = JSON.parse(productsRaw);
                this.data.products = productsData.data;
            } else {
                this.data.products = [];
                this.saveProductsData();
            }

            // 抽奖功能已禁用，无需加载pools数据

            // 从单独文件加载promotions数据
            if (fs.existsSync(this.promotionsPath)) {
                const promotionsRaw = fs.readFileSync(
                    this.promotionsPath,
                    "utf-8",
                );
                const promotionsData = JSON.parse(promotionsRaw);
                this.data.promotions = promotionsData.data;
            } else {
                this.data.promotions = [];
                this.savePromotionsData();
            }

            if (fs.existsSync(this.privacyPath)) {
                this.privacyMap = JSON.parse(
                    fs.readFileSync(this.privacyPath, "utf-8"),
                );
            } else {
                this.privacyMap = {};
                this.savePrivacyMap();
            }

            // 加载会员配置
            if (fs.existsSync(this.memberConfigPath)) {
                const memberConfigRaw = fs.readFileSync(
                    this.memberConfigPath,
                    "utf-8",
                );
                this.memberConfig = JSON.parse(memberConfigRaw);
            } else {
                // 使用默认配置
                this.memberConfig = {
                    description:
                        "会员配置：手动指定的正式会员有效期、特殊用户、积分倍率和降级提醒规则",
                    members: {},
                    specialUsers: [],
                    pointRates: {
                        SPECIAL: 0,
                        TRAINEE: 0.2,
                        OFFICIAL: 1.0,
                    },
                };
                this.saveMemberConfig();
            }
        } catch (error) {
            console.error(`数据加载失败: ${error}`);
            console.log("检测到JSON文件可能损坏或格式错误！");

            // 二次确认是否使用默认模板覆盖
            const confirm = await this.ask(
                "是否使用默认模板覆盖现有数据？这是一个高危操作，将导致所有现有数据丢失！(y/N): ",
            );

            if (
                confirm.toLowerCase() === "y" ||
                confirm.toLowerCase() === "yes"
            ) {
                console.log("正在使用默认模板覆盖数据...");
                this.data = this.getEmptyData();
                this.privacyMap = {};
                this.saveData();
                this.savePrivacyMap();
                console.log("数据已重置为默认模板。");
            } else {
                console.log("用户取消了数据重置操作。程序将退出。");
                process.exit(1);
            }
        }
    }

    private getEmptyData(): StoreData {
        return {
            users: [],
            products: [],
            orders: [],
            refunds: [],
            otherLogs: [], // 替换 budgetLogs
            promotions: [],
        };
    }

    private saveData(): void {
        try {
            // 保存除products和promotions外的数据
            const dataToSave = {
                ...this.data,
                products: undefined,
                promotions: undefined,
            };
            // 移除undefined属性
            delete dataToSave.products;
            delete dataToSave.promotions;

            const content = JSON.stringify(dataToSave, null, 2);
            fs.writeFileSync(this.dataPath, content);

            // 保存products到单独文件
            this.saveProductsData();

            // 保存promotions到单独文件
            this.savePromotionsData();
        } catch (e) {
            console.error("保存数据失败:", e);
        }
    }

    private saveProductsData(): void {
        try {
            const content = JSON.stringify(
                {
                    $schema: "../schemas/product-schema.json",
                    data: this.data.products,
                },
                null,
                2,
            );
            fs.writeFileSync(this.productsPath, content);
        } catch (e) {
            console.error("保存products数据失败:", e);
        }
    }

    // 抽奖功能已禁用，无需保存pools数据

    private savePromotionsData(): void {
        try {
            const content = JSON.stringify(
                {
                    $schema: "../schemas/promotion-schema.json",
                    data: this.data.promotions,
                },
                null,
                2,
            );
            fs.writeFileSync(this.promotionsPath, content);
        } catch (e) {
            console.error("保存promotions数据失败:", e);
        }
    }

    private savePrivacyMap(): void {
        fs.writeFileSync(
            this.privacyPath,
            JSON.stringify(this.privacyMap, null, 2),
        );
    }

    private saveMemberConfig(): void {
        fs.writeFileSync(
            this.memberConfigPath,
            JSON.stringify(this.memberConfig, null, 2),
        );
    }

    private saveChangeLog(logEntry: object): void {
        const logs = fs.existsSync(this.logPath)
            ? JSON.parse(fs.readFileSync(this.logPath, "utf-8"))
            : [];
        logs.push(logEntry);
        fs.writeFileSync(this.logPath, JSON.stringify(logs, null, 2));
    }

    /**
     * 计算商品的当前库存
     * 基于初始库存 - 已售出数量 + 已退款数量
     */
    private calculateCurrentStock(productId: string): number {
        const product = this.data.products.find(p => p.id === productId);
        if (!product) return 0;

        // 初始库存
        let currentStock = product.initialStock;

        // 减去所有已售出的数量
        this.data.orders
            .filter(o => o.productId === productId)
            .forEach(o => {
                currentStock -= o.quantity;
            });

        // 加上所有已退款的数量（直接使用退款数量，不再计算比例）
        this.data.refunds.forEach(r => {
            const originalOrder = this.data.orders.find(
                o => o.id === r.originalOrderId,
            );
            if (originalOrder && originalOrder.productId === productId) {
                // 直接使用退款数量，避免比例计算错误
                currentStock += r.quantity;
            }
        });

        // 检查库存是否为负，如果是则发出警告
        if (currentStock < 0) {
            const product = this.data.products.find(p => p.id === productId);
            console.warn(
                `⚠️ 警告：商品 ${product?.name} (${productId}) 库存出现负数: ${currentStock}`,
            );
            console.warn(`   请检查订单和退款记录是否存在数据不一致`);
        }

        return currentStock; // 返回实际计算结果，允许负数以便发现问题
    }

    // --- 辅助函数 ---

    private getRealName(shortName: string): string {
        return this.privacyMap[shortName] || "未知用户";
    }

    private generateId(prefix: string = "ORD"): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const seconds = String(now.getSeconds()).padStart(2, "0");
        const milliseconds = String(now.getMilliseconds()).padStart(3, "0");
        const random = String(Math.floor(Math.random() * 100)).padStart(2, "0");
        return `${prefix}${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}${random}`;
    }

    private ask(question: string): Promise<string> {
        return new Promise(resolve => this.rl.question(question, resolve));
    }

    // --- 核心业务逻辑 ---

    /**
     * 动态计算活动预算
     * 财务逻辑重写：活动预算现在仅由otherLogs中类型为budget_adjust的记录构成
     * 预算定义：活动预算仅用于未来"积分抽奖"功能的中奖成本扣除，目前不允许任何订单自动扣除它
     */
    public getActivityBudget(): number {
        let budget = 0;
        // 仅由otherLogs中budget_adjust类型的记录构成预算
        this.data.otherLogs.forEach(log => {
            if (log.type === "budget_adjust") {
                if (log.amount > 0) budget += log.amount;
                if (log.amount < 0) budget -= Math.abs(log.amount);
            }
        });
        // 删除所有关于"订单利润"的自动计算逻辑
        return budget;
    }

    /**
     * 获取上周日的日期
     * @returns 上周日的日期对象（0点0分0秒）
     */
    private getLastSunday(date: Date = new Date()): Date {
        const now = new Date(date);
        const dayOfWeek = now.getDay();
        const daysSinceSunday = dayOfWeek === 0 ? 7 : dayOfWeek; // 如果今天是周日，则从上周日开始
        const lastSunday = new Date(now);
        lastSunday.setDate(now.getDate() - daysSinceSunday);
        lastSunday.setHours(0, 0, 0, 0); // 设置为上周日的0点0分0秒
        return lastSunday;
    }

    /**
     * 计算用户每周消费额（不计入已退款订单）
     * 从指定的周日开始计算到指定的结束日期
     */
    private calculateWeeklySpend(
        userShortName: string,
        weekStart: Date,
        weekEnd: Date,
    ): number {
        // 获取用户所有现金订单
        const userCashOrders = this.data.orders.filter(
            o =>
                o.userShortName === userShortName &&
                o.type === "cash" &&
                o.timestamp >= weekStart &&
                o.timestamp < weekEnd,
        );

        // 计算每个订单的实际有效金额（扣除退款部分）
        const effectiveSpend = userCashOrders.reduce((total, order) => {
            // 找到该订单的所有退款
            const orderRefunds = this.data.refunds.filter(
                r => r.originalOrderId === order.id,
            );

            // 计算该订单的总退款金额
            const totalRefund = orderRefunds.reduce(
                (refundTotal, r) => refundTotal + (r.refundCash || 0),
                0,
            );

            // 计算该订单的实际有效金额
            const effectiveAmount = Math.max(0, order.paidCash - totalRefund);

            return total + effectiveAmount;
        }, 0);

        return effectiveSpend;
    }

    /**
     * 计算用户在指定参考日期之前的滑动窗口天数内的总现金消费额（扣除退款）
     * @param userShortName 用户简称
     * @param referenceDate 参考日期，默认为当前时间
     * @returns 窗口内的总消费金额
     */
    private getUserTotalSpendInWindow(
        userShortName: string,
        referenceDate: Date = new Date(),
    ): number {
        // 计算滑动窗口的起始日期
        const lookbackDate = new Date(referenceDate);
        lookbackDate.setDate(
            referenceDate.getDate() - config.MEMBER.NEW_RULE.LOOKBACK_DAYS,
        );

        // 获取用户在这段时间内的所有现金订单
        const userOrdersInPeriod = this.data.orders.filter(
            o =>
                o.userShortName === userShortName &&
                o.type === "cash" &&
                new Date(o.timestamp) >= lookbackDate &&
                new Date(o.timestamp) <= referenceDate,
        );

        // 计算这些订单的总金额（扣除退款）
        let totalSpendInPeriod = userOrdersInPeriod.reduce((total, order) => {
            // 找到该订单的所有退款
            const orderRefunds = this.data.refunds.filter(
                r => r.originalOrderId === order.id,
            );

            // 计算该订单的总退款金额
            const totalRefund = orderRefunds.reduce(
                (refundTotal, r) => refundTotal + (r.refundCash || 0),
                0,
            );

            // 计算该订单的实际有效金额
            const effectiveAmount = Math.max(0, order.paidCash - totalRefund);

            return total + effectiveAmount;
        }, 0);

        return totalSpendInPeriod;
    }

    /**
     * 获取用户的会员等级
     * @param userShortName 用户简称
     * @param referenceDate 用于判断的参考日期，默认为当前时间
     * @returns 会员等级：'SPECIAL'（特殊用户）、'OFFICIAL'（正式会员）或 'TRAINEE'（见习会员）
     */
    private getUserMemberLevel(
        userShortName: string,
        referenceDate: Date = new Date(),
    ): MemberLevel {
        // 首先检查是否为特殊用户
        if (this.memberConfig.specialUsers.includes(userShortName)) {
            return "SPECIAL";
        }

        // 然后检查是否为正式会员
        if (this.isUserMember(userShortName, referenceDate)) {
            return "OFFICIAL";
        }

        // 否则为见习会员（所有用户都有见习会员权限）
        return "TRAINEE";
    }

    /**
     * 检查用户当前是否是会员
     * @param userShortName 用户简称
     * @param referenceDate 用于判断的参考日期，默认为当前时间
     */
    private isUserMember(
        userShortName: string,
        referenceDate: Date = new Date(),
    ): boolean {
        // 首先检查是否为特殊用户或手动指定的会员
        if (this.memberConfig.specialUsers.includes(userShortName)) {
            return true;
        }

        // 检查是否为手动指定的正式会员
        if (this.memberConfig.members[userShortName]) {
            const manualExpiryDate = new Date(
                this.memberConfig.members[userShortName],
            );
            if (manualExpiryDate > referenceDate) {
                return true;
            }
        }

        // 基于滑动窗口消费额判断会员身份
        if (config.MEMBER.NEW_RULE.ENABLED) {
            const totalSpend = this.getUserTotalSpendInWindow(
                userShortName,
                referenceDate,
            );
            return totalSpend >= config.MEMBER.NEW_RULE.TRIGGER_AMOUNT;
        }

        return false;
    }

    /**
     * 检查用户会员状态变化并给出提示
     * 不再存储会员状态，而是实时计算
     */
    private checkAndNotifyMembershipChange(userShortName: string): boolean {
        const now = new Date();
        let statusChanged = false;
        const memberLevel = this.getUserMemberLevel(userShortName, now);

        // 计算当前滑动窗口内的消费总额
        const totalSpendInWindow = this.getUserTotalSpendInWindow(
            userShortName,
            now,
        );

        // 显示当前消费总额和会员状态
        console.log(
            `📊 用户 ${userShortName} 近${config.MEMBER.NEW_RULE.LOOKBACK_DAYS}天消费总额: ￥${totalSpendInWindow.toFixed(2)} (会员门槛: ￥${config.MEMBER.NEW_RULE.TRIGGER_AMOUNT})`,
        );

        // 检查手动指定的会员状态
        if (this.memberConfig.members[userShortName]) {
            const manualExpiryDate = new Date(
                this.memberConfig.members[userShortName],
            );
            if (manualExpiryDate > now) {
                console.log(
                    `🎖️ 用户 ${userShortName} 拥有手动指定的会员权限，有效期至: ${manualExpiryDate.toLocaleDateString()}`,
                );
                statusChanged = true;
            }
        }

        // 显示会员等级
        if (memberLevel === "SPECIAL") {
            console.log(`⭐ 用户 ${userShortName} 是特殊用户`);
            statusChanged = true;
        } else if (memberLevel === "OFFICIAL") {
            console.log(`👑 用户 ${userShortName} 是正式会员`);
            statusChanged = true;

            // 检查是否即将有大额订单"滚出窗口"
            this.checkUpcomingOrdersExpiring(userShortName, now);
        } else {
            console.log(`👤 用户 ${userShortName} 是见习会员`);
            statusChanged = true;

            // 检查是否接近会员门槛
            if (
                totalSpendInWindow > 0 &&
                totalSpendInWindow < config.MEMBER.NEW_RULE.TRIGGER_AMOUNT &&
                config.MEMBER.NEW_RULE.TRIGGER_AMOUNT - totalSpendInWindow <= 5
            ) {
                console.log(
                    `💡 提示：用户 ${userShortName} 距离会员门槛还差 ￥${(config.MEMBER.NEW_RULE.TRIGGER_AMOUNT - totalSpendInWindow).toFixed(2)}，鼓励消费可升级为正式会员！`,
                );
            }
        }

        return statusChanged;
    }

    /**
     * 检查即将滚出窗口的大额订单
     */
    private checkUpcomingOrdersExpiring(
        userShortName: string,
        currentDate: Date,
    ): void {
        // 计算窗口边界日期
        const windowStartDate = new Date(currentDate);
        windowStartDate.setDate(
            currentDate.getDate() - config.MEMBER.NEW_RULE.LOOKBACK_DAYS,
        );

        // 计算即将滚出窗口的日期（1天后）
        const nextDay = new Date(currentDate);
        nextDay.setDate(currentDate.getDate() + 1);

        // 获取用户即将滚出窗口的订单（timestamp在窗口开始日期到窗口开始日期+1天之间）
        const expiringOrders = this.data.orders.filter(
            o =>
                o.userShortName === userShortName &&
                o.type === "cash" &&
                new Date(o.timestamp) >= windowStartDate &&
                new Date(o.timestamp) <
                    new Date(windowStartDate.getTime() + 24 * 60 * 60 * 1000), // 窗口开始日期+1天
        );

        // 计算即将滚出订单的总金额（扣除退款）
        const expiringOrdersValue = expiringOrders.reduce((total, order) => {
            // 找到该订单的所有退款
            const orderRefunds = this.data.refunds.filter(
                r => r.originalOrderId === order.id,
            );

            // 计算该订单的总退款金额
            const totalRefund = orderRefunds.reduce(
                (refundTotal, r) => refundTotal + (r.refundCash || 0),
                0,
            );

            // 计算该订单的实际有效金额
            const effectiveAmount = Math.max(0, order.paidCash - totalRefund);

            return total + effectiveAmount;
        }, 0);

        // 计算当前总消费额
        const currentTotalSpend = this.getUserTotalSpendInWindow(
            userShortName,
            currentDate,
        );

        // 如果有订单即将滚出窗口，且滚出后可能导致不满足会员条件，且当前是会员
        if (
            expiringOrdersValue > 0 &&
            currentTotalSpend >= config.MEMBER.NEW_RULE.TRIGGER_AMOUNT &&
            currentTotalSpend - expiringOrdersValue <
                config.MEMBER.NEW_RULE.TRIGGER_AMOUNT
        ) {
            console.log(
                `⚠️ 警告：用户 ${userShortName} 明天将有价值 ￥${expiringOrdersValue.toFixed(2)} 的订单滚出窗口，可能导致会员身份降级！`,
            );
        }
    }

    /**
     * 会员状态检查与经营提示
     * 在每次加载用户数据或进入经营模式时调用
     */
    private checkMembershipStatus(): void {
        const now = new Date();
        this.data.users.forEach(user => {
            const memberLevel = this.getUserMemberLevel(user.shortName, now);
            const totalSpendInWindow = this.getUserTotalSpendInWindow(
                user.shortName,
                now,
            );

            // 显示用户当前状态
            const memberStatusText =
                memberLevel === "SPECIAL"
                    ? "特殊用户"
                    : memberLevel === "OFFICIAL"
                      ? "正式会员"
                      : "见习会员";

            console.log(
                `用户 ${user.shortName}: ${memberStatusText} (近${config.MEMBER.NEW_RULE.LOOKBACK_DAYS}天消费: ￥${totalSpendInWindow.toFixed(2)})`,
            );

            // 对正式会员进行经营提示
            if (memberLevel === "OFFICIAL") {
                // 检查是否即将有大额订单"滚出窗口"
                this.checkUpcomingOrdersExpiring(user.shortName, now);
            }
            // 对见习会员进行升级提示
            else if (memberLevel === "TRAINEE") {
                // 检查是否接近会员门槛
                if (
                    totalSpendInWindow > 0 &&
                    totalSpendInWindow <
                        config.MEMBER.NEW_RULE.TRIGGER_AMOUNT &&
                    config.MEMBER.NEW_RULE.TRIGGER_AMOUNT -
                        totalSpendInWindow <=
                        5
                ) {
                    console.log(
                        `💡 经营提示：用户 ${user.shortName} 距离会员门槛还差 ￥${(config.MEMBER.NEW_RULE.TRIGGER_AMOUNT - totalSpendInWindow).toFixed(2)}，鼓励消费可升级为正式会员！`,
                    );
                }
            }
        });
    }

    /**
     * 生成校验码
     */
    private generateVerifyCode(
        orderId: string,
        paidCash: number,
        paidPoints: number,
        rewardPoints: number,
    ): string {
        const str =
            config.SALT + orderId + paidCash + paidPoints + rewardPoints;
        return crypto
            .createHash("sha1")
            .update(str)
            .digest("hex")
            .substring(0, 6)
            .toUpperCase();
    }

    // ===================== 经营模式 =====================

    public async runBusinessMode(): Promise<void> {
        this.checkMembershipStatus(); // 检查会员状态
        console.log("\n=== 🛒 经营模式 ===");

        let shortName = await this.ask("请输入顾客简称 (输入 . 创建新用户): ");

        // 查找用户，如果找不到则自动进入创建流程
        let user = this.data.users.find(u => u.shortName === shortName);

        // 新用户创建逻辑
        if (shortName === "." || shortName === "。") {
            const realName = await this.ask("请输入真实姓名: ");
            shortName = await this.ask("请输入简称 (唯一ID): ");

            // 验证关键信息不能为空
            if (!realName.trim()) {
                console.log("❌ 真实姓名不能为空！");
                return;
            }
            if (!shortName.trim()) {
                console.log("❌ 简称不能为空！");
                return;
            }

            // 验证简称唯一性
            if (this.data.users.find(u => u.shortName === shortName)) {
                console.log("❌ 简称已存在！");
                return;
            }

            const newUser: User = {
                shortName,
                points: 0,
                debt: 0,
            };
            this.data.users.push(newUser);
            this.privacyMap[shortName] = realName;
            this.saveData();
            this.savePrivacyMap();
            console.log("✅ 用户创建成功！");
            user = newUser;
        } else if (!user) {
            // 找不到用户时，先询问确认是否创建新用户
            const confirmCreate = await this.ask(
                `用户 "${shortName}" 不存在，是否创建新用户？(y/n): `,
            );
            if (confirmCreate.toLowerCase() !== "y") {
                console.log("❌ 已取消创建新用户");
                return;
            }

            const realName = await this.ask("请输入真实姓名: ");

            // 验证关键信息不能为空
            if (!realName.trim()) {
                console.log("❌ 真实姓名不能为空！");
                return;
            }

            const newUser: User = {
                shortName,
                points: 0,
                debt: 0,
            };
            this.data.users.push(newUser);
            this.privacyMap[shortName] = realName;
            this.saveData();
            this.savePrivacyMap();
            console.log("✅ 用户创建成功！");
            user = newUser;
        }

        // 会员状态展示
        const memberLevel = this.getUserMemberLevel(user.shortName);
        const totalSpendInWindow = this.getUserTotalSpendInWindow(
            user.shortName,
        );

        // 显示会员状态和消费情况
        const memberStatusText =
            memberLevel === "SPECIAL"
                ? "特殊用户"
                : memberLevel === "OFFICIAL"
                  ? "正式会员"
                  : "见习会员";

        console.log(
            `会员状态: ${memberStatusText} (近${config.MEMBER.NEW_RULE.LOOKBACK_DAYS}天消费: ￥${totalSpendInWindow.toFixed(2)})`,
        );

        // 对见习会员进行升级提示
        if (memberLevel === "TRAINEE") {
            const remainingAmount =
                config.MEMBER.NEW_RULE.TRIGGER_AMOUNT - totalSpendInWindow;
            if (remainingAmount > 0 && remainingAmount <= 5) {
                console.log(
                    `\x1b[33m💡 提示：距离会员门槛还差 ￥${remainingAmount.toFixed(2)}，鼓励消费可升级为正式会员！\x1b[0m`,
                );
            }
        }
        while (true) {
            console.log(
                `\n当前顾客: ${user.shortName} | 积分: ${user.points} | 欠款: ${user.debt}`,
            );
            console.log("1. 现金购物  2. 积分商城  3. 返回");
            const opt = await this.ask("请选择: ");

            if (opt === "1") await this.handleCashPurchase(user);
            else if (opt === "2") await this.handlePointsPurchase(user);
            else {
                // 退出经营模式前，展示当前累计实付现金（不含积分）
                this.showCurrentSessionCashRevenue(user.shortName);
                break;
            }
        }
    }

    /**
     * 展示当前会话累计实付现金（不含积分）
     * @param userShortName 用户简称
     */
    private showCurrentSessionCashRevenue(userShortName: string): void {
        console.log("\n=== 💰 当前会话累计实付现金 ===");

        // 使用系统启动时间作为会话开始时间
        const sessionStartTime = this.systemStartTime;

        // 计算当前用户在当前会话中的现金订单实付总额
        const cashOrders = this.data.orders.filter(
            order =>
                order.userShortName === userShortName &&
                order.type === "cash" &&
                order.timestamp >= sessionStartTime,
        );

        // 计算实付现金总额（扣除退款）
        let totalPaidCash = 0;

        cashOrders.forEach(order => {
            // 找到该订单的所有退款
            const orderRefunds = this.data.refunds.filter(
                refund => refund.originalOrderId === order.id,
            );

            // 计算该订单的总退款金额
            const totalRefund = orderRefunds.reduce(
                (sum, refund) => sum + refund.refundCash,
                0,
            );

            // 计算该订单的实际有效金额
            const effectiveAmount = Math.max(0, order.paidCash - totalRefund);
            totalPaidCash += effectiveAmount;
        });

        console.log(
            `用户: ${userShortName} (${this.getRealName(userShortName)})`,
        );
        console.log(`当前会话累计实付现金: ￥${totalPaidCash.toFixed(2)}`);

        if (cashOrders.length > 0) {
            console.log(`订单数量: ${cashOrders.length} 单`);

            // 显示订单详情（可选）
            console.log("\n订单详情:");
            cashOrders.forEach(order => {
                const orderRefunds = this.data.refunds.filter(
                    refund => refund.originalOrderId === order.id,
                );
                const totalRefund = orderRefunds.reduce(
                    (sum, refund) => sum + refund.refundCash,
                    0,
                );
                const effectiveAmount = Math.max(
                    0,
                    order.paidCash - totalRefund,
                );

                console.log(
                    `  ${order.productName} x ${order.quantity} - 实付: ￥${effectiveAmount.toFixed(2)}`,
                );
            });
        } else {
            console.log("当前会话无现金订单");
        }
    }

    // --- 现金购物 ---
    private async handleCashPurchase(user: User): Promise<void> {
        console.log("\n--- 现金货架 ---");
        // 过滤出有现金价格的商品
        const cashProducts = this.data.products.filter(
            p => p.prices[ProductShelf.CASH],
        );
        cashProducts.forEach((p, index) => {
            console.log(
                `[${index + 1}] [${p.id}] ${p.name} - ￥${
                    p.prices[ProductShelf.CASH]
                } (库存: ${this.calculateCurrentStock(p.id)})`,
            );
        });

        const input = await this.ask("输入商品ID/序号: ");
        let prod: Product | undefined;

        // 尝试将输入解析为数字（序号）
        const index = parseInt(input);
        if (!isNaN(index) && index >= 1 && index <= cashProducts.length) {
            prod = cashProducts[index - 1];
        } else {
            // 否则尝试作为ID查找
            prod = this.data.products.find(p => p.id === input);
        }

        if (!prod || !prod.prices[ProductShelf.CASH]) {
            console.log("无效商品ID/序号。");
            return;
        }

        const qtyStr = await this.ask("输入数量: ");
        const qty = parseInt(qtyStr);
        if (isNaN(qty) || qty <= 0) {
            console.log("数量需要是正整数。");
            return;
        }
        const currentStock = this.calculateCurrentStock(prod.id);
        if (qty > currentStock) {
            console.log("库存不足！");
            return;
        }

        const totalCost = prod.prices[ProductShelf.CASH] * qty;
        const totalCostValue = prod.cost * qty; // 实际成本

        // 计算奖励积分
        let rewardPoints = 0;
        // 使用订单创建时间来判断会员状态，而不是系统当前时间
        const orderCreationTime = new Date();

        // 无论正式会员还是见习会员都能获得积分，只是倍率不同
        rewardPoints = this.calculateRewardPoints(
            user,
            prod,
            qty,
            totalCost,
            orderCreationTime,
        );

        // 拦截逻辑：检查积分上限
        if (rewardPoints > 0 && user.points >= config.MAX_POINTS) {
            console.log(
                `❌ 积分已达上限（${config.MAX_POINTS}），请先消耗积分后再购买此类商品`,
            );
            return;
        }

        // 展示详细订单信息
        console.log("\n=== 📋 订单详情 ===");
        console.log(`商品: ${prod.name}`);
        console.log(`数量: ${qty}`);
        console.log(`单价: ￥${prod.prices[ProductShelf.CASH]!.toFixed(2)}`);
        console.log(
            `优惠: ${rewardPoints > 0 ? `赠送 ${rewardPoints} 积分` : "无"}`,
        );
        console.log(`总金额: ￥${totalCost.toFixed(2)}`);
        console.log(`\n=== 💰 顾客资产 ===`);
        console.log(`当前积分: ${user.points}`);
        console.log(`当前欠款: ${user.debt}`);
        console.log(`应付金额: ￥${totalCost.toFixed(2)}`);

        // 要求用户确认
        const confirm = await this.ask("\n确认购买？(Y/N): ");
        if (confirm.toUpperCase() !== "Y") {
            console.log("❌ 购买已取消");
            return;
        }

        // 下单逻辑
        const orderId = this.generateId("CASH");
        const memberLevel = this.getUserMemberLevel(user.shortName);

        // 特殊用户实付金额强制设为0
        const finalPaidCash = memberLevel === "SPECIAL" ? 0 : totalCost;

        const order: Order = {
            id: orderId,
            timestamp: new Date(),
            userShortName: user.shortName,
            productId: prod.id,
            productName: prod.name,
            quantity: qty,
            cost: totalCostValue, // 记录成本
            paidCash: finalPaidCash, // 特殊用户实付为0
            paidPoints: 0,
            rewardPoints: rewardPoints,
            type: "cash",
        };

        // 更新数据
        // prod.stock -= qty; // 不再直接更新库存，库存基于订单历史计算
        // 取消Math.min的截断限制，允许积分超过上限（作为记录）
        user.points = user.points + rewardPoints;

        this.data.orders.push(order);
        this.saveData();
        this.saveChangeLog({
            operation: "cash_purchase",
            orderId,
            user: user.shortName,
            timestamp: new Date(),
        });

        const verifyCode = this.generateVerifyCode(
            orderId,
            finalPaidCash, // 使用调整后的实付金额
            0,
            rewardPoints,
        );
        console.log("✅ 购买成功！");
        console.log(`订单号: ${orderId}`);
        console.log(`校验码: ${verifyCode}`);
        console.log(`\n=== 🧾 手写小票校验数据 ===`);
        console.log(`订单号: ${orderId}`);
        console.log(`现金支付: ${finalPaidCash.toFixed(2)}`);
        console.log(`积分支付: 0`);
        console.log(`奖励积分: ${rewardPoints}`);
        console.log(`校验码: ${verifyCode}`);
        console.log(`(如需赊账，请前往管理模式手动记录)`);

        // 检查并通知会员状态变化
        this.checkAndNotifyMembershipChange(user.shortName);
    }

    // --- 促销活动计算 ---
    private calculateRewardPoints(
        user: User,
        product: Product,
        quantity: number,
        totalAmount: number,
        orderCreationTime: Date,
    ): number {
        if (!product.promoIds || product.promoIds.length === 0) {
            return 0;
        }

        // 获取该商品参与的所有促销活动
        const applicablePromotions = product.promoIds
            .map(promoId => this.data.promotions.find(p => p.id === promoId))
            .filter((p): p is Promotion => p !== undefined)
            .filter(p => p.isMemberOnly);

        if (applicablePromotions.length === 0) {
            return 0;
        }

        // 移除每周限购逻辑，直接使用全部数量计算奖励积分
        const eligibleQuantity = quantity;

        // 计算每个促销活动的奖励积分
        const rewards = applicablePromotions.map(promo => {
            let reward = 0;

            if (promo.type === "quantity_based") {
                // 按数量计算奖励
                const fullSets = Math.floor(eligibleQuantity / promo.threshold);
                reward = fullSets * promo.rewardPoints;
            } else if (promo.type === "amount_based") {
                // 按金额计算奖励（防御性编程：避免除零错误）
                const eligibleAmount =
                    quantity === 0
                        ? 0
                        : (totalAmount / quantity) * eligibleQuantity;
                const fullSets = Math.floor(eligibleAmount / promo.threshold);
                reward = fullSets * promo.rewardPoints;
            }

            return {
                promoId: promo.id,
                promoName: promo.name,
                rewardPoints: reward,
            };
        });

        // 选择奖励最高的促销活动
        if (rewards.length === 0) {
            return 0;
        }

        const bestReward = rewards.reduce((max, current) =>
            current.rewardPoints > max.rewardPoints ? current : max,
        );

        // 根据会员等级应用不同的积分倍率
        const memberLevel = this.getUserMemberLevel(
            user.shortName,
            orderCreationTime,
        );

        // 使用配置中的积分倍率
        const multiplier = this.memberConfig.pointRates[memberLevel] || 0;

        // 确保倍率不为负数
        const safeMultiplier = Math.max(0, multiplier);

        const finalRewardPoints = bestReward.rewardPoints * safeMultiplier;

        console.log(
            `应用促销活动: ${
                bestReward.promoName
            } - 获得 ${finalRewardPoints} 积分 (${
                memberLevel === "OFFICIAL"
                    ? "正式会员"
                    : memberLevel === "SPECIAL"
                      ? "特殊用户"
                      : "见习会员"
            }倍率: ${multiplier * 100}%)`,
        );

        return finalRewardPoints;
    }

    // --- 积分商城 ---
    private async handlePointsPurchase(user: User): Promise<void> {
        const memberLevel = this.getUserMemberLevel(user.shortName);
        // 特殊用户无法参与积分兑换
        if (memberLevel === "SPECIAL") {
            console.log("❌ 特殊用户无法参与积分兑换");
            return;
        }

        console.log("\n--- 积分商城 ---");
        // 过滤出有积分价格的商品
        const pointsProducts = this.data.products.filter(
            p => p.prices[ProductShelf.POINTS],
        );
        pointsProducts.forEach((p, index) => {
            const pointsPrice = p.prices[ProductShelf.POINTS];
            if (pointsPrice !== undefined) {
                console.log(
                    `[${index + 1}] [${p.id}] ${p.name} - ${pointsPrice.toFixed(
                        2,
                    )} 积分 (库存: ${this.calculateCurrentStock(p.id)})`,
                );
            }
        });

        const input = await this.ask("输入商品ID/序号: ");
        let prod: Product | undefined;

        // 尝试将输入解析为数字（序号）
        const index = parseInt(input);
        if (!isNaN(index) && index >= 1 && index <= pointsProducts.length) {
            prod = pointsProducts[index - 1];
        } else {
            // 否则尝试作为ID查找
            prod = this.data.products.find(p => p.id === input);
        }

        if (!prod || !prod.prices[ProductShelf.POINTS]) {
            console.log("无效商品ID/序号。");
            return;
        }

        const qtyStr = await this.ask("输入数量: ");
        const qty = parseInt(qtyStr);
        if (isNaN(qty) || qty <= 0) {
            console.log("数量需要是正整数。");
            return;
        }
        const currentStock = this.calculateCurrentStock(prod.id);
        if (qty > currentStock) {
            console.log("库存不足！");
            return;
        }

        const totalPrice = prod.prices[ProductShelf.POINTS] * qty;
        const totalCostValue = prod.cost * qty; // 这里的cost是人民币成本，积分利润 = 积分 - 成本

        // 展示详细订单信息
        console.log("\n=== 📋 订单详情 ===");
        console.log(`商品: ${prod.name}`);
        console.log(`数量: ${qty}`);
        console.log(
            `单价: ${prod.prices[ProductShelf.POINTS]!.toFixed(2)} 积分`,
        );
        console.log(`总积分: ${totalPrice.toFixed(2)}`);
        console.log(`\n=== 💰 顾客资产 ===`);
        console.log(`当前积分: ${user.points}`);
        console.log(`当前欠款: ${user.debt}`);
        console.log(`需消耗积分: ${totalPrice.toFixed(2)}`);

        // 要求用户确认
        const confirm = await this.ask("\n确认兑换？(Y/N): ");
        if (confirm.toUpperCase() !== "Y") {
            console.log("❌ 兑换已取消");
            return;
        }

        if (user.points < totalPrice) {
            console.log("❌ 积分不足");
            return;
        }

        // 扣除积分
        user.points -= totalPrice;
        // 不需要直接更新库存，库存基于订单历史计算

        const orderId = this.generateId("PTS");
        const order: Order = {
            id: orderId,
            timestamp: new Date(),
            userShortName: user.shortName,
            productId: prod.id,
            productName: prod.name,
            quantity: qty,
            cost: totalCostValue, // 人民币成本
            paidCash: 0,
            paidPoints: totalPrice,
            rewardPoints: 0,
            type: "points",
        };

        this.data.orders.push(order);
        this.saveData();
        const verifyCode = this.generateVerifyCode(orderId, 0, totalPrice, 0);
        console.log("✅ 兑换成功！");
        console.log(`订单号: ${orderId}`);
        console.log(`校验码: ${verifyCode}`);
        console.log(`
=== 🧾 手写小票校验数据 ===`);
        console.log(`订单号: ${orderId}`);
        console.log(`现金支付: 0`);
        console.log(`积分支付: ${totalPrice.toFixed(2)}`);
        console.log(`奖励积分: 0`);
        console.log(`校验码: ${verifyCode}`);

        // 检查并通知会员状态变化
        this.checkAndNotifyMembershipChange(user.shortName);
    }

    // --- 积分抽奖 ---
    // 抽奖功能已禁用

    // ===================== 管理模式 =====================

    public async runAdminMode(): Promise<void> {
        while (true) {
            console.log("\n=== 🔧 管理模式 ===");
            console.log(
                `当前活动预算: ${this.getActivityBudget().toFixed(2)} 积分`,
            );
            console.log("1. 商品看板  2. 活动看板  3. 顾客看板");
            console.log("4. 资产/赊账管理  5. 库存管理  6. 退款业务");
            console.log(
                "7. 活动预算管理  8. 收入情况  9. 导出欠债名单  10. 校验码反查  11. 退出",
            );

            const opt = await this.ask("请选择: ");

            if (opt === "1") this.showProductDashboard();
            else if (opt === "2") this.showActivityDashboard();
            else if (opt === "3") this.showUserDashboard();
            else if (opt === "4") await this.manageAssets();
            else if (opt === "5") await this.manageInventory();
            else if (opt === "6") await this.processRefund();
            else if (opt === "7") await this.manageActivityBudget();
            else if (opt === "8") this.showRevenueOverview();
            else if (opt === "9") await this.exportDebtorList();
            else if (opt === "10") await this.reverseLookupVerifyCode();
            else break;
        }
    }

    private showProductDashboard() {
        console.log("\n--- 商品看板 ---");
        this.data.products.forEach(p => {
            console.log(`${p.name} [${p.id}]`);
            console.log(
                `  库存: ${this.calculateCurrentStock(
                    p.id,
                )} | 成本: ￥${p.cost.toFixed(2)}`,
            );
            console.log(
                `  售价: 现￥${p.prices.cash?.toFixed(
                    2,
                )} / 积${p.prices.points?.toFixed(2)}`,
            );

            // 显示促销活动
            if (p.promoIds && p.promoIds.length > 0) {
                const promos = p.promoIds
                    .map(id => this.data.promotions.find(p => p.id === id))
                    .filter(p => p !== undefined);

                if (promos.length > 0) {
                    console.log(
                        `  促销活动: ${promos.map(p => p?.name).join(", ")}`,
                    );
                }
            }

            // 计算本周销量（特殊用户不统计在销量指标中）
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            weekStart.setHours(0, 0, 0, 0);

            const weeklySales = this.data.orders
                .filter(
                    order =>
                        order.productId === p.id &&
                        order.timestamp >= weekStart,
                )
                .reduce((total, order) => total + order.quantity, 0);

            console.log(`  本周销量: ${weeklySales} 件`);
        });
    }

    private showActivityDashboard() {
        console.log("\n--- 活动看板 ---");
        console.log(`剩余预算: ${this.getActivityBudget()} 积分`);
    }

    private showUserDashboard() {
        console.log("\n--- 顾客看板 ---");

        // 更新所有用户的会员状态
        this.checkMembershipStatus(); // 检查会员是否过期

        this.data.users.forEach(u => {
            const memberLevel = this.getUserMemberLevel(u.shortName);
            const memberStatus =
                memberLevel === "SPECIAL"
                    ? "特殊用户"
                    : memberLevel === "OFFICIAL"
                      ? "正式会员"
                      : memberLevel === "TRAINEE"
                        ? "见习会员"
                        : "非会员";

            // 计算用户总消费（基于订单历史）
            const totalSpent = this.data.orders
                .filter(
                    o => o.userShortName === u.shortName && o.type === "cash",
                )
                .reduce((sum, order) => {
                    // 找到该订单的所有退款
                    const orderRefunds = this.data.refunds.filter(
                        r => r.originalOrderId === order.id,
                    );
                    // 计算该订单的总退款金额
                    const totalRefund = orderRefunds.reduce(
                        (refundTotal, r) => refundTotal + (r.refundCash || 0),
                        0,
                    );
                    // 计算该订单的实际有效金额
                    const effectiveAmount = Math.max(
                        0,
                        order.paidCash - totalRefund,
                    );
                    return sum + effectiveAmount;
                }, 0);

            console.log(`${u.shortName} (${this.getRealName(u.shortName)})`);
            console.log(
                `  会员: ${memberStatus} | 积分: ${u.points} | 欠款: ${u.debt}`,
            );
            console.log(`  总消费: ￥${totalSpent.toFixed(2)}`);
        });
    }

    // --- 资产/赊账管理 (核心变更) ---
    private async manageAssets(): Promise<void> {
        console.log("\n=== 📝 资产/赊账管理 ===");
        const shortName = await this.ask("请输入顾客简称: ");
        const user = this.data.users.find(u => u.shortName === shortName);
        if (!user) {
            console.log("用户不存在");
            return;
        }

        console.log(`当前用户: ${shortName}`);
        console.log(`1. 修改欠款 (当前: ${user.debt})`);
        console.log(`2. 修改积分 (当前: ${user.points})`);
        const opt = await this.ask("请选择操作: ");

        if (opt === "1") {
            const amountStr = await this.ask(
                "输入变动金额 (正=欠我增加, 负=欠我减少): ",
            );
            const amount = parseFloat(amountStr);
            if (isNaN(amount)) return;

            const oldDebt = user.debt; // 记录赊账前的金额
            const newDebt = user.debt + amount;
            console.log(`操作后欠款将为: ${newDebt}`);
            if ((await this.ask("确认吗？ === 'Y'")) === "Y") {
                user.debt = newDebt;
                this.logManualOperation(
                    `赊账调整: ${amount}`,
                    "debt_adjust",
                    amount,
                    oldDebt, // 传递赊账前的金额
                    newDebt, // 传递赊账后的金额
                );
                this.saveData();
                console.log("✅ 已更新");
            }
        } else if (opt === "2") {
            const amountStr = await this.ask(
                "输入变动积分 (正=充值, 负=扣除): ",
            );
            const amount = parseFloat(amountStr);
            if (isNaN(amount)) return;

            const newPoints = user.points + amount; // 取消Math.min截断限制，允许积分超过上限
            console.log(`操作后积分将为: ${newPoints}`);
            if ((await this.ask("确认吗？ === 'Y'")) === "Y") {
                user.points = newPoints;
                this.logManualOperation(
                    `积分调整: ${amount}`,
                    "points_adjust",
                    amount,
                );
                this.saveData();
                console.log("✅ 已更新");
            }
        }
    }

    private logManualOperation(
        reason: string,
        type: "debt_adjust" | "points_adjust" = "debt_adjust",
        amount: number = 0,
        oldValue?: number,
        newValue?: number,
    ) {
        // 使用 otherLogs 记录所有手动资产变更
        let finalReason = reason;

        // 如果是赊账调整，并且提供了旧值和新值，则在备注中记录赊账前和赊账后的金额
        if (
            type === "debt_adjust" &&
            oldValue !== undefined &&
            newValue !== undefined
        ) {
            finalReason = `${reason} (赊账前: ${oldValue}, 赊账后: ${newValue})`;
        }

        this.data.otherLogs.push({
            id: this.generateId("MAN"),
            timestamp: new Date(),
            type: type,
            amount: amount,
            reason: finalReason,
        });
    }

    /**
     * 校验码反查 - 通过校验码查找订单
     */
    private async reverseLookupVerifyCode(): Promise<void> {
        console.log("\n=== 🔍 校验码反查 ===");

        const verifyCode = await this.ask("请输入6位校验码: ");

        if (!verifyCode || verifyCode.length !== 6) {
            console.log("❌ 校验码必须是6位字符");
            return;
        }

        // 自动将输入的校验码转为大写
        const targetCode = verifyCode.toUpperCase();

        console.log(`\n正在查找校验码为 ${targetCode} 的订单...`);

        // 从最晚的订单向前遍历（按时间倒序）
        // 直接使用数组的倒序索引，避免预先排序
        let found = false;
        let checkedCount = 0;

        // 从最后一个订单开始向前遍历
        for (let i = this.data.orders.length - 1; i >= 0; i--) {
            const order = this.data.orders[i];
            checkedCount++;

            // 计算该订单的校验码
            const calculatedCode = this.generateVerifyCode(
                order.id,
                order.paidCash,
                order.paidPoints,
                order.rewardPoints,
            );

            // 显示进度（每检查10个订单显示一次）
            if (checkedCount % 10 === 0) {
                console.log(
                    `已检查 ${checkedCount}/${this.data.orders.length} 个订单...`,
                );
            }

            if (calculatedCode === targetCode) {
                found = true;
                console.log("\n✅ 找到匹配的订单！");
                console.log("\n=== 📋 订单详情 ===");
                console.log(`订单号: ${order.id}`);
                console.log(`时间: ${order.timestamp.toLocaleString()}`);
                console.log(
                    `用户: ${order.userShortName} (${this.getRealName(order.userShortName)})`,
                );
                console.log(`商品: ${order.productName} x ${order.quantity}`);
                console.log(`实付现金: ￥${order.paidCash.toFixed(2)}`);
                console.log(`实付积分: ${order.paidPoints.toFixed(2)}`);
                console.log(`奖励积分: ${order.rewardPoints}`);
                console.log(
                    `类型: ${order.type === "cash" ? "现金购买" : "积分兑换"}`,
                );

                if (order.note) {
                    console.log(`备注: ${order.note}`);
                }

                // 检查是否有退款记录
                const refunds = this.data.refunds.filter(
                    refund => refund.originalOrderId === order.id,
                );

                if (refunds.length > 0) {
                    console.log("\n⚠️  该订单存在退款记录:");
                    refunds.forEach(refund => {
                        console.log(
                            `  - ${refund.timestamp.toLocaleString()}: 退款现金 ￥${refund.refundCash.toFixed(2)}, 退款积分 ${refund.refundPoints}, 扣除积分 ${refund.deductPoints}, 原因: ${refund.reason}`,
                        );
                    });
                }

                console.log(`\n📝 校验码计算参数:`);
                console.log(`  订单ID: ${order.id}`);
                console.log(`  实付现金: ${order.paidCash}`);
                console.log(`  实付积分: ${order.paidPoints}`);
                console.log(`  奖励积分: ${order.rewardPoints}`);

                break;
            }
        }

        if (!found) {
            console.log(`\n❌ 未找到校验码为 ${targetCode} 的订单`);
            console.log(`共检查了 ${checkedCount} 个订单`);
        }
    }

    /**
     * 活动预算管理 - 手动加减预算
     */
    private async manageActivityBudget(): Promise<void> {
        console.log("\n=== 💰 活动预算管理 ===");
        console.log(
            `当前活动预算: ${this.getActivityBudget().toFixed(2)} 积分`,
        );

        console.log("1. 增加预算  2. 减少预算  3. 返回");
        const opt = await this.ask("请选择操作: ");

        if (opt === "1" || opt === "2") {
            const amountStr = await this.ask("输入金额 (正数): ");
            const amount = parseFloat(amountStr);

            if (isNaN(amount) || amount <= 0) {
                console.log("❌ 金额必须是正数");
                return;
            }

            const reason = await this.ask("输入操作原因: ");

            // 创建其他日志（预算调整类型）
            const otherLog: OtherLog = {
                id: this.generateId("MAN"),
                timestamp: new Date(),
                type: "budget_adjust",
                amount: opt === "1" ? amount : -amount,
                reason: reason,
            };

            // 添加到其他日志
            this.data.otherLogs.push(otherLog);
            this.saveData();

            console.log(
                `✅ 成功${opt === "1" ? "增加" : "减少"}预算 ${amount} 积分`,
            );
            console.log(
                `当前活动预算: ${this.getActivityBudget().toFixed(2)} 积分`,
            );
        } else if (opt !== "3") {
            console.log("❌ 无效选项");
        }
    }

    // --- 库存管理 ---
    private async manageInventory(): Promise<void> {
        console.log("\n--- 库存管理 ---");
        const prodId = await this.ask("输入商品ID (留空上架新品): ");

        if (prodId.trim() === "") {
            // 上架新品
            const newId = await this.ask("新商品ID: ");
            const name = await this.ask("名称: ");
            const cost = parseFloat(await this.ask("成本: "));
            const initialStock = parseInt(await this.ask("初始库存: "));
            const pCash = parseFloat(await this.ask("现金售价: "));
            const pPoints = parseFloat(await this.ask("积分售价: "));

            // 显示所有可用优惠策略
            console.log("\n--- 可用优惠策略 ---");
            this.data.promotions.forEach((promo, index) => {
                console.log(`[${index + 1}] ${promo.name} (${promo.id})`);
            });

            const promoInput = await this.ask(
                "选择优惠策略序号（逗号分隔，留空不设置）: ",
            );
            const promoIds: string[] = [];
            if (promoInput.trim() !== "") {
                const selectedIndices = promoInput
                    .split(",")
                    .map(s => parseInt(s.trim()) - 1);
                for (const index of selectedIndices) {
                    if (index >= 0 && index < this.data.promotions.length) {
                        promoIds.push(this.data.promotions[index].id);
                    }
                }
            }

            const newProd: Product = {
                id: newId,
                name,
                cost,
                initialStock,
                prices: {
                    [ProductShelf.CASH]: pCash || undefined,
                    [ProductShelf.POINTS]: pPoints || undefined,
                },
                promoIds: promoIds.length > 0 ? promoIds : undefined,
            };
            this.data.products.push(newProd);
            this.saveData();
            console.log("✅ 上架成功");
        } else {
            // 修改现有商品
            const prod = this.data.products.find(p => p.id === prodId);
            if (!prod) {
                console.log("商品不存在");
                return;
            }

            console.log(`\n当前商品信息:`);
            console.log(`名称: ${prod.name} [${prod.id}]`);
            console.log(`成本: ￥${prod.cost.toFixed(2)}`);
            console.log(`现金售价: ￥${prod.prices.cash?.toFixed(2) || "无"}`);
            console.log(
                `积分售价: ${prod.prices.points?.toFixed(2) || "无"} 积分`,
            );
            console.log(`当前初始库存: ${prod.initialStock}`);
            console.log(`当前实际库存: ${this.calculateCurrentStock(prod.id)}`);

            // 显示当前优惠策略
            if (prod.promoIds && prod.promoIds.length > 0) {
                console.log(
                    `当前优惠策略: ${prod.promoIds
                        .map(id => {
                            const promo = this.data.promotions.find(
                                p => p.id === id,
                            );
                            return promo ? promo.name : id;
                        })
                        .join(", ")}`,
                );
            } else {
                console.log("当前优惠策略: 无");
            }

            console.log("\n--- 操作选项 ---");
            console.log("1. 调整库存");
            console.log("2. 修改优惠策略");
            console.log("3. 修改价格");

            const option = await this.ask("选择操作 (1-3): ");

            if (option === "1") {
                // 调整库存
                const adjustmentInput = await this.ask(
                    "请输入调整数量（正数为补货，负数为损耗/下架）: ",
                );
                const adjustment = parseInt(adjustmentInput);

                if (isNaN(adjustment)) {
                    console.log("❌ 请输入有效的数字");
                    return;
                }

                const oldStock = prod.initialStock;
                const newStock = oldStock + adjustment;

                if (newStock < 0) {
                    console.log("❌ 调整后库存不能为负数");
                    return;
                }

                prod.initialStock = newStock;

                // 记录库存调整日志
                const inventoryLog: OtherLog = {
                    id: this.generateId("MAN"),
                    timestamp: new Date(),
                    type: "inventory_adjust",
                    amount: adjustment,
                    reason:
                        adjustment >= 0
                            ? `补货: ${prod.name} (${prod.id}) 增加 ${adjustment} 件`
                            : `损耗/下架: ${prod.name} (${prod.id}) 减少 ${Math.abs(adjustment)} 件`,
                    productId: prod.id,
                };
                this.data.otherLogs.push(inventoryLog);

                this.saveData();
                console.log("✅ 库存已更新");
                console.log(`新的初始库存: ${newStock}`);
                console.log(
                    `新的实际库存: ${this.calculateCurrentStock(prod.id)}`,
                );
            } else if (option === "2") {
                // 修改优惠策略
                console.log("\n--- 可用优惠策略 ---");
                this.data.promotions.forEach((promo, index) => {
                    console.log(`[${index + 1}] ${promo.name} (${promo.id})`);
                });

                const promoInput = await this.ask(
                    "选择优惠策略序号（逗号分隔，留空清空）: ",
                );
                if (promoInput.trim() === "") {
                    prod.promoIds = undefined;
                    console.log("✅ 已清空优惠策略");
                } else {
                    const selectedIndices = promoInput
                        .split(",")
                        .map(s => parseInt(s.trim()) - 1);
                    const promoIds: string[] = [];
                    for (const index of selectedIndices) {
                        if (index >= 0 && index < this.data.promotions.length) {
                            promoIds.push(this.data.promotions[index].id);
                        }
                    }
                    prod.promoIds = promoIds;
                    console.log(
                        `✅ 已设置优惠策略: ${promoIds
                            .map(id => {
                                const promo = this.data.promotions.find(
                                    p => p.id === id,
                                );
                                return promo ? promo.name : id;
                            })
                            .join(", ")}`,
                    );
                }

                this.saveData();
            } else if (option === "3") {
                // 修改价格
                const newCashPrice =
                    await this.ask("新的现金售价（留空保持不变）: ");
                const newPointsPrice =
                    await this.ask("新的积分售价（留空保持不变）: ");

                if (newCashPrice.trim() !== "") {
                    const cashPrice = parseFloat(newCashPrice);
                    if (!isNaN(cashPrice)) {
                        prod.prices.cash = cashPrice;
                        console.log(
                            `✅ 现金售价已更新为: ￥${cashPrice.toFixed(2)}`,
                        );
                    }
                }

                if (newPointsPrice.trim() !== "") {
                    const pointsPrice = parseFloat(newPointsPrice);
                    if (!isNaN(pointsPrice)) {
                        prod.prices.points = pointsPrice;
                        console.log(
                            `✅ 积分售价已更新为: ${pointsPrice.toFixed(2)} 积分`,
                        );
                    }
                }

                this.saveData();
            } else {
                console.log("❌ 无效选项");
                return;
            }
        }
    }

    // --- 退款业务 (解耦逻辑) ---
    private async processRefund(): Promise<void> {
        const orderId = await this.ask("请输入订单号: ");
        const order = this.data.orders.find(o => o.id === orderId);

        if (!order) {
            console.log("❌ 订单不存在");
            return;
        }
        // 抽奖功能已禁用，无需特殊检查

        const daysDiff =
            (Date.now() - new Date(order.timestamp).getTime()) /
            (1000 * 3600 * 24);
        if (daysDiff > config.REFUND_LIMIT_DAYS) {
            console.log("❌ 超过7天退款期");
            return;
        }

        const user = this.data.users.find(
            u => u.shortName === order.userShortName,
        )!;

        console.log(`订单: ${order.productName} x ${order.quantity}`);

        // 检查历史退款记录，计算已退款数量
        const existingRefunds = this.data.refunds.filter(
            r => r.originalOrderId === order.id,
        );
        const alreadyRefundedQty = existingRefunds.reduce(
            (sum, refund) => sum + (refund.quantity || 0),
            0,
        );

        console.log(`已退款数量: ${alreadyRefundedQty}/${order.quantity}`);

        const qtyInput = await this.ask("输入退款数量: ");
        const qty = parseInt(qtyInput);

        // 强制要求退款数量必须是整数
        if (qtyInput !== qty.toString() || qty <= 0) {
            console.log("❌ 数量无效，必须输入正整数");
            return;
        }

        // 校验本次申请数量 + 历史已退总数 <= 订单原始数量
        if (qty + alreadyRefundedQty > order.quantity) {
            console.log("❌ 退款数量超过订单剩余可退数量");
            console.log(`可退数量: ${order.quantity - alreadyRefundedQty}`);
            return;
        }

        // 防御性编程：避免除零错误
        if (order.quantity === 0) {
            console.log("❌ 订单数量为0，无法计算退款比例");
            return;
        }

        const ratio = qty / order.quantity;
        const refundCash = order.paidCash * ratio;
        const refundPoints = order.paidPoints * ratio;
        const deductRewardPoints = order.rewardPoints * ratio;

        // 预览
        console.log(`\n--- 退款预览 ---`);
        console.log(`实退金额: ￥${refundCash} (仅作记录)`);
        console.log(`实退积分: ${refundPoints}`);
        console.log(`扣除赠送积分: ${deductRewardPoints}`);

        // 预测积分余额
        const projectedPoints = user.points + refundPoints - deductRewardPoints;
        console.log(`用户积分: ${user.points} -> ${projectedPoints}`);

        // 退款风控（二次确认）
        if (projectedPoints < 0) {
            const answer = await this.ask(
                `⚠️ 警告：退款后积分为负（${projectedPoints}），是否继续？(y/n): `,
            );
            if (answer.toLowerCase() !== "y") {
                console.log("❌ 退款已取消");
                return;
            }
        } else {
            const answer = await this.ask("确认退款吗？(y/n): ");
            if (answer.toLowerCase() !== "y") {
                console.log("❌ 退款已取消");
                return;
            }
        }

        // --- 执行退款 (不碰 user.debt) ---
        // 库存会通过 calculateCurrentStock 自动基于订单历史计算，无需直接修改初始库存

        // 调整积分（取消Math.min截断限制，允许积分超过上限）
        user.points = user.points + refundPoints - deductRewardPoints;

        // 注意：不再需要手动更新totalSpent，因为总消费现在基于订单历史计算

        // 4. 记录退款单
        const refundOrder: RefundOrder = {
            id: this.generateId("REF"),
            originalOrderId: order.id,
            timestamp: new Date(),
            userShortName: user.shortName,
            quantity: qty, // 本次退款数量
            refundCash, // 仅记录
            refundPoints,
            deductPoints: deductRewardPoints,
            reason: await this.ask("退款原因: "),
        };
        this.data.refunds.push(refundOrder);

        // 检查并通知会员状态变化
        this.checkAndNotifyMembershipChange(user.shortName);

        this.saveData();

        console.log("✅ 退款成功！");

        // --- 关键提醒 ---
        if (user.debt > 0) {
            console.log(`\n⚠️ 提示：该用户目前欠款 ￥${user.debt}。`);
            console.log(
                "   系统已将积分/现金退还至账户，请根据实际情况手动调整赊账记录。",
            );
        }
    }

    private showRevenueOverview() {
        console.log("\n--- 收入情况分析 ---");

        // 计算统计周期（上周日到现在）
        const now = new Date();
        const dayOfWeek = now.getDay();
        const lastSunday = new Date(now);
        lastSunday.setDate(now.getDate() - (dayOfWeek === 0 ? 7 : dayOfWeek));
        lastSunday.setHours(0, 0, 0, 0);

        // 使用所有订单进行统计（特殊用户订单正常计入营销数据）
        const validOrders = this.data.orders;

        // 计算总收入
        const cashRevenue = validOrders
            .filter(o => o.type === "cash")
            .reduce((sum, order) => sum + order.paidCash, 0);

        const pointsRevenue = validOrders
            .filter(o => o.type === "points")
            .reduce((sum, order) => sum + order.paidPoints, 0);

        // 计算总成本
        const totalCost = validOrders.reduce(
            (sum, order) => sum + order.cost,
            0,
        );

        // 计算总利润
        // 汇率统一度量：取消0.01折算率，严格遵守1人民币=1积分
        const totalRevenue = cashRevenue + pointsRevenue; // 积分直接1:1统计
        const totalProfit = totalRevenue - totalCost;

        // 计算周期内收入（上周日到现在）
        const periodCashRevenue = validOrders
            .filter(
                o => o.type === "cash" && new Date(o.timestamp) >= lastSunday,
            )
            .reduce((sum, order) => sum + order.paidCash, 0);

        const periodPointsRevenue = validOrders
            .filter(
                o => o.type === "points" && new Date(o.timestamp) >= lastSunday,
            )
            .reduce((sum, order) => sum + order.paidPoints, 0);

        // 计算周期内成本
        const periodCost = validOrders
            .filter(o => new Date(o.timestamp) >= lastSunday)
            .reduce((sum, order) => sum + order.cost, 0);

        // 计算周期内利润
        const periodTotalRevenue = periodCashRevenue + periodPointsRevenue; // 积分直接1:1统计
        const periodProfit = periodTotalRevenue - periodCost;

        console.log(
            `📅 统计周期: 上周日(${
                lastSunday.getMonth() + 1
            }月${lastSunday.getDate()}日)至${
                now.getMonth() + 1
            }月${now.getDate()}日`,
        );
        console.log("\n📊 周期内收入统计:");
        console.log(`周期内现金收入: ￥${periodCashRevenue.toFixed(2)}`);
        console.log(`周期内积分收入: ${periodPointsRevenue} 积分`);
        console.log(`周期内总成本: ￥${periodCost.toFixed(2)}`);
        console.log(`周期内总利润: ￥${periodProfit.toFixed(2)}`);

        console.log("\n📊 累计收入统计:");
        console.log(`累计现金收入: ￥${cashRevenue.toFixed(2)}`);
        console.log(`累计积分收入: ${pointsRevenue} 积分`);
        console.log(`累计总成本: ￥${totalCost.toFixed(2)}`);
        console.log(`累计总利润: ￥${totalProfit.toFixed(2)}`);

        // 特殊用户成本统计
        const specialUserOrders = validOrders.filter(order =>
            this.memberConfig.specialUsers.includes(order.userShortName),
        );

        if (specialUserOrders.length > 0) {
            const specialUserTotalCost = specialUserOrders.reduce(
                (sum, order) => sum + order.cost,
                0,
            );
            const specialUserPeriodCost = specialUserOrders
                .filter(order => new Date(order.timestamp) >= lastSunday)
                .reduce((sum, order) => sum + order.cost, 0);

            console.log("\n⭐ 特殊用户成本统计:");
            console.log(
                `周期内特殊用户成本: ￥${specialUserPeriodCost.toFixed(2)}`,
            );
            console.log(
                `累计特殊用户成本: ￥${specialUserTotalCost.toFixed(2)}`,
            );
            console.log(`特殊用户订单数量: ${specialUserOrders.length} 单`);
        }

        // 按商品分类统计（过滤特殊用户）
        console.log("\n📦 商品销售统计:");
        const productSales: {
            [key: string]: { quantity: number; revenue: number; cost: number };
        } = {};

        validOrders.forEach(order => {
            if (!productSales[order.productId]) {
                productSales[order.productId] = {
                    quantity: 0,
                    revenue: 0,
                    cost: 0,
                };
            }
            productSales[order.productId].quantity += order.quantity;
            productSales[order.productId].revenue +=
                order.type === "cash" ? order.paidCash : order.paidPoints;
            productSales[order.productId].cost += order.cost;
        });

        Object.entries(productSales).forEach(([productId, stats]) => {
            const product = this.data.products.find(p => p.id === productId);
            if (product) {
                const profit = stats.revenue - stats.cost;
                // 查找该商品的第一个订单来确定销售类型
                const firstOrder = this.data.orders.find(
                    o => o.productId === productId,
                );
                const isCashSale = firstOrder?.type === "cash";

                console.log(`${product.name}:`);
                console.log(`  销量: ${stats.quantity} 件`);
                console.log(
                    `  收入: ${
                        isCashSale
                            ? `￥${stats.revenue.toFixed(2)}`
                            : `${stats.revenue} 积分`
                    }`,
                );
                console.log(`  成本: ￥${stats.cost.toFixed(2)}`);
                console.log(
                    `  利润: ${
                        isCashSale ? `￥${profit.toFixed(2)}` : `${profit} 积分`
                    }`,
                );
            }
        });
    }

    // --- 导出欠债名单 ---
    public async exportDebtorList(): Promise<void> {
        const debtors = this.data.users.filter(u => u.debt !== 0);
        if (debtors.length === 0) {
            console.log("无欠债记录");
            return;
        }

        console.log("\n--- 赊账名单 ---");
        console.log("简称\t\t真实姓名\t\t欠款金额\t\t最后消费时间");
        console.log("-".repeat(60));

        debtors.forEach(u => {
            // 找最后消费时间
            const uOrders = this.data.orders.filter(
                o => o.userShortName === u.shortName,
            );
            let lastTime = "无";
            if (uOrders.length > 0) {
                uOrders.sort(
                    (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
                );
                lastTime = uOrders[0].timestamp.toLocaleString("zh-CN");
            }

            // 格式化输出，使用制表符对齐
            const shortName = u.shortName.padEnd(8, " ");
            const realName = this.privacyMap[u.shortName].padEnd(10, " ");
            const debt = `￥${u.debt.toFixed(2)}`.padEnd(12, " ");

            console.log(`${shortName}\t${realName}\t${debt}\t${lastTime}`);
        });

        console.log("\n✅ 赊账名单已显示在控制台");
    }

    public start(): void {
        console.log("🏪 宿舍小卖部系统启动中...");
        (async () => {
            while (true) {
                console.log("\n主菜单: 1. 经营模式  2. 管理模式  3. 退出");
                const opt = await this.ask("> ");
                if (opt === "1") await this.runBusinessMode();
                else if (opt === "2") await this.runAdminMode();
                else break;
            }
            this.rl.close();
            process.exit(0);
        })();
    }
}

// 启动系统
(async () => {
    const app = new DormStoreSystem();
    // 等待初始化完成
    await new Promise(resolve => setTimeout(resolve, 100)); // 给异步初始化一点时间
    app.start();
})();
