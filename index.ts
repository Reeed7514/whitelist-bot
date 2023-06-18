import { GetWsParam, IGuild, IChannel, IMessage, AvailableIntentsEventsEnum, createOpenAPI, createWebsocket } from 'qq-guild-bot'
import { RestyResponse } from 'resty-client'
import SteamID from 'steamid'
import dotenv from 'dotenv'
import * as whitelist from './whitelist'
// import { checkVacBans, getPlayerName } from './steam.js'

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



client.meApi.meGuilds()
    .then((res: RestyResponse<IGuild[]>) => {

        // console.log('guilds', res.data)

        return res.data[0].id

    })
    .then((guildId: string) => {

        console.log('got guild id', guildId)

        GUILD_ID = guildId

        return client.channelApi.channels(guildId)

    })
    .then((res: RestyResponse<IChannel[]>) => {

        // console.log('channels', res.data)

        const channel = res.data.find(channel => channel.name === '白名单')

        if (channel) {
            console.log("got channel id", channel.id)

            CHANNEL_ID = channel.id
        }

    })
    .catch(err => {
        console.log(err)
    })


async function pushMsg(content: string, msg_id: string) {

    if (!CHANNEL_ID) {
        console.log('channel id is not set')
        return
    }

    await client.messageApi.postMessage(CHANNEL_ID, {
        msg_id,
        content
    })
}


ws.on('GUILD_MESSAGES', async (data: { eventType: string, eventId: string, msg: IMessage }) => {

    console.log('-----------------------------')

    console.log(data.msg.author.username + ' sent: \n' + data.msg.content)

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
                await pushMsg('指令格式:\n/wt 【STEAM ID】', msg_id)
                return
            }




            let sid = new SteamID(steamId)

            if (!sid.isValidIndividual()) {
                await pushMsg('无效的Steam ID', msg_id)
                return
            }

            let steamid64 = sid.toString()

            console.log('steamId', steamid64)


            const message = await whitelist.checkWhitelist(id, steamid64)

            await pushMsg(message, msg_id)

        } catch (error) {
            console.log(error)
        }
    }

})



