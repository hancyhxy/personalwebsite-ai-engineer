# Getty 场景研究与 Badge 作品集重构方案

日期：2026-09-09  
状态：核心重构已实施并切换到 `index-badge.html`（2026-09-09）。独立预览验证后已归档；旧引擎不再加载。展示层现已按用户决定改为三组总览（4/4/3 精选＋5 归档），不再逐项目停留；下文原始阅读层方案仅作历史设计依据，现行契约以 `FEATURES.md` 为准。执行结果见 [`SCENE-REBUILD-RESULTS.md`](SCENE-REBUILD-RESULTS.md)。下文保留调研与设计依据，区分「源码事实」「浏览器观察」「我们的设计决策」。

## 结论

**重构沉浸式展示引擎，不重做整站。**

采用 Getty 的核心方式：固定视口舞台、透视相机、分深度图片拼贴、滚动编排时间线、独立 HTML 主图与叙述、弹簧相机跟随。停止在现有「正交相机＋按屏高纵向排图＋整列上移」模型上叠加补丁。

这不是换一组 easing，也不是给旧容器加鼠标 translate。框架不必迁到 Nuxt/Vue；需要迁移的是渲染、坐标、滚动与叙事模型。

## 1. 已明确的目标效果

### 1.1 开场与身份场景

- 初始 `Xinyi Han` 小字居中，sin 展开过程中移到最终页眉位置。
- `AI — 紧凑 sin 图片组 — Engineer` 整体居中，图片相互重叠、文字不被遮挡。
- 真实项目封面全程 16:9；不恢复原站的 2:1 展示框。
- 完整组合停留至少 1.3 秒。
- 散开时位置和大小同步到位；不允许落位之后再放大。
- 徽章仍是第一幕中央主体，保留九方向肖像、克制倾斜、透明卡套、键盘与简历入口。
- 左右项目图不要贴边，保留目前已确认的向内收拢方向。

### 1.2 Selected Work 是移动焦点的连续空间

- 明确三组：UX Designer → Independent Work → Parsons School。
- 当前组所有真实作品为原色、100% 不透明，而非只有中央一张清楚。
- 前后组在空间中继续存在，降低透明度；切组时不整组清空、不整屏翻页。
- 上一张／上一组在交界处仍能辨认；不是滚动一点就完全刷掉。
- 真实作品总量保持 16 个，不用无限复制可点击作品制造密度。
- 浅灰空白矩形是独立装饰层，不能用洗白真实作品代替。
- 鼠标移动带来平滑的相机视差；图片 hover 是另外一层局部反馈。
- 密度来自空间布局、前后组共存与装饰层，而不是单纯增加项目。

### 1.3 内容与阅读

- 移除可见 `01 / 03` 章节序号，保留有名称的可访问章节导航。
- 章节使用「设计身份／方向＋独立关键词＋具体叙述」。
- 当前主图下方有项目名称、公司／已确认角色、简短项目描述。
- 章节叙述与项目叙述分开，不再把泛泛职业口号一直悬在主图上方。
- 阅读中的主图和文字稳定；不能因为鼠标轻移而难以阅读。
- 不引入 Getty 的全屏作品放大作为详情过渡：我们原有卡片到详情 Hero 的几何约定仍然有效。

## 2. 调研范围与可信度

### 已完成

1. 获取当前公开页面、JS 分包与 CSS，识别组件及调用关系。
2. 检查 renderer、Scene、相机弹簧、Lenis、ScrollTrigger、Collage、CollageImage、AssetZoom、FeaturedAsset、BlankCanvases。
3. 用独立无登录 Chrome headless 会话打开线上 Getty，1440 × 1000 视口，验证开场、鼠标运动和多个滚动位置。
4. 在临时浏览器内对 renderer 实例加只读记录，采样实际渲染用的相机与 mesh 世界坐标；不是读取无关的 `window.camera` 后推断。
5. 对照本项目实际加载脚本、数据、CSS、项目预览与详情入口。

### 不夸大的边界

