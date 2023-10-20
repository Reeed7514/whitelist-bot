import mysql, { PoolConnection, RowDataPacket } from 'mysql2/promise'
import dotenv from 'dotenv'
import axios from "axios"
import tunnel from 'tunnel'
import SteamID from 'steamid'

dotenv.config()

enum validateResult {
	VACBANNED = '未通过, 你被VAC封禁了',
	GBANNED = '未通过, 你被全球API封禁了',
	LESSPOINTS = '未通过, 你的跳图分数不够50000分',
	PASSED = '通过'
}

const agent = tunnel.httpsOverHttp({
	proxy: {
		host: '127.0.0.1',
		port: 7890,
	}
})


const steamUrl = 'https://api.steampowered.com'
const apiUrl = 'https://kztimerglobal.com/api/v2.0'

const pool = mysql.createPool({
	host: process.env.DATABASE_HOST,
	port: parseInt(process.env.DATABASE_PORT as string),
	user: process.env.DATABASE_USERNAME,
	password: process.env.DATABASE_PASSWORD,
	database: process.env.DATABASE_TARGET
})

async function getPlayerName(steamId64: string): Promise<string> {
	const res = await axios.get(
		`${steamUrl}/ISteamUser/GetPlayerSummaries/v2?key=${process.env.STEAM_API_KEY}&steamids=${steamId64}`,
		{
			httpsAgent: agent
		})
	// console.log('player summary', res.data)
	return res.data.response.players[0].personaname
}

async function checkVacBans(steamId64: string): Promise<validateResult> {
	const res = await axios.get(
		`${steamUrl}/ISteamUser/GetPlayerBans/v1?key=${process.env.STEAM_API_KEY}&steamids=${steamId64}`,
		{
			httpsAgent: agent
		})
	// console.log(res.data)
	const player = res.data.players[0]
	return player.VACBanned ? validateResult.VACBANNED : validateResult.PASSED
}

async function checkGlobalban(steamId64: string): Promise<validateResult> {
	const res = await axios.get(`${apiUrl}/bans?is_expired=false&steamid64=${steamId64}`)
	return res.data.length > 0 ? validateResult.GBANNED : validateResult.PASSED
}


async function checkPoints(steamId64: string): Promise<validateResult> {
	const res = await axios.get(`${apiUrl}/player_ranks?steamid64s=${steamId64}&stages=0&mode_ids=200`)
	const { points } = res.data[0]

	return points < 50000 ? validateResult.LESSPOINTS : validateResult.PASSED
}

async function checkEverything(steamId64: string) {
	const resultVAC = await checkVacBans(steamId64)
	console.log('vac result', resultVAC)

	if (resultVAC !== validateResult.PASSED) return resultVAC


	const resultGban = await checkGlobalban(steamId64)

	if (resultGban !== validateResult.PASSED) return resultGban


	const resultPoints = await checkPoints(steamId64)

	if (resultPoints !== validateResult.PASSED) return resultPoints

	return validateResult.PASSED
}


export default async function tryWhitelist(playerId: string, sid: SteamID) {
	let connection: PoolConnection | undefined

	try {
		connection = await pool.getConnection()

		const [results] = await connection.query('SELECT * FROM whitelist WHERE id = ?', [playerId]) as RowDataPacket[]
		const steamId64 = sid.toString()
		const playerName = await getPlayerName(steamId64)

		if (results.length > 0) {
			const record = results[0]
			if (record.steamId64 === steamId64) {
				return `[${playerName}] 已在白名单内`
			} else {
				let result = await checkEverything(steamId64)
				if (result !== validateResult.PASSED) {
					return result
				}
				await connection.query('UPDATE whitelist SET steamId64 = ? WHERE id = ?', [steamId64, playerId])
				return `已更新 [${playerName}] 到白名单`
			}
		} else {
			let result = await checkEverything(steamId64)
			if (result !== validateResult.PASSED) {
				return result
			}
			await connection.query('INSERT INTO whitelist (id, steamId64) VALUES (?, ?)', [playerId, steamId64])
			return `添加 [${playerId}] 到白名单成功`
		}
	} catch (error) {
		throw error
	} finally {
		if (connection) {
			connection.release()
		}
	}
}