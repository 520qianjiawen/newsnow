import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('36kr_test.html', 'utf-8');
const $ = cheerio.load(html);

const baseURL = "https://www.36kr.com"
const news = [];
const $items = $(".newsflash-item");
console.log("Found items:", $items.length);

$items.each((_, el) => {
    const $el = $(el);
    const $a = $el.find("a.item-title");
    const url = $a.attr("href");
    const title = $a.text();
    const relativeDate = $el.find(".time").text();

    console.log("ITEM:", { url, title, relativeDate });

    if (url && title && relativeDate) {
        news.push({ url, title, relativeDate });
    }
});

console.log("RESULTS:", news);
