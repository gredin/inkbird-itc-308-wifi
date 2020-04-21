// TODO
process.env["NODE_CONFIG_DIR"] = __dirname + '/../config/'

import * as config from 'config'
import * as AWS from 'aws-sdk'
import {Config, DynamoDB} from 'aws-sdk'
import {DeviceStatusFetcher, DeviceStatus} from './tuya'
import {AWSError} from "aws-sdk";
import {QueryOutput} from "aws-sdk/clients/dynamodb";

const tableName = 'DeviceStatus'

const tableCreationParams = {
    TableName: tableName,
    KeySchema: [
        {AttributeName: 'deviceId', KeyType: 'HASH'},
        {AttributeName: 'timestamp', KeyType: 'RANGE'}
    ],
    AttributeDefinitions: [
        {AttributeName: 'deviceId', AttributeType: 'S'},
        {AttributeName: 'timestamp', AttributeType: 'N'}
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1
    }
}

class DeviceStatusStorage {
    dynamoDB: DynamoDB
    documentClient: DynamoDB.DocumentClient

    constructor() {
        AWS.config.update({
            accessKeyId: config.get('aws.dynamodb.accessKeyId_encrypted'),
            secretAccessKey: config.get('aws.dynamodb.secretAccessKey_encrypted'),
            region: config.get('aws.dynamodb.region')
        })

        // TODO
        // @ts-ignore
        AWS.config.update({endpoint: config.get('aws.dynamodb.endpoint')})

        this.dynamoDB = new AWS.DynamoDB()
        this.documentClient = new AWS.DynamoDB.DocumentClient(
            {
                httpOptions: {
                    connectTimeout: 1000 * <number>config.get('aws.dynamodb.timeoutInSeconds'),
                    timeout: 1000 * <number>config.get('aws.dynamodb.timeoutInSeconds')
                },
                maxRetries: config.get('aws.dynamodb.maxRetries')
            }
        )
    }

    async createTable() {
        return new Promise((resolve, reject) => {
            this.dynamoDB.createTable(tableCreationParams, function (err, data) {
                if (err) {
                    return reject(err)
                }

                resolve(data)
            })
        })
    }

    async insertDeviceStatus(deviceStatus: DeviceStatus) {
        let params = {
            TableName: tableName,
            Item: {
                'timestamp': deviceStatus.timestamp,
                'deviceId': deviceStatus.deviceId,
                'status': deviceStatus
            }
        }

        return new Promise((resolve, reject) => {
            this.documentClient.put(params, function (err, data) {
                if (err) {
                    return reject(err)
                }

                resolve(data)
            })
        })
    }

    async getDeviceStatusesBetween(deviceId: string, timestampStart: number, timestampEnd: number) {
        let params = {
            TableName: tableName,
            KeyConditionExpression: '#d = :deviceId AND #t BETWEEN :start and :end',
            ExpressionAttributeNames: {
                '#d': 'deviceId',
                '#t': 'timestamp'
            },
            ExpressionAttributeValues: {
                ':deviceId': {S: `${deviceId}`},
                ':start': {N: `${timestampStart}`},
                ':end': {N: `${timestampEnd}`}
            }
        }

        return new Promise((resolve, reject) => {
            this.dynamoDB.query(params, function (err: AWSError, data: QueryOutput) {
                if (err) {
                    return reject(err)
                }

                //TODO any
                let deviceStatuses = (<any>data.Items).map((item: any) => new DeviceStatus(
                    <string>item.deviceId.S,
                    Number(<string>item.timestamp.N),
                    //TODO any
                    Number(<string>(<any>item.status.M).currentTemperature.N),
                    //TODO any
                    Number(<string>(<any>item.status.M).temperatureSetpoint.N)))

                resolve(deviceStatuses)
            })
        })
    }
}

export {DeviceStatusStorage}
