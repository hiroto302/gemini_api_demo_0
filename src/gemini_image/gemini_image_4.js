/* googleSearch ツールを利用した画像生成のサンプルコード
こちらを参照: とhttps://ai.google.dev/gemini-api/docs/image-generation?hl=ja#use-with-grounding

* tools プロパティ 使用例
  * 1. googleSearch（Google検索）
    tools: [{ googleSearch: {} }]
    リアルタイムのWeb情報を取得
    最新データに基づいた画像生成が可能

    レスポンスには、次の必須フィールドを含む groundingMetadata が含まれます。
      searchEntryPoint: 必要な検索候補をレンダリングするための HTML と CSS が含まれています。
      groundingChunks: 生成された画像のグラウンディングに使用された上位 3 つのウェブソースを返します

  * 2. codeExecution（コード実行）
    tools: [{ codeExecution: {} }]
    Pythonコードを実行して計算や処理を実行
    データ分析、数学的計算、グラフ生成などに活用
    計算結果を画像に反映できる

  * 3. functionDeclaration（Function Calling）
  tools: [{
    functionDeclarations: [{
      name: 'getWeatherData',
      description: '指定された都市の天気データを取得',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: '都市名' }
        }
      }
    }]
  }]
自作の関数をGeminiに提供
外部APIやデータベースとの連携
より複雑なカスタムロジックを実装

* 他のツールと組み合わせた例を作成してみますか？
例えば：
  codeExecution + 画像生成: データ分析結果をグラフ画像として生成
  googleSearch + codeExecution: 検索したデータを計算処理してから視覚化
  functionDeclaration: 外部APIから取得したデータを画像化

色々なアイディアを組み合わせれば実装できる!

*/

import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import 'dotenv/config';

async function main() {

  const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

  const prompt = 'Visualize the current weather forecast for the next 5 days in TOKYO as a clean, modern weather chart. Add a visual on what I should wear each day';
  const aspectRatio = '16:9';
  const resolution = '2K';

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: prompt,
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: resolution,
      },
    tools: [{ googleSearch: {} }]
    },
  });

  console.log("Response from the API:");
  console.log("API Response:");
  console.log(response);
  // console.log(response.candidates[0].content);
  // console.log(response.candidates[0].content.parts[0].inlineData);

  // groundingMetadata の詳細表示
  console.log("\n=== Grounding Metadata ===");
  const groundingMetadata = response.candidates[0].groundingMetadata;
  console.log(JSON.stringify(groundingMetadata, null, 2));

  if (groundingMetadata) {
    // searchEntryPoint の表示
    if (groundingMetadata.searchEntryPoint) {
      console.log("\n--- Search Entry Point ---");
      console.log("Rendered Content (HTML/CSS):");
      console.log(groundingMetadata.searchEntryPoint.renderedContent);
    }

    // groundingChunks の表示（上位3つのWebソース）
    if (groundingMetadata.groundingChunks) {
      console.log("\n--- Grounding Chunks (Top Web Sources) ---");
      groundingMetadata.groundingChunks.forEach((chunk, index) => {
        console.log(`\nSource ${index + 1}:`);
        console.log(`  Title: ${chunk.web?.title || 'N/A'}`);
        console.log(`  URI: ${chunk.web?.uri || 'N/A'}`);
      });
    }

    // groundingSupports の表示（どの部分がどのソースで裏付けられているか）
    if (groundingMetadata.groundingSupports) {
      console.log("\n--- Grounding Supports ---");
      groundingMetadata.groundingSupports.forEach((support, index) => {
        console.log(`\nSupport ${index + 1}:`);
        console.log(`  Segment: ${JSON.stringify(support.segment)}`);
        console.log(`  Grounding Chunk Indices: ${support.groundingChunkIndices}`);
        console.log(`  Confidence Scores: ${support.confidenceScores}`);
      });
    }
  }
  console.log("\n=========================\n");

  for (const part of response.candidates[0].content.parts) {
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      fs.writeFileSync("resource_generated/gemini_googleSearch_weather_1.png", buffer);
      console.log("Image saved as gemini_googleSearch_weather.png");
    }
  }
}

main();


/* レスポンス例
Response from the API:
API Response:
GenerateContentResponse {
  sdkHttpResponse: {
    headers: {
      'alt-svc': 'h3=":443"; ma=2592000,h3-29=":443"; ma=2592000',
      'content-encoding': 'gzip',
      'content-type': 'application/json; charset=UTF-8',
      date: 'Sat, 07 Feb 2026 13:36:26 GMT',
      server: 'scaffolding on HTTPServer2',
      'server-timing': 'gfet4t7; dur=40840',
      'transfer-encoding': 'chunked',
      vary: 'Origin, X-Origin, Referer',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'SAMEORIGIN',
      'x-xss-protection': '0'
    }
  },
  candidates: [
    {
      content: [Object],
      finishReason: 'STOP',
      groundingMetadata: [Object],
      index: 0
    }
  ],
  modelVersion: 'gemini-3-pro-image-preview',
  responseId: '2j-HaYbABqGgvr0Piuy44Qs',
  usageMetadata: {
    promptTokenCount: 33,
    candidatesTokenCount: 1781,
    totalTokenCount: 2299,
    promptTokensDetails: [ [Object] ],
    candidatesTokensDetails: [ [Object] ],
    thoughtsTokenCount: 485
  }
}
*/

/* groundingMetadataのレスポンス例
--- Grounding Chunks (Top Web Sources) ---

Source 1:
  Title: youtube.com
  URI: https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGZuXm3r8kCOIG2bCK6uJqv-X_rk7Yp8W7NdXh0F5oho1Y5gvbamvhZtmHGXqaHQm5CtKsCLQ9Ib7E-k4hRjtO0S133VrCvR-Xsf8kDZjqs2teJNIRKfYesmK6sX8yJLYrVNzkW3BU=

Source 2:
  Title: google.com
  URI: https://www.google.com/search?q=weather+in+Tokyo,+JP

Source 3:
  Title: N/A
  URI: https://www.google.com/search?q=time+in+Tokyo,+JP
*/