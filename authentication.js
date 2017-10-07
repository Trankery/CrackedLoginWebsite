const request = require('request');

/**
 * Authentication tools for authenticating a request.
 */
class Authentication {
    /**
     * Adds information about the user of the given request to the request.
     * @param {request} req The request.
     * @param {response} res The response.
     * @param {middleware} next The next middleware.
     */
    static authenticate(req, res, next) {
        req.user = {};
        req.user['isAuthenticated'] = false;
        if (req.url == '/login' || req.url == '/logout') {
            var redirect = (req, res) => {
                res.writeHead(302, {
                    'Location': '/'
                });
                res.end();
            };
            if (req.url == '/login')
                Authentication.getToken(req, res).then((token) => {
                    redirect(req, res);
                });
            else {
                Authentication.deleteCookie('access_token', req, res);
                redirect(req, res);
            }
        } else { // try to lookup the user using current authentication
            Authentication.getUserInfo(req, res).then((info) => {
                if (info) {
                    req.user['email'] = info['mail'];
                    req.user['firstname'] = info['givenName'];
                    req.user['lastname'] = info['surname'];
                    req.user['isAuthenticated'] = true;
                }
                next();
            });
        }
    }
    /**
     * Gets information about the user of the given request.
     * @param {request} req The request.
     * @param {response} res The response.
     * @return The user information.
     */
    static getUserInfo(req, res) {
        return new Promise((resolve) => {
            Authentication.getToken(req, res).then((token) => {
                if (token)
                    request.get({
                        url: 'https://graph.microsoft.com/v1.0/me',
                        headers: {
                            'Authorization': 'Bearer ' + token,
                            'Content-Type': 'application/json'
                        }
                    }, (error, status, data) => {
                        var response = JSON.parse(data);
                        if (!('error' in response))
                            resolve(response);
                        else {
                            Authentication.deleteCookie('access_token', req, res);
                            resolve();
                        }
                    });
                else
                    resolve();
            })
        });
    }
    /**
     * Gets the access token for the user of the given request.
     * @param {request} req The request.
     * @param {response} res The response.
     * @return The token if it could be determined.
     */
    static getToken(req, res) {
        return new Promise((resolve) => {
            if (req.body && req.body.code && req.url == '/login') {
                var code = req.body.code;
                Authentication.requestAccessToken(req, res).then((token) => {
                    if (token)
                        resolve(token);
                    else
                        resolve(req.cookies ? req.cookies['access_token'] : null);
                });
            } else {
                resolve(req.cookies ? req.cookies['access_token'] : null);
            }
        });
    }
    /**
     * Requests a new access token.
     * @param {request} req The request.
     * @param {response} res The response.
     * @return The new access token, or false it it could not be obtained.
     */
    static requestAccessToken(req, res) {
        return new Promise((resolve) => {
            var params = {
                client_id: '298a9688-c92e-4f8f-bc8c-baddcc5d1970',
                grant_type: 'authorization_code',
                scope: 'User.Read',
                code: req.body.code,
                redirect_uri: req.uri,
            };
            request.post({ url: 'https://login.microsoftonline.com/wpi.edu/oauth2/v2.0/token', form: params }, (error, status, data) => {
                var response = JSON.parse(data);
                if ('access_token' in response) {
                    res.setHeader('Set-Cookie', `access_token=${response['access_token']}; Expires=${response['expires_on']}`);
                    resolve(response['access_token']);
                }
                else
                    resolve();
            })
        });
    }
    /**
     * Deletes a cookie.
     * @param {string} name The name of the cookie.
     * @param {request} req The request.
     * @param {response} res The response.
     */
    static deleteCookie(name, req, res) {
        res.setHeader('Set-Cookie', `${name}=; Max-Age=-1`);
    }
}
module.exports = Authentication;