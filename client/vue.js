let debug = true

function clog(info, error=false){
  if (debug) {
    info = typeof(info) == "object"?JSON.stringify(info):info
    error?console.error(info):console.log(info)
  } else {}
}

Vue.component('list-item', {
  props: ['item', 'taskid'],
  template: `
    <li class="taskitem">
      <div class="taskitem_progress" :style="{ width: (1-item.countdown/item.time)*100 + '%' }" />
      <div class="taskleft">
        <h4 class="taskname" @click="showtaskinfo(taskid)">{{ item.name }}</h4>
        <div>
          <span class="tasktype">{{ item.scdu=="cdown"?"C":"E" }}</span>
          <span class="tasktime">{{ item.time }}</span>
          <span class="taskrandom" v-if="item.random>0">随机 0~{{ item.random }} 秒</span>
        </div>
        <div v-if="item.repeat" class="tasknumb">
          <label>重复次数：</label><span>{{ item.repeat }}</span>
          <span class="taskcountdown" v-if="item.stat=='running'">{{ item.countdown }}</span>
        </div>
      </div>
      <div class="taskright">
        <button :class='[{ "btn--start": item.stat=="stoped" }, "btn"]' @click="$emit('togtask', taskid)">{{ item.stat=="running"?"Pause":"Start" }}</button><button class="btn btn--delete" @click="deltask(taskid)">Delete</button>
      </div>
    </li>
  `,
  methods: {
    deltask(taskid){
      clog("deltask: " + app.tasklists[taskid].name)
      wsSend({op: "delete", data: {tid: taskid}})
      this.$delete(app.tasklists, taskid)
      app.save()
    },
    showtaskinfo(taskid){
      app.edittasktid = taskid
      app.showtlist = false
    }
  }
})

Vue.component('choose', {
  props: ['clists', "editabel", "value"],
  data(){
    return {
      index: 0,
      indexlist: Object.keys(this.clists),
      fdata: this.value
    }
  },
  created(){
    this.fdata = typeof(this.clists[0]) == "undefined" ? this.clists[this.value || this.indexlist[0]] : this.value || this.clists[0]
  },
  template: `
    <div class="clists">
      <div @click="up" class="clists--up">△</div><input class="clists--middle" :disabled="editabel" v-model="fdata" @input="$emit('input', $event.target.value)"/><div @click="down" class="clists--down">▽</div>
    </div>
  `,
  methods: {
    up(){
      if (typeof(this.clists[0])=="string") {
        this.index >= this.clists.length-1 ? this.index=0 : this.index++
        this.fdata = this.clists[this.index]
        this.$emit('input', this.fdata)
      } else if (typeof(this.clists[0])=="number") {
        this.fdata >= this.clists[1] ? this.fdata = this.clists[0] : this.fdata++
        this.$emit('input', this.fdata)
      } else if (typeof(this.clists[0])=="undefined") {
        this.index >= this.indexlist.length-1 ? this.index=0 : this.index++
        let key = this.indexlist[this.index]
        this.fdata = this.clists[key]
        this.$emit('input', key)
      } else {
        alert("未知 clists 类型")
        return false
      }
    },
    down(){
      if (typeof(this.clists[0])=="string") {
        this.index <= 0 ? this.index=this.clists.length-1 : this.index--
        this.fdata = this.clists[this.index]
        this.$emit('input', this.fdata)
      } else if (typeof(this.clists[0])=="number") {
        this.fdata <= this.clists[0] ? this.fdata = this.clists[1] : this.fdata--
        this.$emit('input', this.fdata)
      } else if (typeof(this.clists[0])=="undefined") {
        this.index <= 0 ? this.index=this.indexlist.length-1 : this.index--
        let key = this.indexlist[this.index]
        this.fdata = this.clists[key]
        this.$emit('input', key)
      } else {
        alert("未知 clists 类型")
        return false
      }
    }
  }
})

Vue.component('taskattr_item', {
  props: ["label", "value"],
  data(){
    return {
      checked: true
    }
  },
  computed: {
    background(){
      return this.checked?"var(--theme-btnback--start)":"var(--theme-colors)"
    },
    float(){
      return this.checked?"right":"left"
    }
  },
  template: `
    <div class="taskattr_item">
      <label class="taskattr_label">{{ label }}</label>
      <div class="checkbox" @click="check" :style="{ background }"><div class="checkbox_dot" :style="{ float }"/></div>
      <input class="taskattr_input" :value="value" @input="taskattrinput($event)"/>
    </div>
  `,
  methods: {
    check(){
      this.checked=!this.checked
      if (this.checked==false) this.$emit('input', 0)
    },
    taskattrinput(ev){
      this.checked = true
      this.$emit('input', ev.target.value)
    }
  }
})

