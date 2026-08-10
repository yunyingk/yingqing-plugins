# DeepSeek Web Search

一个 Claude Code/ZCode 标准插件，通过内置的源码级 MCP Server 暴露 `web_search` 工具。搜索、网页读取和答案合成都由 DeepSeek 的服务端搜索工具完成。

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
      "command": "node",
      "args": ["/absolute/path/to/yingqing-plugins/plugins/deepseek-web-search/scripts/start.mjs"],
      "env": {
        "DEEPSEEK_API_KEY": "由使用者提供",
        "WEBSEARCH_BASE_URL": "https://api.deepseek.com/anthropic",
        "WEBSEARCH_MODEL": "deepseek-v4-flash"
      }
    }
  }
}
```

Token 不应提交进 Git。MCP Server 直接从插件配置或环境变量读取 Token。

## 运行要求

- Node.js 20 或更高版本
- 可访问配置的 DeepSeek-compatible Base URL

MCP Server 源码位于 `scripts/server/`，使用 Node.js 内置模块和原生 `fetch`，无需安装 npm 运行时依赖。工具只接受一个真正使用的 `query` 参数，并直接生成 DeepSeek 请求中的固定 system prompt 与 user message。

搜索、格式化和错误处理逻辑改编自 [kyaulabs/deepseek-websearch-mcp](https://github.com/kyaulabs/deepseek-websearch-mcp)，原项目采用 MIT License；许可文本保存在 `THIRD_PARTY_LICENSES/KYAU-LABS-MIT.txt`。当前 MCP 协议层、工具定义、配置持久化及后续维护均由本仓库负责。
