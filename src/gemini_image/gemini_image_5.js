/* 連続したアート（コミック パネル / ストーリーボード）
https://ai.google.dev/gemini-api/docs/image-generation?hl=ja#6_sequential_art_comic_panel_storyboard

こちらは、猫の画像を参照して、キャラクターの整合性とシーンの説明に基づいて、
ビジュアル ストーリーテリング用のパネルを作成するデモです。
テキストの正確性とストーリーテリングの能力については、
これらのプロンプトは Gemini 3 Pro Image Preview で最適に機能します。
*/
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import 'dotenv/config';

async function main() {

  const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

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
// console.log("Contents to be sent to the API:");
// console.log(contents);

const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: contents,
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: resolution,
      },
    },
  });

  console.log("API Response:");
  console.log(response);
  console.log(response.candidates[0].content);
  console.log(response.candidates[0].content.parts[0].inlineData);

  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      fs.writeFileSync("resource_generated/gemini_comic_0.png", buffer);
      console.log("Image saved as resource_generated/gemini_comic_0.png");
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