import http from 'http'
import mustache from 'mustache'
import fs from 'fs'
import mongoose, { Schema } from 'mongoose'

const port = 8080
mongoose.Promise = global.Promise
process.env.TZ = 'Chile/Continental'
const render = (write, data) => {
  return (err, buf) => {
    let template = buf.toString('utf8')
    let html = mustache.to_html(template, data)
    write(html)
  }
}

mongoose.connect('mongodb://localhost:27017/ipRegister', {
  useMongoClient: true
})
const db = mongoose.connection
db.on('error', err => console.log(err.message))

const IP = mongoose.model('ip', new Schema({
  ip: String,
  created_at: Date
}))

http.createServer((req, res) => {
  if (req.url !== '/') return
  res.writeHead(200, {'Content-Type': 'text/html'})

  let remoteAddress = req.connection.remoteAddress.split(':')
  let address = req.headers['x-forwarded-for'] || remoteAddress[remoteAddress.length - 1]
  let newIp = new IP({
    ip: address,
    created_at: Date.now()
  })

  newIp.save()
    .then(() => {
      IP.find()
        .limit(10)
        .sort({
          created_at: -1
        })
        .then((docs) => {
          let data = {connections: []}
          for (let i = 0; i < docs.length; i++) {
            data.connections.push({
              ip: docs[i].ip,
              date: docs[i].created_at.toLocaleTimeString()
            })
          }
          fs.readFile('template/template.mustache', render(html => {
            res.write(html)
            res.end()
          }, data))
        })
    })

}).listen(port)

console.log(`Server running at http://localhost:${port}/`)