- 得到的是部署后的压缩产物，不是 Getty 的原始开发仓库或全部设计规范。
- Headless 使用 SwiftShader，不代表真实 GPU 帧率；未声称「实测达到 60fps」。
- 本轮未完成 Getty 全站所有分支与触屏设备动态验证。
- `BlankCanvases` 确实存在，但它在后面的章节使用；不能说截图中每个浅灰矩形都来自它。早期 collage 也会把深层真实图片混到接近浅灰。
- Getty 的图片淡化主要包含 shader 颜色混合与深度因素，不等于简单 CSS opacity；我们「当前组原色、其他组降透明度」是用户明确的产品规则。
- Getty 并没有与我们的 UX／Independent／Parsons 相同的三组规则，不能机械复制它的章节数据。

### 浏览器证据

同一次会话、1440 × 1000 视口：

| 输入 | 实际场景相机位置，约值 | 观察 |
| --- | --- | --- |
| 鼠标中心 | `(0, 0, 4.98)` | 透视相机，FOV 45° |
| 鼠标右上 `(1200,250)` | `(0.164, 0.123, 4.98)` | 图片世界坐标未改变，相机产生偏移 |
| 鼠标左下 `(240,750)` | `(-0.163,-0.122,4.98)` | 偏移随指针方向反转 |
| 滚动约 1000px | `(-0.167,-0.125,4.035)` | 相机 Z 向 4 靠近，拼贴 Y 同时变化 |
| 滚动约 1800px | `(-0.167,-0.125,4)` | 中央作品与图下说明出现 |
| 滚动 2200 → 3500px | 相机 Z 保持 4 | 图下说明 top 约保持 590px，而背景图片继续向上流动 |

因此：**鼠标主要驱动相机；滚动同时编排相机、拼贴及 HTML 阅读层，三者不是同一条平移。**

临时证据目录：`~/.pi/tmp/2026-09-09/getty-scene-research/`。
主要记录：`runtime-probe.json`、`browser-observations.json`、`getty-scrolled.png`、`getty-focus-2200.png`。

## 3. Getty 的真实结构

### 3.1 渲染与生命周期

`Renderer` 提供一个 WebGLRenderer，`autoClear=false`，注册各场景的 render 回调。公开页面实测只有一个 canvas。

`Scene` 拥有本场景的透视相机，并通过共享 renderer 绘制：

1. 正交背景层。
2. 透视场景。
3. 清深度后绘制正交前景层。

页面有固定舞台 `.fillFixed` 和长的滚动占位；章节按区间激活，不是三个普通 DOM 区块带着全部内容向上滚。

**重要：连续空间感不代表所有章节必须共享一个物理 Scene。** Getty 本身有独立章节场景；连续性来自同一视口、协调时间线、相机与前景／背景组合。

### 3.2 滚动系统

- Lenis 提供平滑滚动状态，并在 GSAP ticker 中更新。
- ScrollTrigger 通过 scrollerProxy / update 与其连接。
- 各章节声明 start/end 和 GSAP timeline；滚动驱动动画进度。
- 全局配置实际覆盖基础 duration：桌面为 1.5，手持判断为 2.5。这是 Getty 参数，不直接照搬到我们的触屏交互。
- 场景渲染另外有共享 RAF dispatcher。不要声称它整站所有任务只有一个 RAF。
- Intro 是时间驱动；进入叙事后是滚动驱动。两者的交接是明确生命周期，不是到处 setTimeout。

### 3.3 相机跟随与 hover 是两个系统

相机：FOV 45°；常见 Z 5，第一章节滚动变为 4。归一化鼠标位置映射到 X/Y；部分场景 motion `.25`，第三场景 `.5`。

弹簧：stiffness 100、damping 30、mass 默认 1；根据 delta 更新速度、位置，并在页面隐藏时停止更新。移动相机而不是给每张图单独编造 translate。

hover：命中的可交互图片 scale `1 → 1.1`，约 `.5s`；rollover 色彩恢复约 `.2s`，提高 renderOrder、临时关闭 depthTest。部分深层图片不注册交互。

快速滚动期间它还会抑制 hover；我们的实现只应暂停作品 hover，不照搬全页 `pointer-events:none`，以免影响 Ask AI、键盘和其他控件。

### 3.4 Collage：有深度的可控图片场

