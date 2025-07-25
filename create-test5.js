require('dotenv').config();
const { Client } = require('@notionhq/client');
const crypto = require('crypto');

// 使用你的凭据
const notion = new Client({ 
    auth: 'ntn_Gm686281869ayWzsPVp9sx1y2hHuZ4bJ5hBs4dQOOnkekG'
});
const databaseId = '23a028e7d48d8068bdbadaf518dcae0f';

// 你提供的长HTML内容
const testHtmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML 元素测试页面</title>
    <meta name="description" content="一个用于测试HTML部署环境的综合页面。">

    <link rel="stylesheet" href="style.css">

    <style>
        body {
            font-family: sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 900px;
            margin: auto;
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        section {
            border-bottom: 2px solid #eee;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }
        h1, h2, h3, h4, h5, h6 {
            color: #1a1a1a;
        }
        pre {
            background: #eee;
            padding: 10px;
            border-radius: 4px;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        code {
            font-family: monospace;
            background-color: #f0f0f0;
            padding: 2px 4px;
            border-radius: 3px;
        }
        table, th, td {
            border: 1px solid #ccc;
            border-collapse: collapse;
        }
        th, td {
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
        button {
            cursor: pointer;
            padding: 10px 15px;
            border-radius: 4px;
            border: 1px solid #007bff;
            background-color: #007bff;
            color: white;
        }
        dialog {
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 20px;
        }
    </style>
</head>
<body>

    <div class="container">
        <header>
            <h1>HTML 综合元素测试页面</h1>
            <p>本页面用于检测HTML、CSS、JS及多媒体资源的部署和渲染情况。</p>
        </header>

        <nav>
            <h2>导航菜单</h2>
            <ul>
                <li><a href="#text">文本</a></li>
                <li><a href="#media">多媒体</a></li>
                <li><a href="#tables">表格</a></li>
                <li><a href="#forms">表单</a></li>
            </ul>
        </nav>

        <main>
            <section id="text">
                <h2>1. 文本与标题</h2>
                <h1>H1 标题</h1>
                <h2>H2 标题</h2>
                <h3>H3 标题</h3>
                <h4>H4 标题</h4>
                <h5>H5 标题</h5>
                <h6>H6 标题</h6>
                
                <p>这是一个段落。包含 <strong>粗体(strong)</strong>, <b>粗体(b)</b>, <em>强调(em)</em>, 和 <i>斜体(i)</i> 文本。 <u>下划线文本</u>, <s>删除线文本</s>. 水的化学式是 H<sub>2</sub>O， E=MC<sup>2</sup>。</p>
                
                <p>下面是一个引用块：</p>
                <blockquote>
                    "Stay hungry, stay foolish." - Steve Jobs. 这是一个长引用。
                </blockquote>
                <p>这是一个短引用: <q>Hello World!</q></p>
                
                <p>代码示例:</p>
                <pre><code>function greet() {
    console.log("Hello from the preformatted block!");
}</code></pre>
                
                <p>这是一个水平分割线:</p>
                <hr>
            </section>

            <section id="lists">
                <h2>2. 列表</h2>
                <h3>无序列表</h3>
                <ul>
                    <li>项目 A</li>
                    <li>项目 B
                        <ul>
                            <li>子项目 B1</li>
                            <li>子项目 B2</li>
                        </ul>
                    </li>
                    <li>项目 C</li>
                </ul>

                <h3>有序列表</h3>
                <ol start="5" reversed>
                    <li>第五项 (倒序)</li>
                    <li>第四项</li>
                    <li>第三项</li>
                </ol>

                <h3>定义列表</h3>
                <dl>
                    <dt>HTML</dt>
                    <dd>超文本标记语言</dd>
                    <dt>CSS</dt>
                    <dd>层叠样式表</dd>
                </dl>
            </section>

            <section id="media">
                <h2>3. 链接与多媒体</h2>
                <p>
                    <a href="https://www.google.com" target="_blank">这是一个指向 Google 的外部链接 (新标签页打开)</a><br>
                    <a href="#top">这是一个返回页面顶部的内部链接</a><br>
                    <a href="mailto:test@example.com">发送邮件</a><br>
                    <a href="tel:+123456789">拨打电话</a>
                </p>

                <h3>图像 (来自外部源)</h3>
                <img src="https://placehold.co/600x300/007bff/white?text=Test+Image" alt="测试图片" style="max-width:100%;">

                <h3>音频 (如果无法加载，请检查服务器MIME类型配置)</h3>
                <audio controls src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3">
                    你的浏览器不支持 audio 标签。
                </audio>

                <h3>视频 (如果无法加载，请检查服务器MIME类型配置)</h3>
                <video controls width="100%" poster="https://placehold.co/600x300/28a745/white?text=Video+Poster">
                    <source src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4">
                    你的浏览器不支持 video 标签。
                </video>

                <h3>Iframe (内嵌框架)</h3>
                <iframe src="https://www.openstreetmap.org/export/embed.html?bbox=-0.004017949104309083%2C51.47612752342224%2C0.004017949104309083%2C51.47856781432573&layer=mapnik" width="100%" height="300" style="border:1px solid black;"></iframe>
            </section>

            <section id="tables">
                <h2>4. 表格</h2>
                <table>
                    <caption>每月开销</caption>
                    <thead>
                        <tr>
                            <th>项目</th>
                            <th>一月</th>
                            <th>二月</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>房租</td>
                            <td>$1000</td>
                            <td>$1000</td>
                        </tr>
                        <tr>
                            <td rowspan="2">食物</td>
                            <td>$300</td>
                            <td>$280</td>
                        </tr>
                        <tr>
                            <td>$150 (外出就餐)</td>
                            <td>$120 (外出就餐)</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="2">总计</td>
                            <td>$1450 + $1400</td>
                        </tr>
                    </tfoot>
                </table>
            </section>

            <section id="forms">
                <h2>5. 表单元素</h2>
                <form action="#" method="post" onsubmit="alert('表单已提交！(前端拦截)'); return false;">
                    <fieldset>
                        <legend>个人信息</legend>
                        <p>
                            <label for="name">姓名:</label>
                            <input type="text" id="name" name="name" required>
                        </p>
                        <p>
                            <label for="password">密码:</label>
                            <input type="password" id="password" name="password">
                        </p>
                        <p>
                            <label for="email">邮箱:</label>
                            <input type="email" id="email" name="email" placeholder="test@example.com">
                        </p>
                        <p>
                            <label for="birthdate">出生日期:</label>
                            <input type="date" id="birthdate" name="birthdate">
                        </p>
                        <p>
                            <label for="quantity">数量 (1-10):</label>
                            <input type="number" id="quantity" name="quantity" min="1" max="10" value="5">
                        </p>
                         <p>
                            <label for="favcolor">喜欢的颜色:</label>
                            <input type="color" id="favcolor" name="favcolor" value="#007bff">
                        </p>
                        <p>
                            <label for="volume">音量:</label>
                            <input type="range" id="volume" name="volume" min="0" max="100">
                        </p>
                        <p>
                            <label for="homepage">个人主页:</label>
                            <input type="url" id="homepage" name="homepage" placeholder="https://example.com">
                        </p>
                    </fieldset>

                    <fieldset>
                        <legend>选项</legend>
                        <p>你喜欢的Web技术:</p>
                        <input type="checkbox" id="tech1" name="tech" value="HTML" checked>
                        <label for="tech1">HTML</label><br>
                        <input type="checkbox" id="tech2" name="tech" value="CSS">
                        <label for="tech2">CSS</label><br>
                        <input type="checkbox" id="tech3" name="tech" value="JS">
                        <label for="tech3">JavaScript</label><br>

                        <p>你的开发水平:</p>
                        <input type="radio" id="level1" name="level" value="beginner" checked>
                        <label for="level1">初学者</label><br>
                        <input type="radio" id="level2" name="level" value="intermediate">
                        <label for="level2">中级</label><br>
                        <input type="radio" id="level3" name="level" value="expert">
                        <label for="level3">专家</label><br>
                    </fieldset>

                    <fieldset>
                        <legend>其他</legend>
                        <p>
                            <label for="framework">选择一个框架:</label>
                            <select id="framework" name="framework">
                                <optgroup label="前端">
                                    <option value="react">React</option>
                                    <option value="vue" selected>Vue</option>
                                    <option value="angular">Angular</option>
                                </optgroup>
                                <optgroup label="后端">
                                    <option value="nodejs">Node.js</option>
                                    <option value="django">Django</option>
                                </optgroup>
                            </select>
                        </p>
                        <p>
                            <label for="comments">留言:</label><br>
                            <textarea id="comments" name="comments" rows="4" cols="50"></textarea>
                        </p>
                        <p>
                            <label for="avatar">上传头像:</label>
                            <input type="file" id="avatar" name="avatar" accept="image/png, image/jpeg">
                        </p>
                    </fieldset>
                    
                    <button type="submit">提交</button>
                    <button type="reset">重置</button>
                    <button type="button" onclick="console.log('这是一个普通按钮的点击事件')">普通按钮</button>
                </form>
            </section>
            
            <section id="interactive">
                <h2>6. 交互式和语义化元素</h2>
                <article>
                    <h3>文章标题</h3>
                    <p>这是一个 \`article\` 标签，通常用于包含独立的内容块。</p>
                </article>

                <details>
                    <summary>点击这里查看详情 (details/summary)</summary>
                    <p>这里是隐藏的详细信息。如果这个可以正常展开和折叠，说明浏览器支持 \`details\` 标签。</p>
                </details>

                <p>
                    <label for="file">下载进度 (progress):</label>
                    <progress id="file" value="70" max="100"> 70% </progress>
                </p>
                <p>
                    <label for="disk_usage">磁盘使用 (meter):</label>
                    <meter id="disk_usage" value="0.6">60%</meter>
                </p>

                <button id="showDialogBtn">打开对话框 (dialog)</button>
                <dialog id="myDialog">
                    <h2>这是一个对话框</h2>
                    <p>这是一个 \`dialog\` 元素，可以通过JS控制显示和隐藏。</p>
                    <button id="closeDialogBtn">关闭</button>
                </dialog>
            </section>

            <section id="graphics">
                <h2>7. 图形绘制</h2>
                <h3>Canvas (JS 绘制)</h3>
                <canvas id="myCanvas" width="200" height="100" style="border:1px solid #000;"></canvas>
                
                <h3>内联 SVG</h3>
                <svg width="100" height="100">
                   <circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" />
                </svg>
            </section>
        </main>
        
        <footer>
            <p>&copy; 2025 - HTML 测试页面</p>
        </footer>
    </div>

    <script src="script.js"></script>
    
    <script>
        // Dialog 逻辑
        const showBtn = document.getElementById('showDialogBtn');
        const closeBtn = document.getElementById('closeDialogBtn');
        const dialog = document.getElementById('myDialog');

        showBtn.addEventListener('click', () => {
            dialog.showModal(); // 使用 showModal() 以模态方式显示
        });

        closeBtn.addEventListener('click', () => {
            dialog.close();
        });

        // Canvas 绘制逻辑
        const canvas = document.getElementById('myCanvas');
        if (canvas.getContext) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'rgb(200, 0, 0)';
            ctx.fillRect(10, 10, 50, 50);

            ctx.fillStyle = 'rgba(0, 0, 200, 0.5)';
            ctx.fillRect(30, 30, 50, 50);
        }

        // 测试控制台输出
        console.log("页面内联JavaScript已成功执行！");
    </script>
</body>
</html>`;

// 生成哈希值
function generateHash(content) {
    const hashSource = content.length > 100 ? content.substring(0, 100) + Date.now() : content;
    return crypto.createHash('md5').update(hashSource).digest('hex').substring(0, 8);
}

async function createTest5Page() {
    try {
        console.log('🧪 开始创建测试5页面...');
        console.log(`📏 HTML内容长度: ${testHtmlContent.length} 字符`);
        
        // 生成页面信息
        const htmlHash = generateHash(testHtmlContent);
        const pageId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        const shareUrl = `https://html-deployer-hhi20qelt-rancelee233s-projects.vercel.app/view/${htmlHash}`;
        
        // 1. 创建页面
        const response = await notion.pages.create({
            parent: { database_id: databaseId },
            properties: {
                '页面标题': {
                    title: [{
                        text: { content: '测试5' }
                    }]
                },
                'HTML哈希值': {
                    rich_text: [{
                        text: { content: htmlHash }
                    }]
                },
                '描述': {
                    rich_text: [{
                        text: { content: '手动创建的长HTML测试页面' }
                    }]
                },
                '页面ID': {
                    rich_text: [{
                        text: { content: pageId }
                    }]
                },
                '分享链接': {
                    rich_text: [{
                        text: { content: shareUrl }
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
        
        console.log('\n🎉 测试5页面创建成功！');
        console.log('🔗 访问链接:', shareUrl);
        console.log('📄 Notion页面ID:', response.id);
        console.log('🔑 HTML哈希值:', htmlHash);
        
        return {
            success: true,
            pageId: response.id,
            htmlHash: htmlHash,
            shareUrl: shareUrl,
            chunksCount: htmlChunks.length,
            originalLength: testHtmlContent.length,
            retrievedLength: retrievedContent.length,
            contentMatch: retrievedContent === testHtmlContent
        };
        
    } catch (error) {
        console.error('❌ 创建测试5页面失败:', error.message);
        console.error('详细错误:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// 运行测试
createTest5Page().then(result => {
    if (result.success) {
        console.log('\n🎊 测试5页面创建总结:');
        console.log('- 页面ID:', result.pageId);
        console.log('- 哈希值:', result.htmlHash);
        console.log('- 分段数量:', result.chunksCount);
        console.log('- 原始长度:', result.originalLength);
        console.log('- 读取长度:', result.retrievedLength);
        console.log('- 内容匹配:', result.contentMatch ? '✅' : '❌');
        console.log('- 访问链接:', result.shareUrl);
        console.log('\n请访问上述链接查看完整页面效果！');
    } else {
        console.log('\n💥 创建失败:', result.error);
    }
});