# MindCare Admin

MindCare 心理健康服务项目的 Web 管理后台，用于承载系统配置、权限管理和后续心理健康业务运营功能。

## 项目简介

`mindcare-admin` 是从 RuoYi Vue 3 前端独立出的管理端工程，已与旧版 Vue 2 前端解耦。当前已接入 `mindcare-backend` 的动态菜单和权限体系，并提供 MindCare 专属运营页面：数据概览、量表管理、课程管理、活动管理、咨询预约处理、全部业务记录和用户终端查询。

运营人员在后台发布或下架内容后，`mindcare-app` 会在下次同步时获取最新数据；用户端提交的测评、预约、课程进度、活动报名和留言也会汇总到本后台。

## 技术栈

- Vue 3.5、JavaScript
- Vite 6
- Element Plus 2.13
- Pinia、Vue Router
- Axios
- ECharts
- VueUse、Vue Quill
- Sass、SVG 图标与构建压缩插件

## 关联仓库

| 项目 | 说明 | GitHub |
| --- | --- | --- |
| mindcare-backend | 后端服务 | [mindcare-backend](https://github.com/jiangyi3265/mindcare-backend) |
| mindcare-admin | 管理后台 | [mindcare-admin](https://github.com/jiangyi3265/mindcare-admin) |
| mindcare-app | 用户端 | [mindcare-app](https://github.com/jiangyi3265/mindcare-app) |

## 快速启动

准备 Node.js 与 npm。仓库提交了依赖锁文件，推荐使用 `npm ci`：

```bash
cp .env.example .env.local
npm ci
npm run dev
```

默认示例将 API 前缀配置为 `/dev-api`；开发代理目标由 `vite.config.js` 转发到本地 `8080` 后端。请先执行后端的两个 SQL 脚本并启动 `mindcare-backend`，再使用初始化的管理员账号登录。MindCare 菜单由 `sql/mindcare.sql` 创建。

生产构建：

```bash
npm run build:prod
```

构建结果输出到 `dist/`，该目录不会提交到 Git。

## 项目结构

```text
src/api/          后端接口封装
src/assets/       图片、图标与全局样式
src/components/   通用业务组件
src/layout/       管理后台整体布局
src/plugins/      权限、缓存、下载与弹窗插件
src/router/       静态路由与动态路由入口
src/store/        Pinia 状态管理
src/views/        系统管理、监控和工具页面
vite/             Vite 插件及构建辅助代码
public/           静态公开资源
```

MindCare 页面位于 `src/views/mindcare/`，接口封装位于 `src/api/mindcare/`。内容配置保留完整 JSON 编辑能力，同时自动同步 ID、标题、分类和简介等公共字段。

## 简历描述示例

参与 MindCare 管理后台建设，基于 Vue 3、Vite 与 Element Plus 实现量表、课程、活动发布，咨询预约处理，用户终端与全量业务记录查询，并通过动态路由和权限控制对接统一后端 API。

## 开源说明

本项目基于 RuoYi Vue 3 二次整理，原项目版权与许可信息见 [LICENSE](./LICENSE)。
