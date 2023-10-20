import XLSX from 'xlsx'
import SteamID from 'steamid';
import tryWhitelist from './whitelist'


// 指定要读取的Excel文件的路径
const excelFilePath = 'C:\\Users\\Reeed\\Desktop\\whitelist.xlsx';

// 读取Excel文件
const workbook = XLSX.readFile(excelFilePath);

// 获取工作表
const sheet = workbook.Sheets[workbook.SheetNames[0]];

// 解析数据并构建对象数组
const result = [];

for (let i = 2;; i++) {
	const nameCell = sheet[`C${i}`]
	const idCell = sheet[`D${i}`]
	const statusCell = sheet[`E${i}`]
	const sidCell = sheet[`G${i}`]

	if (!nameCell) {
		break // 检查是否到达文件末尾
	}

	// const name = nameCell.v
	if (idCell && statusCell && sidCell) {
		if (statusCell.v.toString().includes('1')) {
			const id = idCell.v.toString().trim()
			const name = nameCell.v.toString().trim()
			const steamId64 = new SteamID(sidCell.v.toString().trim()).toString()

			result.push({ name, id, steamId64 })
		}
	}
	// console.log(i, id)
	// console.log(i ,sid)

}

// 打印结果
console.log(JSON.stringify(result, null, 2));