第一章节例子：桌面 3 列 × 25 行 × 2 深度层；X/Y/Z 间距约 2.8 / 1.3 / 1。尺寸有范围，行列错位。

每张图片有 grid pose、wave pose、offset、depth、scale、interaction state。sin 到拼贴的动画同时推进位置插值和 scale。

中心用 `repelPosition / repelRadius` 将图片排开，为主叙述和作品留阅读区。深度也参与材质淡化。

第二章节使用不同配置，约 6 × 4 × 2；Y 通过模运算循环，配合 scroll velocity 调整排开强度。这不是第一章节所有图片都循环，不能把两者混为一个算法。

### 3.5 材质与空白矩形

`uDimmed`：原图与较浅颜色混合；`vDepthFactor`：世界 Z 映射到前后层；`uRolloverPr`：hover 恢复原图。

`BlankCanvases`：独立实例化几何，使用位置／尺寸／比例 attributes；shader 绘制矩形轮廓，根据深度改变 alpha，主要用于后续场景。不是加载失败的图片。

### 3.6 中央作品与叙述层

早期 Still Life 的大图／图下说明使用 `AssetZoom`＋`ImageCredits`；其后也有 `FeaturedAsset`＋`AssetTransaction`。

- 真实 HTML 图片与可选择文字。
- Credits 在图片父级下方 `top:100%`，不是 canvas 文本。
- 主图、标题、正文有独立 timeline 段；背景仍可继续流动。
- 一些作品内部有大图放大阅读，但这不属于我们此次要照搬的详情过渡。

## 4. 我们当前模型的结构性差异

| 方面 | 当前实现 | 重构要求 |
| --- | --- | --- |
| 相机 | OrthographicCamera，按像素设投影 | PerspectiveCamera，世界空间＋投影几何 |
| 滚动 | `field.position.y = smoothScroll + velocity * .42` | 时间线分别控制拼贴位移、相机与阅读层 |
| 深度 | ghost 放在负 Z，但正交投影无透视大小差 | 真实 Z 深度与相机移动共同产生视差 |
| 聚焦 | 只有 `role === main` 计算 scrollFocus | 组状态与项目阅读焦点分开 |
| 三组内容 | canonical data 有 section，布局又重复一份 | canonical section 唯一归属来源 |
| 空间密度 | 长坐标表＋淡化项目复制图 | 受控簇布局＋持续前后组＋独立灰矩形 |
| 淡化 | Shader 默认洗白，外面还有白色径向遮罩 | 当前组源色；移除盖在作品上的白色遮罩 |
| 主图说明 | 没有图下阅读层；只有点击后的 panel | 独立 HTML 主图／标题／说明结构 |
| hover | pointermove 时 raycast、单图放大 | 活跃相机更新后 raycast，与滚动状态协调 |
| 几何 | 手算屏幕矩形，假设无相机位移／透视 | 世界四角投影到屏幕的唯一 bounds API |
| 开场 | 同一个真实项目还有 hero duplicate，结束时换显示身份 | 明确同项目 visual instance 与连续几何交接 |

补充：`style/badge-scroll-stage.css` 在舞台上覆盖中心 `.65` 白色渐变。因此即使材质 alpha=1，图片仍可能发白。只改 JS 的 opacity 无法解决。

`js/badge-hero.js` 同时包含徽章交互、打印简历桥接和身份文案打字。**不能把它作为“旧场景脚本”整段重写。**

## 5. 重构后的确定架构

### 5.1 技术选择

- 保留原生 HTML/CSS/JS，不引入 Nuxt、Vue 或项目构建链。
- 保留 Three.js 与 GSAP 技术路线。
- 采用有版本锁定的 Lenis＋兼容 GSAP 的 ScrollTrigger，统一滚动桥接；新依赖本地 vendoring，保留许可证，不直接引用 Getty 的打包产物。
- Three.js r125 的 API 可支持透视、投影与 InstancedMesh；先不为“像 Getty”而全站升级。颜色空间使用本版本正确实现，不能直接粘贴新版 shader chunks。
- 新场景只挂在 Badge 入口；不更改其他主题的渲染系统。

### 5.2 舞台结构

