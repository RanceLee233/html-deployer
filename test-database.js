require('dotenv').config();
const { Client } = require('@notionhq/client');

// 使用你提供的凭据进行测试
const notion = new Client({ 
    auth: process.env.NOTION_API_KEY || 'ntn_Gm686281869ayWzsPVp9sx1y2hHuZ4bJ5hBs4dQOOnkekG'
});
const databaseId = process.env.NOTION_DATABASE_ID || '23a028e7d48d8068bdbadaf518dcae0f';

async function testDatabase() {
    try {
        console.log('🔗 测试数据库连接...');
        
        // 1. 测试数据库连接
        const database = await notion.databases.retrieve({
            database_id: databaseId
        });
        
        console.log('✅ 数据库连接成功!');
        console.log('📊 数据库名称:', database.title[0]?.plain_text || '未知');
        console.log('🏗️ 数据库字段:');
        
        Object.keys(database.properties).forEach(key => {
            const property = database.properties[key];
            console.log(`  - ${key}: ${property.type}`);
        });
        
        // 2. 检查是否需要"完整HTML内容"字段
        const hasFullHtmlField = database.properties['完整HTML内容'];
        if (hasFullHtmlField) {
            console.log('\n⚠️  发现"完整HTML内容"字段，新架构将使用页面正文存储HTML');
            console.log('💡 建议：可以删除"完整HTML内容"字段，因为HTML内容将存储在页面正文中');
        }
        
        // 3. 测试创建一个简单页面
        console.log('\n🧪 测试创建页面...');
        const testPage = await notion.pages.create({
            parent: { database_id: databaseId },
            properties: {
                '页面标题': {
                    title: [{
                        text: { content: '测试页面-自动创建' }
                    }]
                },
                'HTML哈希值': {
                    rich_text: [{
                        text: { content: 'test123' }
                    }]
                },
                '描述': {
                    rich_text: [{
                        text: { content: '这是一个测试页面' }
                    }]
                }
            }
        });
        
        console.log('✅ 页面创建成功，ID:', testPage.id);
        
        // 4. 测试添加HTML内容到页面正文
        console.log('📝 测试添加HTML内容到页面正文...');
        await notion.blocks.children.append({
            block_id: testPage.id,
            children: [{
                object: 'block',
                type: 'code',
                code: {
                    caption: [],
                    rich_text: [{
                        type: 'text',
                        text: {
                            content: '<h1>测试HTML内容</h1>\n<p>这是一个测试页面，验证长内容存储。</p>'
                        }
                    }],
                    language: 'html'
                }
            }]
        });
        
        console.log('✅ HTML内容已添加到页面正文');
        
        // 5. 测试读取页面正文
        console.log('📖 测试读取页面正文...');
        const pageContent = await notion.blocks.children.list({
            block_id: testPage.id
        });
        
        console.log('✅ 页面正文读取成功');
        pageContent.results.forEach((block, index) => {
            if (block.type === 'code') {
                console.log(`  代码块 ${index + 1}:`, block.code.rich_text[0]?.plain_text?.substring(0, 100) + '...');
            }
        });
        
        // 6. 清理测试页面
        console.log('\n🗑️  清理测试页面...');
        await notion.pages.update({
            page_id: testPage.id,
            archived: true
        });
        console.log('✅ 测试页面已归档');
        
        console.log('\n🎉 所有测试通过！新的页面正文存储方案可以正常工作。');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.error('详细错误:', error);
    }
}

testDatabase();