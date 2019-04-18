const http = require('http')
const path = require('path')
const fs = require('fs')

function getIPAdress() {
  var interfaces = require('os').networkInterfaces();
  for (var devName in interfaces) {
    var iface = interfaces[devName];
    for (var i = 0; i < iface.length; i++) {
      var alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
      }
    }
  }

  return ''
}

module.exports = function createMockServer(dir, PORT, title) {
  if (title) {
    process.title = title
  }

  PORT = PORT || 3000

  function parseFileModel(filename) {
    const ext = path.extname(filename)
    const model = {
      name: filename.replace(ext, ''),
      filename: path.join(process.cwd(), dir, filename)
    }
    return model
  }

  const apis = {}
  let fileWatcher = null

  function watchFile(file) {
    return fs.watch(file, (eventType, filename) => {
      console.log('eventType: %s, filename: %s', eventType, filename)
      // 新建文件test.js eventType: rename, filename: test.js
      // 重命名文件 test.js为 docs.js eventType: rename, filename: docs.js
      // 修改文件test.js eventType: change, filename: test.js
      if (filename) {
        const model = parseFileModel(filename)
        delete require.cache[model.filename]
        // fix 190401 文件重命名要检查文件是否存在
        if (fs.existsSync(model.filename)) {
          apis[model.name] = require(model.filename)
        } else {
          delete apis[model.name]
        }
      }
      // console.log('apis: %j', apis)
    })
  }

  const mockServer = http.createServer((req, res) => {
    try {
      const {
        url
      } = req
      const Url = require('url').parse(url)
      const pathname = Url.pathname

      // mock
      if (pathname.startsWith('/mock')) {
        const _path = pathname.replace('/mock', '')
        const segment0 = _path.replace(/\/(\w+)([\/\w]*)/, "$1")
        const json = apis[segment0.replace(/\w/, segment0.charAt(0).toLowerCase())][_path]
        if (req.headers.origin) {
          res.setHeader('Access-Control-Allow-Origin', req.headers.origin)
        }
        res.setHeader('Access-Control-Allow-Credentials', true)
        res.setHeader('Access-Control-Allow-Headers', 'token,content-type')
        // 默认json utf-8
        res.setHeader('content-type', 'application/json;charset=UTF-8')
        res.end(JSON.stringify(json))
      }
      
    } catch (error) {
      console.error(error)
    }
  })

  mockServer.on('error', err => {
    console.error(err)

    // 端口被占用
    if (err.code === 'EADDRINUSE') {
      console.log('端口被占用, 自动重试中...');
      setTimeout(() => {
        mockServer.close();
        PORT++
        mockServer.listen(PORT, '0.0.0.0');
      }, 1000);
    }
  })

  const listenerCallback = () => {
    const address = mockServer.address()
    console.log(`local server listening http://${address.address}:${address.port}`)
    console.log(`network server listening http://${getIPAdress()}:${address.port}`)
    const mockPath = path.join(process.cwd(), dir)

    fs.readdir(mockPath, (err, files) => {
      if (err) {
        console.error(err)
        return
      }

      console.log('files', files)

      files.forEach(file => {
        const model = parseFileModel(file)
        const filePath = path.join(process.cwd(), dir, file)
        apis[model.name] = require(filePath)
      })
    })

    fileWatcher = watchFile(mockPath)
  }

  mockServer.listen(PORT, '0.0.0.0', listenerCallback)

  // 进程退出前关闭文件watch
  process.on('exit', (code) => {
    console.log(`退出码: ${code}`);
    if (fileWatcher) {
      fileWatcher.close()
    }
  });

  process.on('beforeExit', (code) => {
    console.log(`beforeExit 退出码: ${code}`);
    if (fileWatcher) {
      fileWatcher.close()
    }
  });

  return mockServer
}