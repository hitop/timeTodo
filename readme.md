# 定时器 - nodejs + vue

## 功能说明
- 添加倒计时任务
- 任务云端同步
- 任务运行通过 child_process 模块

## 接口说明 - websocket

### 基本格式 - 客户端发送（JSON.stringify 转换后发送）
<pre>
{
  op: "operation",    // 具体操作
  data: {},    // 相关数据
}
</pre>

说明：
op: 
- addnewtask    // 添加单个任务
- 

### 基本格式 - 客户端接收（接收后 JSON.parse 转换）


### 基本格式 - 服务端发送（JSON.stringify 转换后发送）


### 基本格式 - 服务端接收（接收后 JSON.parse 转换）


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
