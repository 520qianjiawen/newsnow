import * as cheerio from 'cheerio';
const res = await fetch('https://www.36kr.com/newsflashes');
const html = await res.text();
const $ = cheerio.load(html);
console.log('newsflash-item count:', $('.newsflash-item').length);
console.log('item-title count:', $('.item-title').length);
console.log('first title:', $('.item-title').first().text());
