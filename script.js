// DOM元素
const fileInput = document.getElementById('file-input');
const openFolderBtn = document.getElementById('open-folder-btn');
const filesContainer = document.getElementById('files-container');
const documentTitle = document.getElementById('document-title');
const documentContent = document.getElementById('document-content');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');

// 状态变量
let currentFile = null;
let currentPage = 1;
let totalPages = 1;
let fileContent = '';

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadLocalFiles();
    setupEventListeners();

    // 尝试加载示例文件
    loadSampleFile();
});

function setupEventListeners() {
    fileInput.addEventListener('change', handleFileSelect);
    openFolderBtn.addEventListener('click', openResourcesFolder);
    prevPageBtn.addEventListener('click', goToPreviousPage);
    nextPageBtn.addEventListener('click', goToNextPage);
}

function loadLocalFiles() {
    // 在纯前端环境下，无法直接访问本地文件系统
    // 这里模拟一个文件列表
    const mockFiles = [
        { name: '使用说明.txt', size: '1.2 KB', type: 'text/plain' },
        { name: '项目计划.md', size: '3.5 KB', type: 'text/markdown' },
        { name: '报告.pdf', size: '245 KB', type: 'application/pdf' },
        { name: '笔记.html', size: '8.7 KB', type: 'text/html' }
    ];

    displayFileList(mockFiles);
}

