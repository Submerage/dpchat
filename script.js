// DOM元素
const fileInput = document.getElementById('file-input');
const filesContainer = document.getElementById('files-container');
const documentTitle = document.getElementById('document-title');
const documentContent = document.getElementById('document-content');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');
const loadingIndicator = document.getElementById('loading-indicator');

// 状态变量
let currentFile = null;
let currentPage = 1;
let totalPages = 1;
let fileContent = '';
let pdfDoc = null;
let githubRepoUrl = '';

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 设置年份
    document.getElementById('year').textContent = new Date().getFullYear();

    // 获取GitHub仓库URL
    githubRepoUrl = window.location.href.replace('/index.html', '').replace(/\/$/, '');

    setupEventListeners();
    loadRepositoryFiles();
});

function setupEventListeners() {
    fileInput.addEventListener('change', handleFileSelect);
    prevPageBtn.addEventListener('click', goToPreviousPage);
    nextPageBtn.addEventListener('click', goToNextPage);
}

function openGitHubRepo() {
    const repoUrl = githubRepoUrl.replace('github.io', 'github.com').replace(/\/$/, '');
    window.open(repoUrl, '_blank');
}

async function loadRepositoryFiles() {
    try {
        // 获取resources文件夹中的文件列表
        // 注意：GitHub Pages不提供API列出目录内容，我们使用一个预定义的文件列表
        const predefinedFiles = [
            { name: 'sample.txt', size: '0.5 KB', type: 'text/plain' },
            { name: 'example.docx', size: '12.3 KB', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
            { name: 'example.pdf', size: '24.7 KB', type: 'application/pdf' },
            // 添加新文件
            { name: 'your-file.docx', size: '15.2 KB', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
        ];

        displayFileList(predefinedFiles);
    } catch (error) {
        console.error('加载文件列表失败:', error);
        filesContainer.innerHTML = '<p class="placeholder">无法加载文件列表。请确保resources文件夹中包含文档。</p>';
    }
}

function displayFileList(files) {
    if (files.length === 0) {
        filesContainer.innerHTML = '<p class="placeholder">resources 文件夹中没有文档</p>';
        return;
    }

    filesContainer.innerHTML = '';

    files.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';

        // 根据文件类型设置不同的图标
        let icon = '📄';
        if (file.name.endsWith('.docx')) icon = '📝';
        if (file.name.endsWith('.pdf')) icon = '📑';
        if (file.name.endsWith('.txt')) icon = '🗒️';
        if (file.name.endsWith('.md')) icon = '✏️';
        if (file.name.endsWith('.html')) icon = '🌐';

        fileItem.innerHTML = `
            <span class="file-icon">${icon}</span>
            <span class="file-name">${file.name}</span>
            <span class="file-size">${file.size}</span>
        `;
        fileItem.addEventListener('click', () => loadRepositoryFile(file.name, file.type));
        filesContainer.appendChild(fileItem);
    });
}

function showLoading() {
    loadingIndicator.style.display = 'flex';
}

function hideLoading() {
    loadingIndicator.style.display = 'none';
}

async function loadRepositoryFile(fileName, fileType) {
    showLoading();
    documentTitle.textContent = fileName;

    try {
        // 从resources文件夹加载文件
        const response = await fetch(`resources/${fileName}`);

        if (!response.ok) {
            throw new Error(`无法加载文件: ${response.status} ${response.statusText}`);
        }

        currentFile = {
            name: fileName,
            type: fileType
        };

        // 根据文件类型处理
        if (fileName.endsWith('.docx')) {
            await loadDocxFile(response);
        } else if (fileName.endsWith('.pdf')) {
            await loadPdfFile(response);
        } else if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
            await loadTextFile(response);
        } else if (fileName.endsWith('.html')) {
            await loadHtmlFile(response);
        } else {
            // 默认处理
            const text = await response.text();
            documentContent.innerHTML = `<pre>${text}</pre>`;
        }

    } catch (error) {
        console.error('加载文件失败:', error);
        documentContent.innerHTML = `<div class="error">加载文件失败: ${error.message}</div>`;
    } finally {
        hideLoading();
    }
}

async function loadDocxFile(response) {
    try {
        const arrayBuffer = await response.arrayBuffer();

        // 使用Mammoth解析DOCX
        const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });

        // 显示转换后的内容
        documentContent.innerHTML = result.value;

        // 处理可能的错误
        if (result.messages.length > 0) {
            console.warn('DOCX转换警告:', result.messages);
        }

        // 重置分页
        currentPage = 1;
        totalPages = 1;
        updatePageInfo();
        disablePaginationButtons();

    } catch (error) {
        console.error('解析DOCX失败:', error);
        documentContent.innerHTML = `<div class="error">无法解析DOCX文件: ${error.message}</div>`;
    }
}

async function loadPdfFile(response) {
    try {
        const arrayBuffer = await response.arrayBuffer();

        // 使用PDF.js加载文档
        pdfDoc = await pdfjsLib.getDocument(arrayBuffer).promise;
        totalPages = pdfDoc.numPages;
        currentPage = 1;

        // 渲染第一页
        await renderPdfPage(currentPage);

        // 更新分页控件
        updatePageInfo();
        updatePaginationButtons();

    } catch (error) {
        console.error('加载PDF失败:', error);
        documentContent.innerHTML = `<div class="error">无法加载PDF文件: ${error.message}</div>`;
        disablePaginationButtons();
    }
}

