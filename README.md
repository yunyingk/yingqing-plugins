# yingqing-plugins

面向 ZCode 的开源插件市场，当前提供 DeepSeek 原生联网搜索和 OpenAI-compatible 视觉理解两个独立插件。

仓库采用 `.claude-plugin/marketplace.json` 组织多个插件。每个插件都包含自己的清单、MCP Server、Skill、配置和版本，可以按需单独安装、升级或停用。

> 当前文档默认使用中文。其他语言版本将在后续完成翻译与审校后提供。

## 插件一览

| 插件 | 版本 | MCP 工具 | 用途 | API 格式 |
| --- | --- | --- | --- | --- |
| [`deepseek-web-search`](./plugins/deepseek-web-search/) | `0.2.4` | `web_search` | 实时网页检索、事实核查、时效性信息和带来源回答 | DeepSeek Anthropic Messages API + 原生 Web Search |
| [`vision-analyzer`](./plugins/vision-analyzer/) | `0.2.1` | `analyze_image` | 识别附件、本地图片、远程图片、截图、文档、表格和图表 | OpenAI-compatible Chat Completions 视觉格式 |

两个插件完全独立：安装其中一个不会自动启用另一个，Token、Base URL 和模型配置也分别保存。

## 主要特性

- 标准插件市场结构，一个仓库管理多个独立插件。
- MCP Server 源码随仓库发布，不在运行时下载第三方 MCP 包。
- Node.js 原生 `fetch` 和零 npm 运行时依赖。
- API 请求使用 SSE 流式响应，并正确处理服务端 keep-alive。
- 长任务支持 MCP progress 心跳，服务器超时上限为 120 秒。
- 支持并发 MCP 调用，不人为串行化搜索或图片识别请求。
- 使用者自行提供 Token、服务地址和模型，凭据不会写入 Git。
- Skill 触发描述保持能力导向，不把具体供应商实现污染到通用使用场景。

## 环境要求

- ZCode 客户端
- Node.js `24` 或更高版本
- 对应服务的 API Token
- 能访问所配置 API 地址的网络环境

两个 MCP Server 都会在启动时检查 Node.js 主版本。低于 Node.js 24 时会输出明确错误并停止启动。

## 安装

### 从公开仓库安装

1. 打开 ZCode 的“设置 → 插件”。
2. 点击“创建”或“添加插件市场”。
3. 输入本仓库的 GitHub 仓库地址或 Git URL。
4. 添加市场后，按需安装 `deepseek-web-search`、`vision-analyzer`，或者同时安装两个。
5. 进入插件详情页填写配置，点击“保存配置”。

### 从本地目录安装

先克隆仓库：

```bash
git clone <repository-url>
cd yingqing-plugins
```

然后在 ZCode 的“添加插件市场”中选择该仓库目录。ZCode 会读取根目录下的 `.claude-plugin/marketplace.json`。

插件配置由 ZCode 持久化保存。关闭窗口、退出客户端或重启电脑后，已经保存的配置仍然有效。

## DeepSeek Web Search

`deepseek-web-search` 提供 `web_search` 工具。搜索、网页读取、来源收集和答案合成由 DeepSeek 服务端的原生 Web Search 完成。

### 配置

| 配置项 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| DeepSeek API Token | 是 | 无 | 使用者自己的 API Token |
| API Base URL | 是 | `https://api.deepseek.com/anthropic` | 必须支持 Anthropic Messages；插件自动追加 `/v1/messages` |
| 搜索模型 | 是 | `deepseek-v4-flash` | 用于搜索与答案合成的模型 ID |
| Web Search 工具版本 | 是 | `web_search_20250305` | 写入 `tools[].type` 的原生搜索工具版本 |
| 思考模式 | 否 | `enabled` | 支持 `enabled` 或 `disabled` |
| 最大输出 Token | 否 | `32768` | 单次搜索答案的最大输出量 |

Base URL 对应的服务必须同时支持：

- Anthropic Messages 请求格式；
- 配置的 DeepSeek 原生 Web Search 工具；
- SSE 流式响应。

只提供 OpenAI-compatible `/chat/completions`、但不提供 Anthropic Messages 与原生 Web Search 的服务不能用于此插件。

### 适合的任务

- 查询新闻、版本、价格、政策、赛程等可能变化的信息；
- 核对外部事实并保留来源 URL；
- 搜索官方文档、发布说明和实时资料；
- 为研究问题生成带来源的综合回答。

## Vision Analyzer

`vision-analyzer` 提供 `analyze_image` 工具，通过专用视觉模型理解图片内容。

### 配置

