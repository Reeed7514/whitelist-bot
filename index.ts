import { GetWsParam, IGuild, IChannel, IMessage, AvailableIntentsEventsEnum, createOpenAPI, createWebsocket } from 'qq-guild-bot'
import { RestyResponse } from 'resty-client'
import SteamID from 'steamid'
import dotenv from 'dotenv'
import tryWhitelist from './whitelist'
import fetchServers from './servers'
import logger from './winston'
// import './readXls'

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
	logger.info(data.msg.author.id + ' sent:')

	logger.info(data.msg.content)

	console.log(data.msg)

	let { channel_id, id: msg_id } = data.msg

	let { id } = data.msg.author

	try {
		if (data.msg.content?.startsWith('/bind')) {

			let steamId = ''

			const regex = /\/bind\s+(\S+)/

			const match = data.msg.content.match(regex)
			if (match) {
				steamId = match[1]
			} else {
				await pushMsg('指令格式:\n/bind 【STEAM ID】', channel_id, msg_id)
				return
			}

			let sid = new SteamID(steamId)

			if (!sid.isValidIndividual()) {
				await pushMsg('无效的Steam ID', channel_id, msg_id)
				return
			}

			logger.log('info', 'got steamid64 %s', sid.toString())

			const message = await tryWhitelist(id, sid)

			await pushMsg(message, channel_id, msg_id)
		} else if (data.msg.content === '/list') {
			const servers = await fetchServers()

			const message = servers.map((server, index) => `${index + 1}. ${server.name} | ${server.addr} | ${server.map} | ${server.players}/${server.max_players}`).join('\n--------\n')

			await pushMsg(message, channel_id, msg_id)
		}
	} catch (error) {
		logger.log('error', 'error processing message %o', error)
	}
}
)



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