```text
正常页面滚动／章节锚点
  └─ ScrollDriver → NarrativeState
       ├─ CameraRig（镜头基础位姿＋指针弹簧偏移）
       ├─ CollageField（真实作品＋前后组）
       ├─ BlankField（纯装饰矩形）
       ├─ FeaturedLayer（HTML 主图＋图下说明）
       └─ NarrativeLayer（关键词＋章节／项目叙述）

固定 UI：页眉、导航、Ask AI
普通文档流：View Static、简历、footer
```

渲染侧：一个 renderer / canvas；一个持久的 Portfolio Scene 保存作品身份与纹理；Opening、Identity、Work 为同一 Scene 上的阶段控制器。三组 Work 是 group 节点，不是三个必须卸载的 Scene。

这是对 Getty Scene/Collage 模式的有意适配：我们要求三组交界时继续共存，且开场必须连续落到徽章场景，因此不机械复制 Getty 独立章节的销毁方式。**仍使用相同的透视、深度、时间线、HTML 叙事模型，不退回正交假视差。**

正交背景／前景 pass 保留明确扩展位；首版如果没有需要正交绘制的 WebGL 元素，就不用创建空 pass。HTML UI 不伪装成 3D。

### 5.3 一个状态来源，明确谁控制什么

`NarrativeState` 至少包含：

- phase：opening / identity / work / exit。
- scrollProgress、chapterProgress、projectProgress。
- activeGroupId、focusedProjectId。
- groupPresence、groupOpacity。
- cameraBasePose、collageTravel、readingPose。
- hoverProjectId、interactionPaused、reducedMotion。

规则：

1. 滚动进度决定叙事的可逆状态；不靠一串不可逆事件增减透明度。
2. 相机基础位姿由 timeline 决定；鼠标偏移由弹簧叠加，两者不争写同一个属性。
3. 组状态控制可读性；项目焦点控制主图与说明；hover 只能暂时突出目标，不能悄悄换组。
4. 同一个时间步更新 scene、DOM 与 hit testing；不让 DOM 读原始 scrollY、canvas 读另一套滞后 scrollY。
5. resize 后保留章节／项目的归一化进度，再重新求几何，不重播开场。

### 5.4 世界坐标与阅读区

- 透视相机 FOV 45°作为起点，camera Z 在约 4–5 的尺度内定义。
- 固定世界单位，不再把 `innerHeight` 乘到每张图片的 Y 当长期世界坐标。
- 指定相机前距离 d 的可见高度为 `2*d*tan(fov/2)`，宽度由 aspect 得到。
- 用相机投影把主阅读区、页眉、徽章与文字区换成占位约束。
- 真实作品采用可复现的布局；随机只用于受种子控制的装饰层。禁止每次刷新随机把真实作品盖住。
- 主阅读区稳定、两侧簇向内；只装饰层和过渡中的历史图允许轻微重叠。
- 当前组 1 张主图＋2–4 张附近项目为桌面目标，不是硬塞所有 8 个 Parsons 项目进一屏。
- 手机版以主图与说明优先，侧图数量与灰矩形数量降级，不改变项目归属。

### 5.5 三组状态与连续性

稳定阅读段：当前组 alpha=1、源色输出；非当前组先以 alpha≈.18–.30 起调。这个区间是我们的候选值，不是 Getty 的原值。

组交界：

- 用同一局部进度把 incoming 从背景态带到 1、outgoing 从 1 带回背景态。
- 同时连续移动镜头／拼贴少量距离，让上一组部分作品保持在视口邻近位置。
- 不销毁、不闪切、不把前后组强制 `display:none`。
- 名称导航激活点有轻微迟滞，避免临界位置闪烁；动画本身仍连续可逆。
- 非当前组淡化不是删除交互内容；静态索引始终覆盖全部 16 个项目。
- 深层历史实例默认不抢点击；若有可见的可交互历史项目，hover 可恢复可读性，但不改 canonical activeGroup。

真实作品不做无限循环回收。只允许灰矩形／不可交互背景代理在完全离开视口后回收；避免同一真实作品上下各出现一个可点击副本。

### 5.6 中央主图的 HTML / WebGL 交接

