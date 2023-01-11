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



