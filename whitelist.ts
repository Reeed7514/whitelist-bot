import mysql, { PoolConnection, RowDataPacket } from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

export const pool = mysql.createPool({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT as string),
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_TARGET
})

export async function checkWhitelist(playerId: string, steamId: string) {
  let connection: PoolConnection | undefined

  try {
    connection = await pool.getConnection()

    const [results] = await connection.query('SELECT * FROM whitelist WHERE id = ?', [playerId]) as RowDataPacket[]
    if (results.length > 0) {
      const record = results[0]
      if (record.steamId64 === steamId) {
        return '已在白名单内'
      } else {
        await connection.query('UPDATE whitelist SET steamId64 = ? WHERE id = ?', [steamId, playerId]);
        return '已更新SteamID'
      }
    } else {
      await connection.query('INSERT INTO whitelist (id, steamId64) VALUES (?, ?)', [playerId, steamId])
      return '添加到白名单成功'
    }
  } catch (error) {
    throw error
  } finally {
    if (connection) {
      connection.release()
    }
  }
}