| 配置项 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| Vision API Token | 是 | 无 | 使用者自己的视觉服务 Token |
| API Base URL | 是 | `https://api.openai.com` | 填写服务根地址；插件自动追加 `/v1/chat/completions` |
| 视觉模型 | 是 | `gpt-4o` | 必须是支持图片输入的模型 ID |
| 在工具结果中显示模型与用量 | 否 | `false` | 开启后才把模型 ID 和 Token 用量附加到识别正文 |

为了兼容不同服务，Base URL 可以填写以下任一种形式，插件会自动归一化：

```text
https://api.example.com
https://api.example.com/v1
https://api.example.com/v1/chat/completions
```

最终请求地址统一为：

```text
https://api.example.com/v1/chat/completions
```

### 图片输入

工具接受三种图片来源，调用时三选一：

- `path`：聊天附件或本地图片的文件路径；
- `url`：公开可访问的 HTTP(S) 图片 URL；
- `base64`：图片的 Base64 内容。

支持 `general`、`ocr`、`ui_review`、`document`、`table`、`diagram`、`chart`、`receipt`、`math` 和 `code` 等分析模式。

本地图片会读取后编码为 OpenAI-compatible `image_url` 内容块，再发送给配置的视觉服务。单张本地或 Base64 图片设有 20 MB 安全上限。

## 长任务、流式响应与超时

两个插件的外部 API 请求都使用 SSE 流式响应。MCP 调用方提供 `progressToken` 时，Server 每 5 秒发送一次 `notifications/progress` 心跳。

插件同时声明：

```json
{
  "timeoutMs": 120000
}
```

这使搜索和视觉推理可以运行最长约 120 秒，不再受宿主默认 30 秒超时限制。心跳用于报告任务仍在运行，最终识别或搜索结果仍会在完整生成后作为一次 MCP 工具结果返回。

## 隐私与安全

- Token 由使用者在 ZCode 插件配置页填写，不应提交到仓库。
- 搜索查询会发送到所配置的 DeepSeek 或兼容服务。
- 图片内容会发送到所配置的视觉服务；使用本地图片路径不代表图片只在本地处理。
- 仓库自身不包含遥测、账号系统或用量上报服务。
- 视觉用量元数据默认不进入上层 Agent 上下文；需要调试时可以手动开启。
- MCP 可以读取文件和访问网络。安装公开插件前，建议检查 `.mcp.json`、启动脚本和源码。
- 如果 Token 曾出现在截图、聊天记录或公开日志中，请立即轮换。

## 目录结构

```text
yingqing-plugins/
├── .claude-plugin/
│   └── marketplace.json
├── plugins/
│   ├── deepseek-web-search/
│   │   ├── .claude-plugin/plugin.json
│   │   ├── .mcp.json
│   │   ├── skills/deepseek-web-search/SKILL.md
│   │   ├── scripts/
│   │   ├── README.md
│   │   └── UPSTREAM.md
│   └── vision-analyzer/
│       ├── .claude-plugin/plugin.json
│       ├── .mcp.json
│       ├── skills/vision-analyzer/SKILL.md
│       ├── scripts/
│       ├── README.md
│       └── UPSTREAM.md
├── scripts/
│   └── validate.mjs
├── tests/
├── LICENSE
└── package.json
```

## 本地开发

仓库本身没有需要安装的 npm 依赖。使用 Node.js 24 或更高版本运行：

```bash
npm test
npm run validate
```

- `npm test`：运行配置、协议、SSE、并发、心跳和工具行为测试；
- `npm run validate`：检查市场清单、插件版本、默认配置、超时与安全约束；
- `git diff --check`：检查空白符和补丁格式问题。

两个插件独立版本化。修改插件行为时，需要同步更新插件清单和市场条目的版本。

## 开源来源

两个 MCP Server 现在都由本仓库以源码形式维护。部分设计与实现改编自以下 MIT 项目：

- `deepseek-web-search`：[`kyaulabs/deepseek-websearch-mcp`](https://github.com/kyaulabs/deepseek-websearch-mcp)
- `vision-analyzer`：[`winton979/vision-mcp`](https://github.com/winton979/vision-mcp)

完整来源说明和第三方许可文本分别保存在各插件的 `UPSTREAM.md` 与 `THIRD_PARTY_LICENSES/` 目录。

## 贡献

欢迎提交 Issue 或 Pull Request。提交前请：

1. 不要提交 API Token、真实用户配置或含敏感信息的日志；
2. 保持两个插件之间的能力和配置边界；
3. 为行为变化补充测试；
4. 运行 `npm test`、`npm run validate` 和 `git diff --check`。

## 许可证

本仓库使用 [MIT License](./LICENSE)。第三方改编部分同时遵循其原始 MIT 许可和署名要求。
