import { GetWsParam, IGuild, IChannel, IMessage, AvailableIntentsEventsEnum, createOpenAPI, createWebsocket } from 'qq-guild-bot'
import { RestyResponse } from 'resty-client'
import SteamID from 'steamid'
import dotenv from 'dotenv'
import * as whitelist from './whitelist'
import logger from './winston'

dotenv.config()

const testConfig: GetWsParam = {
    appID: process.env.BOT_APP_ID as string,
    token: process.env.BOT_APP_TOKEN as string,
    intents: [AvailableIntentsEventsEnum.GUILDS, AvailableIntentsEventsEnum.GUILD_MESSAGES],
    sandbox: false, // default to false. v2.7.0+
}

let GUILD_ID: string

let CHANNEL_ID: string

const client = createOpenAPI(testConfig)

// establish websocket connection
const ws = createWebsocket(testConfig)



// client.meApi.meGuilds()
//     .then((res: RestyResponse<IGuild[]>) => {

//         console.log('guilds', res.data)

//         const guild = res.data.find(guild => guild.name === 'AXE 测试频道') as IGuild

//         return guild.id

//     })
//     .then((guildId: string) => {

//         console.log('got guild id', guildId)

//         GUILD_ID = guildId

//         return client.channelApi.channels(guildId)

//     })
//     .then((res: RestyResponse<IChannel[]>) => {

//         // console.log('channels', res.data)

//         const channel = res.data.find(channel => channel.name === '白名单')

//         if (channel) {
//             console.log("got channel id", channel.id)

//             CHANNEL_ID = channel.id
//         }

//     })
//     .catch(err => {
//         console.log(err)
//     })


async function pushMsg(content: string, channel_id: string, msg_id: string) {

    if (!channel_id) {
        logger.info('channel id is not provided')
        return
    }

    await client.messageApi.postMessage(channel_id, {
        msg_id,
        content
    })
}


ws.on('GUILD_MESSAGES', async (data: { eventType: string, eventId: string, msg: IMessage }) => {


    logger.info('-----------------------------')

    logger.info(data.msg.author.username + ' sent:')

    logger.info(data.msg.content)


    let channel_id = data.msg.channel_id

    let msg_id = data.msg.id

    let id = data.msg.author.id

    if (data.msg.content?.startsWith('/wt')) {

        try {

            let steamId = ''

            const regex = /\/wt\s+(\S+)/

            const match = data.msg.content.match(regex)
            if (match) {
                steamId = match[1]
            } else {
                await pushMsg('指令格式:\n/wt 【STEAM ID】', channel_id, msg_id)
                return
            }

            let sid = new SteamID(steamId)

            if (!sid.isValidIndividual()) {
                await pushMsg('无效的Steam ID', channel_id, msg_id)
                return
            }

            let steamid64 = sid.toString()

            logger.log('info', 'got steamid64 %s', steamid64)

            const message = await whitelist.checkWhitelist(id, steamid64)


            await pushMsg(message, channel_id, msg_id)


        } catch (error) {
            logger.log('error', 'error processing message %o', error)
        }
    }

})



