# create-mockjs-server

nodejs创建一个http server，模拟接口数据

## 主要功能

1. 基于文件，模拟接口
2. 文件新建、修改自动更新

## 使用

1. 新建 mock目录，新建一个 user.js

```js
module.exports = {
  '/user/info': {
    avatar: 'https://avatars0.githubusercontent.com/u/13115996?s=460&v=4',
    nickname:'nick lin'
  },
  '/user/team': {
    data: [
      {
        id:1,
        avatar: 'https://avatars0.githubusercontent.com/u/13115996?s=460&v=4',
        nickname: '冰冰',
        mobile:'10057618679'
      },
      {
        id:2,
        avatar: 'https://avatars0.githubusercontent.com/u/13115996?s=460&v=4',
        nickname: '萌萌',
        mobile:'11057618679'
      }
    ]
  },
}
```

打开 http://localhost:3000/mock/user/team

打开 http://localhost:3000/mock/user/info

> 注意，路径必须是/mock开始

2. 新建node入口文件index.js

```js
const createMockServer = require('create-mockjs-server')
createMockServer('mock', 3000)
```

## API

### function createMockServer(dir, port?, title?)

- 参数
  - {string} dir 文件所属目录
  - {number} port 监听端口, 默认 3000
  - {stirng} title 进程显示名称