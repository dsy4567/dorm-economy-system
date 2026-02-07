"use strict";
/**
 * 宿舍小卖部营销系统 - Node.js + TypeScript
 * 作者: dsy4567
 * 版本: v3.0
 * 功能: 现金/积分销售、库存管理、财务预算、隐私保护、手动记账
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
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
//      - calculateGiftPromotion(): 计算满消费送商品的数量
//    - reverseLookupVerifyCode(): 校验码反查订单（从最晚订单向前遍历）
//    - exportDebtorList(): 在控制台输出赊账名单（包含最后消费时间）
//    - queryCustomerConsumption(): 查询指定顾客21天消费记录
//    - manageInventory(): 库存管理（支持上架新品、调整库存、修改优惠策略、修改价格）
//    - 系统运行控制
//      - checkProcessLock(): 检查进程锁，确保只能同时运行一个进程
//    - 看板功能
//      - showProductDashboard(): 展示商品看板，包含近2小时销量统计
//
// 4. 关键变量
//    - config: 系统配置
//    - DormStoreSystem: 系统主类
//
// 注意: 修改代码后请更新此大纲
// ===================================================
var fs = require("fs");
var path = require("path");
var readline = require("readline");
var crypto = require("crypto");
// 读取配置文件
var config = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../data/config.json"), "utf-8"));
var ProductShelf;
(function (ProductShelf) {
    ProductShelf["CASH"] = "cash";
    ProductShelf["POINTS"] = "points";
})(ProductShelf || (ProductShelf = {}));
// ===================== 系统主类 =====================
var DormStoreSystem = /** @class */ (function () {
    function DormStoreSystem() {
        // 记录系统启动时间，用于会话统计
        this.systemStartTime = new Date();
        // 实现进程锁
        this.checkProcessLock();
        this.dataPath = path.resolve(process.cwd(), config.DATA_DIR, "store_data.json");
        this.privacyPath = path.resolve(process.cwd(), config.DATA_DIR, "privacy_map.json");
        this.memberConfigPath = path.resolve(process.cwd(), config.DATA_DIR, "member_config.json");
        this.logPath = path.resolve(process.cwd(), config.DATA_DIR, "change_logs.json");
        this.productsPath = path.resolve(process.cwd(), config.DATA_DIR, "products.json");
        this.promotionsPath = path.resolve(process.cwd(), config.DATA_DIR, "promotions.json");
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        this.init();
    }
    /**
     * 检查进程锁，确保只能同时运行一个进程
     */
    DormStoreSystem.prototype.checkProcessLock = function () {
        var pidFilePath = path.resolve(process.cwd(), config.DATA_DIR, "app.pid");
        // 检查是否存在PID文件
        if (fs.existsSync(pidFilePath)) {
            try {
                // 读取PID文件内容
                var pidContent = fs.readFileSync(pidFilePath, "utf-8");
                var pid = parseInt(pidContent.trim());
                // 检查进程是否存在
                process.kill(pid, 0); // 发送信号0，不执行任何操作，只检查进程是否存在
                // 如果进程存在，提示用户
                console.error("\u274C \u7A0B\u5E8F\u5DF2\u7ECF\u5728\u8FD0\u884C\u4E2D (PID: ".concat(pid, ")"));
                console.error("\u8BF7\u6267\u884C\u4EE5\u4E0B\u547D\u4EE4\u7EC8\u6B62\u73B0\u6709\u8FDB\u7A0B:");
                console.error("kill ".concat(pid));
                process.exit(1);
            }
            catch (error) {
                // 如果进程不存在或读取失败，删除旧的PID文件
                fs.unlinkSync(pidFilePath);
            }
        }
        // 创建新的PID文件
        fs.writeFileSync(pidFilePath, process.pid.toString());
        // 在进程退出时删除PID文件
        process.on("exit", function () {
            try {
                fs.unlinkSync(pidFilePath);
            }
            catch (error) {
                // 忽略删除错误
            }
        });
        // 在收到终止信号时删除PID文件
        process.on("SIGINT", function () {
            try {
                fs.unlinkSync(pidFilePath);
            }
            catch (error) {
                // 忽略删除错误
            }
            process.exit(0);
        });
        process.on("SIGTERM", function () {
            try {
                fs.unlinkSync(pidFilePath);
            }
            catch (error) {
                // 忽略删除错误
            }
            process.exit(0);
        });
    };
    DormStoreSystem.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.loadAllData()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // --- 数据加载与保存 ---
    DormStoreSystem.prototype.loadAllData = function () {
        return __awaiter(this, void 0, void 0, function () {
            var raw, productsRaw, productsData, promotionsRaw, promotionsData, memberConfigRaw, error_1, confirm_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 1, , 3]);
                        if (fs.existsSync(this.dataPath)) {
                            raw = fs.readFileSync(this.dataPath, "utf-8");
                            this.data = JSON.parse(raw);
                            // 日期数据恢复
                            this.data.orders.forEach(function (o) { return (o.timestamp = new Date(o.timestamp)); });
                            this.data.refunds.forEach(function (r) { return (r.timestamp = new Date(r.timestamp)); });
                            if (this.data.otherLogs) {
                                this.data.otherLogs.forEach(function (l) { return (l.timestamp = new Date(l.timestamp)); });
                            }
                            // 不再需要处理memberExpiryDate，因为我们不再存储它
                            this.data.users.forEach(function (u) {
                                // 清理可能存在的旧字段
                                delete u.isMember;
                                delete u.memberExpiryDate;
                                delete u.lastRenewalDate;
                            });
                        }
                        else {
                            this.data = this.getEmptyData();
                            this.saveData();
                        }
                        // 从单独文件加载products数据
                        if (fs.existsSync(this.productsPath)) {
                            productsRaw = fs.readFileSync(this.productsPath, "utf-8");
                            productsData = JSON.parse(productsRaw);
                            this.data.products = productsData.data;
                        }
                        else {
                            this.data.products = [];
                            this.saveProductsData();
                        }
                        // 抽奖功能已禁用，无需加载pools数据
                        // 从单独文件加载promotions数据
                        if (fs.existsSync(this.promotionsPath)) {
                            promotionsRaw = fs.readFileSync(this.promotionsPath, "utf-8");
                            promotionsData = JSON.parse(promotionsRaw);
                            this.data.promotions = promotionsData.data;
                        }
                        else {
                            this.data.promotions = [];
                            this.savePromotionsData();
                        }
                        if (fs.existsSync(this.privacyPath)) {
                            this.privacyMap = JSON.parse(fs.readFileSync(this.privacyPath, "utf-8"));
                        }
                        else {
                            this.privacyMap = {};
                            this.savePrivacyMap();
                        }
                        // 加载会员配置
                        if (fs.existsSync(this.memberConfigPath)) {
                            memberConfigRaw = fs.readFileSync(this.memberConfigPath, "utf-8");
                            this.memberConfig = JSON.parse(memberConfigRaw);
                        }
                        else {
                            // 使用默认配置
                            this.memberConfig = {
                                description: "会员配置：手动指定的正式会员有效期、特殊用户、积分倍率和降级提醒规则",
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
                        return [3 /*break*/, 3];
                    case 1:
                        error_1 = _a.sent();
                        console.error("\u6570\u636E\u52A0\u8F7D\u5931\u8D25: ".concat(error_1));
                        console.log("检测到JSON文件可能损坏或格式错误！");
                        return [4 /*yield*/, this.ask("是否使用默认模板覆盖现有数据？这是一个高危操作，将导致所有现有数据丢失！(y/N): ")];
                    case 2:
                        confirm_1 = _a.sent();
                        if (confirm_1.toLowerCase() === "y" ||
                            confirm_1.toLowerCase() === "yes") {
                            console.log("正在使用默认模板覆盖数据...");
                            this.data = this.getEmptyData();
                            this.privacyMap = {};
                            this.saveData();
                            this.savePrivacyMap();
                            console.log("数据已重置为默认模板。");
                        }
                        else {
                            console.log("用户取消了数据重置操作。程序将退出。");
                            process.exit(1);
                        }
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    DormStoreSystem.prototype.getEmptyData = function () {
        return {
            users: [],
            products: [],
            orders: [],
            refunds: [],
            otherLogs: [], // 替换 budgetLogs
            promotions: [],
        };
    };
    DormStoreSystem.prototype.saveData = function () {
        try {
            // 保存除products和promotions外的数据
            var dataToSave = __assign(__assign({}, this.data), { products: undefined, promotions: undefined });
            // 移除undefined属性
            delete dataToSave.products;
            delete dataToSave.promotions;
            var content = JSON.stringify(dataToSave, null, 2);
            fs.writeFileSync(this.dataPath, content);
            // 保存products到单独文件
            this.saveProductsData();
            // 保存promotions到单独文件
            this.savePromotionsData();
        }
        catch (e) {
            console.error("保存数据失败:", e);
        }
    };
    DormStoreSystem.prototype.saveProductsData = function () {
        try {
            var content = JSON.stringify({
                $schema: "../schemas/product-schema.json",
                data: this.data.products,
            }, null, 2);
            fs.writeFileSync(this.productsPath, content);
        }
        catch (e) {
            console.error("保存products数据失败:", e);
        }
    };
    // 抽奖功能已禁用，无需保存pools数据
    DormStoreSystem.prototype.savePromotionsData = function () {
        try {
            var content = JSON.stringify({
                $schema: "../schemas/promotion-schema.json",
                data: this.data.promotions,
            }, null, 2);
            fs.writeFileSync(this.promotionsPath, content);
        }
        catch (e) {
            console.error("保存promotions数据失败:", e);
        }
    };
    DormStoreSystem.prototype.savePrivacyMap = function () {
        fs.writeFileSync(this.privacyPath, JSON.stringify(this.privacyMap, null, 2));
    };
    DormStoreSystem.prototype.saveMemberConfig = function () {
        fs.writeFileSync(this.memberConfigPath, JSON.stringify(this.memberConfig, null, 2));
    };
    DormStoreSystem.prototype.saveChangeLog = function (logEntry) {
        var logs = fs.existsSync(this.logPath)
            ? JSON.parse(fs.readFileSync(this.logPath, "utf-8"))
            : [];
        logs.push(logEntry);
        fs.writeFileSync(this.logPath, JSON.stringify(logs, null, 2));
    };
    /**
     * 计算商品的当前库存
     * 基于初始库存 - 已售出数量 + 已退款数量
     */
    DormStoreSystem.prototype.calculateCurrentStock = function (productId) {
        var _this = this;
        var product = this.data.products.find(function (p) { return p.id === productId; });
        if (!product)
            return 0;
        // 初始库存
        var currentStock = product.initialStock;
        // 减去所有已售出的数量
        this.data.orders
            .filter(function (o) { return o.productId === productId; })
            .forEach(function (o) {
            currentStock -= o.quantity;
        });
        // 加上所有已退款的数量（直接使用退款数量，不再计算比例）
        this.data.refunds.forEach(function (r) {
            var originalOrder = _this.data.orders.find(function (o) { return o.id === r.originalOrderId; });
            if (originalOrder && originalOrder.productId === productId) {
                // 直接使用退款数量，避免比例计算错误
                currentStock += r.quantity;
            }
        });
        // 检查库存是否为负，如果是则发出警告
        if (currentStock < 0) {
            var product_1 = this.data.products.find(function (p) { return p.id === productId; });
            console.warn("\u26A0\uFE0F \u8B66\u544A\uFF1A\u5546\u54C1 ".concat(product_1 === null || product_1 === void 0 ? void 0 : product_1.name, " (").concat(productId, ") \u5E93\u5B58\u51FA\u73B0\u8D1F\u6570: ").concat(currentStock));
            console.warn("   \u8BF7\u68C0\u67E5\u8BA2\u5355\u548C\u9000\u6B3E\u8BB0\u5F55\u662F\u5426\u5B58\u5728\u6570\u636E\u4E0D\u4E00\u81F4");
        }
        return currentStock; // 返回实际计算结果，允许负数以便发现问题
    };
    // --- 辅助函数 ---
    DormStoreSystem.prototype.getRealName = function (shortName) {
        return this.privacyMap[shortName] || "未知用户";
    };
    DormStoreSystem.prototype.generateId = function (prefix) {
        if (prefix === void 0) { prefix = "ORD"; }
        var now = new Date();
        var year = now.getFullYear();
        var month = String(now.getMonth() + 1).padStart(2, "0");
        var day = String(now.getDate()).padStart(2, "0");
        var hours = String(now.getHours()).padStart(2, "0");
        var minutes = String(now.getMinutes()).padStart(2, "0");
        var seconds = String(now.getSeconds()).padStart(2, "0");
        var milliseconds = String(now.getMilliseconds()).padStart(3, "0");
        var random = String(Math.floor(Math.random() * 100)).padStart(2, "0");
        return "".concat(prefix).concat(year).concat(month).concat(day).concat(hours).concat(minutes).concat(seconds).concat(milliseconds).concat(random);
    };
    DormStoreSystem.prototype.ask = function (question) {
        var _this = this;
        return new Promise(function (resolve) { return _this.rl.question(question, resolve); });
    };
    // --- 核心业务逻辑 ---
    /**
     * 动态计算活动预算
     * 财务逻辑重写：活动预算现在仅由otherLogs中类型为budget_adjust的记录构成
     * 预算定义：活动预算仅用于未来"积分抽奖"功能的中奖成本扣除，目前不允许任何订单自动扣除它
     */
    DormStoreSystem.prototype.getActivityBudget = function () {
        var budget = 0;
        // 仅由otherLogs中budget_adjust类型的记录构成预算
        this.data.otherLogs.forEach(function (log) {
            if (log.type === "budget_adjust") {
                if (log.amount > 0)
                    budget += log.amount;
                if (log.amount < 0)
                    budget -= Math.abs(log.amount);
            }
        });
        // 删除所有关于"订单利润"的自动计算逻辑
        return budget;
    };
    /**
     * 获取上周日的日期
     * @returns 上周日的日期对象（0点0分0秒）
     */
    DormStoreSystem.prototype.getLastSunday = function (date) {
        if (date === void 0) { date = new Date(); }
        var now = new Date(date);
        var dayOfWeek = now.getDay();
        var daysSinceSunday = dayOfWeek === 0 ? 7 : dayOfWeek; // 如果今天是周日，则从上周日开始
        var lastSunday = new Date(now);
        lastSunday.setDate(now.getDate() - daysSinceSunday);
        lastSunday.setHours(0, 0, 0, 0); // 设置为上周日的0点0分0秒
        return lastSunday;
    };
    /**
     * 计算用户每周消费额（不计入已退款订单）
     * 从指定的周日开始计算到指定的结束日期
     */
    DormStoreSystem.prototype.calculateWeeklySpend = function (userShortName, weekStart, weekEnd) {
        var _this = this;
        // 获取用户所有现金订单
        var userCashOrders = this.data.orders.filter(function (o) {
            return o.userShortName === userShortName &&
                o.type === "cash" &&
                o.timestamp >= weekStart &&
                o.timestamp < weekEnd;
        });
        // 计算每个订单的实际有效金额（扣除退款部分）
        var effectiveSpend = userCashOrders.reduce(function (total, order) {
            // 找到该订单的所有退款
            var orderRefunds = _this.data.refunds.filter(function (r) { return r.originalOrderId === order.id; });
            // 计算该订单的总退款金额
            var totalRefund = orderRefunds.reduce(function (refundTotal, r) { return refundTotal + (r.refundCash || 0); }, 0);
            // 计算该订单的实际有效金额
            var effectiveAmount = Math.max(0, order.paidCash - totalRefund);
            return total + effectiveAmount;
        }, 0);
        return effectiveSpend;
    };
    /**
     * 计算用户在指定参考日期之前的滑动窗口天数内的总现金消费额（扣除退款）
     * @param userShortName 用户简称
     * @param referenceDate 参考日期，默认为当前时间
     * @returns 窗口内的总消费金额
     */
    DormStoreSystem.prototype.getUserTotalSpendInWindow = function (userShortName, referenceDate) {
        var _this = this;
        if (referenceDate === void 0) { referenceDate = new Date(); }
        // 计算滑动窗口的起始日期
        var lookbackDate = new Date(referenceDate);
        lookbackDate.setDate(referenceDate.getDate() - config.MEMBER.NEW_RULE.LOOKBACK_DAYS);
        // 获取用户在这段时间内的所有现金订单
        var userOrdersInPeriod = this.data.orders.filter(function (o) {
            return o.userShortName === userShortName &&
                o.type === "cash" &&
                new Date(o.timestamp) >= lookbackDate &&
                new Date(o.timestamp) <= referenceDate;
        });
        // 计算这些订单的总金额（扣除退款）
        var totalSpendInPeriod = userOrdersInPeriod.reduce(function (total, order) {
            // 找到该订单的所有退款
            var orderRefunds = _this.data.refunds.filter(function (r) { return r.originalOrderId === order.id; });
            // 计算该订单的总退款金额
            var totalRefund = orderRefunds.reduce(function (refundTotal, r) { return refundTotal + (r.refundCash || 0); }, 0);
            // 计算该订单的实际有效金额
            var effectiveAmount = Math.max(0, order.paidCash - totalRefund);
            return total + effectiveAmount;
        }, 0);
        return totalSpendInPeriod;
    };
    /**
     * 获取用户的会员等级
     * @param userShortName 用户简称
     * @param referenceDate 用于判断的参考日期，默认为当前时间
     * @returns 会员等级：'SPECIAL'（特殊用户）、'OFFICIAL'（正式会员）或 'TRAINEE'（见习会员）
     */
    DormStoreSystem.prototype.getUserMemberLevel = function (userShortName, referenceDate) {
        if (referenceDate === void 0) { referenceDate = new Date(); }
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
    };
    /**
     * 检查用户当前是否是会员
     * @param userShortName 用户简称
     * @param referenceDate 用于判断的参考日期，默认为当前时间
     */
    DormStoreSystem.prototype.isUserMember = function (userShortName, referenceDate) {
        if (referenceDate === void 0) { referenceDate = new Date(); }
        // 首先检查是否为特殊用户或手动指定的会员
        if (this.memberConfig.specialUsers.includes(userShortName)) {
            return true;
        }
        // 检查是否为手动指定的正式会员
        if (this.memberConfig.members[userShortName]) {
            var manualExpiryDate = new Date(this.memberConfig.members[userShortName]);
            if (manualExpiryDate > referenceDate) {
                return true;
            }
        }
        // 基于滑动窗口消费额判断会员身份
        if (config.MEMBER.NEW_RULE.ENABLED) {
            var totalSpend = this.getUserTotalSpendInWindow(userShortName, referenceDate);
            return totalSpend >= config.MEMBER.NEW_RULE.TRIGGER_AMOUNT;
        }
        return false;
    };
    /**
     * 检查用户会员状态变化并给出提示
     * 不再存储会员状态，而是实时计算
     */
    DormStoreSystem.prototype.checkAndNotifyMembershipChange = function (userShortName) {
        var now = new Date();
        var statusChanged = false;
        var memberLevel = this.getUserMemberLevel(userShortName, now);
        // 计算当前滑动窗口内的消费总额
        var totalSpendInWindow = this.getUserTotalSpendInWindow(userShortName, now);
        // 显示当前消费总额和会员状态
        console.log("\uD83D\uDCCA \u7528\u6237 ".concat(userShortName, " \u8FD1").concat(config.MEMBER.NEW_RULE.LOOKBACK_DAYS, "\u5929\u6D88\u8D39\u603B\u989D: \uFFE5").concat(totalSpendInWindow.toFixed(2), " (\u4F1A\u5458\u95E8\u69DB: \uFFE5").concat(config.MEMBER.NEW_RULE.TRIGGER_AMOUNT, ")"));
        // 检查手动指定的会员状态
        if (this.memberConfig.members[userShortName]) {
            var manualExpiryDate = new Date(this.memberConfig.members[userShortName]);
            if (manualExpiryDate > now) {
                console.log("\uD83C\uDF96\uFE0F \u7528\u6237 ".concat(userShortName, " \u62E5\u6709\u624B\u52A8\u6307\u5B9A\u7684\u4F1A\u5458\u6743\u9650\uFF0C\u6709\u6548\u671F\u81F3: ").concat(manualExpiryDate.toLocaleDateString()));
                statusChanged = true;
            }
        }
        // 显示会员等级
        if (memberLevel === "SPECIAL") {
            console.log("\u2B50 \u7528\u6237 ".concat(userShortName, " \u662F\u7279\u6B8A\u7528\u6237"));
            statusChanged = true;
        }
        else if (memberLevel === "OFFICIAL") {
            console.log("\uD83D\uDC51 \u7528\u6237 ".concat(userShortName, " \u662F\u6B63\u5F0F\u4F1A\u5458"));
            statusChanged = true;
            // 检查是否即将有大额订单"滚出窗口"
            this.checkUpcomingOrdersExpiring(userShortName, now);
        }
        else {
            console.log("\uD83D\uDC64 \u7528\u6237 ".concat(userShortName, " \u662F\u89C1\u4E60\u4F1A\u5458"));
            statusChanged = true;
            // 检查是否接近会员门槛
            if (totalSpendInWindow > 0 &&
                totalSpendInWindow < config.MEMBER.NEW_RULE.TRIGGER_AMOUNT &&
                config.MEMBER.NEW_RULE.TRIGGER_AMOUNT - totalSpendInWindow <= 5) {
                console.log("\uD83D\uDCA1 \u63D0\u793A\uFF1A\u7528\u6237 ".concat(userShortName, " \u8DDD\u79BB\u4F1A\u5458\u95E8\u69DB\u8FD8\u5DEE \uFFE5").concat((config.MEMBER.NEW_RULE.TRIGGER_AMOUNT - totalSpendInWindow).toFixed(2), "\uFF0C\u9F13\u52B1\u6D88\u8D39\u53EF\u5347\u7EA7\u4E3A\u6B63\u5F0F\u4F1A\u5458\uFF01"));
            }
        }
        return statusChanged;
    };
    /**
     * 检查即将滚出窗口的大额订单
     */
    DormStoreSystem.prototype.checkUpcomingOrdersExpiring = function (userShortName, currentDate) {
        var _this = this;
        // 计算窗口边界日期
        var windowStartDate = new Date(currentDate);
        windowStartDate.setDate(currentDate.getDate() - config.MEMBER.NEW_RULE.LOOKBACK_DAYS);
        // 计算即将滚出窗口的日期（1天后）
        var nextDay = new Date(currentDate);
        nextDay.setDate(currentDate.getDate() + 1);
        // 获取用户即将滚出窗口的订单（timestamp在窗口开始日期到窗口开始日期+1天之间）
        var expiringOrders = this.data.orders.filter(function (o) {
            return o.userShortName === userShortName &&
                o.type === "cash" &&
                new Date(o.timestamp) >= windowStartDate &&
                new Date(o.timestamp) <
                    new Date(windowStartDate.getTime() + 24 * 60 * 60 * 1000);
        });
        // 计算即将滚出订单的总金额（扣除退款）
        var expiringOrdersValue = expiringOrders.reduce(function (total, order) {
            // 找到该订单的所有退款
            var orderRefunds = _this.data.refunds.filter(function (r) { return r.originalOrderId === order.id; });
            // 计算该订单的总退款金额
            var totalRefund = orderRefunds.reduce(function (refundTotal, r) { return refundTotal + (r.refundCash || 0); }, 0);
            // 计算该订单的实际有效金额
            var effectiveAmount = Math.max(0, order.paidCash - totalRefund);
            return total + effectiveAmount;
        }, 0);
        // 计算当前总消费额
        var currentTotalSpend = this.getUserTotalSpendInWindow(userShortName, currentDate);
        // 如果有订单即将滚出窗口，且滚出后可能导致不满足会员条件，且当前是会员
        if (expiringOrdersValue > 0 &&
            currentTotalSpend >= config.MEMBER.NEW_RULE.TRIGGER_AMOUNT &&
            currentTotalSpend - expiringOrdersValue <
                config.MEMBER.NEW_RULE.TRIGGER_AMOUNT) {
            console.log("\u26A0\uFE0F \u8B66\u544A\uFF1A\u7528\u6237 ".concat(userShortName, " \u660E\u5929\u5C06\u6709\u4EF7\u503C \uFFE5").concat(expiringOrdersValue.toFixed(2), " \u7684\u8BA2\u5355\u6EDA\u51FA\u7A97\u53E3\uFF0C\u53EF\u80FD\u5BFC\u81F4\u4F1A\u5458\u8EAB\u4EFD\u964D\u7EA7\uFF01"));
        }
    };
    /**
     * 会员状态检查与经营提示
     * 在每次加载用户数据或进入经营模式时调用
     */
    DormStoreSystem.prototype.checkMembershipStatus = function () {
        var _this = this;
        var now = new Date();
        this.data.users.forEach(function (user) {
            var memberLevel = _this.getUserMemberLevel(user.shortName, now);
            var totalSpendInWindow = _this.getUserTotalSpendInWindow(user.shortName, now);
            // 显示用户当前状态
            var memberStatusText = memberLevel === "SPECIAL"
                ? "特殊用户"
                : memberLevel === "OFFICIAL"
                    ? "正式会员"
                    : "见习会员";
            console.log("\u7528\u6237 ".concat(user.shortName, ": ").concat(memberStatusText, " (\u8FD1").concat(config.MEMBER.NEW_RULE.LOOKBACK_DAYS, "\u5929\u6D88\u8D39: \uFFE5").concat(totalSpendInWindow.toFixed(2), ")"));
            // 对正式会员进行经营提示
            if (memberLevel === "OFFICIAL") {
                // 检查是否即将有大额订单"滚出窗口"
                _this.checkUpcomingOrdersExpiring(user.shortName, now);
            }
            // 对见习会员进行升级提示
            else if (memberLevel === "TRAINEE") {
                // 检查是否接近会员门槛
                if (totalSpendInWindow > 0 &&
                    totalSpendInWindow <
                        config.MEMBER.NEW_RULE.TRIGGER_AMOUNT &&
                    config.MEMBER.NEW_RULE.TRIGGER_AMOUNT -
                        totalSpendInWindow <=
                        5) {
                    console.log("\uD83D\uDCA1 \u7ECF\u8425\u63D0\u793A\uFF1A\u7528\u6237 ".concat(user.shortName, " \u8DDD\u79BB\u4F1A\u5458\u95E8\u69DB\u8FD8\u5DEE \uFFE5").concat((config.MEMBER.NEW_RULE.TRIGGER_AMOUNT - totalSpendInWindow).toFixed(2), "\uFF0C\u9F13\u52B1\u6D88\u8D39\u53EF\u5347\u7EA7\u4E3A\u6B63\u5F0F\u4F1A\u5458\uFF01"));
                }
            }
        });
    };
    /**
     * 生成校验码
     */
    DormStoreSystem.prototype.generateVerifyCode = function (orderId, paidCash, paidPoints, rewardPoints) {
        var str = config.SALT + orderId + paidCash + paidPoints + rewardPoints;
        return crypto
            .createHash("sha1")
            .update(str)
            .digest("hex")
            .substring(0, 6)
            .toUpperCase();
    };
    // ===================== 经营模式 =====================
    DormStoreSystem.prototype.runBusinessMode = function () {
        return __awaiter(this, void 0, void 0, function () {
            var shortName, user, realName, newUser, confirmCreate, realName, newUser, memberLevel, totalSpendInWindow, memberStatusText, remainingAmount, opt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.checkMembershipStatus(); // 检查会员状态
                        console.log("\n=== 🛒 经营模式 ===");
                        return [4 /*yield*/, this.ask("请输入顾客简称 (输入 . 创建新用户): ")];
                    case 1:
                        shortName = _a.sent();
                        user = this.data.users.find(function (u) { return u.shortName === shortName; });
                        if (!(shortName === "." || shortName === "。")) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.ask("请输入真实姓名: ")];
                    case 2:
                        realName = _a.sent();
                        return [4 /*yield*/, this.ask("请输入简称 (唯一ID): ")];
                    case 3:
                        shortName = _a.sent();
                        // 验证关键信息不能为空
                        if (!realName.trim()) {
                            console.log("❌ 真实姓名不能为空！");
                            return [2 /*return*/];
                        }
                        if (!shortName.trim()) {
                            console.log("❌ 简称不能为空！");
                            return [2 /*return*/];
                        }
                        // 验证简称唯一性
                        if (this.data.users.find(function (u) { return u.shortName === shortName; })) {
                            console.log("❌ 简称已存在！");
                            return [2 /*return*/];
                        }
                        newUser = {
                            shortName: shortName,
                            points: 0,
                            debt: 0,
                        };
                        this.data.users.push(newUser);
                        this.privacyMap[shortName] = realName;
                        this.saveData();
                        this.savePrivacyMap();
                        console.log("✅ 用户创建成功！");
                        user = newUser;
                        return [3 /*break*/, 7];
                    case 4:
                        if (!!user) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.ask("\u7528\u6237 \"".concat(shortName, "\" \u4E0D\u5B58\u5728\uFF0C\u662F\u5426\u521B\u5EFA\u65B0\u7528\u6237\uFF1F(y/n): "))];
                    case 5:
                        confirmCreate = _a.sent();
                        if (confirmCreate.toLowerCase() !== "y") {
                            console.log("❌ 已取消创建新用户");
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.ask("请输入真实姓名: ")];
                    case 6:
                        realName = _a.sent();
                        // 验证关键信息不能为空
                        if (!realName.trim()) {
                            console.log("❌ 真实姓名不能为空！");
                            return [2 /*return*/];
                        }
                        newUser = {
                            shortName: shortName,
                            points: 0,
                            debt: 0,
                        };
                        this.data.users.push(newUser);
                        this.privacyMap[shortName] = realName;
                        this.saveData();
                        this.savePrivacyMap();
                        console.log("✅ 用户创建成功！");
                        user = newUser;
                        _a.label = 7;
                    case 7:
                        memberLevel = this.getUserMemberLevel(user.shortName);
                        totalSpendInWindow = this.getUserTotalSpendInWindow(user.shortName);
                        memberStatusText = memberLevel === "SPECIAL"
                            ? "特殊用户"
                            : memberLevel === "OFFICIAL"
                                ? "正式会员"
                                : "见习会员";
                        console.log("\u4F1A\u5458\u72B6\u6001: ".concat(memberStatusText, " (\u8FD1").concat(config.MEMBER.NEW_RULE.LOOKBACK_DAYS, "\u5929\u6D88\u8D39: \uFFE5").concat(totalSpendInWindow.toFixed(2), ")"));
                        // 对见习会员进行升级提示
                        if (memberLevel === "TRAINEE") {
                            remainingAmount = config.MEMBER.NEW_RULE.TRIGGER_AMOUNT - totalSpendInWindow;
                            if (remainingAmount > 0 && remainingAmount <= 5) {
                                console.log("\u001B[33m\uD83D\uDCA1 \u63D0\u793A\uFF1A\u8DDD\u79BB\u4F1A\u5458\u95E8\u69DB\u8FD8\u5DEE \uFFE5".concat(remainingAmount.toFixed(2), "\uFF0C\u9F13\u52B1\u6D88\u8D39\u53EF\u5347\u7EA7\u4E3A\u6B63\u5F0F\u4F1A\u5458\uFF01\u001B[0m"));
                            }
                        }
                        _a.label = 8;
                    case 8:
                        if (!true) return [3 /*break*/, 15];
                        console.log("\n\u5F53\u524D\u987E\u5BA2: ".concat(user.shortName, " | \u79EF\u5206: ").concat(user.points, " | \u6B20\u6B3E: ").concat(user.debt));
                        console.log("1. 现金购物  2. 积分商城  3. 返回");
                        return [4 /*yield*/, this.ask("请选择: ")];
                    case 9:
                        opt = _a.sent();
                        if (!(opt === "1")) return [3 /*break*/, 11];
                        return [4 /*yield*/, this.handleCashPurchase(user)];
                    case 10:
                        _a.sent();
                        return [3 /*break*/, 14];
                    case 11:
                        if (!(opt === "2")) return [3 /*break*/, 13];
                        return [4 /*yield*/, this.handlePointsPurchase(user)];
                    case 12:
                        _a.sent();
                        return [3 /*break*/, 14];
                    case 13:
                        // 退出经营模式前，展示当前累计实付现金（不含积分）
                        this.showCurrentSessionCashRevenue(user.shortName);
                        // 满消费送商品计算
                        this.calculateGiftPromotion(user.shortName);
                        return [3 /*break*/, 15];
                    case 14: return [3 /*break*/, 8];
                    case 15: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 满消费送商品计算
     * @param userShortName 用户简称
     */
    DormStoreSystem.prototype.calculateGiftPromotion = function (userShortName) {
        var _this = this;
        var _a;
        // 检查是否启用满消费送商品功能
        if (!((_a = config.GIFT_PROMOTION) === null || _a === void 0 ? void 0 : _a.ENABLED)) {
            return;
        }
        console.log("\n=== 🎁 满消费送商品 ===");
        // 使用系统启动时间作为会话开始时间
        var sessionStartTime = this.systemStartTime;
        // 计算当前用户在当前会话中的现金订单实付总额
        var cashOrders = this.data.orders.filter(function (order) {
            return order.userShortName === userShortName &&
                order.type === "cash" &&
                order.timestamp >= sessionStartTime;
        });
        // 计算实付现金总额（扣除退款）
        var totalPaidCash = 0;
        cashOrders.forEach(function (order) {
            // 找到该订单的所有退款
            var orderRefunds = _this.data.refunds.filter(function (refund) { return refund.originalOrderId === order.id; });
            // 计算该订单的总退款金额
            var totalRefund = orderRefunds.reduce(function (sum, refund) { return sum + refund.refundCash; }, 0);
            // 计算该订单的实际有效金额
            var effectiveAmount = Math.max(0, order.paidCash - totalRefund);
            totalPaidCash += effectiveAmount;
        });
        // 获取用户的会员等级
        var memberLevel = this.getUserMemberLevel(userShortName);
        // 只有见习和正式会员参与活动
        if (memberLevel !== "TRAINEE" && memberLevel !== "OFFICIAL") {
            return;
        }
        // 获取赠送策略
        var strategy = config.GIFT_PROMOTION.STRATEGIES[memberLevel];
        if (!strategy) {
            return;
        }
        // 计算应送数量
        var giftCount = Math.floor(totalPaidCash / strategy);
        if (giftCount > 0) {
            // 查找要赠送的商品
            var giftProduct = this.data.products.find(function (p) { return p.id === config.GIFT_PROMOTION.PRODUCT_ID; });
            if (giftProduct) {
                console.log("\uD83C\uDF8A \u606D\u559C\uFF01\u60A8\u5728\u5F53\u524D\u4F1A\u8BDD\u6D88\u8D39\u4E86 \uFFE5".concat(totalPaidCash.toFixed(2)));
                console.log("\uD83C\uDF81 \u5E94\u83B7\u5F97\u8D60\u54C1: ".concat(giftProduct.name, " x ").concat(giftCount, " \u5305"));
            }
            else {
                console.log("\uD83C\uDF8A \u606D\u559C\uFF01\u60A8\u5728\u5F53\u524D\u4F1A\u8BDD\u6D88\u8D39\u4E86 \uFFE5".concat(totalPaidCash.toFixed(2)));
                console.log("\uD83C\uDF81 \u5E94\u83B7\u5F97\u8D60\u54C1: ".concat(config.GIFT_PROMOTION.PRODUCT_ID, " x ").concat(giftCount, " \u5305"));
            }
        }
    };
    /**
     * 展示当前会话累计实付现金（不含积分）
     * @param userShortName 用户简称
     */
    DormStoreSystem.prototype.showCurrentSessionCashRevenue = function (userShortName) {
        var _this = this;
        console.log("\n=== 💰 当前会话累计实付现金 ===");
        // 使用系统启动时间作为会话开始时间
        var sessionStartTime = this.systemStartTime;
        // 计算当前用户在当前会话中的现金订单实付总额
        var cashOrders = this.data.orders.filter(function (order) {
            return order.userShortName === userShortName &&
                order.type === "cash" &&
                order.timestamp >= sessionStartTime;
        });
        // 计算实付现金总额（扣除退款）
        var totalPaidCash = 0;
        cashOrders.forEach(function (order) {
            // 找到该订单的所有退款
            var orderRefunds = _this.data.refunds.filter(function (refund) { return refund.originalOrderId === order.id; });
            // 计算该订单的总退款金额
            var totalRefund = orderRefunds.reduce(function (sum, refund) { return sum + refund.refundCash; }, 0);
            // 计算该订单的实际有效金额
            var effectiveAmount = Math.max(0, order.paidCash - totalRefund);
            totalPaidCash += effectiveAmount;
        });
        console.log("\u7528\u6237: ".concat(userShortName, " (").concat(this.getRealName(userShortName), ")"));
        console.log("\u5F53\u524D\u4F1A\u8BDD\u7D2F\u8BA1\u5B9E\u4ED8\u73B0\u91D1: \uFFE5".concat(totalPaidCash.toFixed(2)));
        if (cashOrders.length > 0) {
            console.log("\u8BA2\u5355\u6570\u91CF: ".concat(cashOrders.length, " \u5355"));
            // 显示订单详情（可选）
            console.log("\n订单详情:");
            cashOrders.forEach(function (order) {
                var orderRefunds = _this.data.refunds.filter(function (refund) { return refund.originalOrderId === order.id; });
                var totalRefund = orderRefunds.reduce(function (sum, refund) { return sum + refund.refundCash; }, 0);
                var effectiveAmount = Math.max(0, order.paidCash - totalRefund);
                console.log("  ".concat(order.productName, " x ").concat(order.quantity, " - \u5B9E\u4ED8: \uFFE5").concat(effectiveAmount.toFixed(2)));
            });
        }
        else {
            console.log("当前会话无现金订单");
        }
    };
    // --- 现金购物 ---
    DormStoreSystem.prototype.handleCashPurchase = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var availableCashProducts, soldOutCashProducts, input, prod, index, qtyStr, qty, currentStock, totalCost, totalCostValue, rewardPoints, orderCreationTime, confirm, orderId, memberLevel, finalPaidCash, order, verifyCode;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\n--- 现金货架 ---");
                        availableCashProducts = this.data.products.filter(function (p) {
                            return p.prices[ProductShelf.CASH] &&
                                _this.calculateCurrentStock(p.id) > 0;
                        });
                        soldOutCashProducts = this.data.products.filter(function (p) {
                            return p.prices[ProductShelf.CASH] &&
                                _this.calculateCurrentStock(p.id) === 0;
                        });
                        // 显示可购买商品
                        availableCashProducts.forEach(function (p, index) {
                            console.log("[".concat(index + 1, "] [").concat(p.id, "] ").concat(p.name, " - \uFFE5").concat(p.prices[ProductShelf.CASH], " (\u5E93\u5B58: ").concat(_this.calculateCurrentStock(p.id), ")"));
                        });
                        // 提示已售罄商品
                        if (soldOutCashProducts.length > 0) {
                            console.log("\n--- 已售罄商品 ---");
                            soldOutCashProducts.forEach(function (p) {
                                console.log("[".concat(p.id, "] ").concat(p.name, " - \u5DF2\u552E\u7F44"));
                            });
                        }
                        return [4 /*yield*/, this.ask("输入商品ID/序号: ")];
                    case 1:
                        input = _a.sent();
                        index = parseInt(input);
                        if (!isNaN(index) &&
                            index >= 1 &&
                            index <= availableCashProducts.length) {
                            prod = availableCashProducts[index - 1];
                        }
                        else {
                            // 否则尝试作为ID查找
                            prod = this.data.products.find(function (p) { return p.id === input; });
                        }
                        if (!prod || !prod.prices[ProductShelf.CASH]) {
                            console.log("无效商品ID/序号。");
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.ask("输入数量: ")];
                    case 2:
                        qtyStr = _a.sent();
                        qty = parseInt(qtyStr);
                        if (isNaN(qty) || qty <= 0) {
                            console.log("数量需要是正整数。");
                            return [2 /*return*/];
                        }
                        currentStock = this.calculateCurrentStock(prod.id);
                        if (qty > currentStock) {
                            console.log("库存不足！");
                            return [2 /*return*/];
                        }
                        totalCost = prod.prices[ProductShelf.CASH] * qty;
                        totalCostValue = prod.cost * qty;
                        rewardPoints = 0;
                        orderCreationTime = new Date();
                        // 无论正式会员还是见习会员都能获得积分，只是倍率不同
                        rewardPoints = this.calculateRewardPoints(user, prod, qty, totalCost, orderCreationTime);
                        // 拦截逻辑：检查积分上限
                        if (rewardPoints > 0 && user.points >= config.MAX_POINTS) {
                            console.log("\u274C \u79EF\u5206\u5DF2\u8FBE\u4E0A\u9650\uFF08".concat(config.MAX_POINTS, "\uFF09\uFF0C\u8BF7\u5148\u6D88\u8017\u79EF\u5206\u540E\u518D\u8D2D\u4E70\u6B64\u7C7B\u5546\u54C1"));
                            return [2 /*return*/];
                        }
                        // 展示详细订单信息
                        console.log("\n=== 📋 订单详情 ===");
                        console.log("\u5546\u54C1: ".concat(prod.name));
                        console.log("\u6570\u91CF: ".concat(qty));
                        console.log("\u5355\u4EF7: \uFFE5".concat(prod.prices[ProductShelf.CASH].toFixed(2)));
                        console.log("\u4F18\u60E0: ".concat(rewardPoints > 0 ? "\u8D60\u9001 ".concat(rewardPoints, " \u79EF\u5206") : "无"));
                        console.log("\u603B\u91D1\u989D: \uFFE5".concat(totalCost.toFixed(2)));
                        console.log("\n=== \uD83D\uDCB0 \u987E\u5BA2\u8D44\u4EA7 ===");
                        console.log("\u5F53\u524D\u79EF\u5206: ".concat(user.points));
                        console.log("\u5F53\u524D\u6B20\u6B3E: ".concat(user.debt));
                        console.log("\u5E94\u4ED8\u91D1\u989D: \uFFE5".concat(totalCost.toFixed(2)));
                        return [4 /*yield*/, this.ask("\n确认购买？(Y/N): ")];
                    case 3:
                        confirm = _a.sent();
                        if (confirm.toUpperCase() !== "Y") {
                            console.log("❌ 购买已取消");
                            return [2 /*return*/];
                        }
                        orderId = this.generateId("CASH");
                        memberLevel = this.getUserMemberLevel(user.shortName);
                        finalPaidCash = memberLevel === "SPECIAL" ? 0 : totalCost;
                        order = {
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
                            orderId: orderId,
                            user: user.shortName,
                            timestamp: new Date(),
                        });
                        verifyCode = this.generateVerifyCode(orderId, finalPaidCash, // 使用调整后的实付金额
                        0, rewardPoints);
                        console.log("✅ 购买成功！");
                        console.log("\u8BA2\u5355\u53F7: ".concat(orderId));
                        console.log("\u6821\u9A8C\u7801: ".concat(verifyCode));
                        console.log("\n=== \uD83E\uDDFE \u624B\u5199\u5C0F\u7968\u6821\u9A8C\u6570\u636E ===");
                        console.log("\u8BA2\u5355\u53F7: ".concat(orderId));
                        console.log("\u73B0\u91D1\u652F\u4ED8: ".concat(finalPaidCash.toFixed(2)));
                        console.log("\u79EF\u5206\u652F\u4ED8: 0");
                        console.log("\u5956\u52B1\u79EF\u5206: ".concat(rewardPoints));
                        console.log("\u6821\u9A8C\u7801: ".concat(verifyCode));
                        console.log("(\u5982\u9700\u8D4A\u8D26\uFF0C\u8BF7\u524D\u5F80\u7BA1\u7406\u6A21\u5F0F\u624B\u52A8\u8BB0\u5F55)");
                        // 检查并通知会员状态变化
                        this.checkAndNotifyMembershipChange(user.shortName);
                        return [2 /*return*/];
                }
            });
        });
    };
    // --- 促销活动计算 ---
    DormStoreSystem.prototype.calculateRewardPoints = function (user, product, quantity, totalAmount, orderCreationTime) {
        var _this = this;
        if (!product.promoIds || product.promoIds.length === 0) {
            return 0;
        }
        // 获取该商品参与的所有促销活动
        var applicablePromotions = product.promoIds
            .map(function (promoId) { return _this.data.promotions.find(function (p) { return p.id === promoId; }); })
            .filter(function (p) { return p !== undefined; })
            .filter(function (p) { return p.isMemberOnly; });
        if (applicablePromotions.length === 0) {
            return 0;
        }
        // 移除每周限购逻辑，直接使用全部数量计算奖励积分
        var eligibleQuantity = quantity;
        // 计算每个促销活动的奖励积分
        var rewards = applicablePromotions.map(function (promo) {
            var reward = 0;
            if (promo.type === "quantity_based") {
                // 按数量计算奖励
                var fullSets = Math.floor(eligibleQuantity / promo.threshold);
                reward = fullSets * promo.rewardPoints;
            }
            else if (promo.type === "amount_based") {
                // 按金额计算奖励（防御性编程：避免除零错误）
                var eligibleAmount = quantity === 0
                    ? 0
                    : (totalAmount / quantity) * eligibleQuantity;
                var fullSets = Math.floor(eligibleAmount / promo.threshold);
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
        var bestReward = rewards.reduce(function (max, current) {
            return current.rewardPoints > max.rewardPoints ? current : max;
        });
        // 根据会员等级应用不同的积分倍率
        var memberLevel = this.getUserMemberLevel(user.shortName, orderCreationTime);
        // 使用配置中的积分倍率
        var multiplier = this.memberConfig.pointRates[memberLevel] || 0;
        // 确保倍率不为负数
        var safeMultiplier = Math.max(0, multiplier);
        var finalRewardPoints = bestReward.rewardPoints * safeMultiplier;
        console.log("\u5E94\u7528\u4FC3\u9500\u6D3B\u52A8: ".concat(bestReward.promoName, " - \u83B7\u5F97 ").concat(finalRewardPoints, " \u79EF\u5206 (").concat(memberLevel === "OFFICIAL"
            ? "正式会员"
            : memberLevel === "SPECIAL"
                ? "特殊用户"
                : "见习会员", "\u500D\u7387: ").concat(multiplier * 100, "%)"));
        return finalRewardPoints;
    };
    // --- 积分商城 ---
    DormStoreSystem.prototype.handlePointsPurchase = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var memberLevel, availablePointsProducts, soldOutPointsProducts, input, prod, index, qtyStr, qty, currentStock, totalPrice, totalCostValue, confirm, orderId, order, verifyCode;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        memberLevel = this.getUserMemberLevel(user.shortName);
                        // 特殊用户无法参与积分兑换
                        if (memberLevel === "SPECIAL") {
                            console.log("❌ 特殊用户无法参与积分兑换");
                            return [2 /*return*/];
                        }
                        console.log("\n--- 积分商城 ---");
                        availablePointsProducts = this.data.products.filter(function (p) {
                            return p.prices[ProductShelf.POINTS] &&
                                _this.calculateCurrentStock(p.id) > 0;
                        });
                        soldOutPointsProducts = this.data.products.filter(function (p) {
                            return p.prices[ProductShelf.POINTS] &&
                                _this.calculateCurrentStock(p.id) === 0;
                        });
                        // 显示可购买商品
                        availablePointsProducts.forEach(function (p, index) {
                            var pointsPrice = p.prices[ProductShelf.POINTS];
                            if (pointsPrice !== undefined) {
                                console.log("[".concat(index + 1, "] [").concat(p.id, "] ").concat(p.name, " - ").concat(pointsPrice.toFixed(2), " \u79EF\u5206 (\u5E93\u5B58: ").concat(_this.calculateCurrentStock(p.id), ")"));
                            }
                        });
                        // 提示已售罄商品
                        if (soldOutPointsProducts.length > 0) {
                            console.log("\n--- 已售罄商品 ---");
                            soldOutPointsProducts.forEach(function (p) {
                                console.log("[".concat(p.id, "] ").concat(p.name, " - \u5DF2\u552E\u7F44"));
                            });
                        }
                        return [4 /*yield*/, this.ask("输入商品ID/序号: ")];
                    case 1:
                        input = _a.sent();
                        index = parseInt(input);
                        if (!isNaN(index) &&
                            index >= 1 &&
                            index <= availablePointsProducts.length) {
                            prod = availablePointsProducts[index - 1];
                        }
                        else {
                            // 否则尝试作为ID查找
                            prod = this.data.products.find(function (p) { return p.id === input; });
                        }
                        if (!prod || !prod.prices[ProductShelf.POINTS]) {
                            console.log("无效商品ID/序号。");
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.ask("输入数量: ")];
                    case 2:
                        qtyStr = _a.sent();
                        qty = parseInt(qtyStr);
                        if (isNaN(qty) || qty <= 0) {
                            console.log("数量需要是正整数。");
                            return [2 /*return*/];
                        }
                        currentStock = this.calculateCurrentStock(prod.id);
                        if (qty > currentStock) {
                            console.log("库存不足！");
                            return [2 /*return*/];
                        }
                        totalPrice = prod.prices[ProductShelf.POINTS] * qty;
                        totalCostValue = prod.cost * qty;
                        // 展示详细订单信息
                        console.log("\n=== 📋 订单详情 ===");
                        console.log("\u5546\u54C1: ".concat(prod.name));
                        console.log("\u6570\u91CF: ".concat(qty));
                        console.log("\u5355\u4EF7: ".concat(prod.prices[ProductShelf.POINTS].toFixed(2), " \u79EF\u5206"));
                        console.log("\u603B\u79EF\u5206: ".concat(totalPrice.toFixed(2)));
                        console.log("\n=== \uD83D\uDCB0 \u987E\u5BA2\u8D44\u4EA7 ===");
                        console.log("\u5F53\u524D\u79EF\u5206: ".concat(user.points));
                        console.log("\u5F53\u524D\u6B20\u6B3E: ".concat(user.debt));
                        console.log("\u9700\u6D88\u8017\u79EF\u5206: ".concat(totalPrice.toFixed(2)));
                        return [4 /*yield*/, this.ask("\n确认兑换？(Y/N): ")];
                    case 3:
                        confirm = _a.sent();
                        if (confirm.toUpperCase() !== "Y") {
                            console.log("❌ 兑换已取消");
                            return [2 /*return*/];
                        }
                        if (user.points < totalPrice) {
                            console.log("❌ 积分不足");
                            return [2 /*return*/];
                        }
                        // 扣除积分
                        user.points -= totalPrice;
                        orderId = this.generateId("PTS");
                        order = {
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
                        verifyCode = this.generateVerifyCode(orderId, 0, totalPrice, 0);
                        console.log("✅ 兑换成功！");
                        console.log("\u8BA2\u5355\u53F7: ".concat(orderId));
                        console.log("\u6821\u9A8C\u7801: ".concat(verifyCode));
                        console.log("\n=== \uD83E\uDDFE \u624B\u5199\u5C0F\u7968\u6821\u9A8C\u6570\u636E ===");
                        console.log("\u8BA2\u5355\u53F7: ".concat(orderId));
                        console.log("\u73B0\u91D1\u652F\u4ED8: 0");
                        console.log("\u79EF\u5206\u652F\u4ED8: ".concat(totalPrice.toFixed(2)));
                        console.log("\u5956\u52B1\u79EF\u5206: 0");
                        console.log("\u6821\u9A8C\u7801: ".concat(verifyCode));
                        // 检查并通知会员状态变化
                        this.checkAndNotifyMembershipChange(user.shortName);
                        return [2 /*return*/];
                }
            });
        });
    };
    // --- 积分抽奖 ---
    // 抽奖功能已禁用
    // ===================== 管理模式 =====================
    DormStoreSystem.prototype.runAdminMode = function () {
        return __awaiter(this, void 0, void 0, function () {
            var opt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!true) return [3 /*break*/, 21];
                        console.log("\n=== 🔧 管理模式 ===");
                        console.log("\u5F53\u524D\u6D3B\u52A8\u9884\u7B97: ".concat(this.getActivityBudget().toFixed(2), " \u79EF\u5206"));
                        console.log("1. 商品看板  2. 活动看板  3. 顾客看板");
                        console.log("4. 资产/赊账管理  5. 库存管理  6. 退款业务");
                        console.log("7. 活动预算管理  8. 收入情况  9. 导出欠债名单  10. 校验码反查  11. 查询顾客消费记录  12. 退出");
                        return [4 /*yield*/, this.ask("请选择: ")];
                    case 1:
                        opt = _a.sent();
                        if (!(opt === "1")) return [3 /*break*/, 2];
                        this.showProductDashboard();
                        return [3 /*break*/, 20];
                    case 2:
                        if (!(opt === "2")) return [3 /*break*/, 3];
                        this.showActivityDashboard();
                        return [3 /*break*/, 20];
                    case 3:
                        if (!(opt === "3")) return [3 /*break*/, 4];
                        this.showUserDashboard();
                        return [3 /*break*/, 20];
                    case 4:
                        if (!(opt === "4")) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.manageAssets()];
                    case 5:
                        _a.sent();
                        return [3 /*break*/, 20];
                    case 6:
                        if (!(opt === "5")) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.manageInventory()];
                    case 7:
                        _a.sent();
                        return [3 /*break*/, 20];
                    case 8:
                        if (!(opt === "6")) return [3 /*break*/, 10];
                        return [4 /*yield*/, this.processRefund()];
                    case 9:
                        _a.sent();
                        return [3 /*break*/, 20];
                    case 10:
                        if (!(opt === "7")) return [3 /*break*/, 12];
                        return [4 /*yield*/, this.manageActivityBudget()];
                    case 11:
                        _a.sent();
                        return [3 /*break*/, 20];
                    case 12:
                        if (!(opt === "8")) return [3 /*break*/, 13];
                        this.showRevenueOverview();
                        return [3 /*break*/, 20];
                    case 13:
                        if (!(opt === "9")) return [3 /*break*/, 15];
                        return [4 /*yield*/, this.exportDebtorList()];
                    case 14:
                        _a.sent();
                        return [3 /*break*/, 20];
                    case 15:
                        if (!(opt === "10")) return [3 /*break*/, 17];
                        return [4 /*yield*/, this.reverseLookupVerifyCode()];
                    case 16:
                        _a.sent();
                        return [3 /*break*/, 20];
                    case 17:
                        if (!(opt === "11")) return [3 /*break*/, 19];
                        return [4 /*yield*/, this.queryCustomerConsumption()];
                    case 18:
                        _a.sent();
                        return [3 /*break*/, 20];
                    case 19: return [3 /*break*/, 21];
                    case 20: return [3 /*break*/, 0];
                    case 21: return [2 /*return*/];
                }
            });
        });
    };
    DormStoreSystem.prototype.showProductDashboard = function () {
        var _this = this;
        console.log("\n--- 商品看板 ---");
        // 计算最近2小时的起始时间
        var twoHoursAgo = new Date();
        twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
        this.data.products.forEach(function (p) {
            var _a, _b;
            console.log("".concat(p.name, " [").concat(p.id, "]"));
            console.log("  \u5E93\u5B58: ".concat(_this.calculateCurrentStock(p.id), " | \u6210\u672C: \uFFE5").concat(p.cost.toFixed(2)));
            console.log("  \u552E\u4EF7: \u73B0\uFFE5".concat((_a = p.prices.cash) === null || _a === void 0 ? void 0 : _a.toFixed(2), " / \u79EF").concat((_b = p.prices.points) === null || _b === void 0 ? void 0 : _b.toFixed(2)));
            // 显示促销活动
            if (p.promoIds && p.promoIds.length > 0) {
                var promos = p.promoIds
                    .map(function (id) { return _this.data.promotions.find(function (p) { return p.id === id; }); })
                    .filter(function (p) { return p !== undefined; });
                if (promos.length > 0) {
                    console.log("  \u4FC3\u9500\u6D3B\u52A8: ".concat(promos.map(function (p) { return p === null || p === void 0 ? void 0 : p.name; }).join(", ")));
                }
            }
            // 计算本周销量（特殊用户不统计在销量指标中）
            var weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            weekStart.setHours(0, 0, 0, 0);
            var weeklySales = _this.data.orders
                .filter(function (order) {
                return order.productId === p.id &&
                    order.timestamp >= weekStart;
            })
                .reduce(function (total, order) { return total + order.quantity; }, 0);
            // 计算最近2小时销量
            var twoHourSales = _this.data.orders
                .filter(function (order) {
                return order.productId === p.id &&
                    order.timestamp >= twoHoursAgo;
            })
                .reduce(function (total, order) { return total + order.quantity; }, 0);
            console.log("  \u672C\u5468\u9500\u91CF: ".concat(weeklySales, " \u4EF6"));
            console.log("  \u8FD12\u5C0F\u65F6\u9500\u91CF: ".concat(twoHourSales, " \u4EF6"));
        });
    };
    DormStoreSystem.prototype.showActivityDashboard = function () {
        console.log("\n--- 活动看板 ---");
        console.log("\u5269\u4F59\u9884\u7B97: ".concat(this.getActivityBudget(), " \u79EF\u5206"));
    };
    DormStoreSystem.prototype.showUserDashboard = function () {
        var _this = this;
        console.log("\n--- 顾客看板 ---");
        // 更新所有用户的会员状态
        this.checkMembershipStatus(); // 检查会员是否过期
        this.data.users.forEach(function (u) {
            var memberLevel = _this.getUserMemberLevel(u.shortName);
            var memberStatus = memberLevel === "SPECIAL"
                ? "特殊用户"
                : memberLevel === "OFFICIAL"
                    ? "正式会员"
                    : memberLevel === "TRAINEE"
                        ? "见习会员"
                        : "非会员";
            // 计算用户总消费（基于订单历史）
            var totalSpent = _this.data.orders
                .filter(function (o) { return o.userShortName === u.shortName && o.type === "cash"; })
                .reduce(function (sum, order) {
                // 找到该订单的所有退款
                var orderRefunds = _this.data.refunds.filter(function (r) { return r.originalOrderId === order.id; });
                // 计算该订单的总退款金额
                var totalRefund = orderRefunds.reduce(function (refundTotal, r) { return refundTotal + (r.refundCash || 0); }, 0);
                // 计算该订单的实际有效金额
                var effectiveAmount = Math.max(0, order.paidCash - totalRefund);
                return sum + effectiveAmount;
            }, 0);
            console.log("".concat(u.shortName, " (").concat(_this.getRealName(u.shortName), ")"));
            console.log("  \u4F1A\u5458: ".concat(memberStatus, " | \u79EF\u5206: ").concat(u.points, " | \u6B20\u6B3E: ").concat(u.debt));
            console.log("  \u603B\u6D88\u8D39: \uFFE5".concat(totalSpent.toFixed(2)));
        });
    };
    // --- 资产/赊账管理 (核心变更) ---
    DormStoreSystem.prototype.manageAssets = function () {
        return __awaiter(this, void 0, void 0, function () {
            var shortName, user, opt, amountStr, amount, oldDebt, newDebt, amountStr, amount, newPoints;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\n=== 📝 资产/赊账管理 ===");
                        return [4 /*yield*/, this.ask("请输入顾客简称: ")];
                    case 1:
                        shortName = _a.sent();
                        user = this.data.users.find(function (u) { return u.shortName === shortName; });
                        if (!user) {
                            console.log("用户不存在");
                            return [2 /*return*/];
                        }
                        console.log("\u5F53\u524D\u7528\u6237: ".concat(shortName));
                        console.log("1. \u4FEE\u6539\u6B20\u6B3E (\u5F53\u524D: ".concat(user.debt, ")"));
                        console.log("2. \u4FEE\u6539\u79EF\u5206 (\u5F53\u524D: ".concat(user.points, ")"));
                        return [4 /*yield*/, this.ask("请选择操作: ")];
                    case 2:
                        opt = _a.sent();
                        if (!(opt === "1")) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.ask("输入变动金额 (正=欠我增加, 负=欠我减少): ")];
                    case 3:
                        amountStr = _a.sent();
                        amount = parseFloat(amountStr);
                        if (isNaN(amount))
                            return [2 /*return*/];
                        oldDebt = user.debt;
                        newDebt = user.debt + amount;
                        console.log("\u64CD\u4F5C\u540E\u6B20\u6B3E\u5C06\u4E3A: ".concat(newDebt));
                        return [4 /*yield*/, this.ask("确认吗？ === 'Y'")];
                    case 4:
                        if ((_a.sent()) === "Y") {
                            user.debt = newDebt;
                            this.logManualOperation("\u8D4A\u8D26\u8C03\u6574: ".concat(amount), "debt_adjust", amount, oldDebt, // 传递赊账前的金额
                            newDebt);
                            this.saveData();
                            console.log("✅ 已更新");
                        }
                        return [3 /*break*/, 8];
                    case 5:
                        if (!(opt === "2")) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.ask("输入变动积分 (正=充值, 负=扣除): ")];
                    case 6:
                        amountStr = _a.sent();
                        amount = parseFloat(amountStr);
                        if (isNaN(amount))
                            return [2 /*return*/];
                        newPoints = user.points + amount;
                        console.log("\u64CD\u4F5C\u540E\u79EF\u5206\u5C06\u4E3A: ".concat(newPoints));
                        return [4 /*yield*/, this.ask("确认吗？ === 'Y'")];
                    case 7:
                        if ((_a.sent()) === "Y") {
                            user.points = newPoints;
                            this.logManualOperation("\u79EF\u5206\u8C03\u6574: ".concat(amount), "points_adjust", amount);
                            this.saveData();
                            console.log("✅ 已更新");
                        }
                        _a.label = 8;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    DormStoreSystem.prototype.logManualOperation = function (reason, type, amount, oldValue, newValue) {
        if (type === void 0) { type = "debt_adjust"; }
        if (amount === void 0) { amount = 0; }
        // 使用 otherLogs 记录所有手动资产变更
        var finalReason = reason;
        // 如果是赊账调整，并且提供了旧值和新值，则在备注中记录赊账前和赊账后的金额
        if (type === "debt_adjust" &&
            oldValue !== undefined &&
            newValue !== undefined) {
            finalReason = "".concat(reason, " (\u8D4A\u8D26\u524D: ").concat(oldValue, ", \u8D4A\u8D26\u540E: ").concat(newValue, ")");
        }
        this.data.otherLogs.push({
            id: this.generateId("MAN"),
            timestamp: new Date(),
            type: type,
            amount: amount,
            reason: finalReason,
        });
    };
    /**
     * 校验码反查 - 通过校验码查找订单
     */
    DormStoreSystem.prototype.reverseLookupVerifyCode = function () {
        return __awaiter(this, void 0, void 0, function () {
            var verifyCode, targetCode, found, checkedCount, _loop_1, this_1, i, state_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\n=== 🔍 校验码反查 ===");
                        return [4 /*yield*/, this.ask("请输入6位校验码: ")];
                    case 1:
                        verifyCode = _a.sent();
                        if (!verifyCode || verifyCode.length !== 6) {
                            console.log("❌ 校验码必须是6位字符");
                            return [2 /*return*/];
                        }
                        targetCode = verifyCode.toUpperCase();
                        console.log("\n\u6B63\u5728\u67E5\u627E\u6821\u9A8C\u7801\u4E3A ".concat(targetCode, " \u7684\u8BA2\u5355..."));
                        found = false;
                        checkedCount = 0;
                        _loop_1 = function (i) {
                            var order = this_1.data.orders[i];
                            checkedCount++;
                            // 计算该订单的校验码
                            var calculatedCode = this_1.generateVerifyCode(order.id, order.paidCash, order.paidPoints, order.rewardPoints);
                            // 显示进度（每检查10个订单显示一次）
                            if (checkedCount % 10 === 0) {
                                console.log("\u5DF2\u68C0\u67E5 ".concat(checkedCount, "/").concat(this_1.data.orders.length, " \u4E2A\u8BA2\u5355..."));
                            }
                            if (calculatedCode === targetCode) {
                                found = true;
                                console.log("\n✅ 找到匹配的订单！");
                                console.log("\n=== 📋 订单详情 ===");
                                console.log("\u8BA2\u5355\u53F7: ".concat(order.id));
                                console.log("\u65F6\u95F4: ".concat(order.timestamp.toLocaleString()));
                                console.log("\u7528\u6237: ".concat(order.userShortName, " (").concat(this_1.getRealName(order.userShortName), ")"));
                                console.log("\u5546\u54C1: ".concat(order.productName, " x ").concat(order.quantity));
                                console.log("\u5B9E\u4ED8\u73B0\u91D1: \uFFE5".concat(order.paidCash.toFixed(2)));
                                console.log("\u5B9E\u4ED8\u79EF\u5206: ".concat(order.paidPoints.toFixed(2)));
                                console.log("\u5956\u52B1\u79EF\u5206: ".concat(order.rewardPoints));
                                console.log("\u7C7B\u578B: ".concat(order.type === "cash" ? "现金购买" : "积分兑换"));
                                if (order.note) {
                                    console.log("\u5907\u6CE8: ".concat(order.note));
                                }
                                // 检查是否有退款记录
                                var refunds = this_1.data.refunds.filter(function (refund) { return refund.originalOrderId === order.id; });
                                if (refunds.length > 0) {
                                    console.log("\n⚠️  该订单存在退款记录:");
                                    refunds.forEach(function (refund) {
                                        console.log("  - ".concat(refund.timestamp.toLocaleString(), ": \u9000\u6B3E\u73B0\u91D1 \uFFE5").concat(refund.refundCash.toFixed(2), ", \u9000\u6B3E\u79EF\u5206 ").concat(refund.refundPoints, ", \u6263\u9664\u79EF\u5206 ").concat(refund.deductPoints, ", \u539F\u56E0: ").concat(refund.reason));
                                    });
                                }
                                console.log("\n\uD83D\uDCDD \u6821\u9A8C\u7801\u8BA1\u7B97\u53C2\u6570:");
                                console.log("  \u8BA2\u5355ID: ".concat(order.id));
                                console.log("  \u5B9E\u4ED8\u73B0\u91D1: ".concat(order.paidCash));
                                console.log("  \u5B9E\u4ED8\u79EF\u5206: ".concat(order.paidPoints));
                                console.log("  \u5956\u52B1\u79EF\u5206: ".concat(order.rewardPoints));
                                return "break";
                            }
                        };
                        this_1 = this;
                        // 从最后一个订单开始向前遍历
                        for (i = this.data.orders.length - 1; i >= 0; i--) {
                            state_1 = _loop_1(i);
                            if (state_1 === "break")
                                break;
                        }
                        if (!found) {
                            console.log("\n\u274C \u672A\u627E\u5230\u6821\u9A8C\u7801\u4E3A ".concat(targetCode, " \u7684\u8BA2\u5355"));
                            console.log("\u5171\u68C0\u67E5\u4E86 ".concat(checkedCount, " \u4E2A\u8BA2\u5355"));
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 活动预算管理 - 手动加减预算
     */
    DormStoreSystem.prototype.manageActivityBudget = function () {
        return __awaiter(this, void 0, void 0, function () {
            var opt, amountStr, amount, reason, otherLog;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\n=== 💰 活动预算管理 ===");
                        console.log("\u5F53\u524D\u6D3B\u52A8\u9884\u7B97: ".concat(this.getActivityBudget().toFixed(2), " \u79EF\u5206"));
                        console.log("1. 增加预算  2. 减少预算  3. 返回");
                        return [4 /*yield*/, this.ask("请选择操作: ")];
                    case 1:
                        opt = _a.sent();
                        if (!(opt === "1" || opt === "2")) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.ask("输入金额 (正数): ")];
                    case 2:
                        amountStr = _a.sent();
                        amount = parseFloat(amountStr);
                        if (isNaN(amount) || amount <= 0) {
                            console.log("❌ 金额必须是正数");
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.ask("输入操作原因: ")];
                    case 3:
                        reason = _a.sent();
                        otherLog = {
                            id: this.generateId("MAN"),
                            timestamp: new Date(),
                            type: "budget_adjust",
                            amount: opt === "1" ? amount : -amount,
                            reason: reason,
                        };
                        // 添加到其他日志
                        this.data.otherLogs.push(otherLog);
                        this.saveData();
                        console.log("\u2705 \u6210\u529F".concat(opt === "1" ? "增加" : "减少", "\u9884\u7B97 ").concat(amount, " \u79EF\u5206"));
                        console.log("\u5F53\u524D\u6D3B\u52A8\u9884\u7B97: ".concat(this.getActivityBudget().toFixed(2), " \u79EF\u5206"));
                        return [3 /*break*/, 5];
                    case 4:
                        if (opt !== "3") {
                            console.log("❌ 无效选项");
                        }
                        _a.label = 5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    // --- 库存管理 ---
    DormStoreSystem.prototype.manageInventory = function () {
        return __awaiter(this, void 0, void 0, function () {
            var prodId, newId, name_1, cost, _a, initialStock, _b, pCash, _c, pPoints, _d, promoInput, promoIds, selectedIndices, _i, selectedIndices_1, index, newProd, prod, option, adjustmentInput, adjustment, oldStock, newStock, inventoryLog, promoInput, selectedIndices, promoIds, _e, selectedIndices_2, index, newCashPrice, newPointsPrice, cashPrice, pointsPrice;
            var _f;
            var _this = this;
            var _g, _h;
            return __generator(this, function (_j) {
                switch (_j.label) {
                    case 0:
                        console.log("\n--- 库存管理 ---");
                        return [4 /*yield*/, this.ask("输入商品ID (留空上架新品): ")];
                    case 1:
                        prodId = _j.sent();
                        if (!(prodId.trim() === "")) return [3 /*break*/, 9];
                        return [4 /*yield*/, this.ask("新商品ID: ")];
                    case 2:
                        newId = _j.sent();
                        return [4 /*yield*/, this.ask("名称: ")];
                    case 3:
                        name_1 = _j.sent();
                        _a = parseFloat;
                        return [4 /*yield*/, this.ask("成本: ")];
                    case 4:
                        cost = _a.apply(void 0, [_j.sent()]);
                        _b = parseInt;
                        return [4 /*yield*/, this.ask("初始库存: ")];
                    case 5:
                        initialStock = _b.apply(void 0, [_j.sent()]);
                        _c = parseFloat;
                        return [4 /*yield*/, this.ask("现金售价: ")];
                    case 6:
                        pCash = _c.apply(void 0, [_j.sent()]);
                        _d = parseFloat;
                        return [4 /*yield*/, this.ask("积分售价: ")];
                    case 7:
                        pPoints = _d.apply(void 0, [_j.sent()]);
                        // 显示所有可用优惠策略
                        console.log("\n--- 可用优惠策略 ---");
                        this.data.promotions.forEach(function (promo, index) {
                            console.log("[".concat(index + 1, "] ").concat(promo.name, " (").concat(promo.id, ")"));
                        });
                        return [4 /*yield*/, this.ask("选择优惠策略序号（逗号分隔，留空不设置）: ")];
                    case 8:
                        promoInput = _j.sent();
                        promoIds = [];
                        if (promoInput.trim() !== "") {
                            selectedIndices = promoInput
                                .split(",")
                                .map(function (s) { return parseInt(s.trim()) - 1; });
                            for (_i = 0, selectedIndices_1 = selectedIndices; _i < selectedIndices_1.length; _i++) {
                                index = selectedIndices_1[_i];
                                if (index >= 0 && index < this.data.promotions.length) {
                                    promoIds.push(this.data.promotions[index].id);
                                }
                            }
                        }
                        newProd = {
                            id: newId,
                            name: name_1,
                            cost: cost,
                            initialStock: initialStock,
                            prices: (_f = {},
                                _f[ProductShelf.CASH] = pCash || undefined,
                                _f[ProductShelf.POINTS] = pPoints || undefined,
                                _f),
                            promoIds: promoIds.length > 0 ? promoIds : undefined,
                        };
                        this.data.products.push(newProd);
                        this.saveData();
                        console.log("✅ 上架成功");
                        return [3 /*break*/, 18];
                    case 9:
                        prod = this.data.products.find(function (p) { return p.id === prodId; });
                        if (!prod) {
                            console.log("商品不存在");
                            return [2 /*return*/];
                        }
                        console.log("\n\u5F53\u524D\u5546\u54C1\u4FE1\u606F:");
                        console.log("\u540D\u79F0: ".concat(prod.name, " [").concat(prod.id, "]"));
                        console.log("\u6210\u672C: \uFFE5".concat(prod.cost.toFixed(2)));
                        console.log("\u73B0\u91D1\u552E\u4EF7: \uFFE5".concat(((_g = prod.prices.cash) === null || _g === void 0 ? void 0 : _g.toFixed(2)) || "无"));
                        console.log("\u79EF\u5206\u552E\u4EF7: ".concat(((_h = prod.prices.points) === null || _h === void 0 ? void 0 : _h.toFixed(2)) || "无", " \u79EF\u5206"));
                        console.log("\u5F53\u524D\u521D\u59CB\u5E93\u5B58: ".concat(prod.initialStock));
                        console.log("\u5F53\u524D\u5B9E\u9645\u5E93\u5B58: ".concat(this.calculateCurrentStock(prod.id)));
                        // 显示当前优惠策略
                        if (prod.promoIds && prod.promoIds.length > 0) {
                            console.log("\u5F53\u524D\u4F18\u60E0\u7B56\u7565: ".concat(prod.promoIds
                                .map(function (id) {
                                var promo = _this.data.promotions.find(function (p) { return p.id === id; });
                                return promo ? promo.name : id;
                            })
                                .join(", ")));
                        }
                        else {
                            console.log("当前优惠策略: 无");
                        }
                        console.log("\n--- 操作选项 ---");
                        console.log("1. 调整库存");
                        console.log("2. 修改优惠策略");
                        console.log("3. 修改价格");
                        return [4 /*yield*/, this.ask("选择操作 (1-3): ")];
                    case 10:
                        option = _j.sent();
                        if (!(option === "1")) return [3 /*break*/, 12];
                        return [4 /*yield*/, this.ask("请输入调整数量（正数为补货，负数为损耗/下架）: ")];
                    case 11:
                        adjustmentInput = _j.sent();
                        adjustment = parseInt(adjustmentInput);
                        if (isNaN(adjustment)) {
                            console.log("❌ 请输入有效的数字");
                            return [2 /*return*/];
                        }
                        oldStock = prod.initialStock;
                        newStock = oldStock + adjustment;
                        if (newStock < 0) {
                            console.log("❌ 调整后库存不能为负数");
                            return [2 /*return*/];
                        }
                        prod.initialStock = newStock;
                        inventoryLog = {
                            id: this.generateId("MAN"),
                            timestamp: new Date(),
                            type: "inventory_adjust",
                            amount: adjustment,
                            reason: adjustment >= 0
                                ? "\u8865\u8D27: ".concat(prod.name, " (").concat(prod.id, ") \u589E\u52A0 ").concat(adjustment, " \u4EF6")
                                : "\u635F\u8017/\u4E0B\u67B6: ".concat(prod.name, " (").concat(prod.id, ") \u51CF\u5C11 ").concat(Math.abs(adjustment), " \u4EF6"),
                            productId: prod.id,
                        };
                        this.data.otherLogs.push(inventoryLog);
                        this.saveData();
                        console.log("✅ 库存已更新");
                        console.log("\u65B0\u7684\u521D\u59CB\u5E93\u5B58: ".concat(newStock));
                        console.log("\u65B0\u7684\u5B9E\u9645\u5E93\u5B58: ".concat(this.calculateCurrentStock(prod.id)));
                        return [3 /*break*/, 18];
                    case 12:
                        if (!(option === "2")) return [3 /*break*/, 14];
                        // 修改优惠策略
                        console.log("\n--- 可用优惠策略 ---");
                        this.data.promotions.forEach(function (promo, index) {
                            console.log("[".concat(index + 1, "] ").concat(promo.name, " (").concat(promo.id, ")"));
                        });
                        return [4 /*yield*/, this.ask("选择优惠策略序号（逗号分隔，留空清空）: ")];
                    case 13:
                        promoInput = _j.sent();
                        if (promoInput.trim() === "") {
                            prod.promoIds = undefined;
                            console.log("✅ 已清空优惠策略");
                        }
                        else {
                            selectedIndices = promoInput
                                .split(",")
                                .map(function (s) { return parseInt(s.trim()) - 1; });
                            promoIds = [];
                            for (_e = 0, selectedIndices_2 = selectedIndices; _e < selectedIndices_2.length; _e++) {
                                index = selectedIndices_2[_e];
                                if (index >= 0 && index < this.data.promotions.length) {
                                    promoIds.push(this.data.promotions[index].id);
                                }
                            }
                            prod.promoIds = promoIds;
                            console.log("\u2705 \u5DF2\u8BBE\u7F6E\u4F18\u60E0\u7B56\u7565: ".concat(promoIds
                                .map(function (id) {
                                var promo = _this.data.promotions.find(function (p) { return p.id === id; });
                                return promo ? promo.name : id;
                            })
                                .join(", ")));
                        }
                        this.saveData();
                        return [3 /*break*/, 18];
                    case 14:
                        if (!(option === "3")) return [3 /*break*/, 17];
                        return [4 /*yield*/, this.ask("新的现金售价（留空保持不变）: ")];
                    case 15:
                        newCashPrice = _j.sent();
                        return [4 /*yield*/, this.ask("新的积分售价（留空保持不变）: ")];
                    case 16:
                        newPointsPrice = _j.sent();
                        if (newCashPrice.trim() !== "") {
                            cashPrice = parseFloat(newCashPrice);
                            if (!isNaN(cashPrice)) {
                                prod.prices.cash = cashPrice;
                                console.log("\u2705 \u73B0\u91D1\u552E\u4EF7\u5DF2\u66F4\u65B0\u4E3A: \uFFE5".concat(cashPrice.toFixed(2)));
                            }
                        }
                        if (newPointsPrice.trim() !== "") {
                            pointsPrice = parseFloat(newPointsPrice);
                            if (!isNaN(pointsPrice)) {
                                prod.prices.points = pointsPrice;
                                console.log("\u2705 \u79EF\u5206\u552E\u4EF7\u5DF2\u66F4\u65B0\u4E3A: ".concat(pointsPrice.toFixed(2), " \u79EF\u5206"));
                            }
                        }
                        this.saveData();
                        return [3 /*break*/, 18];
                    case 17:
                        console.log("❌ 无效选项");
                        return [2 /*return*/];
                    case 18: return [2 /*return*/];
                }
            });
        });
    };
    // --- 退款业务 (解耦逻辑) ---
    DormStoreSystem.prototype.processRefund = function () {
        return __awaiter(this, void 0, void 0, function () {
            var orderId, order, daysDiff, user, existingRefunds, alreadyRefundedQty, qtyInput, qty, ratio, refundCash, refundPoints, deductRewardPoints, projectedPoints, answer, answer, refundOrder;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.ask("请输入订单号: ")];
                    case 1:
                        orderId = _b.sent();
                        order = this.data.orders.find(function (o) { return o.id === orderId; });
                        if (!order) {
                            console.log("❌ 订单不存在");
                            return [2 /*return*/];
                        }
                        daysDiff = (Date.now() - new Date(order.timestamp).getTime()) /
                            (1000 * 3600 * 24);
                        if (daysDiff > config.REFUND_LIMIT_DAYS) {
                            console.log("❌ 超过7天退款期");
                            return [2 /*return*/];
                        }
                        user = this.data.users.find(function (u) { return u.shortName === order.userShortName; });
                        console.log("\u8BA2\u5355: ".concat(order.productName, " x ").concat(order.quantity));
                        existingRefunds = this.data.refunds.filter(function (r) { return r.originalOrderId === order.id; });
                        alreadyRefundedQty = existingRefunds.reduce(function (sum, refund) { return sum + (refund.quantity || 0); }, 0);
                        console.log("\u5DF2\u9000\u6B3E\u6570\u91CF: ".concat(alreadyRefundedQty, "/").concat(order.quantity));
                        return [4 /*yield*/, this.ask("输入退款数量: ")];
                    case 2:
                        qtyInput = _b.sent();
                        qty = parseInt(qtyInput);
                        // 强制要求退款数量必须是整数
                        if (qtyInput !== qty.toString() || qty <= 0) {
                            console.log("❌ 数量无效，必须输入正整数");
                            return [2 /*return*/];
                        }
                        // 校验本次申请数量 + 历史已退总数 <= 订单原始数量
                        if (qty + alreadyRefundedQty > order.quantity) {
                            console.log("❌ 退款数量超过订单剩余可退数量");
                            console.log("\u53EF\u9000\u6570\u91CF: ".concat(order.quantity - alreadyRefundedQty));
                            return [2 /*return*/];
                        }
                        // 防御性编程：避免除零错误
                        if (order.quantity === 0) {
                            console.log("❌ 订单数量为0，无法计算退款比例");
                            return [2 /*return*/];
                        }
                        ratio = qty / order.quantity;
                        refundCash = order.paidCash * ratio;
                        refundPoints = order.paidPoints * ratio;
                        deductRewardPoints = order.rewardPoints * ratio;
                        // 预览
                        console.log("\n--- \u9000\u6B3E\u9884\u89C8 ---");
                        console.log("\u5B9E\u9000\u91D1\u989D: \uFFE5".concat(refundCash, " (\u4EC5\u4F5C\u8BB0\u5F55)"));
                        console.log("\u5B9E\u9000\u79EF\u5206: ".concat(refundPoints));
                        console.log("\u6263\u9664\u8D60\u9001\u79EF\u5206: ".concat(deductRewardPoints));
                        projectedPoints = user.points + refundPoints - deductRewardPoints;
                        console.log("\u7528\u6237\u79EF\u5206: ".concat(user.points, " -> ").concat(projectedPoints));
                        if (!(projectedPoints < 0)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.ask("\u26A0\uFE0F \u8B66\u544A\uFF1A\u9000\u6B3E\u540E\u79EF\u5206\u4E3A\u8D1F\uFF08".concat(projectedPoints, "\uFF09\uFF0C\u662F\u5426\u7EE7\u7EED\uFF1F(y/n): "))];
                    case 3:
                        answer = _b.sent();
                        if (answer.toLowerCase() !== "y") {
                            console.log("❌ 退款已取消");
                            return [2 /*return*/];
                        }
                        return [3 /*break*/, 6];
                    case 4: return [4 /*yield*/, this.ask("确认退款吗？(y/n): ")];
                    case 5:
                        answer = _b.sent();
                        if (answer.toLowerCase() !== "y") {
                            console.log("❌ 退款已取消");
                            return [2 /*return*/];
                        }
                        _b.label = 6;
                    case 6:
                        // --- 执行退款 (不碰 user.debt) ---
                        // 库存会通过 calculateCurrentStock 自动基于订单历史计算，无需直接修改初始库存
                        // 调整积分（取消Math.min截断限制，允许积分超过上限）
                        user.points = user.points + refundPoints - deductRewardPoints;
                        _a = {
                            id: this.generateId("REF"),
                            originalOrderId: order.id,
                            timestamp: new Date(),
                            userShortName: user.shortName,
                            quantity: qty, // 本次退款数量
                            refundCash: refundCash, // 仅记录
                            refundPoints: refundPoints,
                            deductPoints: deductRewardPoints
                        };
                        return [4 /*yield*/, this.ask("退款原因: ")];
                    case 7:
                        refundOrder = (_a.reason = _b.sent(),
                            _a);
                        this.data.refunds.push(refundOrder);
                        // 检查并通知会员状态变化
                        this.checkAndNotifyMembershipChange(user.shortName);
                        this.saveData();
                        console.log("✅ 退款成功！");
                        // --- 关键提醒 ---
                        if (user.debt > 0) {
                            console.log("\n\u26A0\uFE0F \u63D0\u793A\uFF1A\u8BE5\u7528\u6237\u76EE\u524D\u6B20\u6B3E \uFFE5".concat(user.debt, "\u3002"));
                            console.log("   系统已将积分/现金退还至账户，请根据实际情况手动调整赊账记录。");
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    DormStoreSystem.prototype.showRevenueOverview = function () {
        var _this = this;
        console.log("\n--- 收入情况分析 ---");
        // 计算统计周期（上周日到现在）
        var now = new Date();
        var dayOfWeek = now.getDay();
        var lastSunday = new Date(now);
        lastSunday.setDate(now.getDate() - (dayOfWeek === 0 ? 7 : dayOfWeek));
        lastSunday.setHours(0, 0, 0, 0);
        // 使用所有订单进行统计（特殊用户订单正常计入营销数据）
        var validOrders = this.data.orders;
        // 计算总收入
        var cashRevenue = validOrders
            .filter(function (o) { return o.type === "cash"; })
            .reduce(function (sum, order) { return sum + order.paidCash; }, 0);
        var pointsRevenue = validOrders
            .filter(function (o) { return o.type === "points"; })
            .reduce(function (sum, order) { return sum + order.paidPoints; }, 0);
        // 计算总成本
        var totalCost = validOrders.reduce(function (sum, order) { return sum + order.cost; }, 0);
        // 计算总利润
        // 汇率统一度量：取消0.01折算率，严格遵守1人民币=1积分
        var totalRevenue = cashRevenue + pointsRevenue; // 积分直接1:1统计
        var totalProfit = totalRevenue - totalCost;
        // 计算周期内收入（上周日到现在）
        var periodCashRevenue = validOrders
            .filter(function (o) { return o.type === "cash" && new Date(o.timestamp) >= lastSunday; })
            .reduce(function (sum, order) { return sum + order.paidCash; }, 0);
        var periodPointsRevenue = validOrders
            .filter(function (o) { return o.type === "points" && new Date(o.timestamp) >= lastSunday; })
            .reduce(function (sum, order) { return sum + order.paidPoints; }, 0);
        // 计算周期内成本
        var periodCost = validOrders
            .filter(function (o) { return new Date(o.timestamp) >= lastSunday; })
            .reduce(function (sum, order) { return sum + order.cost; }, 0);
        // 计算周期内利润
        var periodTotalRevenue = periodCashRevenue + periodPointsRevenue; // 积分直接1:1统计
        var periodProfit = periodTotalRevenue - periodCost;
        console.log("\uD83D\uDCC5 \u7EDF\u8BA1\u5468\u671F: \u4E0A\u5468\u65E5(".concat(lastSunday.getMonth() + 1, "\u6708").concat(lastSunday.getDate(), "\u65E5)\u81F3").concat(now.getMonth() + 1, "\u6708").concat(now.getDate(), "\u65E5"));
        console.log("\n📊 周期内收入统计:");
        console.log("\u5468\u671F\u5185\u73B0\u91D1\u6536\u5165: \uFFE5".concat(periodCashRevenue.toFixed(2)));
        console.log("\u5468\u671F\u5185\u79EF\u5206\u6536\u5165: ".concat(periodPointsRevenue, " \u79EF\u5206"));
        console.log("\u5468\u671F\u5185\u603B\u6210\u672C: \uFFE5".concat(periodCost.toFixed(2)));
        console.log("\u5468\u671F\u5185\u603B\u5229\u6DA6: \uFFE5".concat(periodProfit.toFixed(2)));
        console.log("\n📊 累计收入统计:");
        console.log("\u7D2F\u8BA1\u73B0\u91D1\u6536\u5165: \uFFE5".concat(cashRevenue.toFixed(2)));
        console.log("\u7D2F\u8BA1\u79EF\u5206\u6536\u5165: ".concat(pointsRevenue, " \u79EF\u5206"));
        console.log("\u7D2F\u8BA1\u603B\u6210\u672C: \uFFE5".concat(totalCost.toFixed(2)));
        console.log("\u7D2F\u8BA1\u603B\u5229\u6DA6: \uFFE5".concat(totalProfit.toFixed(2)));
        // 特殊用户成本统计
        var specialUserOrders = validOrders.filter(function (order) {
            return _this.memberConfig.specialUsers.includes(order.userShortName);
        });
        if (specialUserOrders.length > 0) {
            var specialUserTotalCost = specialUserOrders.reduce(function (sum, order) { return sum + order.cost; }, 0);
            var specialUserPeriodCost = specialUserOrders
                .filter(function (order) { return new Date(order.timestamp) >= lastSunday; })
                .reduce(function (sum, order) { return sum + order.cost; }, 0);
            console.log("\n⭐ 特殊用户成本统计:");
            console.log("\u5468\u671F\u5185\u7279\u6B8A\u7528\u6237\u6210\u672C: \uFFE5".concat(specialUserPeriodCost.toFixed(2)));
            console.log("\u7D2F\u8BA1\u7279\u6B8A\u7528\u6237\u6210\u672C: \uFFE5".concat(specialUserTotalCost.toFixed(2)));
            console.log("\u7279\u6B8A\u7528\u6237\u8BA2\u5355\u6570\u91CF: ".concat(specialUserOrders.length, " \u5355"));
        }
        // 按商品分类统计（过滤特殊用户）
        console.log("\n📦 商品销售统计:");
        var productSales = {};
        validOrders.forEach(function (order) {
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
        Object.entries(productSales).forEach(function (_a) {
            var productId = _a[0], stats = _a[1];
            var product = _this.data.products.find(function (p) { return p.id === productId; });
            if (product) {
                var profit = stats.revenue - stats.cost;
                // 查找该商品的第一个订单来确定销售类型
                var firstOrder = _this.data.orders.find(function (o) { return o.productId === productId; });
                var isCashSale = (firstOrder === null || firstOrder === void 0 ? void 0 : firstOrder.type) === "cash";
                console.log("".concat(product.name, ":"));
                console.log("  \u9500\u91CF: ".concat(stats.quantity, " \u4EF6"));
                console.log("  \u6536\u5165: ".concat(isCashSale
                    ? "\uFFE5".concat(stats.revenue.toFixed(2))
                    : "".concat(stats.revenue, " \u79EF\u5206")));
                console.log("  \u6210\u672C: \uFFE5".concat(stats.cost.toFixed(2)));
                console.log("  \u5229\u6DA6: ".concat(isCashSale ? "\uFFE5".concat(profit.toFixed(2)) : "".concat(profit, " \u79EF\u5206")));
            }
        });
    };
    // --- 导出欠债名单 ---
    DormStoreSystem.prototype.exportDebtorList = function () {
        return __awaiter(this, void 0, void 0, function () {
            var debtors;
            var _this = this;
            return __generator(this, function (_a) {
                debtors = this.data.users.filter(function (u) { return u.debt !== 0; });
                if (debtors.length === 0) {
                    console.log("无欠债记录");
                    return [2 /*return*/];
                }
                console.log("\n--- 赊账名单 ---");
                console.log("简称\t\t真实姓名\t\t欠款金额\t\t最后消费时间");
                console.log("-".repeat(60));
                debtors.forEach(function (u) {
                    // 找最后消费时间
                    var uOrders = _this.data.orders.filter(function (o) { return o.userShortName === u.shortName; });
                    var lastTime = "无";
                    if (uOrders.length > 0) {
                        uOrders.sort(function (a, b) { return b.timestamp.getTime() - a.timestamp.getTime(); });
                        lastTime = uOrders[0].timestamp.toLocaleString("zh-CN");
                    }
                    // 格式化输出，使用制表符对齐
                    var shortName = u.shortName.padEnd(8, " ");
                    var realName = _this.privacyMap[u.shortName].padEnd(10, " ");
                    var debt = "\uFFE5".concat(u.debt.toFixed(2)).padEnd(12, " ");
                    console.log("".concat(shortName, "\t").concat(realName, "\t").concat(debt, "\t").concat(lastTime));
                });
                console.log("\n✅ 赊账名单已显示在控制台");
                return [2 /*return*/];
            });
        });
    };
    /**
     * 查询指定顾客21天消费记录
     */
    DormStoreSystem.prototype.queryCustomerConsumption = function () {
        return __awaiter(this, void 0, void 0, function () {
            var shortName, user, twentyOneDaysAgo, userOrdersInPeriod, memberLevel, memberStatus, totalCashSpent, totalPointsSpent, totalRewardPoints, totalRefundCash, totalRefundPoints, totalDeductedPoints, totalSpendIn21Days;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\n=== 🔍 查询顾客消费记录 ===");
                        return [4 /*yield*/, this.ask("请输入顾客简称: ")];
                    case 1:
                        shortName = _a.sent();
                        user = this.data.users.find(function (u) { return u.shortName === shortName; });
                        if (!user) {
                            console.log("❌ 用户不存在");
                            return [2 /*return*/];
                        }
                        twentyOneDaysAgo = new Date();
                        twentyOneDaysAgo.setDate(twentyOneDaysAgo.getDate() - 21);
                        twentyOneDaysAgo.setHours(0, 0, 0, 0);
                        userOrdersInPeriod = this.data.orders
                            .filter(function (o) {
                            return o.userShortName === shortName &&
                                new Date(o.timestamp) >= twentyOneDaysAgo;
                        })
                            .sort(function (a, b) { return a.timestamp.getTime() - b.timestamp.getTime(); });
                        if (userOrdersInPeriod.length === 0) {
                            console.log("\n\u7528\u6237 ".concat(shortName, " (").concat(this.getRealName(shortName), ") \u5728\u8FC7\u53BB21\u5929\u5185\u65E0\u6D88\u8D39\u8BB0\u5F55"));
                            return [2 /*return*/];
                        }
                        memberLevel = this.getUserMemberLevel(shortName);
                        memberStatus = memberLevel === "SPECIAL"
                            ? "特殊用户"
                            : memberLevel === "OFFICIAL"
                                ? "正式会员"
                                : memberLevel === "TRAINEE"
                                    ? "见习会员"
                                    : "非会员";
                        console.log("\n--- \u7528\u6237\u4FE1\u606F ---");
                        console.log("\u7B80\u79F0: ".concat(shortName));
                        console.log("\u771F\u5B9E\u59D3\u540D: ".concat(this.getRealName(shortName)));
                        console.log("\u4F1A\u5458\u72B6\u6001: ".concat(memberStatus));
                        console.log("\u5F53\u524D\u79EF\u5206: ".concat(user.points));
                        console.log("\u5F53\u524D\u6B20\u6B3E: \uFFE5".concat(user.debt.toFixed(2)));
                        totalCashSpent = 0;
                        totalPointsSpent = 0;
                        totalRewardPoints = 0;
                        totalRefundCash = 0;
                        totalRefundPoints = 0;
                        totalDeductedPoints = 0;
                        // 显示消费记录
                        console.log("\n--- 21\u5929\u6D88\u8D39\u8BB0\u5F55 (\u5171".concat(userOrdersInPeriod.length, "\u7B14) ---"));
                        console.log("订单号\t\t时间\t\t\t商品\t\t\t类型\t数量\t实付金额\t奖励积分\t备注");
                        console.log("-".repeat(120));
                        userOrdersInPeriod.forEach(function (order) {
                            // 查找该订单的退款记录
                            var refunds = _this.data.refunds.filter(function (r) { return r.originalOrderId === order.id; });
                            var refundCash = refunds.reduce(function (sum, r) { return sum + r.refundCash; }, 0);
                            var refundPoints = refunds.reduce(function (sum, r) { return sum + r.refundPoints; }, 0);
                            var deductedPoints = refunds.reduce(function (sum, r) { return sum + r.deductPoints; }, 0);
                            // 累计统计
                            totalCashSpent += order.paidCash - refundCash;
                            totalPointsSpent += order.paidPoints - refundPoints;
                            totalRewardPoints += order.rewardPoints - deductedPoints;
                            totalRefundCash += refundCash;
                            totalRefundPoints += refundPoints;
                            totalDeductedPoints += deductedPoints;
                            // 格式化显示
                            var orderType = order.type === "cash" ? "现金" : "积分";
                            var payment = order.type === "cash"
                                ? "\uFFE5".concat((order.paidCash - refundCash).toFixed(2))
                                : "".concat((order.paidPoints - refundPoints).toFixed(2), "\u79EF\u5206");
                            var rewardPoints = order.rewardPoints - deductedPoints;
                            // 截断过长的商品名称
                            var productName = order.productName.length > 10
                                ? order.productName.substring(0, 9) + "..."
                                : order.productName;
                            console.log("".concat(order.id, "\t").concat(order.timestamp.toLocaleString("zh-CN"), "\t").concat(productName, "\t\t").concat(orderType, "\t").concat(order.quantity, "\t").concat(payment, "\t\t").concat(rewardPoints, "\t\t").concat(order.note || ""));
                        });
                        // 显示退款记录
                        if (totalRefundCash > 0 || totalRefundPoints > 0) {
                            console.log("\n--- 退款记录 ---");
                            if (totalRefundCash > 0) {
                                console.log("\u9000\u6B3E\u73B0\u91D1: \uFFE5".concat(totalRefundCash.toFixed(2)));
                            }
                            if (totalRefundPoints > 0) {
                                console.log("\u9000\u6B3E\u79EF\u5206: ".concat(totalRefundPoints.toFixed(2), " \u79EF\u5206"));
                            }
                            console.log("\u6263\u9664\u5956\u52B1\u79EF\u5206: ".concat(totalDeductedPoints, " \u79EF\u5206"));
                        }
                        // 显示消费统计
                        console.log("\n--- 消费统计 ---");
                        console.log("\u5B9E\u4ED8\u73B0\u91D1: \uFFE5".concat(totalCashSpent.toFixed(2)));
                        console.log("\u5B9E\u4ED8\u79EF\u5206: ".concat(totalPointsSpent.toFixed(2), " \u79EF\u5206"));
                        console.log("\u83B7\u5F97\u5956\u52B1\u79EF\u5206: ".concat(totalRewardPoints, " \u79EF\u5206"));
                        console.log("\u51C0\u6D88\u8D39: \uFFE5".concat((totalCashSpent + totalPointsSpent).toFixed(2), " (\u73B0\u91D1+\u79EF\u5206)"));
                        totalSpendIn21Days = this.getUserTotalSpendInWindow(shortName);
                        console.log("21\u5929\u5185\u6D88\u8D39\u603B\u989D: \uFFE5".concat(totalSpendIn21Days.toFixed(2), " (\u4EC5\u73B0\u91D1\u6D88\u8D39\uFF0C\u6263\u9664\u9000\u6B3E)"));
                        // 显示会员状态相关信息
                        console.log("\n--- 会员状态 ---");
                        console.log("\u4F1A\u5458\u95E8\u69DB: \uFFE5".concat(config.MEMBER.NEW_RULE.TRIGGER_AMOUNT, " (21\u5929\u5185\u6D88\u8D39)"));
                        console.log("\u8DDD\u79BB\u4F1A\u5458\u95E8\u69DB: \uFFE5".concat(Math.max(0, config.MEMBER.NEW_RULE.TRIGGER_AMOUNT - totalSpendIn21Days).toFixed(2)));
                        console.log("\n✅ 查询完成");
                        return [2 /*return*/];
                }
            });
        });
    };
    DormStoreSystem.prototype.start = function () {
        var _this = this;
        console.log("🏪 宿舍小卖部系统启动中...");
        (function () { return __awaiter(_this, void 0, void 0, function () {
            var opt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!true) return [3 /*break*/, 7];
                        console.log("\n主菜单: 1. 经营模式  2. 管理模式  3. 退出");
                        return [4 /*yield*/, this.ask("> ")];
                    case 1:
                        opt = _a.sent();
                        if (!(opt === "1")) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.runBusinessMode()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 3:
                        if (!(opt === "2")) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.runAdminMode()];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5: return [3 /*break*/, 7];
                    case 6: return [3 /*break*/, 0];
                    case 7:
                        this.rl.close();
                        process.exit(0);
                        return [2 /*return*/];
                }
            });
        }); })();
    };
    return DormStoreSystem;
}());
// 启动系统
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var app;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                app = new DormStoreSystem();
                // 等待初始化完成
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
            case 1:
                // 等待初始化完成
                _a.sent(); // 给异步初始化一点时间
                app.start();
                return [2 /*return*/];
        }
    });
}); })();
