# 纵向行程与 UX 章节文案修正

2026-09-09。正式本地入口：`index-badge.html`；未部署线上。

历史阶段记录：下文的逐项目阅读节奏已被三组总览替代。当前是 4 / 4 / 3 精选、5 个归档，共约 3.8 屏；参见 `FEATURES.md` 与 `SCENE-REBUILD-RESULTS.md`。Getty 行程实测仍是运动幅度的参考，不是恢复逐项目展示的理由。

## 滚动行程

Getty 第一段阅读场景的实测：桌面每滚 1000 CSS px，近层图片上移约 708px、远层约 566px；手机尺寸模拟近层约 .99 屏／屏。此前本项目 UX 侧图同样滚 1000px，只上移约 29px。

本次不放大 canvas 像素尺寸，不再增加空白滚动高度，而是扩大实际世界空间行程：

- 桌面最近层：滚动 1000px，上移约 **700px**。
- 深度 -1 的真实图片及灰矩形：同样滚动，上移约 **585px**。
- 窄屏手机最近层：滚动一屏，上移约 **.98 屏**。
- 上述倍率适用于稳定阅读区间中的非主图平面；章节接近／深度混合以及主图承接另有平滑插值。
- 固定主图只在阅读停留时脱离背景运动，周围世界继续上移。
- 项目按阅读次序分布在连续纵向空间中，不再每章节只漂移 .12 屏，也不再把 Parsons 后四项整批向上切换。
- 新章节在引入期间提前露出下方边缘，与上一组共存；偏移平滑归位，不反向滚动。
- 只有灰色装饰矩形可在视口外循环；真实项目仍是 16 个唯一身份。
- 阅读避让共用连续水平推移函数，避免图片穿过保护区边缘时突然横跳。

为避免更长的空间变成更多空白，每项目阅读段从 `.9` 调为 `.65` 屏；16 个阅读停留全部保留，总叙事从 `17.6` 缩到 `13.6` 屏。图片不再强行一直留在四角，同屏侧图数量会随行程变化。相机指针弹簧和 Lenis 阻尼未改。

## UX 文案

中间仍可展示 Dispatch，并保留它的名称、公司／年份和项目入口。但四个 UX 阅读停留统一使用章节级大段文案：

> At Alibaba and ByteDance, I designed clear, usable experiences across complex platforms, service workflows and global products.

该文案单独存为 UX 的 `readingSummary`，没有覆盖任何 `SCROLLCAROUSEL_PROJECTS.summary`。预览、案例详情、静态索引和降级内容中的项目介绍保持原样。其他两个章节的阅读文案没有改写。

## 本轮文件

- `js/badge-scene-config.js`：共享行程系数、阅读节奏、平滑避让、UX 文案。
- `js/badge-scene-camera.js`：使用共享的阅读相机 Z，防止倍率标定与实际镜头脱节。
- `js/badge-scene-field.js`：连续纵向地址与章节接近插值。
- `js/badge-scene-background.js`：装饰层使用同一世界行程和避让。
- `js/badge-scene-reading.js`：UX 章节文案；按实际文字高度保护阅读区域并缓存测量。
- `scripts/badge-scene-check.cjs`：新增行程和章节文案断言，覆盖两个章节边界。
- `FEATURES.md`、`VISUAL-TUNING.md`、`SCENE-REBUILD-RESULTS.md`、本文件。

## 验证

28 项浏览器回归通过，包括新增的桌面行程、手机行程、UX 章节文案，以及原有完整开场、16 个阅读停留、两种详情模板、简历打印／拖纸／下载、Ask AI、横屏、反滚、resize、reduced motion、WebGL／图片失败降级。

证据：`~/.pi/tmp/2026-09-09/badge-scroll-amplitude/checks/`，其中 `checks.json` 保存实测倍率。基线、逐帧采样与滚动 GIF 在同一主题目录中。

Chrome headless / SwiftShader 和手机尺寸模拟不代表真实 Safari／iPhone 帧率。GIF 是滚动位置逐帧采样，不是性能录屏。真实设备手感仍应通过本地预览验收。
