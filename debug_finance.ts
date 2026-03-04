import { myFetch } from "./server/utils/fetch"

globalThis.defineSource = (o: any) => o
globalThis.myFetch = myFetch

async function testFinance() {
  const { default: financeSource } = await import("./server/sources/finance")
  const indicesGetter = (financeSource as any)["finance-indices"]
  if (typeof indicesGetter === "function") {
    const data = await indicesGetter()
    console.log("Indices data:", JSON.stringify(data, null, 2))
  }
}

testFinance()
