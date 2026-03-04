import { defineRSSSource } from "./server/utils/source"

async function testPANewsSource() {
  console.log("Testing PANews source directly...")
  try {
    const fetchFunc = defineRSSSource("https://www.panewslab.com/rss.xml")
    const items = await fetchFunc()
    console.log(`Success! Fetched ${items.length} items.`)
    if (items.length > 0) {
      console.log("First item sample:", JSON.stringify(items[0], null, 2))
    }
  } catch (error) {
    console.error("Failed to fetch/parse PANews:")
    console.error(error)
  }
}

testPANewsSource()