function displayFileList(files) {
    if (files.length === 0) {
        filesContainer.innerHTML = '<p class="placeholder">resources 文件夹中没有找到文档</p>';
        return;
    }

    filesContainer.innerHTML = '';

    files.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span class="file-icon">📄</span>
            <span class="file-name">${file.name}</span>
            <span class="file-size">${file.size}</span>
        `;
        fileItem.addEventListener('click', () => loadFile(file));
        filesContainer.appendChild(fileItem);
    });
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();

        reader.onload = function(event) {
            currentFile = {
                name: file.name,
                size: formatFileSize(file.size),
                type: file.type,
                content: event.target.result
            };
            displayFileContent(currentFile);
        };

        if (file.type.startsWith('image/')) {
            reader.readAsDataURL(file);
        } else if (file.type === 'application/pdf') {
            // 简化处理PDF，实际应用需要pdf.js库
            reader.readAsText(new Blob(['这是一个PDF文件，需要更多库支持才能完整显示。']));
        } else {
            reader.readAsText(file);
        }
    }
}

function openResourcesFolder() {
    alert('由于浏览器安全限制，无法直接打开本地文件夹。\n\n请将文档放入项目中的 "resources" 文件夹，然后刷新页面。');
}

function loadFile(file) {
    // 模拟加载文件
    documentTitle.textContent = file.name;
    documentContent.innerHTML = `<div class="loading">正在加载 ${file.name}...</div>`;

    setTimeout(() => {
        if (file.name.endsWith('.pdf')) {
            documentContent.innerHTML = `
                <h2>PDF文档预览</h2>
                <p>这是一个PDF文档: <strong>${file.name}</strong></p>
                <p>文件大小: ${file.size}</p>
                <div class="pdf-preview">
                    <p>📝 PDF内容预览需要集成pdf.js库</p>
                    <p>当前仅支持查看文本文件，但你可以下载示例PDF查看效果。</p>
                </div>
                <div class="download-section">
                    <button onclick="downloadSamplePDF()">下载示例PDF</button>
                </div>
            `;
        } else if (file.name.endsWith('.md')) {
            documentContent.innerHTML = `
                <h1>${file.name}</h1>
                <h2>标题2</h2>
                <p>这是一个Markdown文档示例。</p>
                <pre><code>// 代码示例
function helloWorld() {
  console.log("Hello, World!");
}</code></pre>
                <p>支持<strong>粗体</strong>、<em>斜体</em>和<a href="#">链接</a>。</p>
                <table>
                    <tr>
                        <th>标题1</th>
                        <th>标题2</th>
                    </tr>
                    <tr>
                        <td>单元格1</td>
                        <td>单元格2</td>
                    </tr>
                </table>
            `;
        } else if (file.name.endsWith('.html')) {
            documentContent.innerHTML = `
                <h1>${file.name}</h1>
                <p>这是一个HTML文档示例</p>
                <div style="background-color: #f0f0f0; padding: 15px; border-radius: 8px;">
                    <h3>嵌入内容</h3>
                    <p>HTML内容可以包含丰富的格式和样式</p>
                    <button style="background-color: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">点击按钮</button>
                </div>
            `;
        } else {
            documentContent.innerHTML = `
                <h1>${file.name}</h1>
                <p>这是文档的内容。实际应用中，这里会显示从resources文件夹加载的${file.name}文件的内容。</p>
                <p>文件类型: ${file.type || 'text/plain'}</p>
                <p>文件大小: ${file.size}</p>
                <pre>${generateSampleText()}</pre>
            `;
        }

        currentPage = 1;
        totalPages = 1;
        updatePageInfo();
    }, 500);
}

function loadSampleFile() {
    // 加载resources文件夹中的示例文件
    fetch('resources/sample.txt')
        .then(response => {
            if (response.ok) {
                return response.text();
            }
            throw new Error('文件不存在');
        })
        .then(text => {
            currentFile = {
                name: 'sample.txt',
                size: formatFileSize(new Blob([text]).size),
                type: 'text/plain',
                content: text
            };
            documentTitle.textContent = 'sample.txt';
            documentContent.innerHTML = `<pre>${text}</pre>`;
        })
        .catch(error => {
            console.log('没有找到示例文件: ', error);
            // 创建示例文件内容
            const sampleContent = `# 欢迎使用本地文档阅读器

这是一个示例文本文件，放在resources文件夹中。

## 功能特点
- 无需网络连接
- 支持多种文档格式
- 简洁的阅读界面
- 响应式设计，适配各种设备

## 如何使用
1. 将文档放入resources文件夹
2. 刷新页面
3. 从左侧列表选择文档
4. 开始阅读

## 技术栈
- HTML5
- CSS3
- JavaScript
- 原生File API

感谢使用本地文档阅读器！`;

            // 显示示例内容
            documentTitle.textContent = '示例文档';
            documentContent.innerHTML = `<pre>${sampleContent}</pre>`;
        });
}

function displayFileContent(file) {
    documentTitle.textContent = file.name;
    fileContent = file.content;

    if (file.type.startsWith('image/')) {
        documentContent.innerHTML = `<img src="${file.content}" alt="${file.name}">`;
    } else if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
        documentContent.innerHTML = file.content;
    } else if (file.name.endsWith('.md')) {
        // 简单的Markdown转HTML，实际应用应使用marked.js等库
        const htmlContent = file.content
            .replace(/^# (.*)$/gm, '<h1>$1</h1>')
            .replace(/^## (.*)$/gm, '<h2>$1</h2>')
            .replace(/^### (.*)$/gm, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
            .replace(/\n/g, '<br>');

        documentContent.innerHTML = htmlContent;
    } else if (file.type === 'application/pdf') {
        documentContent.innerHTML = `
            <h2>PDF文档</h2>
            <p>文件名: ${file.name}</p>
            <p>大小: ${file.size}</p>
            <p>⚠️ PDF渲染需要额外的库支持。在完整实现中，我们会集成pdf.js库。</p>
            <div class="pdf-placeholder">
                <div class="pdf-page">
                    <p>PDF页面1内容预览...</p>
                </div>
            </div>
        `;
    } else {
        // 文本文件
        documentContent.innerHTML = `<pre>${file.content}</pre>`;
    }

    currentPage = 1;
    totalPages = 1;
    updatePageInfo();

    // 重置文件输入
    fileInput.value = '';
}

function goToPreviousPage() {
    if (currentPage > 1) {
        currentPage--;
        renderCurrentPage();
    }
}

function goToNextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        renderCurrentPage();
    }
}

function renderCurrentPage() {
    // 简单分页逻辑，实际应用中需要根据内容类型处理
    updatePageInfo();
}

function updatePageInfo() {
    pageInfo.textContent = `${currentPage}/${totalPages}`;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateSampleText() {
    return `这是文档的内容。
    
您可以将任意文本文件放入resources文件夹，然后刷新页面查看。
    
支持的格式包括：
- TXT 文本文件
- MD Markdown文件
- HTML 网页文件
- PDF 文件 (需要额外库支持)

项目结构：
document-reader/
├── index.html
├── styles.css
├── script.js
└── resources/
    └── 您的文档放在这里

提示：直接将文件拖放到resources文件夹，然后刷新页面即可。`;
}

function downloadSamplePDF() {
    // 创建一个示例PDF内容
    const pdfContent = `这是一个示例PDF文件的内容。
    
在实际应用中，这里会是真正的PDF内容，但受限于纯前端环境，我们只能模拟下载行为。

要真正支持PDF阅读，需要集成Mozilla的pdf.js库。`;

    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = '示例文档.pdf';
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
}