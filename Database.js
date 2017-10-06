const mysql = require('mysql');

const secrets = require("./secrets.json");

/**
 * A database used to query, add, remove and modify movies.
 */
class Database {
    /**
     * Creates a new database.
     */
    constructor() {
        this.connection = mysql.createConnection({
            host: secrets['host'],
            user: secrets['user'],
            database: secrets['database'],
            password: secrets['password']
        });
        this.connection.connect(function (err) {
            if (err) throw err;
        });
    }
    /**
     * Adds a movie to the datbase.
     * @param {string} title The title of the movie.
     * @param {int} releaseYear The release year of the movie.
     * @param {string} description The description for the movie.
     * @return A promise whose resolve parameter is the result of the add.
     */
    add(title, releaseYear, description = "") {
        return this.query(`INSERT INTO movies (title, release_year, description) VALUES ("${title}", "${releaseYear}", "${description}");`);
    }
    /**
     * Edits an existing movie in the datbase.
     * @param {int} id The ID of the movie.
     * @param {string} title The title of the movie.
     * @param {int} releaseYear The release year of the movie.
     * @param {string} description The description for the movie.
     * @return A promise whose resolve parameter is the result of the add.
     */
    edit(id, title, releaseYear, description = "") {
        return this.query(`UPDATE movies SET title="${title}", release_year="${releaseYear}", description="${description}" WHERE id=${id}`);
    }
    /**
     * Searches for a movie with the given title.
     * @param {string} title The title to search for.
     * @return A promise whose resolve parameter is a list of movies matching the given title.
     */
    search(title) {
        return this.query(`SELECT * FROM movies WHERE title LIKE "%${title}%"`);
    }
    /**
     * Removes a movie from the database.
     * @param {int} id The movie ID to remove.
     * @return A promise whose resolve parameter is the result of the remove.
     */
    remove(id) {
        return this.query(`DELETE FROM movies WHERE id=${id};`);
    }
    /**
     * Queries the database.
     * @param {string} query The query.
     * @return A promise whose resolve parameter is the result of the query.
     */
    query(query) {
        return new Promise((resolve) => {
            this.connection.query(query, function (error, result) {
                resolve(result);
            });
        });
    }
}
module.exports = Database;