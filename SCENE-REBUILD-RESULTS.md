# Badge 场景重构执行结果

日期：2026-09-09。入口：`index-badge.html`。已在本机预览切换，未提交 Git、未部署线上。

最新修正：**章节总览＋精选归档，两项均已落地。26 项浏览器检查通过。**

1. 不再逐项目展示：UX 4 个、Independent 4 个、Experimental 3 个项目同时出现在各自总览构图中；三组共约 **3.8 屏**，没有独立介绍屏或多余的退出空屏。
2. 第三组改名 **Experimental Practice**，精选 Power Station、Museum Tour、Museum Kit。其余五个进入 Archive，不删除案例；原 16 个详情索引不变，旧 Parsons 锚点仍可用。Museum Tour 明确标注概念提案。

本轮改动：`js/scrollcarousel-data.js`（筛选与分组）、`js/badge-scene-{config,field,reading,interaction,runtime,scroll}.js`（总览与链接）、`js/badge-work.js`（索引指向本地案例）、`style/badge-scene.css`、`index-badge.html`、回归脚本及行为／调参文档。

证据：`~/.pi/tmp/2026-09-09/badge-group-overview/checks/`。桌面验证 1440×1000、1280×800；手机仅保留功能性检查，视觉优化另做。此前滚动幅度研究见 [`SCROLL-AMPLITUDE-NOTES.md`](SCROLL-AMPLITUDE-NOTES.md)，其中逐项目节奏已被本轮总览取代。

## 实际结果

- 原正交画布／长列平移引擎停止加载，改为持久 Three.js 透视场景。
- 单 renderer、16 个稳定案例身份；首页数据驱动 UX / Independent / Experimental 三组（4 / 4 / 3），另 5 个只归档，不加载其 WebGL 纹理。
- Lenis 平滑滚轮与 ScrollTrigger 统一叙事进度；触屏不启用模拟拖动滚动。
- 相机采用 dt 弹簧跟随鼠标；作品 hover 与镜头运动独立。
- 当前组所有作品原色、alpha=1；前后组降至约 .20，切组时连续混合，而非清空。
- 独立浅灰矩形层使用 InstancedMesh；不加载项目纹理，不参与点击或键盘。
- 每组是一幅完整构图：中央标题、关键词和整体总结，周围项目同时出现；Experimental 上方突出 Power Station。
- 图片始终在 WebGL 中，原生链接及小号名称跟随其投影矩形；没有逐项目 HTML 放大阅读层。
- 整组随滚动连续向上移动约 .70 屏／屏，标题不再收为逐项目小标题，仍无可见 `01 / 03`。
- 活跃构图保留文字净空，历史／接近中的作品与装饰层平滑避让；手机的独立视觉方案暂缓。
- 开场继续是紧凑 sin、姓名提前到页眉、位置与尺寸同步落位；统一超时／失败清理，开场期间非开场 UI inert。
- 详情进入在首页完成一次精确 Hero 变形，导航后不再二次缩放。

## 文件范围

### 新场景引擎

- `js/badge-scene-config.js`
- `js/badge-scene-camera.js`
- `js/badge-scene-field.js`
- `js/badge-scene-background.js`
- `js/badge-scene-reading.js`
- `js/badge-scene-scroll.js`
- `js/badge-scene-interaction.js`
- `js/badge-scene-runtime.js`
- `style/badge-scene.css`

### 接入与几何桥接

- `index-badge.html`：新入口接线；不再加载旧 scene JS/CSS。
- `js/badge-opening.js`、`style/badge-opening.css`：传入开场布局、统一生命周期、恢复 inert／滚动。
- `js/badge-hero-geometry.js`：用同源实际详情布局测量目标 Hero，避免两套 CSS 公式漂移。
- `js/scrollcarousel-detail.js`：测量模式不消费导航状态；已完成的首页过渡不再在详情页重播。
- `js/vendor/ScrollTrigger-3.10.4.min.js`：与现有 GSAP 版本匹配；许可证头保留。
- `js/vendor/LENIS-LICENSE.txt`、`js/vendor/SCENE-DEPENDENCIES.md`：依赖来源与许可记录。

