/* 画像編集（テキストと画像による画像変換) サンプルコード
https://ai.google.dev/gemini-api/docs/image-generation?hl=ja の 画像編集（テキストと画像による画像変換）のサンプルコードを実演

*/

import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import 'dotenv/config';

async function main() {

  const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
  const restaurantImagePath = "resource_generated/gemini-restaurant.png";
  const imageData = fs.readFileSync(restaurantImagePath);
  const base64Image = imageData.toString("base64");

  // Create prompt with both text and image！
  // 型: Part[] この配列形式により テキストと画像の両方を送信可能
  const prompt = [
    { text: "Create a picture of cat eating a nano-banana in this" +
            "restaurant under the Gemini constellation" },
    {
      inlineData: {
        mimeType: "image/png",
        data: base64Image,
      },
    },
  ];
  console.log("Prompt:");
  console.log(prompt);

  console.log("Sending request to Gemini API... waiting for response.");

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: prompt,
  });
  console.log("Response:");
  console.log(response);

  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      fs.writeFileSync("resource_generated/gemini-restaurant-cat-1.png", buffer);
      console.log("Image saved as resource_generated/gemini-restaurant-cat-1.png");
    }
  }
}
main();

/* リスポンス実行結果
注目すべきは、画像データが inlineData プロパティに Base64 エンコードされた形で含まれている点
promptTokenCount: 276 の数が示すように、画像データのトークン数もカウントされている。
テキストだけの場合、17トークン程度であるのに対し、画像データを含むことで大幅に増加している

GenerateContentResponse {
  sdkHttpResponse: {
    headers: {
      'alt-svc': 'h3=":443"; ma=2592000,h3-29=":443"; ma=2592000',
      'content-encoding': 'gzip',
      'content-type': 'application/json; charset=UTF-8',
      date: 'Wed, 04 Feb 2026 04:10:18 GMT',
      server: 'scaffolding on HTTPServer2',
      'server-timing': 'gfet4t7; dur=15781',
      'transfer-encoding': 'chunked',
      vary: 'Origin, X-Origin, Referer',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'SAMEORIGIN',
      'x-xss-protection': '0'
    }
  },
  candidates: [ { content: [Object], finishReason: 'STOP', index: 0 } ],
  modelVersion: 'gemini-3-pro-image-preview',
  responseId: 'qcaCaeDiNeizvr0P7tfOuQk',
  usageMetadata: {
    promptTokenCount: 276,
    candidatesTokenCount: 1225,
    totalTokenCount: 1650,
    promptTokensDetails: [ [Object], [Object] ],
    candidatesTokensDetails: [ [Object] ],
    thoughtsTokenCount: 149
  }
}

*/