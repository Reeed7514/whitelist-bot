import axios from 'axios'
import dotenv from 'dotenv'
import tunnel from 'tunnel'

dotenv.config()

const url = `https://api.steampowered.com/IGameServersService/GetServerList/v1`

const ips = [
	'43.138.126.94:10001',
	'43.138.126.94:10002',
	'43.138.126.94:10003',
	'43.138.126.94:10004',
	'43.138.126.94:10005',
	'43.138.126.94:10006',
	'42.193.18.224:27015',
	'42.193.18.224:27016',
	'42.193.18.224:27017',
	'42.193.18.224:27018',
	'42.193.18.224:27019',
	'211.159.224.242:27015',
	'211.159.224.242:10001',
	'211.159.224.242:10002',
	'211.159.224.242:10003',
	'211.159.224.242:10004',
	'211.159.224.242:10005',
	'124.156.182.187:27015',
	'124.156.182.187:27016'
]


const agent = tunnel.httpsOverHttp({
	proxy: {
		host: '127.0.0.1',
		port: 7890,
	}
})

export default async function fetchServers(): Promise<any[]>{
	const results = await Promise.all(ips.map(ip => axios.get(`${url}?key=${process.env.STEAM_API_KEY}&filter=\\gameaddr\\${ip}`, {httpsAgent: agent})))

	const servers: any[] = []
	results.forEach(result => {
		if(result.data.response.servers?.length > 0){
			servers.push(result.data.response.servers[0])
		}
	})

	return servers
}

// const s = 
// {
//   addr: '43.138.126.94:10001',
//   gameport: 10001,
//   steamid: '85568392930334722',
//   name: 'AXE GOKZ 北京 #1 [Public]',
//   appid: 730,
//   gamedir: 'csgo',
//   version: '1.38.8.1',
//   product: 'csgo',
//   region: 4,
//   players: 2,
//   max_players: 20,
//   bots: 0,
//   map: 'vnl_oy_lj',
//   secure: true,
//   dedicated: true,
//   os: 'l',
//   gametype: 'axe,axekz,climb,gokz,kreedz,kz,secure'
// }