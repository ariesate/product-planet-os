# 产品星球

## 项目初始化安装

> 推荐使用 [ni](https://github.com/antfu/ni)，依赖处理更方便 :3

```bash
# install 时，由于node@17版本问题，可能出现grpc error，将node版本降为16即可。
pnpm install
```

## 添加依赖

```bash
# 给 root workspace 添加依赖
pnpm add <package> -W
# 给 sub workspace 添加依赖，下面两种方式结果一致
pnpm add <package> --filter "<workspace>"
cd ./path/to/workspace & pnpm add <package>
```

## 开发

首先需要配置 host，使用 iHost 或者其他工具修改

```bash
127.0.0.1 product-planet.staging.kuaishou.com
127.0.0.1 product-planet-local.staging.kuaishou.com
```

接下来你可以通过两种命令进行开发

```bash
pnpm local
pnpm dev
```

### 前端 MODEL 生成

> 会更新或创建实体文件至*packages/product-planet-website/models/entities/*

```bash
pnpm sync:models
```

允许添加自定义的属性和方法。注意不要修改带有`@Field`和`@Relation`装饰器的托管属性（会被更新覆盖）。

## 参考

- [PNPM Workspaces](https://pnpm.io/zh/workspaces)
- [@antfu/ni](https://github.com/antfu/ni)

## 容器部署

见文档 [产品星球容器部署与流水线流程](https://docs.corp.kuaishou.com/d/home/fcAAsFbrIZUZQZlQH37SMD9js#)

## 主机部署

> 已废弃，请使用容器部署

-------------------------------环境基本信息------------------------------------

- 云机 ip：172.29.66.88
- 主机：frontend-fanglin05-01.dev.kwaidc.com
- 云机线上登录地址：https://halo.corp.kuaishou.com/dev/#/servers/6142/shell
- 域名：product-planet.staging.kuaishou.com
- 服务端口：4000
- 域名管理：https://accessproxy.staging.kuaishou.com/domain/2657

---

发布步骤：

1. 新用户把 ssh 密钥发给@方琳添加 (注意：用户名是 fanglin05)
2. 登陆发布机执行`proupdate`命令或直接执行远程命令`ssh fanglin05@172.29.66.88 proupdate`

> 请勿使用 root 权限执行此命令避免出现文件读写权限问题
