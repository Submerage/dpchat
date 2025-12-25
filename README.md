# 本地文档阅读器

一个可以在GitHub Pages上部署的静态网站，用于阅读预先上传到resources文件夹中的文档。

## 功能特点
- 无需后端服务器，完全静态网站
- 支持多种文档格式：TXT, DOCX, PDF, MD, HTML
- 响应式设计，适配各种设备
- 免费部署在GitHub Pages上

## 使用方法
1. 克隆此仓库
2. 将您的文档放入resources文件夹
3. 提交并推送到GitHub
4. 在GitHub仓库设置中启用GitHub Pages
5. 访问生成的GitHub Pages链接

## 技术说明
- 使用Mammoth.js解析DOCX文件
- 使用PDF.js解析PDF文件
- 仅能访问已提交到仓库的文件，无法访问用户本地文件系统

## 限制
- 由于GitHub Pages限制，无法直接列出resources文件夹内容，文件列表是预定义的
- 大型DOCX或PDF文件可能加载较慢
- 某些复杂的格式可能无法完美渲染

## 部署
1. 创建GitHub仓库
2. 上传所有文件
3. 在仓库Settings > Pages中，选择分支（通常是main或master）和文件夹（/root）
4. 等待几分钟，然后访问提供的URL