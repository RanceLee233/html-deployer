require('dotenv').config();
const { Client } = require('@notionhq/client');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Notion配置
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const notionDatabaseId = process.env.NOTION_DATABASE_ID;

// Supabase配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 工具函数
function generateHash(content) {
    const hashSource = content.length > 100 ? content.substring(0, 100) + Date.now() : content;
    return crypto.createHash('md5').update(hashSource).digest('hex').substring(0, 8);
}

function generateHashFromTitle(title) {
    return crypto.createHash('md5').update(title).digest('hex').substring(0, 8);
}

// 从Notion页面正文获取HTML内容
async function getHtmlFromNotionPage(pageId) {
    try {
        const pageContent = await notion.blocks.children.list({
            block_id: pageId
        });
        
        const contentParts = [];
        let foundHtmlSection = false;
        
        for (const block of pageContent.results) {
            // 跳过标题，查找段落内容
            if (block.type === 'heading_3' && block.heading_3) {
                const headingText = block.heading_3.rich_text[0]?.plain_text || '';
                if (headingText === 'HTML内容') {
                    foundHtmlSection = true;
                    continue;
                }
            }
            
            // 在HTML内容区域中收集段落
            if (foundHtmlSection && block.type === 'paragraph' && block.paragraph) {
                const text = block.paragraph.rich_text[0]?.plain_text || '';
                if (text) {
                    contentParts.push(text);
                }
            }
            
            // 兼容旧的代码块格式
            if (block.type === 'code' && block.code) {
                contentParts.push(block.code.rich_text[0]?.plain_text || '');
            }
        }
        
        return contentParts.join('');
    } catch (error) {
        console.error('从页面正文读取HTML失败:', error.message);
        return null;
    }
}

