// 配置：列出resources文件夹中的四个特定文档
const DOCUMENTS = [
    {
        name: "银行积分流通系统设计方案",
        file: "银行积分流通系统设计方案（基于区块链）.docx",
        type: "docx"
    },
    {
        name: "命令文档",
        file: "命令文档.docx",
        type: "docx"
    },
    {
        name: "基础环境配置2",
        file: "基础环境配置2.docx",
        type: "docx"
    },
    {
        name: "基础环境配置",
        file: "基础环境配置.docx",
        type: "docx"
    }
];

// DOM元素
const fileListElement = document.getElementById('fileList');
const documentTitleElement = document.getElementById('documentTitle');
const documentContentElement = document.getElementById('documentContent');

// 当前选中的文件
let currentFile = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    renderFileList();
});

// 渲染文件列表
function renderFileList() {
    fileListElement.innerHTML = '';

    DOCUMENTS.forEach(doc => {
        const li = document.createElement('li');
        li.className = 'file-item';
        li.innerHTML = `<span class="file-icon">📄</span>${doc.name}`;
        li.dataset.file = doc.file;
        li.dataset.type = doc.type;

        li.addEventListener('click', () => {
            // 更新选中状态
            document.querySelectorAll('.file-item').forEach(item => {
                item.classList.remove('active');
            });
            li.classList.add('active');

            // 加载文档
            loadDocument(doc);
        });

        fileListElement.appendChild(li);
    });
}

// 加载文档
function loadDocument(doc) {
    currentFile = doc;
    documentTitleElement.textContent = doc.name;

    // 显示加载状态
    documentContentElement.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <p>正在加载文档...</p>
        </div>
    `;

    const filePath = `resources/${encodeURIComponent(doc.file)}`;

    // 加载DOCX文件
    fetch(filePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`无法加载文件: ${response.status} ${response.statusText}`);
            }
            return response.arrayBuffer();
        })
        .then(arrayBuffer => {
            // 使用Mammoth将DOCX转换为HTML
            return mammoth.convertToHtml({
                arrayBuffer: arrayBuffer,
                styleMap: [
                    "p[style-name='Title'] => h1:fresh",
                    "p[style-name='Subtitle'] => h2:fresh",
                    "p[style-name='Heading 1'] => h1:fresh",
                    "p[style-name='Heading 2'] => h2:fresh",
                    "p[style-name='Heading 3'] => h3:fresh",
                    "p[style-name='Heading 4'] => h4:fresh"
                ]
            });
        })
        .then(result => {
            // 处理内容，增强可读性
            let content = result.value;

            // 简单清理和增强格式
            content = content
                .replace(/<p><\/p>/g, '') // 移除空段落
                .replace(/<p>&nbsp;<\/p>/g, '') // 移除空格段落
                .replace(/<p>　+<\/p>/g, '') // 移除中文空格段落
                .replace(/<p>(\s|&nbsp;)*<\/p>/g, ''); // 移除空白段落

            documentContentElement.innerHTML = content;

            // 处理警告
            if (result.messages.length > 0) {
                console.warn('DOCX转换警告:', result.messages);
            }
        })
        .catch(error => {
            documentContentElement.innerHTML = `
                <div class="error">
                    <p><strong>加载失败:</strong> ${error.message}</p>
                    <p>请确保文件存在于resources文件夹中，且文件名完全匹配。</p>
                    <p>尝试的路径: ${filePath}</p>
                </div>
            `;
            console.error('加载文件失败:', error);
        });
}