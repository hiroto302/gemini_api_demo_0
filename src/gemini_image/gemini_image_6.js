/* gemini_image_5 を Multi-turn に拡張したサンプルコード 英語版と日本語版の両方を作成する
連続したアート（コミック パネル / ストーリーボード）
https://ai.google.dev/gemini-api/docs/image-generation?hl=ja#6_sequential_art_comic_panel_storyboard

*/
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import 'dotenv/config';

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

async function main() {

  const chat = ai.chats.create({
    model: "gemini-3-pro-image-preview",
    config: {
      responseModalities: ['TEXT', 'IMAGE']
    }
  });

  const prompt =
      'Create a three-panel comic using a gritty noir art style with high-contrast black and white ink.' +
      ' The comic should feature a humorous conversation between three cats at a restaurant.';
  const aspectRatio = '16:9';
  const resolution = '1K';

  // レストラン・3匹の猫の画像をBase64エンコードして読み込む
  const base64ImageFile1 = loadImageAsBase64('resource_generated/gemini-restaurant_cats_0.png');

  const contents = [
    { text: prompt },
    {
      inlineData: {
        mimeType: "image/png",
        data: base64ImageFile1,
      },
    }
  ];
  console.log("Contents to be sent to the API:");
  console.log("generating English version...");

  const response = await chat.sendMessage({
    message: contents,
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: resolution,
      },
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      fs.writeFileSync("resource_generated/gemini_comic_2_en.png", buffer);
      console.log("Image saved as resource_generated/gemini_comic_2_en.png");
    }
  }

  // === 2回目: 日本語版に変更（マルチターン） ===
  console.log("\n--- Second turn: Converting to Japanese ---");

  const secondPrompt = 'Update this infographic to be in Japanese. Do not change any other elements of the image.';

  const secondResponse = await chat.sendMessage({
    message: secondPrompt,
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: resolution,
      },
    },
  });

  for (const part of secondResponse.candidates[0].content.parts) {
      if (part.text) {
        console.log(part.text);
      } else if (part.inlineData) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");
        fs.writeFileSync("resource_generated/gemini_comic_2_jp.png", buffer);
        console.log("Image saved as resource_generated/gemini_comic_2_jp.png");
      }
    }

}

main();


// 画像ファイルをBase64エンコードする関数
function loadImageAsBase64(filePath) {
  const imageBuffer = fs.readFileSync(filePath);
  return imageBuffer.toString('base64');
}


/* リスポンス例

*/