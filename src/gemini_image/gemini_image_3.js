/* Gemini 3 Pro Image の新機能
Gemini 3 Pro Image モデルは、画像生成に加えて、複数の画像を入力として受け取り、それらを組み合わせて新しい画像を生成する機能を備えています。
この機能により、ユーザーは既存の画像を基にしたカスタマイズされたコンテンツを作成できます。
https://ai.google.dev/gemini-api/docs/image-generation?hl=ja#gemini-3-capabilities

こちらは、猫の画像２枚を参照して、restaurant でのグループ写真を生成するサンプルコードです。
*/
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import 'dotenv/config';

async function main() {

  const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
  // console.log("Gemini API initialized.");
  // console.log(ai);


  //NOTE: こちらのPrompt だと猫が3匹になった。(参考: gemini_restaurant_cats_0.png)
  // const prompt =
  //     'An restaurant group photo of these cats, they are making funny faces.';

  //NOTE: こちらのPrompt だと猫が2匹になった。(参考: gemini_restaurant_cats_1.png)
  const prompt =
      'A restaurant group photo of these two cats, they are making funny faces.';
  const aspectRatio = '5:4';
  const resolution = '1K';

  // レストランの画像・猫の画像２枚をBase64エンコードして読み込む
  const base64ImageFile1 = loadImageAsBase64('resource_generated/gemini-restaurant.png');
  const base64ImageFile2 = loadImageAsBase64('public/ref/cat_black.png');
  const base64ImageFile3 = loadImageAsBase64('public/ref/cat_white.png');

const contents = [
  { text: prompt },
  {
    inlineData: {
      mimeType: "image/png",
      data: base64ImageFile1,
    },
  },
  {
    inlineData: {
      mimeType: "image/png",
      data: base64ImageFile2,
    },
  },
  {
    inlineData: {
      mimeType: "image/png",
      data: base64ImageFile3,
    },
  },
];
console.log("Contents to be sent to the API:");
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
      fs.writeFileSync("resource_generated/gemini-restaurant_cats_1.png", buffer);
      console.log("Image saved as resource_generated/gemini-restaurant_cats_1.png");
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
やはり、画像を３枚参照しているので、prompt token count の値が大きくなる。

API Response:
GenerateContentResponse {
  sdkHttpResponse: {
    headers: {
      'alt-svc': 'h3=":443"; ma=2592000,h3-29=":443"; ma=2592000',
      'content-encoding': 'gzip',
      'content-type': 'application/json; charset=UTF-8',
      date: 'Fri, 06 Feb 2026 02:02:30 GMT',
      server: 'scaffolding on HTTPServer2',
      'server-timing': 'gfet4t7; dur=19271',
      'transfer-encoding': 'chunked',
      vary: 'Origin, X-Origin, Referer',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'SAMEORIGIN',
      'x-xss-protection': '0'
    }
  },
  candidates: [ { content: [Object], finishReason: 'STOP', index: 0 } ],
  modelVersion: 'gemini-3-pro-image-preview',
  responseId: 'tkuFaZXdDoTd2roPhPSdSA',
  usageMetadata: {
    promptTokenCount: 789,
    candidatesTokenCount: 1295,
    totalTokenCount: 2296,
    promptTokensDetails: [ [Object], [Object] ],
    candidatesTokensDetails: [ [Object] ],
    thoughtsTokenCount: 212
  }
}
*/