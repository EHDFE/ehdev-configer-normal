# EHDEV-CONFIGER-NORMAL
---

[![Build Status](https://travis-ci.org/EHDFE/ehdev-configer-normal.svg?branch=master)](https://travis-ci.org/EHDFE/ehdev-configer-normal)
[![npm](https://img.shields.io/npm/dm/ehdev-configer-normal.svg)]()
[![npm](https://img.shields.io/npm/v/ehdev-configer-normal.svg)]()
[![node](https://img.shields.io/node/v/ehdev-configer-normal.svg)]()
[![GitHub tag](https://img.shields.io/github/tag/ehdfe/ehdev-configer-normal.svg)]()
[![David](https://img.shields.io/david/EHDFE/ehdev-configer-normal.svg)]()
[![David](https://img.shields.io/david/dev/EHDFE/ehdev-configer-normal.svg)]()


## 配置说明

| 配置项 | 默认值 | 说明 |
|---|---| ---|
| buildPath | dist | 输出目录 |
| enableHotModuleReplacement | true | 启用[热更新](https://webpack.js.org/guides/hot-module-replacement) |
|framework|raect|依赖框架，目前只对 `react` 有做优化，包括引入 `react-hot-loader`|
|htmlWebpackPlugin|`{inject: true, chunksSortMode: 'auto', cache: true, showErrors: true}`|`htmlWebpackPlugin` 插件配置, 参考 [https://github.com/jantimon/html-webpack-plugin#configuration](https://github.com/jantimon/html-webpack-plugin#configuration)|
| browserSupports | last 2 version | 浏览器支持配置，影响 `babel` 和 `autoprefixer`, 配置参考：[https://github.com/ai/browserslist](https://github.com/ai/browserslist) |
| dll | `{ enable: false, enclude: [] }` | 是否启用 dll，enclude 提供打入 dll 包的模块 |
| providePluginConfig | `{}` | 主要用来支持 jQuery 依赖全局挂载的老模块， 参考 [https://webpack.js.org/plugins/provide-plugin/](https://webpack.js.org/plugins/provide-plugin/) |
| https | false | 开发环境的 https 支持 |
