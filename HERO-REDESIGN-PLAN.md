# V3 首页改版｜确认方案与实施边界

状态：布局、交互方向与字体已获用户确认。首版独立 Hero 原型已实现于 index-badge.html；旧首页未覆盖、未发布。保留现有未提交代码与 Demo，不重置分支。

## 当前原型进度

- 已实现薄卡 CSS 透视、九方向人像、AI Engineer、Newsreader / Inter / 等宽标签、行业项目预览。
- 第二轮：增加黑色油墨细边框、小标签；Alibaba: Chatbot / Customer Support，ByteDance: Food Delivery / Social Media；照片右侧加入 One mind. Full loop. 与 Think. Design. Build. Ship. Iterate.。
- 工牌支持拖动旋转（水平±55°、垂直±35°）、松手回正、键盘方向键、Reset；手机默认正常滚动，先点 Rotate card 才启用卡内旋转。使用 CSS 3D 薄层，不是 Blender 网格或360°模型。
- 1440px / 390px 自动化检查通过：标签、鼠标拖动／释放、键盘旋转与重置、触摸样式模式、项目预览，无 JS 错误。真实触屏拖拽仍需设备复核。
- Talk to Agent 已按 lnkiai.com 的 Ask an AI 参考改成右下角轻量浮层：Hero入口＋浮动胶囊、四个AI入口、复制提示词、折叠问题预览，无遮罩大弹窗和URL输入表单。保留Newsreader与本网站配色，服务入口使用抽象符号＋明确名称，非官方Logo。
- 四个入口：ChatGPT、Claude、Google AI Mode、Perplexity；URL编码携带公开网站提示词。只使用 https://xyhan.com，无未发布 llms.txt、私人简历正文或预览地址。预填方式依服务支持，未实际向这些服务提交问题；登录／联网要求与复制降级在展开区说明。
- badge-agent.js / badge-agent.css 独立维护。1440/390检查通过：双入口、四个编码链接、复制降级、Escape与焦点返回、点击外部关闭，无溢出或JS错误。
- 用户要求互动角色不要照抄参考黑球：改为原创SVG小白狗，细墨线、垂耳、跟随鼠标的眼睛、眨眼、hover歪头抬耳、按压反馈。减少动态效果模式关闭动画。
- 桌面hover临时打开说明层，移入浮层保留，移出260ms关闭；点击固定，再点击／Escape关闭；hover不抢焦点。服务入口有title名称提示。复制操作固定浮层以便读取反馈。
- 新检查通过：鼠标hover/跨入面板/离开/点击固定/Escape、390px触屏点击开关、无横向溢出、reduced-motion禁用眨眼。

### Superseded experiment — classic centered badge
- User rejected this internal re-layout: restore original left portrait + right manifesto/loop with AI-NATIVE / 001. Remove only era copy as previously requested; preserve left-aligned name, outlined industry tags and footer slogan/barcode. Keep the new inline résumé entry, logos, no hover preview, single floating AI entry and outer drop/settle animation. 390/1440 checks passed for restored split layout and inline résumé loading.
- The following centered-layout notes describe the superseded experiment, not the current design:
- Remove the right-hand manifesto/loop/era copy; keep AI-NATIVE / 001 centered above the portrait.
- Name, portrait, title and barcode centered. Résumé document button lives beside the name and invokes the original printer flow.
- Remove standalone Hero buttons including Talk to Agent. The dog Ask an AI FAB is the only AI entry; agent code tolerates no Hero trigger.
- Experience rows use locally served transparent Alibaba symbol / TikTok mark (the latter explicitly approved as a ByteDance substitute). Sources and derivative details: assets/brand/README.md. Employer text remains ByteDance, not TikTok.
- No experience hover preview. Rows link directly to published case studies, with no animation/color change on hover.
- 1.25s subtle drop/settle animation on the outer perspective wrapper, independent of the draggable card transform; disabled for reduced motion.
- No Rotate/Reset/help copy. Mouse drag and horizontal touch rotation remain; vertical touch scrolls. Fixed bubbled lostpointercapture from portrait interrupting mobile drags.
- 1440/390/320 checks passed for logos, no overflow/JS errors, single AI entry and inline résumé loading. Reduced-motion entrance and touch rotation/release checks passed separately. No publication or canonical-site edits.
- View Résumé 已连接页尾，进入视野时加载 index-resume-embed.html，隔离复用现有打印状态机；隐藏 Demo 头尾和重复介绍，保留自动打印、阅读、撕纸与下载。
- 公司目前是文字占位，不是正式 Logo；需补经核实的品牌资产。
- 作品区已实现：读取16项 gallery.json 项目，按话题归类、缩略图随滚动收拢到 Index 行、同一批 DOM 在 My Journey 时间线重排、章节导航高亮；Chatbot 在话题视图优先。项目链接指向已发布主站，未复制案例页面。
- 时间线日期依据项目日期，不冒充任职日期；包含 Foundations / Alibaba / ByteDance / Independent & Study，独立内容和 UTS 学习有时间重叠，文案已明示。
- 完整首页测试：1440 / 390 布局、16项目、4章节、快速切换、无横向溢出、打印ready、阅读弹层、Agent URL和复制降级通过，无JS错误。另通过 reduced-motion 和实际PDF下载请求测试。截图审阅修正了旧占位链接CSS覆盖Index行布局的问题。
- 测试：1440px / 390px 无横向溢出，弹层、URL 校验、项目预览、打印区加载通过；JS 语法检查通过。未将这些检查等同于完整移动端手势与所有打印边界验收。
- 新增 index-badge.html、style/badge-hero.css、style/badge-ink.css、js/badge-hero.js、assets/hero-portrait/；完整首页另有 js/badge-work.js、style/badge-work.css、index-resume-embed.html、style/resume-embedded.css。原首页、原打印 Demo 保持不变；尚未发布。

