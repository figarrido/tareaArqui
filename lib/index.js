import http from 'http'
import mongoose, { Schema } from 'mongoose'

const port = 8888
mongoose.connect('mongodb://localhost:27017/ipRegister', {
  useMongoClient: true
})
const db = mongoose.connection
mongoose.Promise = global.Promise

const IP = mongoose.model('ip', new Schema({
  ip: String,
  created_at: Date
}))

http.createServer((req, res) => {
  if (req.url !== '/') return
  res.writeHead(200, {'Content-Type': 'text/plain'})

  let address = req.connection.remoteAddress
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
          res.end(JSON.stringify(docs))
        })
    })

}).listen(port)

console.log(`Server running at http://localhost:${port}/`)
