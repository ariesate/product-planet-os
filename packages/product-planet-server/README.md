# product-planet-server

## 项目初始化安装

```bash
pnpm install
```

## 项目启动

### 连本地数据库启动

```bash
pnpm dev
```

### 连线上数据库启动

```bash
pnpm start
```



## 项目开发

> 分为系统 api 和自定义 api，
> 系统 api 多为库表操作，会在项目启动时候自动生成，详见 runtime 中 api.map.json
> 自定义 api 见 '自定义接口开发'

### 自定义接口开发

- 自定义接口文件路径 product-planet/app/
- 自定义接口文件命名：xxx.api.js
- 接口写法：参考 test.api.js

### 所有接口

启动项目后生成到 runtime/api.map.json

## 前端请求


请求参数约定：

```javascript
{
  "identity":{
    // 用户信息，context会绑定到请求处理函数的this上
    "user":{
      "name":"方琳",
      "account":"fanglin05",
    },
  },
  "context":{
    // 请求上下文，context会绑定到请求处理函数的this上
  },
  "argv":[
    //请求参数
  ]
}
```

## ER 文件规范【TODO】
