const fs = require("fs");
const path = require("path");

// 读取现有的 store_data.json 文件
const dataPath = path.resolve(__dirname, "data", "store_data.json");
const rawData = fs.readFileSync(dataPath, "utf-8");
const storeData = JSON.parse(rawData);

console.log("开始迁移日志数据结构...");

// 转换 budgetLogs 到 otherLogs
if (storeData.budgetLogs && storeData.budgetLogs.length > 0) {
    console.log(`找到 ${storeData.budgetLogs.length} 条旧日志记录`);

    // 初始化 otherLogs 数组
    storeData.otherLogs = storeData.otherLogs || [];

    // 转换每条日志记录
    storeData.budgetLogs.forEach(log => {
        let type = "budget_adjust";
        let amount = log.amount;

        // 根据原因判断日志类型
        if (log.reason.includes("赊账调整")) {
            type = "debt_adjust";
            // 从原因中提取金额
            const match = log.reason.match(/赊账调整: ([\d.-]+)/);
            if (match) {
                amount = parseFloat(match[1]);
            }
        } else if (log.reason.includes("积分调整")) {
            type = "points_adjust";
            // 从原因中提取金额
            const match = log.reason.match(/积分调整: ([\d.-]+)/);
            if (match) {
                amount = parseFloat(match[1]);
            }
        }

        // 创建新的 otherLog 记录
        const otherLog = {
            id: log.id,
            timestamp: log.timestamp,
            type: type,
            amount: amount,
            reason: log.reason,
        };

        storeData.otherLogs.push(otherLog);
        console.log(`转换日志: ${log.id} -> ${type}, amount: ${amount}`);
    });

    // 删除旧的 budgetLogs 字段
    delete storeData.budgetLogs;

    console.log("日志转换完成！");
} else {
    console.log("没有找到需要转换的旧日志记录");
    // 确保 otherLogs 字段存在
    storeData.otherLogs = storeData.otherLogs || [];
}

// 保存修改后的数据
fs.writeFileSync(dataPath, JSON.stringify(storeData, null, 2), "utf-8");
console.log("数据迁移完成！");

// 显示新的数据结构
console.log("\n新的数据结构:");
console.log(`- users: ${storeData.users.length} 条记录`);
console.log(`- orders: ${storeData.orders.length} 条记录`);
console.log(`- refunds: ${storeData.refunds.length} 条记录`);
console.log(`- otherLogs: ${storeData.otherLogs.length} 条记录`);
console.log(
    `- promotions: ${
        storeData.promotions ? storeData.promotions.length : 0
    } 条记录`
);

console.log("\notherLogs 类型统计:");
const typeStats = {};
storeData.otherLogs.forEach(log => {
    typeStats[log.type] = (typeStats[log.type] || 0) + 1;
});
Object.keys(typeStats).forEach(type => {
    console.log(`- ${type}: ${typeStats[type]} 条记录`);
});
