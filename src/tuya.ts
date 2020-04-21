// TODO
process.env["NODE_CONFIG_DIR"] = __dirname + '/../config/'

import config = require('config')
import {OpenAPI} from './openapi'

class DeviceStatus {
    deviceId: string
    timestamp: number
    currentTemperature: number
    temperatureSetpoint: number

    constructor(deviceId: string, timestamp: number, currentTemperature: number, temperatureSetpoint: number) {
        this.deviceId = deviceId
        this.timestamp = timestamp
        this.currentTemperature = currentTemperature
        this.temperatureSetpoint = temperatureSetpoint
    }

    static fromRawStatus(deviceId: string, status: any) { // TODO: any
        let timestamp = new Date().getTime()
        let currentTemperature: number = 0
        let temperatureSetpoint: number = 0

        for (let data of status) {
            if (<string>data.code === 'temp_current') {
                currentTemperature = <number>data.value / 10
            }

            if (<string>data.code === 'temp_set') {
                temperatureSetpoint = <number>data.value / 10
            }
        }

        return new this(deviceId, timestamp, currentTemperature, temperatureSetpoint)
    }
}


class DeviceStatusFetcher {
    api: OpenAPI

    constructor() {
        this.api = new OpenAPI({
            key: config.get('openapi.key_encrypted'),
            secret: config.get('openapi.secret_encrypted'),
            schema: config.get('openapi.schema'),
            region: config.get('openapi.region')
        })
    }

    async getDeviceStatus(deviceId: string) {
        let rawStatus = await this.api.getDeviceStatus(deviceId)

        return DeviceStatus.fromRawStatus(deviceId, rawStatus)
    }
}

export {
    DeviceStatusFetcher,
    DeviceStatus
}

