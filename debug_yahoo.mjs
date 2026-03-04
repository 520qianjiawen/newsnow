import { $fetch } from "ofetch"

async function testYahoo() {
  const symbols = ["%5EGSPC", "GC%3DF"]
  for (const sym of symbols) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}`
    console.log(`Testing ${sym} at ${url}...`)
    try {
      const res = await $fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      })
      console.log(`Success for ${sym}:`, JSON.stringify(res.chart.result?.[0]?.meta, null, 2))
    } catch (error) {
      console.error(`Failed for ${sym}:`, error.message)
      if (error.response) {
        console.error("Status:", error.response.status)
        console.error("Body:", await error.response.text())
      }
    }
  }
}

testYahoo()
