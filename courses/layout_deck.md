# 设计样式要求

生成一个 Infographic，白色背景，简体中文，单 HTML 实现。左上角是页标题，下面是主要内容，这是部门汇报材料的一页，专业美观，不要额外添加信息，严格保留下面提供的信息和提供可视化，美观，专业的布局即可不要出现深色配色，选择你认为最合理的布局展示方式，可以使用图标 或 inline SVG 增加可视化和结构化的观感。

页面内容以单页宽幅一页 ppt 的16:9画幅，适配展示区域最大化。   

页脚写 `Express Company & Technology and AI Innovation`，不要其他页眉页脚了。

# PPT流式响应布局

此标准旨在使网页在嵌入 iframe 或不同尺寸容器时，能如 PPT 般等比缩放并完美适配边界。

## 目标文件

保存在指定需求文档或目标课程文件夹内的 index.html

## 核心原则 (Core Principles)

1. **容器比例 (Container Ratio)**
   - 主体容器需设为 `100vw` 宽，高度按比例计算（如 16:9 比例设为 `56.25vw`）。
   - 容器应填满视口，`body` 建议设 `overflow: hidden` 以绝非预期滚动。

2. **全量视口单位 (Full Viewport Units)**
   - 凡 `padding`, `margin`, `gap`, `border-radius`, `stroke-width` 等空间属性，统一使用 `vw` 单位。
   - 禁止在布局中使用固定 `px` 值，确保所有间距随屏幕同步缩放。

3. **弹性字体 (Flexible Typography)**
   - 所有文本必须使用 `clamp(min, preferred, max)` 函数配合 `vw`。
   - 示例：`font-size: clamp(1rem, 2.5vw, 3rem);`。确保在大屏不空旷、小屏不局促。

4. **柔性骨架 (Flexible Skeleton)**
   - 利用 `Flexbox` 或 `Grid` 进行布局。
   - 纵向分布时，重要内容区设 `flex-grow: 1` 撑开空间，页脚（Footer）设 `margin-top: auto` 确保置底。

5. **自适应图标 (Adaptive Icons)**
   - SVG 图标的宽高须设为 `vw` 单位，使其与文字比例保持一致。

---

## 示例 CSS 代码片段

```css
/* 16:9 演示容器 */
.ppt-slide {
    width: 100vw;
    height: 56.25vw;
    box-sizing: border-box;
    padding: 3vw 4vw;
    display: flex;
    flex-direction: column;
}

/* 响应式大标题 */
.main-title {
    font-size: clamp(1.8rem, 3.2vw, 4rem);
    margin-bottom: 2.5vw;
}

/* 弹性网格 */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5vw;
}

/* 自动置底的页脚 */
.footer {
    margin-top: auto;
    font-size: clamp(0.75rem, 1vw, 1.4rem);
}
```

## 例子

严格学习模仿这个例子中的布局：

- [courses\00 汇报材料\汇报 - 2025 DAS 年度总结\02 - 2025 项目类交付一览\index.html]