## 1. 页面结构

三个视觉主体：工牌 Hero → Selected Work → Résumé & Contact 打印区 → Footer。

Hero 包含两个操作：Talk to Agent 打开提示词弹层；View Résumé 滚动到页面底部打印区。不要新增第四个竞争注意力的视觉主体。

## 2. 视觉系统（已确认）

- Elegant、极简、编辑式排版；不是手写风。
- 保留当前 Newsreader 衬线字体，用于标题、姓名、Journey 阶段标题。
- 保留 Inter，用于正文、项目叙述、操作按钮。
- 工牌编号、年份和简短行业标签使用 ui-monospace / SFMono-Regular。
- 借鉴九方向人像 Demo 的留白、轻盈层级与克制灰色，不直接更换为该 Demo 的 Georgia。
- 暖白页面、白色薄卡、墨黑文字、细边线与轻阴影；不采用重拟物或厚塑料盒。

## 3. Hero｜薄工牌与身份

### 卡面

- 真人照片位于左上角；姓名、职业 title、AI-native 信息构成清晰层级。
- 行业经验比大厂身份更重要：Alibaba Logo + Chatbot；ByteDance Logo + Food Delivery。
- Logo 是过去经历的标识，不冒充现任雇员工牌；配轻量 Previously at 说明。
- 行业标签悬停／键盘聚焦时，在卡旁出现对应项目图片；点击进入案例。触屏提供显式点击方式，不依赖 hover。
- 职业 title 已由用户确认：AI Engineer。卡面使用该准确文字，不添加 AX 或 UX 前缀。

### 交互

- 复用九方向照片，根据鼠标相对照片中心的位置切换；整卡仅轻微倾斜。
- 现有素材：/Users/han/.pi/tmp/2026-09-06/cursor-avatar/assets/。
- 原逻辑参考：同目录 app.js，包含中心死区、边界迟滞、方向键与 reduced-motion。
- 实现时将所需素材复制进本 worktree 的独立 assets 子目录，不在正式页面依赖临时目录。
- 手机保持纵向滚动优先，禁止照搬 Demo 整区 touch-action:none；交互需在卡内显式操作或仅对水平拖动响应。

### 3D 技术建议（待原型验证）

- Blender 可用于薄卡、微倒角和简单夹扣，约1mm卡厚比例仅为起始建议。
- 人像切换必须保留网页实时交互，不烘焙成视频。
- 先验证轻量 CSS 透视卡体与可访问文字，再判断是否需要 Blender 导出 glTF；避免仅为薄卡引入高加载成本。
- 不新增复杂挂绳物理作为首版要求。

## 4. Selected Work｜同一批作品的两种叙事

### 默认 By Topic

