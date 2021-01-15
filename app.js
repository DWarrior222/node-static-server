var express = require('express')
var bodyParser = require('body-parser')
var fs = require('fs')
var path = require('path')
var multer = require('multer')
var upload = multer({
    dest: 'static/'
})

var types = require('./contentType').types
var config = require('./config')
var env = require('./env')

process.env = env
var staticPath = 'static'
var port = process.env.PORT || 3000

var app = express()

app.use(express.static(path.join(__dirname, 'public')))
app.set('views', './views')
app.set('view engine', 'jade')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: false
}))

app.listen(port)
console.log('listen port ' + port)

app.get('/', (req, res) => {
    res.render('upload', {})
})

app.get('/admin/upload', (req, res) => {
    res.render('upload', {})
})

app.get('/video', (req, res) => {
    res.render('video', {})
})


function fileTypeValidate(file) {
    if (!file) {
        return false
    }
    let type = file.mimetype
    let typeList = ['png', 'jpg', 'jpeg']
    let matchType = typeList.filter((item) => {
        return type === 'image/' + item
    })
    if (!matchType.length) {
        return false
    } else {
        return 1
    }
}

function fileSizeValidate(file) {
    if (!file) {
        return false
    }
    let size = file.size / 1000;
    if (size > 2048) {
        return false
    } else {
        return 1
    }
}

function deleteFile(files) {
    files = files || []
    files.forEach((item, index) => {
        fs.unlink(item.path, function (err) {
            if (err) {
                console.log(err)
            }
        })
    })
}

// 上传图片
app.post('/admin/uploadFile', upload.array('nss', 10), (req, res) => {
    let typeValidateResult = true
    let sizeValidateResult = true
    var files = req.files
    var urlList = []
    if (!files.length) {
        return res.json({
            code: 10001,
            msg: '请选择上传图片'
        })
    }
    files.forEach((item, index) => {
        if (!typeValidateResult || !sizeValidateResult) {
            return
        } else {
            typeValidateResult = fileTypeValidate(item)
            sizeValidateResult = fileSizeValidate(item)
        }

    })
    if (!typeValidateResult) {
        deleteFile(files)
        return res.json({
            code: 10001,
            msg: '文件类型不符合要求'
        })
    } else if (!sizeValidateResult) {
        deleteFile(files)
        return res.json({
            code: 10001,
            msg: '文件大小不符合要求'
        })
    } else {
        files.forEach((item, index) => {
            var reg = new RegExp(/\..+$/ig)
            var type = reg.exec(item.originalname)
            type = type ? type[0] : '.png'
            fs.renameSync(item.path, "./static/image/" + item.filename + type)
            urlList.push('/image/' + item.filename + type)
        })

        res.json({
            url_list: urlList
        })
    }
})

// 下载图片
app.get('/download/*', function (req, res) {
    let filePath = req.url.replace('/download', './static')

    fs.readFile(filePath, function (err, data) {
        if (err) {
            res.end("Read file failed!");
            return;
        }
        res.writeHead(200, {
            'Content-Type': 'application/octet-stream', //告诉浏览器这是一个二进制文件  
            'Content-Disposition': 'attachment;', //告诉浏览器这是一个需要下载的文件  
        });
        res.end(data)
    })
})

// 获取图片
app.get('/image/*', function (req, res) {
    var pathName = req.url
    var realPath = staticPath + pathName
    var ext = path.extname(realPath)
    ext = ext ? ext.slice(1) : 'unknown'
    var contentType = types[ext] || 'text/plain'

    // 设置Expires和max-age
    if (ext.match(config.Expires.fileMatch)) {
        // Date对象
        var expires = new Date()
        // 以毫秒设置 Date 对象
        expires.setTime(expires.getTime() + config.Expires.maxAge * 1000)
        // 设置Expires为一年之后的时间。浏览器在这个时间之前都使用缓存
        res.setHeader('Expires', expires.toUTCString())
        // 设置max-age为多久，浏览器会缓存多久
        res.setHeader('cache-control', 'max-age=' + config.Expires.maxAge)
        // res.setHeader('cache-control', 's-maxage=30')
    }
    // 可以查看文件的修改时间
    fs.stat(realPath, function (err, stat) {
        if (err || !stat) {
            res.set({
                'Content-Type': contentType,
            })
            res.status(500).end('Server exception')
        }

        // 获取文件最后修改的时间，根据世界时 (UTC) 把 Date 对象转换为字符串
        var lastModified = stat.mtime.toUTCString()
        // 设置头部的Last-modified
        res.setHeader('Last-modified', lastModified)
        // 如果请求header中的if-modified-since存在而且和件最后修改的时间相符，则返回304，否则返回新的资源
        if (req.headers['if-modified-since'] && lastModified === req.headers['if-modified-since']) {
            res.status(304).end('Not Modified')
        } else {
            fs.exists(realPath, function (exists) {
                if (!exists) {
                    // 没有文件，返回404
                    res.set({
                        'Content-Type': contentType,
                    })
                    res.status(404).end('not found resources:' + pathName)
                } else {
                    // 读取文件内容并返回
                    fs.readFile(realPath, 'binary', function (err, file) {
                        if (err) {
                            res.set({
                                'Content-Type': contentType,
                            })
                            res.status(500).end('Server exception')
                        } else {
                            res.set({
                                'Content-Type': contentType,
                            })
                            res.write(file, 'binary')
                            res.status(200).end()
                        }
                    })
                }
            })
        }
    })
})

// 获取视频
app.get('/video/*', function (req, res) {
    var pathName = req.url
    var realPath = staticPath + pathName
    let head = {
        'Content-Type': 'video/mp4'
    };
    // 需要设置HTTP HEAD
    res.writeHead(200, head);
    fs.createReadStream(realPath)
        .pipe(res);
})