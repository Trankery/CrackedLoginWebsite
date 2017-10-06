const fs = require('fs');
const http = require('http');
const jsrender = require('jsrender');
const mime = require('mime');
const qs = require('querystring');
const url = require('url')

const Database = require('./Database.js');

var port = process.env.PORT || 8080;
var db = new Database();

http.createServer(function (req, res) {
    var uri = url.parse(req.url);
    for (var match in pages) {
        if (new RegExp(match).test(uri.pathname)) {
            var page = pages[match](req);
            if (page) {
                send(res, page);
                return;
            }
        }
    }
}).listen(port);

function send(res, page) {
    res.writeHead(page['statusCode'], {
        'Content-Type': page['contentType']
    });
    if ('content' in page) {
        res.write(page['content']);
        res.end();
    } else if ('promise' in page) {
        page['promise'].then((content) => {
            res.write(content);
            res.end();
        });
    }
}

var pages = {
    '^/$': function (req) {
        return {
            promise: new Promise((resolve) => {
                resolve("Hi!");
                // resolve(template('search.html').render({
                //     title: "Search",
                //     query: "",
                //     results: []
                // }));
            }),
            contentType: "text/html",
            statusCode: 200
        };
    },
    '^/auth': function (req) {
        return {
            promise: new Promise((resolve) => {
                resolve("auth");
                // db.search(query).then(function (movies) {
                //     resolve();
                // });
            }),
            contentType: "application/json",
            statusCode: 200
        };
    },
    '^/static/': function (req) {
        var file = './public/' + url.parse(req.url).path;
        if (fs.existsSync(file))
            return {
                promise: new Promise((resolve) => {
                    fs.readFile(file, function (error, content) {
                        resolve(content);
                    });
                }),
                contentType: mime.getType(file),
                statusCode: 200
            };
        else
            return;
    },
    '^.*$': function (req) {
        return {
            content: template('404.html').render({
                title: "Page Not Found"
            }),
            contentType: "text/html",
            statusCode: 404
        };
    }
}

function template(name, directory = './public/templates/') {
    return jsrender.templates(directory + name);
}