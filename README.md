# 校园综合服务平台（Web）

一个基于 Vue 3 + TypeScript + Vite 的校园服务前端项目，覆盖通知公告、失物招领、二手交易、场馆预约、统一登录和 AI 助手等核心模块。

## 技术栈

- Vue 3
- TypeScript
- Vite
- Vue Router
- Pinia
- ESLint

## 本地运行

```bash
npm install
npm run dev
```

构建生产包：

```bash
npm run build
```

`npm run dev` 会同时启动前端与接口服务，并把前端的 `/api` 请求代理到本地后端。

若只需前端（例如 API 已由其他终端启动），可用：

```bash
npm run dev:web
```

单独启动后端服务（一般不必再开，除非你要与 `dev:web` 搭配）：

```bash
npm run dev:server
```

后端 API（Java + Spring Boot + MySQL）：

```bash
npm run dev:server:java
```

使用 Java 后端时，请在前端环境变量中将接口地址指向后端 `/api` 路径。AI 助手在演示服务中已提供与 Java 一致的校园指引；若需大模型或生产级数据，请使用 Java 后端。

说明：

- Java 后端目录：`server-java`
- 端口：按你的部署环境配置
- 需先安装 JDK 11（或更高 LTS）和 Maven
- MySQL 库名：`campus_service`（连接配置在 `server-java/src/main/resources/application.yml`）
- 生产环境配置模板：`server-java/src/main/resources/application-prod.yml`
- 建表脚本：`server-java/src/main/resources/schema.sql`
- 前端环境变量模板：`.env.example`
- Java 后端环境变量模板：`server-java/.env.example`

生产配置运行示例：

```bash
mvn -f server-java/pom.xml spring-boot:run -Dspring-boot.run.profiles=prod
```

环境变量使用建议：

1. 前端复制 `.env.example` 为 `.env` 后按需修改
2. Java 后端按 `server-java/.env.example` 准备生产环境变量

## 演示账号

- 学生：`20260001 / 123456`
- 学生：`20260002 / 654321`
- 老师：`T2026001 / 888888`

## 已实现模块

- 统一认证登录
  - 学号密码登录
  - 微信扫码登录（会话生成、状态轮询、过期处理）
  - 登录后个人中心、微信绑定
- 通知公告
  - 列表展示
  - 独立发布页（仅老师可发布）
  - 图片上传（最多 3 张，单张 <= 2MB）
- 失物招领
  - 列表展示
  - 独立发布页（支持图片上传与预览）
- 二手市集
  - 商品列表与购买
  - “我要出售”独立发布页
  - 价格业务校验（价格 > 0.01）
- 场馆预约
  - 选择场馆、审批老师、日期与时间段
  - 提交后进入“待老师审批”状态
  - 展示我的预约申请记录
  - 老师审批台支持通过/驳回
- AI 服务助手
  - 机器人面板式对话页面
  - 基础问答引导（演示版）

## 业务角色与权限

项目当前定义两类角色：

- 老师
- 学生

权限规则：

- 通知公告：仅老师可发布；老师和学生都可查看
- 二手交易：老师和学生都可发布与购买
- 失物招领：老师和学生都可发布与查看
- 场馆预约：登录用户可提交申请，按场馆对应老师审批

## 主要页面路由

- `/` 首页
- `/login` 登录页
- `/profile` 个人中心（需登录）
- `/news` 通知公告
- `/news/publish` 发布通知（需登录，老师权限）
- `/lost-found` 失物招领
- `/lost-found/publish` 发布失物招领（需登录）
- `/market` 二手市集
- `/market/sell` 发布商品（需登录）
- `/booking` 场馆预约（需登录）
- `/approval` 老师审批台（需登录，老师权限）
- `/ai-assistant` AI 服务助手

## 项目目录结构（Vue 版）

```text
src/
  api/           # 认证与微信扫码会话等接口模拟
  assets/        # 静态资源
  data/          # 演示数据（通知、场馆、审批老师等）
  router/        # Vue Router 路由与鉴权守卫
  stores/        # Pinia 状态管理
  views/         # 页面视图（Home/Login/News/...）
  App.vue        # 全局壳层（导航、页脚、RouterView）
  main.ts        # Vue 应用入口
  index.css      # 全局样式
```

## 后续可扩展方向

- 对接真实后端 API 和数据库
- 老师审批后台（通过/驳回）
- 上传文件持久化（对象存储）
- AI 助手对接真实大模型并支持流式回复
