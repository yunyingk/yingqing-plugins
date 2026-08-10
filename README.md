# yingqing-plugins

本地 Claude Code/ZCode 插件市场。仓库使用标准 `.claude-plugin/marketplace.json`，每个插件位于 `plugins/<name>/`。

## 当前插件

- `deepseek-web-search`：通过 DeepSeek 服务端联网搜索提供 MCP `web_search` 工具。

## 添加到 ZCode

进入“设置 → 插件 → 创建 → 添加插件市场”，选择本仓库目录：

```text
/Users/yingqing/code/yingqing-plugins
```

然后安装 `deepseek-web-search`，填写自己的 Token、Base URL 和模型。

如果当前 ZCode 版本暂不支持在界面保存敏感配置，请先在启动 ZCode 的环境中设置 `DEEPSEEK_API_KEY`。

## 本地检查

```bash
npm test
npm run validate
```

## 目录结构

```text
yingqing-plugins/
├── .claude-plugin/
│   └── marketplace.json
└── plugins/
    └── deepseek-web-search/
        ├── .claude-plugin/plugin.json
        ├── .mcp.json
        ├── skills/deepseek-web-search/SKILL.md
        └── scripts/
```