- 从 Hero 下滚后，作品缩略图沿克制、可追踪的轨迹出现、缩小并收拢。
- 同一张缩略图最终归位到对应 Index 行左侧，不做“旧图掉走／新网格淡入”的视觉替身。
- 布局：左侧小图，右侧项目名、一句问题或贡献、领域／角色／年份。
- 按领域组织，优先突出 Chatbot；其余分组根据真实项目数据确定。
- 不提供 Gallery 模式；不是纯图片大网格。

### 切换 My Journey

- 按钮：By Topic / My Journey。
- 点击后旧分组标题淡出，原图片脱离行位、沿路径移动到时间线位置，阶段标题与叙述随后进入。
- 不是随机打乱。每张图有稳定项目 ID，用户能追踪同一作品的去向。
- 叙事阶段：Parsons → Alibaba → ByteDance → Independent；日期与真实归属实现前核验，不臆造履历或影响指标。
- 每阶段一句说明＋少量代表作品，自然滚动触发阶段高亮；不劫持滚轮。
- 切回 By Topic 时同一批作品重新归类。

### 数据与实现

- 复用已有项目内容；为两种展示维护一份稳定 ID 的映射，不复制两套项目事实。
- content/gallery.json 中有项目地址；js/scrollcarousel-data.js 仅含现有主题展示字段。先核对一致性，不凭标题推测 URL。
- 可用 FLIP / Web Animations API 实现重排，滚动登场以区块相对进度控制。
- 原 js/scrollcarousel-app.js 以全局 scrollY 和视口阈值切换 is-past，且图片掉出后另起网格；不能直接搬到新结构。
- 现有网格创建 article/img/title/meta，没有项目链接，需补真实链接与键盘入口。

## 5. Résumé & Contact｜页面内打印

- 位置：Footer 上方，打印机与联系信息并列。
- Hero View Résumé → 平滑滚动到此区 → 确认区块可见且简历图片加载后 → 自动打印。
- 自然浏览进入此区也可首次触发，页面会话内只自动打印一次；重复点击提供明确重播，不叠加动画。
- 自动打印不自动下载；点击下载或完成撕纸才请求保存 PDF。
- 保留放大阅读、下载按钮、可选撕纸与小手引导。
- Demo：index-boarding-pass.html、js/boarding-pass.js、style/boarding-pass.css。
- 当前 Demo 在图片就绪后自动打印；集成时需改为可见性／导航触发，不能在 Hero 尚可见时提前打印。
- Hero 旧弹窗打印入口、终端 Contact Demo 保留历史文件，但新首页不同时展示两套竞争流程。

## 6. Talk to Agent｜提示词弹层

- 保留当前页面和滚动位置，打开含说明、完整提示词预览、复制按钮的弹层。
- 明确这是“复制给你自己的 AI”，不是实时聊天服务。
- 提示词包含实际公开网站 URL，请 AI 总结项目／能力、附来源、结合用户提供的 JD 分析匹配；无法读取时明确失败，不猜测。
- 正式域名待核对，不能复制 worktree 或 Tailscale 私有预览地址给外部 Agent。
- Clipboard API 在部分普通 HTTP 环境不可用：提供可选择文本与手动复制降级；复制失败不能显示成功。
- Escape 关闭、焦点约束与返回触发按钮、手机长文本阅读必须支持。

## 7. 分阶段实施与验收

1. 独立原型：薄白工牌＋九方向照片＋Newsreader 字体＋按钮布局；使用已确认的 AI Engineer title，核对照片裁切。
2. 作品编排：真实项目链接、By Topic／My Journey 数据映射、滚动归位与切换动画。
3. 功能串联：Agent 提示词弹层、页尾打印区、View Résumé 导航与打印状态机。
4. 质量检查：桌面、手机、键盘、reduced-motion、图片失败、复制失败、重复点击、快速滚动和切换。
5. 视频取材：Hero 交互 → 缩略图归位 → Journey 重排 → 打印简历 → Agent 复制演示；未验证访问／面试事实不写入页面。

动画验收：没有相互重叠的全局监听或两套争抢 transform；快速切换后布局与内容正确；手机正常滚动； reduced-motion 下直接呈现清晰内容；不可访问的资源不阻断项目与简历阅读。

## 8. 本次不做

不改已发布 personalwebsite；不移动、删除或重置任何 worktree；不覆盖现有未提交 Demo；不生成／上传私人照片；不将计划记作已完成实现。
