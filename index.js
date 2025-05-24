const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const { Parser } = require("json2csv");
const xlsx = require("xlsx");

const BASE_URL = "https://quotes.toscrape.com/page/";

async function scrapeQuotes() {
  const allQuotes = [];

  for (let page = 1; page <= 10; page++) {
    const url = `${BASE_URL}${page}/`;

    try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);

      $(".quote").each((i, el) => {
        const quote = $(el).find(".text").text().trim();
        const author = $(el).find(".author").text().trim();
        const tags = [];
        $(el)
          .find(".tags a.tag")
          .each((i, tag) => {
            tags.push($(tag).text());
          });

        allQuotes.push({ quote, author, tags });
      });
    } catch (error) {
      console.error(`Error scraping page ${page}:`, error.message);
    }
  }

  return allQuotes;
}

async function saveData() {
  const quotes = await scrapeQuotes();

  // 1. Guardar JSON
  fs.writeFileSync("quotes.json", JSON.stringify(quotes, null, 2), "utf-8");
  console.log("✅ Archivo JSON generado: quotes.json");

  // 2. Guardar CSV
  const parser = new Parser({ fields: ["quote", "author", "tags"] });
  const csv = parser.parse(quotes);
  fs.writeFileSync("quotes.csv", csv, "utf-8");
  console.log("✅ Archivo CSV generado: quotes.csv");

  // 3. Guardar Excel
  const worksheet = xlsx.utils.json_to_sheet(quotes);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, "Quotes");
  xlsx.writeFile(workbook, "quotes.xlsx");
  console.log("✅ Archivo Excel generado: quotes.xlsx");
}

saveData();
