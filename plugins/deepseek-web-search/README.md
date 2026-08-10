# DeepSeek Web Search

一个 Claude Code/ZCode 标准插件，通过 MCP 暴露 `web_search` 工具。搜索、网页读取和答案合成都由 DeepSeek 的服务端搜索工具完成。

## 配置

| 配置 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `api_key` | 是 | 无 | 使用者自己的 DeepSeek 或兼容服务 Token；可在 ZCode 插件详情页填写并保存 |
| `base_url` | 是 | `https://api.deepseek.com/anthropic` | Anthropic-compatible API 根地址 |
| `model` | 是 | `deepseek-v4-flash` | 搜索模型 ID |
| `thinking` | 否 | `enabled` | `enabled` 或 `disabled` |
| `max_tokens` | 否 | `32768` | 最大输出 Token |

代理 Base URL 必须实现：

- `POST <base_url>/v1/messages`
- Anthropic Messages 请求格式
- DeepSeek 服务端工具 `web_search_20250305`

在 ZCode 中进入插件详情页，在“配置”区域填写 Token 后点击“保存配置”。配置由 ZCode 持久化，关闭窗口、退出应用或重启 Mac 后仍然有效。

对于没有插件配置界面的 MCP 宿主，也可以在启动宿主前设置：

```bash
export DEEPSEEK_API_KEY="你的-token"
```

也可以用环境变量覆盖其他设置：

```bash
export WEBSEARCH_BASE_URL="https://api.deepseek.com/anthropic"
export WEBSEARCH_MODEL="deepseek-v4-flash"
export WEBSEARCH_THINKING="enabled"
export WEBSEARCH_MAX_TOKENS="32768"
```

## 在任意 MCP 客户端中使用

不安装插件市场时，也可以直接注册底层 MCP Server：

```json
{
  "mcpServers": {
    "deepseek-web-search": {
      "command": "npx",
      "args": ["--yes", "@kyaulabs/deepseek-websearch@1.0.4"],
      "env": {
        "DEEPSEEK_API_KEY": "由使用者提供",
        "WEBSEARCH_BASE_URL": "https://api.deepseek.com/anthropic",
        "WEBSEARCH_MODEL": "deepseek-v4-flash"
      }
    }
  }
}
```

Token 不应提交进 Git。插件只负责把使用者提供的 Token 传给 MCP Server。

## 运行要求

- Node.js 20 或更高版本
- 可访问 npm（首次启动会下载固定版本的 MCP Server）
- 可访问配置的 DeepSeek-compatible Base URL

底层 MCP Server 固定为 `@kyaulabs/deepseek-websearch@1.0.4`，避免上游更新未经审查就自动进入插件。

该 MCP Server 由 [kyaulabs/deepseek-websearch-mcp](https://github.com/kyaulabs/deepseek-websearch-mcp) 提供并采用 MIT License。本插件负责标准化安装、用户配置、环境变量回退和跨客户端接入。
