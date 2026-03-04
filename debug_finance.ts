import { myFetch } from "./server/utils/fetch"

globalThis.defineSource = (o: any) => o
globalThis.myFetch = myFetch

async function testFinance() {
  const { default: financeSource } = await import("./server/sources/finance")
  const currenciesGetter = (financeSource as any)["finance-currencies"]
  if (typeof currenciesGetter === "function") {
    const data = await currenciesGetter()
    console.log("Currencies data:", JSON.stringify(data, null, 2))
  }
}

testFinance()
