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

## 当前实现

当前 MCP Server 源码已经内置在本插件中，由本仓库直接维护，不再运行或下载 `@winton979/vision-mcp`。图片输入、OpenAI-compatible SSE 解析、错误处理、取消和 MCP 协议均使用 Node.js 内置模块实现，没有 npm 运行时依赖。

视觉请求始终使用流式输出。MCP Server 会在调用方提供 `progressToken` 时每 5 秒发送进度心跳，插件同时把 ZCode MCP 超时声明为 120 秒，以兼容不按进度重置计时器的宿主。

实现最初改编自 [`winton979/vision-mcp`](https://github.com/winton979/vision-mcp) 的 MIT 源码；许可和来源记录仍保留，后续代码与版本由本仓库维护。

## 运行要求

- Node.js 24 或更高版本
- 兼容 OpenAI Chat Completions 图片输入的视觉模型服务