采用 Getty 的混合方式，不把正文画进 WebGL：

1. 图在拼贴中时是 mesh；聚焦进入阅读位时取得其世界四角的屏幕投影矩形。
2. 预解码的 HTML `<figure>` 在同一矩形承接，图片仍为 16:9、同一裁切。
3. HTML 承接后该项目 mesh 隐藏，不能双图叠加导致变亮或鬼影。
4. figure 到阅读位的变化由同一 projectProgress 完成；图下 caption 属于同一 DOM 组件。
5. 阅读稳定时，主图／说明不跟随背景相机摇摆；周围图片持续细微视差，体现前景阅读与背景空间的区别。
6. 离开阅读位时按目标投影几何交还 mesh，回到下一组旁边的低强调状态；反向滚动沿同一函数逆行。

主图 handoff 是重构必须先证明的技术点，不留到最后用 crossfade 掩盖几何不一致。可用投影逆算匹配 HTML 目标矩形，再切换绘制拥有者。

### 5.7 开场交接

- 开场到身份阶段继续由时间线驱动，进入 Work 后由滚动驱动。
- 开场／徽章／Work 共享 projectId 与纹理缓存；visual instance 可以不同，但由登记表明确拥有者。
- hero 的三张项目图必须在 intro 结束前达到最终屏幕位置与大小。
- 相机跟随权重在开场为 0，落位后平滑开启，不能突然引入偏移。
- Skip、Escape、reduced motion、超时、纹理失败统一调用 `settleIdentity()`，恢复正常滚动。
- 删除现有 pending 7 秒 gate 与 opening 9 秒 watchdog 各自决定显示状态的多头逻辑，改为一个生命周期管理器。
- 不因切换阶段重建纹理或重新随机布局。

### 5.8 相机、点击与详情

- 采用 dt 驱动弹簧，初值可参考 stiffness 100 / damping 30，限制过大 dt。
- 鼠标离开、窗口失焦时回到中性；触屏与 reduced motion 不启用指针相机偏移。
- 高频滚动暂缓 hover，稳定后重新 raycast；不全页禁止点击。
- 每次相机／mesh 更新后更新矩阵与 raycast，避免指针没动但图片移动导致命中陈旧。
- 项目链接优先原生 `<a>` 语义；canvas 点击、HTML 主图、键盘均调用同一 ProjectInteraction。
- 详情过渡必须在点击／Enter 当下重新读取可见实例的投影 bounds，不使用打开 panel 时缓存的旧矩形。
- 首页与详情共享 HeroGeometry；保持一次变到目标 Hero，不满屏 overshoot，不到页面后再缩一次。
- 现有 stacked / two-column 模板、真实项目链接、简历打印状态机不重写。

### 5.9 普通文档流与可访问性

- 只给沉浸区配置 narrative spacer，不把简历和 footer 固定到 canvas 上。
- 到 View Static 退出区时舞台与命中区域一起退出；普通页面继续自然滚动。
- 锚点、键盘 PageDown/Home/End、返回恢复走同一个 ScrollDriver。
- 简历 iframe 保留原有由父页面控制高度和滚动的方式。
- 不接管触屏纵向手势做 3D 拖拽；Lenis 关闭触屏模拟，采用原生滚动状态驱动 timeline。
- reduced motion / WebGL 初始化失败 / context lost 均落到三组可读 HTML 项目内容，不能只有空白标题。View Static 仍可用。
- Tab 顺序不随相机位置乱变；隐藏的 figure 不能留在 tab 序列。

## 6. 三组内容与文案边界

现有 `SCROLLCAROUSEL_PROJECTS.section` 已明确分好 4 / 4 / 8，不再靠坐标猜：

- UX：Rider Dispatch、Content-Driven Food Delivery、Alibaba Help Center、Customer Service AI Workspace。
- Independent：Claude Code ↔ Figma、Virtual Drum Kit、FriendUp、KOL Growth Strategy。
- Parsons：My Friends、Museum Game、Food Memory、Oscars、Museum Kit、Solar System、Farmer Coffee、Global 1M Audition。

注意：第三组包含 company 为 Independent、Farmer Coffee、musical.ly 的项目。它是当前约定的创作阶段分组，不应写成全部由 Parsons 委托或在校课程。