Vue.component('newtaskpanel', {
  data() {
    return {
      name: 'task ' + (Object.keys(app.tasklists).length + 1),
      scdu: 'cdown',
      repeat: 1,
      random: 0,
      taskcmd: '',
      hour: 0,
      minute: 0,
      second: 15,
    }
  },
  template: `
    <div class="ataskname">
      <div class="ataskname_div center"><label class="ataskname_label">任务名：</label><input  class="ataskname_input" v-model="name"/></div>
      <div class="center">
        <div is="choose" v-model="scdu" :clists="{cdown: '倒计时', exact: '定时'}" style="width: 120px" editabel="disabled"/>
        <div is="choose" v-model="hour" :clists="[0, 23]"/>
        <div class="ctimedot">时</div>
        <div is="choose" v-model="minute" :clists="[0, 59]"/>
        <div class="ctimedot">分</div>
        <div is="choose" v-model="second" :clists="[0, 59]"/>
        <div class="ctimedot">秒</div>
      </div>
      <div class="taskattr center">
        <taskattr_item label="随机" v-model="random"/>
        <taskattr_item label="重复" v-model="repeat"/>
      </div>
      <div class="ataskcmd center">
        <label class="ataskcmd_label">任务命令：</label><textarea class="ataskcmd_input" v-model="taskcmd"/>
      </div>
      <div class="func center">
        <button class="btn btn--addtask" @click="newTask">开始任务</button>
        <button class="btn btn--addtask" @click="back">返回</button>
      </div>
    </div>
  `,
  methods: {
    newTask(){
      var body = {}
      if(this.name.length>=2) body.name = this.name
      else {
        alert("任务名至少两个字")
        return false
      }
      body.scdu = this.scdu == "exact" ? "exact" : "cdown"
      let time = Number(this.hour)*60*60 + Number(this.minute)*60 + Number(this.second)
      if(body.scdu=="cdown" && time<=10){
        alert("倒计时怎么也得大于10秒吧")
        return false
      } else {
        body.time = time
        body.countdown = time
      }
      if(this.taskcmd.length>=1) body.task = this.taskcmd
      else {
        alert("任务指令 输入有误")
        return false
      }
      body.repeat = this.repeat
      body.random = this.random

      body.stat = "running"
      let newtid = this.getRanStr()
      this.$set(app.tasklists, newtid, body)

      app.showtlist = true
      app.save()

      wsSend({op: "addnewtask", data: { tid: newtid, task: body}})
    },
    getRanStr(len = 8) {
      // 获取一个随机字符，默认长度为 6, 可自定义
      let b62 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
      let str = b62[Math.floor(Math.random()*52)]
      while(len--){
        str += b62[Math.floor(Math.random()*62)]
      }
      return str
    },
    back(){
      app.showtlist = true
    }
  }
})

