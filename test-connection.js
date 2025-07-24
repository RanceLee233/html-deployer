#!/usr/bin/env node
// 测试Notion数据库连接和字段验证脚本

require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function testConnection() {
    console.log('🔍 开始测试Notion连接...');
    console.log('数据库ID:', databaseId);
    console.log('API Key存在:', !!process.env.NOTION_API_KEY);
    
    try {
        // 测试数据库连接
        console.log('\n📊 获取数据库结构...');
        const database = await notion.databases.retrieve({
            database_id: databaseId
        });
        
        console.log('✅ 数据库连接成功!');
        console.log('数据库名称:', database.title[0]?.plain_text || '无标题');
        console.log('\n📋 当前属性结构:');
        
        Object.keys(database.properties).forEach(key => {
            const prop = database.properties[key];
            console.log(`  - ${key}: ${prop.type}`);
        });
        
        // 检查必需字段
        const requiredFields = [
            '页面标题',
            'HTML代码', // 旧字段
            'HTML哈希值', // 新字段
            '完整HTML内容', // 新字段：存储完整HTML
            '描述',
            '页面ID',
            '分享链接'
        ];
        
        console.log('\n🔍 字段检查:');
        requiredFields.forEach(field => {
            const exists = database.properties[field] !== undefined;
            console.log(`  ${exists ? '✅' : '❌'} ${field}: ${exists ? database.properties[field].type : '缺失'}`);
        });
        
        // 测试查询
        console.log('\n📄 测试查询...');
        const response = await notion.databases.query({
            database_id: databaseId,
            page_size: 1
        });
        
        console.log(`✅ 查询成功! 找到 ${response.results.length} 个页面`);
        
        if (response.results.length > 0) {
            const page = response.results[0];
            console.log('\n📄 第一个页面示例:');
            console.log('  ID:', page.id);
            console.log('  标题:', page.properties.页面标题?.title[0]?.plain_text || '无标题');
            
            // 检查旧字段
            const oldHtml = page.properties['HTML代码']?.rich_text[0]?.plain_text;
            console.log('  旧HTML代码长度:', oldHtml ? oldHtml.length : 0);
            
            // 检查新字段
            const newHash = page.properties['HTML哈希值']?.rich_text[0]?.plain_text;
            console.log('  新HTML哈希值:', newHash || '缺失');
        }
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.error('错误代码:', error.code);
        
        if (error.code === 'unauthorized') {
            console.error('API密钥无效或权限不足');
        } else if (error.code === 'object_not_found') {
            console.error('数据库ID无效或数据库不存在');
        } else if (error.code === 'validation_error') {
            console.error('验证错误，检查字段名称');
        }
    }
}

if (!databaseId) {
    console.error('❌ 未设置NOTION_DATABASE_ID环境变量');
    process.exit(1);
}

if (!process.env.NOTION_API_KEY) {
    console.error('❌ 未设置NOTION_API_KEY环境变量');
    process.exit(1);
}

testConnection();