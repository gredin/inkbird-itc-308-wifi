// TODO
process.env["NODE_CONFIG_DIR"] = __dirname + '/../config/'

import * as config from 'config'
import {DeviceStatusFetcher, DeviceStatus} from './tuya'
import {DeviceStatusStorage} from './dynamodb'

const refreshIntervalInMilliseconds = <number>config.get('refreshIntervalInSeconds') * 1000

const deviceId = <string>config.get('deviceId_encrypted')

const fetcher = new DeviceStatusFetcher()

const storage = new DeviceStatusStorage()

console.log(`DynamoDB endpoint: ${config.get('aws.dynamodb.endpoint')}`)

//console.log(process.env)

async function processDeviceStatus() {
    let deviceStatus = await fetcher.getDeviceStatus(deviceId)

    console.log(`Device status fetched: ${JSON.stringify(deviceStatus)}`)

    await storage.insertDeviceStatus(deviceStatus)
}

async function startWorker() {
    try {
        await storage.createTable()
    } catch (e) {
        if (e.code == 'ResourceInUseException') {
            console.log("DynamoDB table already exists")
        } else {
            throw e
        }
    }

    processDeviceStatus()

    setInterval(processDeviceStatus, refreshIntervalInMilliseconds)
}

startWorker()

export = {}