Vue.component('addtaskpanel', {
  props: ['taskid', 'task'],
  data(){
    return {
      name: this.task.name,
      scdu: this.task.scdu,
      repeat: this.task.repeat,
      random: this.task.random,
      taskcmd: this.task.task,
      hour: 0,
      minute: 0,
      second: 15,
    }
  },
  beforeCreated(){
    [hour, minute, second] = gethms(this.task.time)
  },
  template: `
    <div class="ataskname">
      <div class="ataskname_div center"><label class="ataskname_label">任务名：</label><input  class="ataskname_input" v-model="name"/></div>
      <div class="center">
        <div is="choose" v-model="scdu" :clists="{cdown: '倒计时', exact: '定时'}" style="width: 120px" editabel="disabled"/>
        <div is="choose" v-model="hour" :clists="[0, 23]"/>
        <div class="ctimedot">时</div>
        <div is="choose" v-model="minute" :clists="[0, 59]"/>
        <div class="ctimedot">分</div>
        <div is="choose" v-model="second" :clists="[0, 59]"/>
        <div class="ctimedot">秒</div>
      </div>
      <div class="taskattr center">
        <taskattr_item label="随机" v-model="random"/>
        <taskattr_item label="重复" v-model="repeat"/>
      </div>
      <div class="ataskcmd center">
        <label class="ataskcmd_label">任务命令：</label><textarea class="ataskcmd_input" v-model="taskcmd"/>
      </div>
      <div class="func center">
        <button class="btn btn--addtask" @click="startTask">更新信息</button>
        <button class="btn btn--addtask" @click="back">返回</button>
      </div>
    </div>
  `,
  methods: {
    gethms(result){
      var h = Math.floor(result / 3600)
      var m = Math.floor((result / 60 % 60))
      var s = Math.floor((result % 60))
      return [h,m,s]
    },
    startTask() {
      var body = {}
      if(this.name.length>=2) body.name = this.name
      else {
        alert("任务名至少两个字")
        return false
      }
      body.scdu = this.scdu == "exact" ? "exact" : "cdown"
      let time = Number(this.hour)*60*60 + Number(this.minute)*60 + Number(this.second)
      if(body.scdu=="cdown" && time<=10){
        alert("倒计时怎么也得大于10秒吧")
        return false
      } else {
        body.time = time
        body.countdown = time
      }
      if(this.taskcmd.length>=1) body.task = this.taskcmd
      else {
        alert("任务指令 输入有误")
        return false
      }
      body.repeat = this.repeat
      body.random = this.random

      this.$set(app.tasklists, this.taskid, body)
 
      app.showtlist = true
      app.save()

      this.name = 'task ' + (Object.keys(app.tasklists).length + 1)
      this.taskcmd = ''
    },
    back(){
      app.showtlist = true
    }
  }
})

let app = new Vue({
  el: "#app",
  data: {
    showtlist: true,
    tasklists: {},
    edittasktid: ''
  },
  computed: {
    task(){
      return this.tasklists[this.edittasktid]
    }
  },
  created(){
    this.tasklists = localStorage.tasklists ? JSON.parse(localStorage.tasklists) : {}
    for (let taskid in this.tasklists) {
      // clog(this.tasklists[taskid].stat)
      this.tasklists[taskid].stat = "stoped"
    }
  },
  methods: {
    togtask(taskid){
      clog("togtask: " + taskid)
      if (this.tasklists[taskid].stat == "running") {
        wsSend({op: "pause", data: {tid: taskid}})
        this.$set(this.tasklists[taskid], "stat", "stoped")
      } else {
        wsSend({op: "start", data: {tid: taskid, task: this.tasklists[taskid]}})
        this.tasklists[taskid].stat = "running"
      }
    },
    newTask(){
      this.showtlist = false
      this.edittasktid = ''
    },
    save(){
      localStorage.tasklists = JSON.stringify(this.tasklists)
    }
  }
})

let wsport = 8080
let ws = new WebSocket("ws://" + location.hostname + ":" + wsport)

function wsSend(obj) {
  // ws.send 转换
  if (typeof(obj) == "object") {
    ws.send(JSON.stringify(obj))
  } else {
    ws.send(obj)
  }
}

ws.onopen = ()=>{
  clog("ws open port: " + wsport)
  // wsSend({op: "putall", data: app.tasklists})
}

ws.onmessage = ms=>{
  let res = JSON.parse(ms.data)
  switch(res.restype) {
    case "running":
      let tlist = res.data
      if(Object.keys(tlist).length>0) {
        app.tasklists = {...app.tasklists, ...tlist}
        app.save()
      }
      break
    case "countdown":
      clog(app.tasklists[res.data.tid].name + " 倒计时： " + res.data.countdown)
      app.tasklists[res.data.tid].countdown = res.data.countdown
      if (res.data.countdown <= 0) {
        app.tasklists[res.data.tid].stat = "stoped"
      }
      break
    case "repeat":
      clog("剩余重复次数： " + (res.data.repeat -1))
      app.tasklists[res.data.tid].repeat = res.data.repeat
      app.save()
      break
    case "random":
      clog("随机增加秒数： " + res.data)
      // app.tasklists[res.data.tid].random = res.data.random
      // app.save()
      break
    case "success":
      let tid = res.data.tid
      clog(app.tasklists[tid].name + " 任务完成", )
      app.tasklists[tid].stat = "stoped"
      app.tasklists[tid].countdown = app.tasklists[tid].time
      app.save()
      break
    case "fail":
      clog(res.data)
      break
    default:{
      break
    }
  }
}

ws.onclose = close=>{
  alert("与服务器连接断开" + close)
}

ws.onerror = error=>{
  alert("连接错误" + error)
}


