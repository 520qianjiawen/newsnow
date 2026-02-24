import { $fetch } from "ofetch";
import * as cheerio from "cheerio";
import dayjs from "dayjs";

const myFetch = $fetch.create({
    headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    },
    timeout: 10000,
    retry: 3,
});

async function testQuick() {
    const baseURL = "https://www.36kr.com";
    const url = `${baseURL}/newsflashes`;
    const response = await myFetch(url);
    const $ = cheerio.load(response);
    const news = [];
    const $items = $(".newsflash-item");
    $items.each((_, el) => {
        const $el = $(el);
        const $a = $el.find("a.item-title");
        const href = $a.attr("href");
        const title = $a.text();
        const relativeDate = $el.find(".time").text();
        if (href && title && relativeDate) {
            news.push({ url: `${baseURL}${href}`, title, relativeDate });
        }
    });
    console.log("Quick items:", news.length);
    if (news.length > 0) console.log("Quick first item:", news[0]);
}

async function testRenqi() {
    const baseURL = "https://36kr.com";
    const formatted = dayjs().format("YYYY-MM-DD");
    const url = `${baseURL}/hot-list/renqi/${formatted}/1`;
    try {
        const response = await myFetch(url, {
            headers: {
                "Referer": "https://www.freebuf.com/",
            },
        });
        const $ = cheerio.load(response);
        const articles = [];
        const $items = $(".article-item-info");
        $items.each((_, el) => {
            const $el = $(el);
            const $a = $el.find("a.article-item-title.weight-bold");
            const href = $a.attr("href") || "";
            const title = $a.text().trim();
            if (href && title) articles.push({ title });
        });
        console.log("Renqi HTML length:", response.length);
        console.log("Renqi items:", articles.length);
        if (articles.length > 0) console.log("Renqi first item:", articles[0]);
    } catch (e) {
        console.error("Renqi Error:", e.message);
    }
}

async function run() {
    await testQuick();
    await testRenqi();
}
run();