文案方向（草案，非新增履历事实）：

- UX Designer：`Platform Systems · Complex Workflows · Global Experiences`。叙述围绕 Alibaba / ByteDance 的平台系统、运营流程、客服与跨市场一致性。
- Independent Work：`AI Prototyping · Interactive Products · Content Practice`。叙述个人／学习／内容实践中的设计到实现。
- Parsons School：`Interaction · Physical Experiences · Visual Storytelling`。叙述这一阶段的空间、实体交互、数据与视觉探索。

项目 caption 先用现有 title/company/summary。Role、成果数据必须从案例文案确认，不根据截图编造。

## 7. 模块边界与迁移范围

建议新模块按职责拆分，不继续增大旧 `badge-webgl.js`：

| 模块 | 唯一职责 |
| --- | --- |
| `badge-scene-config.js` | 三组布局／叙事节拍／调参，不复制项目内容 |
| `badge-scene-runtime.js` | renderer、scene、资源生命周期、统一帧更新 |
| `badge-scene-scroll.js` | Lenis／ScrollTrigger、锚点、归一化 narrative 状态 |
| `badge-scene-camera.js` | 透视相机、弹簧、坐标与投影几何 |
| `badge-scene-field.js` | 作品实例、组状态、布局与材质 |
| `badge-scene-background.js` | 独立灰矩形、实例化、回收与密度 |
| `badge-scene-reading.js` | HTML figure、关键词／说明、mesh handoff |
| `badge-scene-interaction.js` | raycast、键盘、preview、详情几何交接 |
| `badge-opening.js` | 接入新状态／几何 API，保留已确认开场节奏 |

保留 `badge-hero.js`、`badge-work.js`、`badge-agent.js`、`badge-footer.js` 的模块边界。必要的滚动调用通过 adapter 接入，不能顺手改打印或 AI 功能。

迁移后移除 Badge 入口对旧 `badge-webgl.js`、旧 `badge-scroll-stage.js` 的加载；其他入口若有引用先核对，不无差别删除文件。旧层的白色遮罩、重复位置公式、重复滚动监听不能残留。

上一轮新增、尚未被消费的 `window.BADGE_WORK_GROUP` 属于未完成尝试；不作为新架构基础，正式迁移时由统一 NarrativeState 取代。

## 8. 实施顺序与阶段门槛

### 阶段 A：建立基线与最小架构验证

1. 保存当前可运行版本的文件快照与关键截图，不覆盖用户未提交更改。
2. 在同仓独立预览入口接入新引擎，旧 Badge 入口暂不切换。
3. 用 3 张真实图片＋灰矩形验证透视、镜头跟随、滚动与静止阅读层。
4. 先证明 mesh ↔ HTML 主图交接、前后组共存、反向滚动可逆。
5. 通过屏幕几何验收后再迁入所有作品；不先花时间调字体掩盖模型问题。

### 阶段 B：完整叙事

1. 接入 16 个项目和 3 个组，按项目数量配置阅读节拍，不强迫三组等长。
2. 去掉 `01 / 03`，接入关键词、章节叙述与图下 caption。
3. 接回 compact sin → identity → Work，同一几何系统同步到位。
4. 接回 preview、详情、静态索引、简历与 Ask AI。
5. 完成桌面／手机／低动态／失败分支验证后，切换正式 Badge 入口并停用旧驱动。

这是一条重构路线，不是新旧引擎长期共存。独立预览仅用于安全验证；正式切换后每种属性只能有一个控制者。

## 9. 可检验的验收标准

### 视觉与连续性

- 同一源封面在活跃组阅读态为原色、alpha=1；没有 CSS 白幕或 shader 洗白叠在上面。
- 横向鼠标采样时非 hover 图片世界坐标保持不变、相机移动，近层屏幕位移大于远层。
- 主图阅读稳定段滚动时，图下 caption 保持可读，背景仍连续流动。
- 在两组交界的若干固定进度帧，前后组同时可见；没有空白帧和整屏清除。
- 同样的 scrollProgress 正向／反向到达时，除自然弹簧余量外布局一致，不重新随机。
- 图片全程 16:9。开场终点和身份场景起点 bounds 误差目标 ≤1 CSS px；不出现位置先到、大小后到。
- mesh / HTML 交接误差目标 ≤1 CSS px；无双图、无变亮、无边缘跳动。
- 同屏主项目／相关项目无相互遮挡，正文不被灰矩形或假背景穿过。

