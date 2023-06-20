import axios from "axios"
import dotenv from "dotenv"

dotenv.config()

const url = 'https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/'


export async function checkVacBans(steamId: string): Promise<boolean> {
  const res = await axios.get(`${url}?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`)
  const player = res.data.players[0]
  if (player.VACBanned) {
    return true
  } else {
    return false
  }
}

export async function getPlayerName(steamId: string): Promise<boolean> {
  const res = await axios.get(`${url}?key=${process.env.STEAM_API_KEY}&steamids=${steamId}`)
  return res.data.response.players[0].personaname
}