# Vision Analyzer

一个独立的 Claude Code/ZCode 视觉插件，通过 MCP `analyze_image` 工具识别聊天附件、本地图片、图片 URL 或 Base64 图片。

## 配置

| 配置 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `api_key` | 是 | 无 | 使用者自己的视觉模型服务 Token，可在 ZCode 插件详情页填写并保存 |
| `base_url` | 是 | `https://api.openai.com` | OpenAI-compatible 服务根地址；插件自动追加 `/v1/chat/completions` |
| `model` | 是 | `gpt-4o` | 支持图片输入的模型 ID |

不要在 Base URL 中重复填写 `/v1/chat/completions`。为了兼容已有配置，插件也接受以 `/v1` 或完整 `/v1/chat/completions` 结尾的地址，并会归一化后再启动 MCP。

配置的服务必须支持 OpenAI Chat Completions 图片消息格式，即在 `messages[].content` 中接收 `text` 与 `image_url` 内容块。

## 图片来源

`analyze_image` 接受三种来源，三选一：

- `path`：附件或本地图片的文件路径
- `url`：公开可访问的 HTTP(S) 图片 URL
- `base64`：图片的 Base64 内容

对于 ZCode 中的图片附件，技能会优先把宿主提供的本地附件路径传给 MCP。MCP 不会自动读取整段聊天附件；宿主必须向 Agent 暴露文件路径、URL 或图片内容。

## 当前运行时

当前版本固定使用 [`@winton979/vision-mcp@0.2.0`](https://github.com/winton979/vision-mcp) 作为底层 MCP Server。插件启动器负责配置映射和 URL 归一化；上游版本不会自动漂移。验证稳定后，可以把其 MIT 源码内置到本插件继续维护。

首次启动需要联网通过 `npx` 下载固定版本。后续通常使用本机 npm 缓存。

## 运行要求

- Node.js 24 或更高版本
- 兼容 OpenAI Chat Completions 图片输入的视觉模型服务
