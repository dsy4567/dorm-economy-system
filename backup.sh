#!/bin/bash

# 一键备份脚本 - 将data文件夹复制到backups文件夹
# 备份文件夹命名格式：bkYYYYMMDD-data

# 设置项目根目录
PROJECT_DIR="/home/dsy/dorm-economy-system"
DATA_DIR="$PROJECT_DIR/data"
BACKUPS_DIR="$PROJECT_DIR/backups"

# 检查data目录是否存在
if [ ! -d "$DATA_DIR" ]; then
    echo "错误：data目录不存在 - $DATA_DIR"
    exit 1
fi

# 检查backups目录是否存在，不存在则创建
if [ ! -d "$BACKUPS_DIR" ]; then
    echo "创建backups目录..."
    mkdir -p "$BACKUPS_DIR"
fi

# 生成备份文件夹名称（当前日期）
BACKUP_DATE=$(date +"%Y%m%d")
BACKUP_FOLDER_NAME="bk${BACKUP_DATE}-data"
BACKUP_PATH="$BACKUPS_DIR/$BACKUP_FOLDER_NAME"

# 检查是否已经存在今天的备份
if [ -d "$BACKUP_PATH" ]; then
    echo "警告：今天的备份已存在 - $BACKUP_FOLDER_NAME"
    echo "是否覆盖现有备份？(y/N): "
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "备份已取消"
        exit 0
    fi
    echo "覆盖现有备份..."
    rm -rf "$BACKUP_PATH"
fi

# 创建备份文件夹
mkdir -p "$BACKUP_PATH"

# 复制data目录内容到备份文件夹
echo "开始备份data目录..."
cp -r "$DATA_DIR/"* "$BACKUP_PATH/"

# 检查复制是否成功
if [ $? -eq 0 ]; then
    echo "✅ 备份成功完成！"
    echo "备份位置：$BACKUP_PATH"
    echo "备份文件数：$(ls "$BACKUP_PATH" | wc -l)"
    echo "备份时间：$(date)"
else
    echo "❌ 备份失败！"
    exit 1
fi

# 显示备份内容概览
echo ""
echo "📁 备份内容概览："
ls -la "$BACKUP_PATH"

echo ""
echo "💾 备份完成！备份文件夹：$BACKUP_FOLDER_NAME"