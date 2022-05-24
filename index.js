const express = require('express')
const fetch = require('node-fetch')
const fs = require('fs-extra')
const puppeteer = require('puppeteer')
const app = express()
const port = 3000

async function scrape(baseUrl) {
  const browser = await puppeteer.launch({headless: true})
  const page = await browser.newPage()
  await page.goto(baseUrl)
  await page.waitForSelector('.jp-playlist-current', {visible: true})
  const audioSrc = await page.$$eval('#jp_audio_0', els => els.map(el => el.getAttribute('src')))
  let re = /https:\/\/www.top945.com.tw\/(.*)01/i
  let mp3Src = audioSrc.toString().match(re)[1]
  await page.waitForSelector('#jp_container_1 > div.jp-type-playlist > div.jp-playlist > ul > li > div > a.jp-playlist-item')
  const result = await page.$$eval('#jp_container_1 > div.jp-type-playlist > div.jp-playlist > ul > li > div > a.jp-playlist-item', (rows, mp3Src) => {
    return Array.from(rows, row => {
      let fileUrl = `https://www.top945.com.tw/${mp3Src}`
      + encodeURIComponent(row.text)
      + '.mp3'
      let fileName = row.text + '.mp3'

      return { "fileUrl": fileUrl, "fileName": fileName }
    });
  }, mp3Src);
  browser.close()
  return result
}

app.get('/', function(req, res) {
  let baseUrl = req.query.u
  let dir = `./downloads/${Date.now()}`
  scrape(baseUrl).then(result => {
    result.map(item => {
      fetch(item.fileUrl).then(response => {
        if (!fs.existsSync(dir)){
          fs.mkdirSync(dir, { recursive: true });
        }
        response.body.pipe(fs.createWriteStream(`${dir}/` + item.fileName))
        console.log(item.fileName + ' is downloaded')
      })
    })
  })
  res.send("baseUrl is set to " + req.query.u);
});
app.listen(port, () => console.log(`Example app listening on port ${port}!`))