async function renderPdfPage(pageNumber) {
    if (!pdfDoc) return;

    try {
        const page = await pdfDoc.getPage(pageNumber);

        // 设置渲染参数
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // 渲染PDF页面
        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;

        // 清除当前内容并添加新页面
        documentContent.innerHTML = '';
        const pdfContainer = document.createElement('div');
        pdfContainer.className = 'pdf-container';

        const pageElement = document.createElement('div');
        pageElement.className = 'pdf-page';
        pageElement.innerHTML = `<h3>第 ${pageNumber} 页</h3>`;
        pageElement.appendChild(canvas);

        pdfContainer.appendChild(pageElement);
        documentContent.appendChild(pdfContainer);

    } catch (error) {
        console.error('渲染PDF页面失败:', error);
        documentContent.innerHTML = `<div class="error">渲染PDF页面失败: ${error.message}</div>`;
    }
}

async function loadTextFile(response) {
    try {
        const text = await response.text();

        if (currentFile.name.endsWith('.md')) {
            // 简单的Markdown转HTML
            const htmlContent = convertMarkdownToHtml(text);
            documentContent.innerHTML = htmlContent;
        } else {
            // 普通文本
            documentContent.innerHTML = `<pre>${text}</pre>`;
        }

        // 重置分页
        currentPage = 1;
        totalPages = 1;
        updatePageInfo();
        disablePaginationButtons();

    } catch (error) {
        console.error('加载文本文件失败:', error);
        documentContent.innerHTML = `<div class="error">无法加载文本文件: ${error.message}</div>`;
        disablePaginationButtons();
    }
}

async function loadHtmlFile(response) {
    try {
        const htmlContent = await response.text();
        documentContent.innerHTML = htmlContent;

        // 重置分页
        currentPage = 1;
        totalPages = 1;
        updatePageInfo();
        disablePaginationButtons();

    } catch (error) {
        console.error('加载HTML文件失败:', error);
        documentContent.innerHTML = `<div class="error">无法加载HTML文件: ${error.message}</div>`;
        disablePaginationButtons();
    }
}

function convertMarkdownToHtml(markdown) {
    // 简单的Markdown转换
    let html = markdown

        // 标题
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')

        // 强调
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')

        // 链接
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')

        // 代码块
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        .replace(/`([^`]*)`/g, '<code>$1</code>')

        // 列表
        .replace(/^\s*\d+\.\s+(.*)$/gim, '<ol><li>$1</li></ol>')
        .replace(/^\s*[-*+]\s+(.*)$/gim, '<ul><li>$1</li></ul>')

        // 段落
        .replace(/^(?!<[h|p|ul|ol|li|pre|code]).+$/gm, '<p>$&</p>')

        // 换行
        .replace(/\n/g, '<br>');

    return html;
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    showLoading();
    documentTitle.textContent = file.name;

    const reader = new FileReader();

    reader.onload = async function (event) {
        currentFile = {
            name: file.name,
            size: formatFileSize(file.size),
            type: file.type
        };

        try {
            if (file.name.endsWith('.docx')) {
                // 处理DOCX文件
                const arrayBuffer = event.target.result;
                const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
                documentContent.innerHTML = result.value;

                currentPage = 1;
                totalPages = 1;
                updatePageInfo();
                disablePaginationButtons();
            } else if (file.name.endsWith('.pdf')) {
                // 处理PDF文件
                const arrayBuffer = event.target.result;
                pdfDoc = await pdfjsLib.getDocument(arrayBuffer).promise;
                totalPages = pdfDoc.numPages;
                currentPage = 1;
                await renderPdfPage(currentPage);

                updatePageInfo();
                updatePaginationButtons();
            } else if (file.type.startsWith('image/')) {
                documentContent.innerHTML = `<img src="${event.target.result}" alt="${file.name}" style="max-width: 100%;">`;
                currentPage = 1;
                totalPages = 1;
                updatePageInfo();
                disablePaginationButtons();
            } else if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
                documentContent.innerHTML = event.target.result;
                currentPage = 1;
                totalPages = 1;
                updatePageInfo();
                disablePaginationButtons();
            } else if (file.name.endsWith('.md')) {
                const htmlContent = convertMarkdownToHtml(event.target.result);
                documentContent.innerHTML = htmlContent;
                currentPage = 1;
                totalPages = 1;
                updatePageInfo();
                disablePaginationButtons();
            } else {
                // 默认处理文本文件
                documentContent.innerHTML = `<pre>${event.target.result}</pre>`;
                currentPage = 1;
                totalPages = 1;
                updatePageInfo();
                disablePaginationButtons();
            }
        } catch (error) {
            console.error('处理文件失败:', error);
            documentContent.innerHTML = `<div class="error">处理文件失败: ${error.message}</div>`;
            disablePaginationButtons();
        } finally {
            hideLoading();
            fileInput.value = '';
        }
    };

    if (file.name.endsWith('.docx') || file.name.endsWith('.pdf')) {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsText(file);
    }
}

function goToPreviousPage() {
    if (currentPage > 1 && pdfDoc) {
        currentPage--;
        renderPdfPage(currentPage);
        updatePageInfo();
        updatePaginationButtons();
    }
}

function goToNextPage() {
    if (currentPage < totalPages && pdfDoc) {
        currentPage++;
        renderPdfPage(currentPage);
        updatePageInfo();
        updatePaginationButtons();
    }
}

function updatePageInfo() {
    pageInfo.textContent = `${currentPage}/${totalPages}`;
}

function updatePaginationButtons() {
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
}

function disablePaginationButtons() {
    prevPageBtn.disabled = true;
    nextPageBtn.disabled = true;
    pageInfo.textContent = '1/1';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}