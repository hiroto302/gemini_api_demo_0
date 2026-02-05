/* マルチターンの画像編集 サンプルコード
https://ai.google.dev/gemini-api/docs/image-generation?hl=ja#multi-turn-image-editing の 画像編集（テキストと画像による画像変換）のサンプルコードを実演
*/

import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import 'dotenv/config';

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

async function main() {

  // チャットセクションを作成
  const chat = ai.chats.create({
    model: "gemini-3-pro-image-preview",
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      tools: [{googleSearch: {}}],
    }
  });
  console.log("Chat session created.");
  console.log(chat);

  // await main();

  const message = "Create a vibrant infographic that explains photosynthesis as if it were a recipe for a plant's favorite food."
    + " Show the \"ingredients\" (sunlight, water, CO2) and the \"finished dish\" (sugar/energy)."
    + " The style should be like a page from a colorful kids' cookbook, suitable for a 4th grader."

  let response = await chat.sendMessage({message});

  console.log("First response:");
  console.log(response);

  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      fs.writeFileSync("resource_generated/photosynthesis-0.png", buffer);
      console.log("Image saved as photosynthesis-0.png");
    }
  }
}

main();