// 主迁移函数
async function migrateFromNotionToSupabase() {
    console.log('🚀 开始从Notion迁移数据到Supabase...\n');
    
    try {
        // 1. 检查环境变量
        if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID || 
            !process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
            console.error('❌ 环境变量缺失，请检查以下变量：');
            console.log('- NOTION_API_KEY:', !!process.env.NOTION_API_KEY);
            console.log('- NOTION_DATABASE_ID:', !!process.env.NOTION_DATABASE_ID);
            console.log('- SUPABASE_URL:', !!process.env.SUPABASE_URL);
            console.log('- SUPABASE_ANON_KEY:', !!process.env.SUPABASE_ANON_KEY);
            return;
        }
        
        // 2. 从Notion获取所有页面
        console.log('📖 正在从Notion数据库获取页面...');
        const response = await notion.databases.query({
            database_id: notionDatabaseId,
            sorts: [
                {
                    property: '排序',
                    direction: 'ascending',
                },
                {
                    property: '创建时间',
                    direction: 'descending',
                },
            ],
        });
        
        console.log(`✅ 成功获取到 ${response.results.length} 个页面\n`);
        
        // 3. 逐个迁移页面
        let successCount = 0;
        let failureCount = 0;
        
        for (let i = 0; i < response.results.length; i++) {
            const page = response.results[i];
            const properties = page.properties;
            
            try {
                console.log(`[${i + 1}/${response.results.length}] 迁移页面: "${properties.页面标题?.title[0]?.plain_text || '无标题'}"`);
                
                // 获取页面信息
                const title = properties.页面标题?.title[0]?.plain_text || '无标题';
                const description = properties.描述?.rich_text[0]?.plain_text || '';
                const htmlHash = properties['HTML哈希值']?.rich_text[0]?.plain_text || '';
                const pageId = properties['页面ID']?.rich_text[0]?.plain_text || '';
                const shareUrl = properties['分享链接']?.rich_text[0]?.plain_text || '';
                const sortOrder = properties['排序']?.number || 0;
                const createdAt = page.created_time;
                
                // 获取HTML内容
                let htmlContent = '';
                
                // 1. 优先从页面正文获取
                const contentFromPage = await getHtmlFromNotionPage(page.id);
                if (contentFromPage) {
                    htmlContent = contentFromPage;
                    console.log(`  📝 从页面正文获取HTML内容 (${htmlContent.length} 字符)`);
                }
                
                // 2. 如果正文没有，尝试从字段获取
                if (!htmlContent) {
                    if (properties['完整HTML内容']) {
                        htmlContent = properties['完整HTML内容']?.rich_text[0]?.plain_text || '';
                        console.log(`  📝 从"完整HTML内容"字段获取HTML内容 (${htmlContent.length} 字符)`);
                    } else if (properties['HTML代码']) {
                        htmlContent = properties['HTML代码']?.rich_text[0]?.plain_text || '';
                        console.log(`  📝 从"HTML代码"字段获取HTML内容 (${htmlContent.length} 字符)`);
                    }
                }
                
                if (!htmlContent) {
                    console.log(`  ⚠️  警告: 页面没有找到HTML内容，跳过迁移`);
                    failureCount++;
                    continue;
                }
                
                // 生成新的哈希值（如果需要）
                const finalHtmlHash = htmlHash || generateHash(htmlContent);
                const finalPageId = pageId || (Date.now().toString(36) + Math.random().toString(36).substr(2));
                
                // 插入到Supabase
                const { data: newPage, error } = await supabase
                    .from('html_deployer_pages')
                    .insert([
                        {
                            title: title,
                            html_content: htmlContent,
                            html_hash: finalHtmlHash,
                            description: description,
                            page_id: finalPageId,
                            share_url: shareUrl,
                            sort_order: sortOrder,
                            created_at: createdAt
                        }
                    ])
                    .select()
                    .single();
                
                if (error) {
                    if (error.code === '23505') {
                        console.log(`  ⚠️  页面已存在，跳过: ${error.message}`);
                    } else {
                        throw error;
                    }
                } else {
                    console.log(`  ✅ 成功迁移，Supabase ID: ${newPage.id}`);
                    successCount++;
                }
                
            } catch (error) {
                console.log(`  ❌ 迁移失败: ${error.message}`);
                failureCount++;
            }
            
            console.log(''); // 空行
        }
        
        // 4. 迁移总结
        console.log('📊 迁移完成！');
        console.log(`✅ 成功迁移: ${successCount} 个页面`);
        console.log(`❌ 迁移失败: ${failureCount} 个页面`);
        console.log(`📝 总计页面: ${response.results.length} 个页面\n`);
        
        // 5. 验证迁移结果
        console.log('🔍 验证迁移结果...');
        const { data: migratedPages, error: verifyError } = await supabase
            .from('html_deployer_pages')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (verifyError) {
            console.error('验证失败:', verifyError);
        } else {
            console.log(`✅ Supabase数据库中现有 ${migratedPages.length} 个页面`);
            migratedPages.forEach((page, index) => {
                console.log(`  ${index + 1}. "${page.title}" (${page.html_content.length} 字符)`);
            });
        }
        
    } catch (error) {
        console.error('❌ 迁移过程中发生错误:', error);
    }
}

// 清空Supabase表（谨慎使用）
async function clearSupabaseTable() {
    console.log('⚠️  正在清空Supabase表...');
    const { error } = await supabase
        .from('html_deployer_pages')
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000'); // 删除所有记录
    
    if (error) {
        console.error('清空表失败:', error);
    } else {
        console.log('✅ 成功清空Supabase表');
    }
}

// 主函数
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--clear')) {
        await clearSupabaseTable();
        return;
    }
    
    if (args.includes('--help')) {
        console.log(`
Notion到Supabase数据迁移工具

用法:
  node migrate-to-supabase.js          # 开始迁移
  node migrate-to-supabase.js --clear  # 清空Supabase表（危险操作）
  node migrate-to-supabase.js --help   # 显示此帮助信息

环境变量要求:
  NOTION_API_KEY      - Notion集成token
  NOTION_DATABASE_ID  - Notion数据库ID
  SUPABASE_URL        - Supabase项目URL
  SUPABASE_ANON_KEY   - Supabase匿名密钥
        `);
        return;
    }
    
    await migrateFromNotionToSupabase();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { migrateFromNotionToSupabase, clearSupabaseTable };