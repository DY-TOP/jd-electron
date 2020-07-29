import {
	app,
	BrowserWindow
} from 'electron'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
	global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development' ?
	`http://localhost:9080` :
	`file://${__dirname}/index.html`

function createWindow() {
	/**
	 * Initial window options
	 */
	mainWindow = new BrowserWindow({
		height: 563,
		useContentSize: true,
		width: 1000,
		webPreferences: {
			nodeIntegration: true
		}
	})

	mainWindow.loadURL(winURL)

	mainWindow.on('closed', () => {
		mainWindow = null
	})
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	if (mainWindow === null) {
		createWindow()
	}
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */

import {
	ipcMain,
	net
} from 'electron'

let cookieStr = ''
ipcMain.on('login', (evt, arg) => {
	let jdWin = new BrowserWindow({
		height: 563,
		useContentSize: true,
		width: 1000
		// parent: mainWindow
	})
	jdWin.loadURL('https://jrw.jd.com/page/login/index.html')
	let webContents = jdWin.webContents;
	webContents.on("did-navigate-in-page", () => {
		webContents.session.cookies.get({
			domain: '.jd.com'
		}, function(err, cookies) {
			if (err) {
				jdWin.close(); // 关闭登陆窗口
			}
			cookieStr = ''
			cookies.map((it) => {
				cookieStr += `; ${it.name}=${it.value}`
				return it
			})
			cookieStr = cookieStr.substr(2)
			console.log(cookieStr)
		})
	})
	jdWin.on('closed', () => {
		jdWin = null
	})
})

ipcMain.on('start', (evt, arg) => {
	requestData()
})

let currentPage = 1
let pageSize = 20
let cachedLastOneId = 0

function fetchCachedLast() {

	const request = net.request('http://jd.backing.top/api/assignment?_size=1&_sort=-assignmentId&_fields=assignmentId')
	request.on('response', (response) => {

		let lastestItem = ''
		response.on('data', (chunk) => {
			lastestItem += chunk
		})
		response.on('end', () => {

			console.log(lastestItem)
			cachedLastOneId = JSON.parse(lastestItem)[0].assignmentId

		})
	})
	request.end()
}

function requestData() {
	const request = net.request({
		method: 'POST',
		url: 'https://jrw-api.jd.com/assignment/start/queryAssignmentTodoList'
	})
	request.on('response', (response) => {

		let data = ''
		response.on('data', (chunk) => {
			data += chunk
		})
		response.on('end', () => {
			console.log(data)
			let obj = JSON.parse(data)
			let contents = obj.data.content
			handleData(contents)

			let t = obj.data.totalPage
			// let lastId = _.last(contents).assignmentId
			// if ( lastId <= cachedLastOneId) {
			// 	currentPage = t
			// }
			// console.log(`last item id = ${lastId}, cachedLastOneId = ${cachedLastOneId}`)
			if (currentPage < t) {
				currentPage += 1
				setTimeout(requestData, 30 * 1000)
			} else {
				currentPage = 1
				// fetchCachedLast()
				setTimeout(requestData, /* 10 * */ 60 * 1000)
			}
		})
	})

	let body =
		`assignmentType=-1&keyword=&contentType=-1&shopType=-1&sortField=0&sortOrder=1&subChannelIds=%5B%5D&currentPage=${currentPage}&pageSize=${pageSize}&filterType=0`
	console.log(body)
	request.setHeader("cookie", cookieStr)
	request.setHeader("Content-Type", "application/x-www-form-urlencoded")
	request.write(body)
	request.end()
}

const _ = require('lodash')

function handleData(contents) {

	let assignmentIds = new Set([])

	let assignments = contents.map((task) => {
		assignmentIds.add(task.assignmentId)
		return {
			assignmentId: task.assignmentId,
			assignmentTitle: task.assignmentTitle,
			assignmentContent: task.assignmentContent,
			assignmentType: task.assignmentType,
			shopId: task.shopId,
			shopName: task.shopName,
			shopPIN: task.shopPIN,
			shopUrl: task.shopUrl,
			logoUrl: task.logoUrl,
			shopPhone: task.shopPhone,
			shopAddress: task.shopAddress,
			subChannelNameList: task.subChannelNameList ? task.subChannelNameList.join() : "",
			wareURL: task.wareURL ? task.wareURL.join() : "",
			commission: task.commission,
			releaseTime: task.releaseTime,
			registrationTime: task.registrationTime,
			dueTime: task.dueTime,
			contentTypesList: task.contentTypesList ? task.contentTypesList.join() : ""
		}
	})

	const _ids = Array.from(assignmentIds).join()
	console.log(_ids)

	const request = net.request(`http://jd.backing.top/api/assignment/bulk?_ids=${_ids}&_fields=assignmentId`)
	request.on('response', (response) => {

		let idResp = ''
		response.on('data', (chunk) => {
			idResp += chunk
		})
		response.on('end', () => {

			console.log(idResp)
			const existIds = JSON.parse(idResp)

			let body = _.pullAllBy(assignments, existIds, 'assignmentId')
			if (body.length > 0) {
				upload(body)
			}
		})
	})
	request.end()
}

function upload(data) {
	console.log(data)

	const request = net.request({
		method: 'POST',
		url: 'http://jd.backing.top/api/assignment/bulk'
	})
	request.on('response', (response) => {
		response.on('data', (chunk) => {
			console.log(`BODY: ${chunk}`)
			mainWindow.webContents.send('newdata', data.length)
		})
	})
	request.setHeader("Content-Type", "application/json")
	request.write(JSON.stringify(data))
	request.end()
}
