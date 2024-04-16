const fs = require('fs')

const data = fs.readFileSync('.env.local.json', 'utf8')
const jsonData = JSON.stringify(JSON.parse(data))
const envContent = `CONFIG=${jsonData}`
fs.writeFileSync('.env.local', envContent)
