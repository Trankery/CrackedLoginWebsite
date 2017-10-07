const mysql = require('mysql');
const hash = require('password-hash');

const secrets = require("./secrets.json");

/**
 * A database used to query, add, remove and modify movies.
 */
class Database {
    /**
     * Creates a new database with the given connection parameters.
     * @param {string} host The host.
     * @param {string} database The database.
     * @param {string} user The user.
     * @param {string} password The password.
     */
    constructor(host, database, user, password) {
        this.connection = mysql.createConnection({
            host: host,
            database: database,
            user: user,
            password: password,
        });
        this.connection.on('error', (err) => {
            console.log(err);
            this.error = true;
            this.message = err['sqlMessage'];
        })
    }
    /**
     * Gets information about an account's registration status.
     * @param {string} email The email address.
     * @return The registration status.
     */
    getRegistrationStatus(email) {
        return new Promise((resolve) => {
            this.query(`SELECT * FROM users WHERE email = ${mysql.escape(email)};`).then((data) => {
                if (data)
                    resolve({
                        canJoin: data.length > 0,
                        isRegistered: data.length > 0 ? data[0]['username'] != null : false,
                        username: data.length > 0 ? data[0]['username'] : null
                    });
                else
                    resolve({ error: this.message });
            });
        });
    }
    /**
     * Gets information about an account's player status.
     * @param {string} username The registered username.
     * @return The player status.
     */
    getPlayerStatus(username) {
        return new Promise((resolve) => {
            this.query(`SELECT * FROM users WHERE username = ${mysql.escape(username)};`).then((data) => {
                if (data)
                    resolve({
                        canJoin: data.length > 0,
                        isRegistered: data.length > 0,
                        isBanned: false,
                        email: data.length > 0 ? data[0].email : null,
                        firstname: data.length > 0 ? data[0].firstname : null,
                        lastname: data.length > 0 ? data[0].lastname : null,
                        canAuthenticate: (password) => {
                            return data.length > 0 ? hash.verify(password, data[0].password) : false;
                        }
                    });
                else
                    resolve({ error: this.message });
            });
        });
    }
    /**
     * Updates the password of a given account.
     * @param {string} username The username.
     * @param {string} password The new password.
     */
    updatePassword(username, password) {
        console.log(username);
        return this.query(`UPDATE users SET password=${mysql.escape(hash.generate(password))} WHERE username=${mysql.escape(username)};`);
    }
    /**
     * Registers a username and password to an existing account.
     * @param {string} email The email address.
     * @param {string} username The unique username.
     * @param {string} password The password.
     */
    register(email, username, password) {
        return this.query(`UPDATE users SET username=${mysql.escape(username)},password=${mysql.escape(hash.generate(password))} WHERE email=${mysql.escape(email)};`);
    }
    /**
     * Queries the database.
     * @param {string} query The query.
     * @return A promise whose resolve parameter is the result of the query.
     */
    query(query) {
        return new Promise((resolve) => {
            if (this.error) {
                resolve()
            }
            else
                this.connection.query({ sql: query, timeout: 1000 }, function (error, result) {
                    resolve(result, error);
                });
        });
    }
}
module.exports = Database;