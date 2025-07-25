require('dotenv').config();
const { Client } = require('@notionhq/client');

// 使用你的凭据
const notion = new Client({ 
    auth: 'ntn_Gm686281869ayWzsPVp9sx1y2hHuZ4bJ5hBs4dQOOnkekG'
});
const databaseId = '23a028e7d48d8068bdbadaf518dcae0f';

// 测试用的长HTML内容
const testHtmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>分段存储测试页面</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: auto;
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        h1 { color: #2c3e50; }
        .success { color: #27ae60; background: #d5f4e6; padding: 10px; border-radius: 4px; }
        .info { color: #3498db; background: #ebf3fd; padding: 10px; border-radius: 4px; }
        .test-section { 
            border: 2px solid #eee; 
            padding: 15px; 
            margin: 15px 0; 
            border-radius: 8px; 
        }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
        code { background: #f8f9fa; padding: 2px 4px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 分段存储测试成功!</h1>
        
        <div class="success">
            <h2>✅ 测试结果</h2>
            <p>这个HTML内容已经成功通过分段存储的方式保存在Notion页面正文中！</p>
            <p>内容总长度: <strong>超过3000字符</strong></p>
        </div>

        <div class="info">
            <h3>📋 技术实现</h3>
            <ul>
                <li>HTML内容按2000字符分段</li>
                <li>每段作为独立段落块存储</li>
                <li>读取时自动合并所有分段</li>
                <li>突破了Notion字段长度限制</li>
            </ul>
        </div>

        <div class="test-section">
            <h3>🔧 功能测试</h3>
            <p>以下是各种HTML元素的测试：</p>
            
            <h4>文本格式</h4>
            <p>这里有 <strong>粗体</strong>、<em>斜体</em>、<u>下划线</u> 和 <code>代码</code> 文本。</p>
            
            <h4>列表</h4>
            <ul>
                <li>无序列表项目 1</li>
                <li>无序列表项目 2</li>
                <li>无序列表项目 3</li>
            </ul>
            
            <ol>
                <li>有序列表项目 1</li>
                <li>有序列表项目 2</li>
                <li>有序列表项目 3</li>
            </ol>
            
            <h4>表格</h4>
            <table border="1" style="border-collapse: collapse; width: 100%;">
                <tr>
                    <th>功能</th>
                    <th>状态</th>
                    <th>说明</th>
                </tr>
                <tr>
                    <td>分段存储</td>
                    <td>✅ 成功</td>
                    <td>HTML内容按段落分别存储</td>
                </tr>
                <tr>
                    <td>内容合并</td>
                    <td>✅ 成功</td>
                    <td>读取时自动合并所有段落</td>
                </tr>
                <tr>
                    <td>长度突破</td>
                    <td>✅ 成功</td>
                    <td>支持任意长度HTML内容</td>
                </tr>
            </table>
            
            <h4>代码示例</h4>
            <pre><code>function testSuccess() {
    console.log("分段存储测试成功!");
    console.log("HTML内容长度:", document.body.innerHTML.length);
    return "✅ 所有功能正常工作";
}</code></pre>
        </div>

        <div class="test-section">
            <h3>🎯 测试验证</h3>
            <p>如果你能看到这个页面，说明以下功能都正常工作：</p>
            <ol>
                <li>✅ 长HTML内容成功写入Notion页面正文</li>
                <li>✅ 分段存储策略有效工作</li>
                <li>✅ 内容读取和合并功能正常</li>
                <li>✅ CSS样式正确渲染</li>
                <li>✅ 各种HTML元素显示正常</li>
            </ol>
        </div>

        <footer style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666;">
            <p>🤖 由Claude Code自动生成的测试页面</p>
            <p>测试时间: ${new Date().toLocaleString('zh-CN')}</p>
        </footer>
    </div>

    <script>
        // 测试JavaScript功能
        console.log("✅ JavaScript执行成功");
        console.log("页面总长度:", document.body.innerHTML.length);
        
        // 添加交互功能
        document.addEventListener('DOMContentLoaded', function() {
            const container = document.querySelector('.container');
            container.addEventListener('click', function() {
                console.log("🎉 页面交互功能正常!");
            });
        });
    </script>
</body>
</html>`.trim();

async function testLongHtmlStorage() {
    try {
        console.log('🧪 开始测试长HTML内容分段存储...');
        console.log(`📏 测试内容长度: ${testHtmlContent.length} 字符`);
        
        // 1. 创建页面
        const response = await notion.pages.create({
            parent: { database_id: databaseId },
            properties: {
                '页面标题': {
                    title: [{
                        text: { content: '分段存储测试-自动生成' }
                    }]
                },
                'HTML哈希值': {
                    rich_text: [{
                        text: { content: 'test-chunk-' + Date.now() }
                    }]
                },
                '描述': {
                    rich_text: [{
                        text: { content: '测试长HTML内容的分段存储功能' }
                    }]
                }
            }
        });
        
        console.log('✅ 页面创建成功，ID:', response.id);
        
        // 2. 分段存储HTML内容
        const maxChunkSize = 2000;
        const htmlChunks = [];
        
        for (let i = 0; i < testHtmlContent.length; i += maxChunkSize) {
            htmlChunks.push(testHtmlContent.substring(i, i + maxChunkSize));
        }
        
        console.log(`📦 内容分为 ${htmlChunks.length} 段`);
        
        const children = [];
        
        // 添加标题说明
        children.push({
            object: 'block',
            type: 'heading_3',
            heading_3: {
                rich_text: [{
                    type: 'text',
                    text: { content: 'HTML内容' }
                }]
            }
        });
        
        // 将每个分段作为段落添加
        htmlChunks.forEach((chunk, index) => {
            children.push({
                object: 'block',
                type: 'paragraph',
                paragraph: {
                    rich_text: [{
                        type: 'text',
                        text: { content: chunk }
                    }]
                }
            });
        });
        
        // 批量添加到页面
        await notion.blocks.children.append({
            block_id: response.id,
            children: children
        });
        
        console.log(`✅ HTML内容已成功分段存储（${htmlChunks.length}个分段）`);
        
        // 3. 测试读取功能
        console.log('📖 测试内容读取...');
        const pageContent = await notion.blocks.children.list({
            block_id: response.id
        });
        
        // 合并内容
        const contentParts = [];
        let foundHtmlSection = false;
        
        for (const block of pageContent.results) {
            if (block.type === 'heading_3' && block.heading_3) {
                const headingText = block.heading_3.rich_text[0]?.plain_text || '';
                if (headingText === 'HTML内容') {
                    foundHtmlSection = true;
                    continue;
                }
            }
            
            if (foundHtmlSection && block.type === 'paragraph' && block.paragraph) {
                const text = block.paragraph.rich_text[0]?.plain_text || '';
                if (text) {
                    contentParts.push(text);
                }
            }
        }
        
        const retrievedContent = contentParts.join('');
        
        console.log(`📏 读取的内容长度: ${retrievedContent.length} 字符`);
        console.log(`🔍 内容完整性检查: ${retrievedContent === testHtmlContent ? '✅ 完全匹配' : '❌ 内容不匹配'}`);
        
        if (retrievedContent === testHtmlContent) {
            console.log('🎉 测试完全成功！分段存储和读取功能正常工作');
        } else {
            console.log('⚠️  内容不完全匹配，可能存在问题');
            console.log('原始长度:', testHtmlContent.length);
            console.log('读取长度:', retrievedContent.length);
        }
        
        // 4. 生成访问链接
        const hashValue = response.properties['HTML哈希值']?.rich_text[0]?.plain_text;
        const viewUrl = `https://html-deployer-hhi20qelt-rancelee233s-projects.vercel.app/view/${hashValue}`;
        
        console.log('🔗 测试页面访问链接:', viewUrl);
        
        // 5. 清理测试页面
        console.log('🗑️  清理测试页面...');
        await notion.pages.update({
            page_id: response.id,
            archived: true
        });
        console.log('✅ 测试页面已归档');
        
        return {
            success: true,
            pageId: response.id,
            chunksCount: htmlChunks.length,
            originalLength: testHtmlContent.length,
            retrievedLength: retrievedContent.length,
            contentMatch: retrievedContent === testHtmlContent,
            viewUrl: viewUrl
        };
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.error('详细错误:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// 运行测试
testLongHtmlStorage().then(result => {
    if (result.success) {
        console.log('\n🎊 测试总结:');
        console.log('- 分段数量:', result.chunksCount);
        console.log('- 原始长度:', result.originalLength);
        console.log('- 读取长度:', result.retrievedLength);
        console.log('- 内容匹配:', result.contentMatch ? '✅' : '❌');
        console.log('- 访问链接:', result.viewUrl);
    } else {
        console.log('\n💥 测试失败:', result.error);
    }
});