### 文档与测试

- `scripts/badge-scene-check.cjs`
- `FEATURES.md`、`VISUAL-TUNING.md`、`OPENING-NOTES.md`
- `GETTY-SCENE-REBUILD-PLAN.md`、本文件

旧 `badge-webgl.js`、`badge-scroll-stage.js` 等源文件仍保留在磁盘上，以免删除已有用户工作，但没有 HTML 入口继续加载它们。独立预览页已移到临时证据目录，不留第二套生产入口。

**未重写**徽章交互、简历打印机、Ask AI、静态索引、footer 或其他主题；详情的 stacked / two-column 内容模板未合并。

## 首轮历史浏览器检查：25 项（当时的逐项目版本）

当前以脚本的 26 项总览检查为准；下列涉及逐项目阅读和旧手机布局的验收已被新方案替代，不再作为当前行为。

1. Skip 恢复身份场景、滚动与键盘焦点。
2. 徽章键盘方向与主内容交互恢复。
3. 一个透视引擎、16 个身份、4/4/8 归属、独立矩形实例。
4. mesh / HTML 误差小于 1 CSS px，单一绘制拥有者，当前组全实色。
5. 鼠标移动相机而非侧图世界坐标；主图保持稳定。
6. 阅读停留期间继续滚动，主图位置稳定。
7. 组交界前后作品同时可见。
8. 反向滚动恢复相同项目状态。
9. 窗口缩放保留叙事进度。
10. 全部 16 个项目都有唯一阅读停留。
11. 原生链接打开预览，Escape 返回焦点。
12. stacked 详情：目标 Hero 与导航前端点一致，无抵达缩放。
13. two-column 详情：同样的几何检查，模板保留。
14. View Static 保留 16 个项目。
15. Ask AI 可打开，三 provider 保留。
16. Learn more 到达原打印流程，iframe 高度由父页面适配。
17. 简历阅读与短距离纸张拖拽。
18. 简历保存／PDF 下载／打印重播。
19. 完整开场逐帧：16:9、位置尺寸同步、落位无几何跳变。
20. 手机原生触屏配置，主图与说明完整可读。
21. 手机横屏说明不裁切，无页面横向溢出。
22. Reduced motion 直接展示全部 HTML 项目，无 WebGL／滚动锁。
23. WebGL context loss 恢复 HTML 内容。
24. 图片加载失败恢复 HTML 内容，不隐藏项目入口。
25. 全程无未捕获浏览器异常。

另外执行 JS 语法检查、`git diff --check`。完整自动化在正式 `index-badge.html` 上重跑通过。

## 复跑方式

先使用仓库既有方式启动 HTTP 服务，再运行：

```bash
BASE_URL=http://127.0.0.1:8000 \
PLAYWRIGHT_MODULE=/absolute/path/to/playwright \
ARTIFACT_DIR=/absolute/path/to/test-artifacts \
node scripts/badge-scene-check.cjs
```

可选 `CHROME_PATH` 指向本机 Chrome；不需要给本项目安装新的构建链。测试会在独立浏览器中触发一次本地简历 PDF 下载，并删除该次测试下载，不发送邮件或打开 AI provider 会话。

证据：`~/.pi/tmp/2026-09-09/badge-scene-rebuild/final-checks/`。
基线与已验证独立预览也保存在同一临时主题目录。

## 仍需人工确认的边界

- 自动化使用 Chrome headless / SwiftShader，含手机与横屏模拟；不能代替真实 Safari／iPhone 的触控和 GPU 性能验收。
- 尚未宣称实机 60fps；真实设备的滚动阻尼、镜头幅度与阅读停留长度可在新架构下继续调参。
- 外部 AI provider 的真实会话发送未执行；保留原模块，只验证本地面板、提供方数量与关闭路径。
- 未线上发布。下一步通过本机预览检查实际手感，而不是继续改变基础场景模型。