### 交互与内容

- 所有 16 个项目都有可访问入口，三组 membership 与 canonical data 一致。
- 当前组原色；前后组低强调；hover 不改变组归属。
- 非交互灰矩形完全不参与 raycast／cursor／Tab。
- 键盘、触屏、跳过、缩放窗口、返回页面、从中间锚点进入都能到达等价内容。
- 快速滚动不会跳出错项目预览；点击矩形来自当前帧投影。
- 至少一个 stacked 与一个 two-column 项目验证整条详情进入路径。
- 简历读／重播／拖纸／保存／下载与 Ask AI 三 provider 行为不回退。

### 性能与失败恢复

- renderer／纹理只初始化一次；离开沉浸区或页面隐藏时暂停无用更新。
- 纹理共享、灰矩形实例化、可见性裁剪；不沿用 Getty 数百张图片的数量。
- 不在每个 mesh 每帧读取 computed style／DOM bounds；resize 和字体完成时批量测量。
- 桌面目标 60fps，触屏优先稳定；需在真实设备测量，headless 不作为性能结论。
- WebGL 失败／丢失、图片加载失败、reduced motion 都显示可读 HTML；不会遗留 overflow 锁。
- JS 语法、diff check、自动化几何／状态测试、浏览器 console 与 screenshots 全部检查。

## 10. 与 FEATURES.md 的关系

实施时已同步 `FEATURES.md` 中被用户改变的产品决定：

- 去掉 `01 / 03` 与旧的固定短句。
- 从「只有中央项目恢复颜色」改为「当前整组原色」。
- 将纯灰矩形与历史项目淡化分为两类。
- 允许稳定主图阅读态与背景独立运动，而不是强制始终按当前屏幕最近的 main mesh 决定一切。
- 保留 16:9、sin 停留、位置大小同步、徽章交互、项目详情 Hero、简历、静态索引和 Ask AI 锁定行为。

## 11. 源码索引

以下为 2026-09-09 获取的公开部署文件；文件 hash 名未来可能变化。

- [线上页面](https://www.getty.edu/tracingart/)
- [Renderer](https://www.getty.edu/tracingart/_nuxt/VbIHlcLE.js)：共享 renderer、perspective / ortho camera、render registry。
- [Scene / spring / image material / hover](https://www.getty.edu/tracingart/_nuxt/BQjU4dwZ.js)：`Scene`、`stiffness:100,damping:30`、`cameraMotion`、`uDimmed`、`uRolloverPr`。
- [初始 Collage / AssetZoom / ImageCredits / FeaturedAsset](https://www.getty.edu/tracingart/_nuxt/BGfcuG2n.js)：sin／grid、图下说明、HTML 图文时间线。
- [第二章节循环 Collage](https://www.getty.edu/tracingart/_nuxt/CAExIIT3.js)：wrapped Y、6×4×2、repelScrollStr。
- [章节时间线 / BlankCanvases](https://www.getty.edu/tracingart/_nuxt/BBSPXiNi.js)：Section1/2/3、zoomInGridPr、BlankCanvases shader。
- [Lenis / GSAP providers](https://www.getty.edu/tracingart/_nuxt/DPLBeim1.js)：`SmoothScrollLenis`、scrollerProxy、全局 options override。
- [固定舞台页面](https://www.getty.edu/tracingart/_nuxt/0DoWyssW.js)：scroll spacer、fillFixed、章节 anchors。
- [共享 RAF dispatcher](https://www.getty.edu/tracingart/_nuxt/CDY68bNc.js)。
- [CSS](https://www.getty.edu/tracingart/_nuxt/style.BLbxF1pr.css)：fixed canvas、章节可见性、credits top:100%。

学习／重建这些技术模式；不复制 Getty 的品牌、文案、素材或整份私有打包代码到我们的运行项目。
