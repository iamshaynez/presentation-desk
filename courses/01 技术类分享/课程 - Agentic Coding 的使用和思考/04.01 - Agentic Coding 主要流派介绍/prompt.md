生成一个 Infographic，白色背景，简体中文，单 HTML 实现。根据用户提供的内容要求，选择你认为最合理的布局展示方式，可以使用图标 或 inline SVG 增加可视化和结构化的观感，色彩鲜艳一些。少 JS 动态。

请按【嵌入式组件】或【卡片】风格设计，CSS 使用 h-auto 而不是 min-h-screen，确保在 iframe 中预览时不出现双重滚动条。

主题：Agentic Coding 的主要实践流派

## 调研结果：Vibe Coding 的主要实践流派完整清单

### **核心实践流派**

#### 1. **TDD (Test-Driven Development) - 测试驱动开发**
遵循 Red-Green-Refactor 循环，先编写失败的测试，再实现代码。与 Vibe Coding 的目标不同：TDD 问"这构建得对吗？"而 Vibe Coding 问"这值得构建吗？"。可以混合使用——用 Vibe Coding 快速原型，再用 TDD 保证质量。 [linkedin](https://www.linkedin.com/posts/simonfiltness_do-vibe-coding-and-tdd-mix-my-take-no-activity-7361756510323892225-6w0y)

#### 2. **SDD (Spec-Driven Development) - 规范驱动开发**
从详细的规范（PRD、技术文档）出发，规范是"单一事实来源"，代码由规范生成。包括三个阶段：设计规范 → 实现与测试 → 部署监控。相比 Vibe Coding，SDD 更加结构化，要求前置规范工作更充分，AI 可以据此生成更精准的代码。 [github](https://github.com/localden/sdd)

#### 3. **BDD (Behavior-Driven Development) + Gherkin - 行为驱动开发**
使用 Given-When-Then 的自然语言格式描述行为，业务分析师、开发者、测试员共同对齐。Gherkin 语言格式天然与提示工程配合，形成可执行的行为规范。这种"对齐的感觉"本身就是 Vibe Coding 追求的——代码、测试、需求三位一体的共振。 [linkedin](https://www.linkedin.com/posts/kirill-kolomin_vibecoding-bdd-gherkin-activity-7385270281579425792-1Ukx)

#### 4. **DDD (Domain-Driven Design) - 领域驱动设计**
通过 Ubiquitous Language（无处不在的语言）统一术语、定义 Bounded Contexts 和 Aggregates、明确不变性约束。为 AI 提供清晰的业务语义和责任边界，显著提升 AI 生成代码的质量。一个新兴的融合方法叫"**Constrained Improvisation**"：人类定义领域模型和不变性，AI 负责广度和速度（生成控制器、用例、基础设施代码），但明确禁止 AI 修改领域核心。 [speakerdeck](https://speakerdeck.com/bumptakayuki/laravel-applications-with-ddd-x-clean-architecture-x-vibe-coding)

#### 5. **ATDD (Acceptance Test-Driven Development) - 验收测试驱动开发**
由"三个朋友"（业务方、开发者、测试员）协作定义验收条件，然后编写验收测试。与 BDD 目标相同，区别在于测试规范格式。强调开发前明确定义验收标准。 [en.wikipedia](https://en.wikipedia.org/wiki/Acceptance_test-driven_development)

#### 6. **PDD (Prompt-Driven Development) - 提示驱动开发**
相比 Vibe Coding 更加结构化和方法论化。将需求分解为结构化提示序列，强调可维护性和代码质量。**关键区别**：PDD 用于生产应用（专业/教育用途），Vibe Coding 用于原型和探索性项目（玩耍和创意）。 [andrewships.substack](https://andrewships.substack.com/p/vibe-coding-vs-prompt-driven-development)

#### 7. **Vibe Testing - 体验感测试**
定义应用应该"感觉"如何（快速、流畅、安全等），AI 自动生成大量相应的测试用例。与 BDD 不同——BDD 确保业务需求满足，Vibe Testing 使用 AI 探索真实世界的用户体验。可与 BDD 结合：BDD 确保功能正确，Vibe Testing 确保体验满意。 [linkedin](https://www.linkedin.com/pulse/bdd-testing-vs-vibe-jeevan-koneti-91bvc)

#### 8. **Property-Based Testing / Property-Based Approach - 基于性质的测试**
不定义具体测试用例，而是定义系统应满足的不变性质，AI 或测试工具生成边界测试和反例。在 SDD 中与规范结合，在模板中定义"Then Property"（应满足的性质）。 [zilliz](https://zilliz.com/ai-faq/can-vibe-coding-reliably-generate-unit-tests-for-my-features)

#### 9. **Event-Driven Development / Event Sourcing - 事件驱动开发**
以事件为中心的系统架构设计。在 Vibe Coding 中的应用包括 Event Modeling（用于前期理解）和 AI 辅助的 Event Sourcing 实现。Event Storming 可用于 DDD 领域建模的前期阶段。 [alguidelines](https://alguidelines.dev/docs/vibe-coding/al-events/)

#### 10. **最小化代码审查的 Vibe Coding（原始/纯粹风格）**
最小人工审查，完全接受 AI 输出，注重快速迭代。适用于一次性项目和快速验证想法。风险包括技术债和可维护性差。 [en.wikipedia](https://en.wikipedia.org/wiki/Vibe_coding)



### **流派间的关键对比表**

| 流派 | 核心专注 | 人工介入 | 质量保证 | 最佳适用场景 |
|-----|---------|---------|--------|------------|
| Vibe Coding | 速度、创意 | 最小 | 运行时反馈 | 原型、黑客马拉松 |
| **TDD** | 正确性、设计 | 高 | 前置测试 | 生产代码、关键系统 |
| SDD | 规范清晰度 | 中-高 | 规范驱动生成 | AI 友好的需求定义 |
| **BDD** | 业务对齐 | 中 | 行为验证 | 跨职能团队协作 |
| DDD | 架构、业务逻辑 | 高 | 结构约束 | 复杂领域建模 |
| PDD | 可维护性 | 高 | 方法论流程 | 生产应用、规模化 |
| Constrained Improvisation | 平衡创新与约束 | 中-高 | 两层验证 | 快速开发 + 复杂业务 |

