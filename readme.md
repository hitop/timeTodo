# 定时器 - nodejs + vue

## 功能说明
- 添加倒计时任务
- 任务云端同步
- 任务运行通过 child_process 模块

## 数据传递 - websocket

### 基本格式 - 客户端发送/服务端接收
<pre>
{
  op: "operation",    // 具体操作
  data: {},           // 相关数据
}
</pre>

#### 说明
op - 请求任务操作: 
- addnewtask    // 添加任务
- start         // 开始任务
- pause         // 暂停任务
- delete        // 删除任务

示例：
- wsSend({op: "pause", data: {tid: "taskid"}})


### 基本格式 - 客户端接收/服务端发送
<pre>
  {restype: "type", data: {}}
</pre>

#### 说明
restype - 返回数据类型:
- running       // 服务器正在运行的程序
- countdown     // 单个任务倒计时时间
- repeat        // 单个任务剩余重复运行次数
- random        // 单个任务增加的随机秒数
- success       // 任务顺利执行
- fail          // 任务执行失败


示例：
- wsSendSer({restype: "random", data: {tid: "tid", random: 18}})


***
### Todo
- [ ] js 脚本
- [ ] 定时任务
- [ ] 简略模式
- [ ] 添加任务可视化（选择文件/打开链接.../you get）

### Done
- [x] 已添加任务信息查看/修改
- [x] 更新信息服务器同步
- [x] 初次加载检查服务器端是否有任务运行
- [x] 时间时分转秒
- [x] 随机秒数
