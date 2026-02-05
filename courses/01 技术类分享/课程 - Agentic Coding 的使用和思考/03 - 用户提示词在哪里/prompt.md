生成一个 Infographic，白色背景，简体中文，单 HTML 实现。根据用户提供的内容要求，选择你认为最合理的布局展示方式，可以使用图标 或 inline SVG 增加可视化和结构化的观感，色彩鲜艳一些。少 JS 动态。

请按【嵌入式组件】或【卡片】风格设计，CSS 使用 h-auto 而不是 min-h-screen，确保在 iframe 中预览时不出现双重滚动条。

主题：

- 展示一个有 Coding Agent，用户交互的方式。
- Coding Agent 组件中，包含核心的 Agent，以及若干有细分目的的 SKILL，对应 Agent Prompt 和 SKILL Prompt。
- 用户的主体 USER PROMPT 会成为提示词直接指挥 Agent，成为工作目标。
- 用户也可以定义自己的 SKILL，对应 USER SKILL PROMPT，在细分任务执行的时候被调用。
- 可视化的展示上面这个结构，并高亮出用户的 PROMPT
- 关键在于展示 Agent 组件的结构，以及用户 Prompt 的位置和作用。