import { myFetch } from "./server/utils/fetch"

globalThis.myFetch = myFetch

async function testJinse() {
  const url = "https://api.jinse.cn/noah/v2/bull/list?limit=20"
  try {
    const res: any = await myFetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
      },
    })
    console.log("Status:", res?.bottom != null ? "Success" : "Failed")
    if (res?.list?.length > 0) {
      console.log("First item:", JSON.stringify(res.list[0].lives[0], null, 2))
    }
  } catch (e) {
    console.error(e)
  }
}

testJinse()
