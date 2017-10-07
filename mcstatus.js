const query = require('mcquery');

var q;
/**
 * A tool for checking the status of a Minecraft server.
 */
class MCStatus {
    /**
     * Creates a new status checker for the given server.
     * @param {string} host The host.
     * @param {int} interval The number of seconds between checks.
     */
    constructor(host, interval = 60) {
        q = new query(host, 25565, { timeout: 10000 });
        this.updateStatus();
        setInterval(this.updateStatus, interval * 1000)
    }
    /**
     * Gets the last known status of the Minecraft server.
     * @return The status.
     */
    getStatus() {
        return this.status;
    }
    /**
     * Updates the known status of the Minecraft server.
     */
    updateStatus() {
        q.connect((err) => {
            q.full_stat((err, response) => {
                console.log(response);
                var status = {
                    host: q.address()['address']
                };
                if (response) {
                    status['online'] = true;
                    status['playerCount'] = response['numplayers'];
                    status['playerMax'] = response['maxplayers'];
                    status['players'] = response['player_'];
                    status['version'] = response['version']
                } else {
                    status['online'] = false;
                }
                console.log(status);
                this.status = status;
            })
        })
    }
}
module.exports = MCStatus;