# Presentation Desk

一个用来培训的高度定制化的 Web 工具。能按页展示用户准备好的 Deck，并能在页面上进行必要的教学信息记录或互动。

## 主要功能

- **课程选择**：从本地目录读取课程列表。
- **讲演台**：
  - **大纲侧栏**：展示课程结构。
  - **图片展示**：左侧展示课程图片，支持全屏。
  - **多功能区**：
    - **Content**：展示 Markdown 格式的教学内容。
    - **Notes**：记录和保存课堂笔记（即时写入本地文件）。
    - **Browser**：内嵌浏览器以展示外部资源。

## 目录结构

```text
presentation-desk/
├── courses/               <-- 课程数据根目录 (请在此放入您的课程文件夹)
│   └── Course Name/       <-- 一级目录：课程名称
│       ├── Topic Name/    <-- 二级目录：页面/主题名称
│       │   ├── image.png  <-- 展示图片 (支持常见图片格式)
│       │   ├── Readme.md  <-- 教学内容
│       │   └── Update.md  <-- 笔记记录
│       └── ...
├── src/                   <-- 前端源码
├── api/                   <-- 后端 API 源码
└── ...
```

## 本地运行指南 (Getting Started)

本项目包含前端 (React) 与后端 (Express API)，需同时启动。

### 1. 安装依赖

请确保您的电脑已安装 [Node.js](https://nodejs.org/) (推荐 v18+)。

```bash
npm install
```

### 2. 准备课程数据

在项目根目录下，程序会自动扫描 `courses` 文件夹。您可以直接使用内置的示例课程，或按上述目录结构添加自己的课程文件夹。

### 3. 启动开发环境

运行以下命令，将同时启动前端页面和后端 API 服务：

```bash
npm run dev
```

启动成功后，请在浏览器访问：

- **主页**: [http://localhost:5173](http://localhost:5173)

### 4. 其他命令

- `npm run build`: 构建生产环境版本。
- `npm run lint`: 检查代码规范。
- `npm run check`: 运行 TypeScript 类型检查。

## 技术栈

- **Frontend**: React, Tailwind CSS, Lucide React, Zustand
- **Backend**: Express, Node.js (fs)
- **Tooling**: Vite, TypeScript
