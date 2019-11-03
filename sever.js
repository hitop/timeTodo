const ws = require('ws')
const express = require('express')
const bodyParser = require('body-parser')
// const shortid = require('shortid')
// const fs = require('fs')
const { exec } = require('child_process')

const app = express()

app.use(express.static(__dirname + '/client'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*')
//   res.header(
//     'Access-Control-Allow-Headers',
//     'Origin, X-Requested-With, Content-Type, Accept, Authorization'
//   )
//   if (req.method === 'OPTIONS') {
//     res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
//     return res.status(200).json({})
//   }
//   next()
// })

app.get("/", (req, res)=>{
  res.readFile(__dirname + "/client")
})

var task = {}

const port = 7560
app.listen(port, ()=>{
  console.log("port: " + port)
})


var runningtasks = {}

function taskpause(tid) {
  // 暂停任务
  task[tid].stat = "stoped"
  clearInterval(runningtasks[tid])
  console.log("task: %s pause", task[tid].name)
}

function taskstart(tid) {
  // 开始任务
  console.log("task: %s start", task[tid].name)
  task[tid].stat = "running"
  if(task[tid].random) {
    let rand = Math.floor(Math.random()*Number(task[tid].random))
    task[tid].countdown = Number(task[tid].countdown) + rand
    wsSendSer({restype: "random", data: {tid: tid, random: rand}})
  }
  runningtasks[tid] = setInterval(()=>{
    if(task[tid].countdown>0) {
      task[tid].countdown--
      wsSendSer({restype: "countdown", data: {tid: tid, countdown: task[tid].countdown}})
    } else {
      clearInterval(runningtasks[tid])
      console.log("运行命令： %s", task[tid].task)
      exec(task[tid].task, (error, stdout)=>{
        if (error) {
          wsSendSer({restype: "fail", data: error})
        } else {
          stdout ? console.log("stdout: %s repeat: %d", stdout, task[tid].repeat-1) : console.log("job done")
          if(task[tid].repeat>1) {
            task[tid].repeat--
            task[tid].countdown = task[tid].time
            taskstart(tid)
            wsSendSer({restype: "repeat", data: {tid: tid, repeat: task[tid].repeat}})
          } else {
            // task[tid].stat="stoped"
            wsSendSer({restype: "success", data: {tid: tid}})
            delete task[tid]
          }
        }
      })
    }
  }, 1000)
}


const wss = new ws.Server({ port: 8080 })

let gws

wss.on('connection', (ws)=>{
  gws = ws
  wsSendSer({restype: "running", data: getrunningtid()})
  ws.on('message', (ctask)=>{
    ctask = JSON.parse(ctask)
    console.log('received task: %s', ctask.op)
    switch(ctask.op){
      case "start":
        // 开始任务
        task[ctask.data.tid] = ctask.data.task
        taskstart(ctask.data.tid)
        break
      case "pause":
        // 暂停任务
        taskpause(ctask.data.tid)
        break
      case "delete":
        // 删除任务
        taskpause(ctask.data.tid)
        delete task[ctask.data.tid]
        break
      case "addnewtask":
        // 添加一个新的任务
        task[ctask.data.tid] = ctask.data.task
        taskstart(ctask.data.tid)
        break
      default:{
        break
      }
    }
  })
})

function wsSendSer(obj){
  // ws.send 转换
  if (typeof(obj) == "object") {
    obj = JSON.stringify(obj)
  }
  wss.clients.forEach(client=>{
    if (client.readyState === ws.OPEN) {
      client.send(obj)
    }
  })
}

function getrunningtid(){
  let ru = {}
  for(let runtid in task) {
    if(task[runtid].stat == "running") ru[runtid] = task[runtid]
  }
  return ru
}