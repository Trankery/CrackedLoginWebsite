const jsrender = require('jsrender');

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const authentication = require('./authentication.js');
const database = require('./database.js');
const mcstatus = require('./mcstatus.js');
const secrets = require("./secrets.json");

var port = process.env.PORT || 8080;
var db = new database(secrets.mysql['host'], secrets.mysql['database'], secrets.mysql['user'], secrets.mysql['password']);
var mc = new mcstatus(secrets.minecraft['host']);

const app = express();

/*  Middleware  */
// add middleware to parse post requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// add middleware to parse cookies in requests
app.use(cookieParser());

// add middleware to authenticate a user using Microsoft OAuth API
app.use(authentication.authenticate);

// add middleware to determine a user's registration status
app.use((req, res, next) => {
    if (req.user.isAuthenticated) {
        db.getRegistrationStatus(req.user.email).then((info) => {
            if ('error' in info) // couldn't perform the db lookup
                req.user.error = info['error'];
            else { // update the user with information about registration
                req.user['isRegistered'] = info.isRegistered;
                req.user['canJoin'] = info.canJoin;
                req.user['username'] = info.username;
            }
            next();
        });
    } else
        next();
})


/*  Routing  */
// route get requests to the home page
app.get('/', (req, res) => {
    if (req.query.message)
        req.user.message = req.query.message;
    send(res, {
        content: template('home.html').render({
            user: req.user,
            status: mc.getStatus()
        }),
        contentType: "text/html",
        statusCode: 200
    });
});

app.post('/register', (req, res) => {
    if (req.user.isAuthenticated && req.user.canJoin) {
        console.log(req.user);
        if (req.user.isRegistered) { // updating a password
            db.updatePassword(req.user.username, req.body.password);
        } else { // registering a new username
            db.register(req.user.email, req.body['username'], req.body['password']);
        }
    }
    res.setHeader('Location', '/');
    send(res, {
        contentType: "text/html",
        statusCode: 302
    });
});

app.get('/auth', (req, res) => {
    if ('username' in req.query && req.query['username'] && 'q' in req.query && req.query['q']) {
        db.getPlayerStatus(req.query['username']).then((status) => {
            if ('error' in status) 
                send(res, {
                    contentType: "text/html",
                    statusCode: 200
                });
            else {
                var result = ''
                switch (req.query['q']) {
                    case 'canJoin':
                        result = status.canJoin;
                        break;
                    case 'isRegistered':
                        result = status.isRegistered;
                        break;
                    case 'isBanned':
                        result = status.isBanned;
                        break;
                    case 'canAuthenticate':
                        result = status.canAuthenticate(req.query['password']);
                        break;
                    case 'getOwner':
                        result = `${status.firstname} ${status.lastname} (${status.email})`;
                        break;
                }
                send(res, {
                    content: result.toString(),
                    contentType: "text/html",
                    statusCode: 200
                });
            }
        })
    } else {
        send(res, {
            contentType: "text/html",
            statusCode: 200
        });
    }

});

app.use('/static', express.static('public/static'));

app.use((req, res, next) => {
    send(res, {
        content: template('error.html').render({
            errorCode: 404,
            error: "Page not found",
            message: "The page that you requested could not be found.",
            user: req.user,
            status: mc.getStatus()
        }),
        contentType: "text/html",
        statusCode: 404
    });
})

app.listen(port, () => {
    console.log(`Listening on :${port}`);
})

function send(res, page) {
    if ('promise' in page) {
        page['promise'].then((content) => {
            page['content'] = content;
            page['promise'] = null;
            send(res, page);
        })
    } else {
        res.writeHead(page['statusCode'], {
            'Content-Type': page['contentType']
        });
        if ('content' in page)
            res.write(page['content']);
        res.end();
    }
}

function template(name, directory = './public/templates/') {
    return jsrender.templates(directory + name);
}