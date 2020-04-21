// TODO
process.env["NODE_CONFIG_DIR"] = __dirname + '/../config/'

import * as express from 'express'
import * as config from 'config'
import {DeviceStatusStorage} from './dynamodb'

export = {}

const port = <number>config.get('webserver.port')

const app = express()

const storage = new DeviceStatusStorage()

const deviceId = <string>config.get('deviceId_encrypted')

//console.log(config.get('openapi.region'))
//console.log(process.env)

class Error {
    statusCode: number
    message: string

    constructor(statusCode: number, message: string) {
        this.statusCode = statusCode
        this.message = message
    }

    send(res: express.Response) {
        res.status(this.statusCode).json(this)
    }
}

app.get('/health', (req, res) => {
    res.json({message: 'I\'m fine, thank you!'})
})

app.get('/device-status', async (req, res) => {
    let start = Number(req.query.start)
    let end = Number(req.query.end)

    if (isNaN(start) || isNaN(end)) {
        return new Error(404, 'Numeric start and end timestamps must be provided.').send(res)
    }

    let now = new Date().getTime()
    let aLongTimeAgo = now - 1000 * 3600 * 24 * 365 * 10

    if (end <= start) {
        return new Error(422, 'End timestamp must be greater than start timestamp.').send(res)
    }

    if (start < aLongTimeAgo) {
        return new Error(422, 'Requested start timestamp was a long time ago.').send(res)
    }

    if (start > now) {
        return new Error(422, 'Start timestamp must be in the past.').send(res)
    }

    try {
        let deviceStatuses = await storage.getDeviceStatusesBetween(deviceId, start, end)

        res.json(deviceStatuses)
    } catch (e) {
        console.log(e)
        return new Error(500, 'Device status storage failed.').send(res)
    }
})

app.listen(port, function () {
    console.log(`Web server listening on port ${port}`)
})
