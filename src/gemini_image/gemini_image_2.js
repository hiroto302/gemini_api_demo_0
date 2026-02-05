/* マルチターンの画像編集 サンプルコード
https://ai.google.dev/gemini-api/docs/image-generation?hl=ja#multi-turn-image-editing の 画像編集（テキストと画像による画像変換）のサンプルコードを実演

* const chat = ai.chats.create について

同じ chat オブジェクトを使うことで、1回目の画像のコンテキストが保持され、
今回は「このインフォグラフィック」として参照している。

  * responseModalities: ['TEXT', 'IMAGE'],
    「AIが何を返せるか」を指定


  * tools: [{googleSearch: {}}],
  AIが使える「ツール」を指定。今回は、Google検索を使えるようにしている。
  実際の動作
    ユーザー: 「光合成のインフォグラフィックを作って」
    AI: 「光合成について正確な情報が必要だな...」
    AI: Google検索を実行（内部的に）
    AI: 検索結果を基に、正確なインフォグラフィックを生成

    groundingMetadata: [Object],  // ← Google検索を使った証拠
  これは「この回答はGoogle検索の情報に基づいています」という意味です。

* モデルを "gemini-3-pro-image-preview" にする理由
  画像生成対応モデルである必要があるため。
  "gemini-3-flash-preview" はテキスト生成専用モデルなので、画像生成はできない。
  そのため、もし model を "gemini-3-flash-preview" にすると、２回目のリクエストで
  「Request contains an invalid argument.」というエラーになる。これは imageConfig を設定しているからである
  imageConfigの設定をしていなければ、英語のテキストを日本語化して返してくれるよ！


* 文字列エスケープについて
  Gemini API は JSON 形式でデータを送受信するため、
  メッセージ内の改行や引用符は適切にエスケープする必要がある。
  例: 改行は \n、引用符は \" とする。

  \" = エスケープされたダブルクォート

  " Show the \"ingredients\" (sunlight, water, CO2) and the \"finished dish\" (sugar/energy)."
  は実際は
  Show the "ingredients" (sunlight, water, CO2) and the "finished dish" (sugar/energy).
  のようにバックスラッシュ \ は消えて、ダブルクォートだけが残ります

  まあ別に、/”(ダブルクォート + エスケープ) ではなく 'シングルクォート) または `（バッククォート）で囲んでも良いのですが
  gemini API 側の例に合わせている
*/

import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import 'dotenv/config';

const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

async function main() {

  // チャットセクションを作成
  const chat = ai.chats.create({
    model: "gemini-3-pro-image-preview",
    // model : "gemini-3-flash-preview",
    config: {
      responseModalities: ['TEXT', 'IMAGE'], // ← デフォルトでは 'TEXT'と'IMAGE' の両方を返す設定
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
      fs.writeFileSync("resource_generated/photosynthesis-1-en.png", buffer);
      console.log("Image saved as photosynthesis-1-en.png");
    }
  }

  // === 2回目: 日本語版に変更（マルチターン） ===
  console.log("\n--- Second turn: Converting to Japanese ---");

  const secondMessage = 'Update this infographic to be in Japanese. Do not change any other elements of the image.';
  const aspectRatio = '16:9';
  const resolution = '2K';

  let secondResponse = await chat.sendMessage({
    message: secondMessage,
    config: {
      responseModalities: ['TEXT', 'IMAGE'], // ← オーバーライドでこのメッセージだけの指定も可能
      imageConfig: {                         // 画像に関する設定、画像を返すようになる。
        aspectRatio: aspectRatio,
        imageSize: resolution,
      },
      tools: [{googleSearch: {}}],
    },
  });

  console.log("Second response:");
  console.log(secondResponse);

  for (const part of secondResponse.candidates[0].content.parts) {
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      fs.writeFileSync("resource_generated/photosynthesis-1-jp.png", buffer);
      console.log("Image saved as resource_generated/photosynthesis-1-jp.png");
    }
  }
}

main();

/* 実行結果の例
Chat session created.
Chat {
  apiClient: ApiClient {
    clientOptions: {
      auth: [NodeAuth],
      project: undefined,
      location: undefined,
      apiVersion: undefined,
      apiKey: 'AIzaSyBckiuUkGBKhfLpL1i6Po2ZqKo_3cqz3o0',
      vertexai: false,
      httpOptions: [Object],
      userAgentExtra: 'gl-node/v22.14.0',
      uploader: NodeUploader {},
      downloader: NodeDownloader {}
    },
    customBaseUrl: undefined
  },
  modelsModule: Models {
    apiClient: ApiClient { clientOptions: [Object], customBaseUrl: undefined },
    generateContent: [AsyncFunction (anonymous)],
    generateContentStream: [AsyncFunction (anonymous)],
    generateImages: [AsyncFunction (anonymous)],
    list: [AsyncFunction (anonymous)],
    editImage: [AsyncFunction (anonymous)],
    upscaleImage: [AsyncFunction (anonymous)],
    generateVideos: [AsyncFunction (anonymous)]
  },
  model: 'gemini-3-pro-image-preview',
  config: { responseModalities: [ 'TEXT', 'IMAGE' ], tools: [ [Object] ] },
  history: [],
  sendPromise: Promise { undefined }
}
First response:
GenerateContentResponse {
  sdkHttpResponse: {
    headers: {
      'alt-svc': 'h3=":443"; ma=2592000,h3-29=":443"; ma=2592000',
      'content-encoding': 'gzip',
      'content-type': 'application/json; charset=UTF-8',
      date: 'Thu, 05 Feb 2026 12:08:03 GMT',
      server: 'scaffolding on HTTPServer2',
      'server-timing': 'gfet4t7; dur=24501',
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
  responseId: 'I4iEaaD6I-SDvr0PyYuGqA0',
  usageMetadata: {
    promptTokenCount: 69,
    candidatesTokenCount: 1554,
    totalTokenCount: 1827,
    promptTokensDetails: [ [Object] ],
    candidatesTokensDetails: [ [Object] ],
    thoughtsTokenCount: 204
  }
}
Image saved as photosynthesis-1-en.png

--- Second turn: Converting to Japanese ---
Second response:
GenerateContentResponse {
  sdkHttpResponse: {
    headers: {
      'alt-svc': 'h3=":443"; ma=2592000,h3-29=":443"; ma=2592000',
      'content-encoding': 'gzip',
      'content-type': 'application/json; charset=UTF-8',
      date: 'Thu, 05 Feb 2026 12:08:48 GMT',
      server: 'scaffolding on HTTPServer2',
      'server-timing': 'gfet4t7; dur=43948',
      'transfer-encoding': 'chunked',
      vary: 'Origin, X-Origin, Referer',
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'SAMEORIGIN',
      'x-xss-protection': '0'
    }
  },
  candidates: [ { content: [Object], finishReason: 'STOP', index: 0 } ],
  modelVersion: 'gemini-3-pro-image-preview',
  responseId: 'T4iEaYX4E7Clvr0PnI-_uQ4',
  usageMetadata: {
    promptTokenCount: 347,
    candidatesTokenCount: 1397,
    totalTokenCount: 2233,
    promptTokensDetails: [ [Object], [Object] ],
    candidatesTokensDetails: [ [Object] ],
    thoughtsTokenCount: 489
  }
}
Image saved as resource_generated/photosynthesis-1-jp.png
(flask_web_sample) snsnap1159@SnSnap1159noMacBook-Pro gemini_api_demo_0 % 
*/





/* model を "gemini-3-flash-preview" に変更したときのエラー例

(flask_web_sample) snsnap1159@SnSnap1159noMacBook-Pro gemini_api_demo_0 % node src/gemini_image/gemini_image_2.js
Chat session created.
Chat {
  apiClient: ApiClient {
    clientOptions: {
      auth: [NodeAuth],
      project: undefined,
      location: undefined,
      apiVersion: undefined,
      apiKey: 'AIzaSyBckiuUkGBKhfLpL1i6Po2ZqKo_3cqz3o0',
      vertexai: false,
      httpOptions: [Object],
      userAgentExtra: 'gl-node/v22.14.0',
      uploader: NodeUploader {},
      downloader: NodeDownloader {}
    },
    customBaseUrl: undefined
  },
  modelsModule: Models {
    apiClient: ApiClient { clientOptions: [Object], customBaseUrl: undefined },
    generateContent: [AsyncFunction (anonymous)],
    generateContentStream: [AsyncFunction (anonymous)],
    generateImages: [AsyncFunction (anonymous)],
    list: [AsyncFunction (anonymous)],
    editImage: [AsyncFunction (anonymous)],
    upscaleImage: [AsyncFunction (anonymous)],
    generateVideos: [AsyncFunction (anonymous)]
  },
  model: 'gemini-3-flash-preview',
  config: { responseModalities: [ 'TEXT', 'IMAGE' ], tools: [ [Object] ] },
  history: [],
  sendPromise: Promise { undefined }
}
First response:
GenerateContentResponse {
  sdkHttpResponse: {
    headers: {
      'alt-svc': 'h3=":443"; ma=2592000,h3-29=":443"; ma=2592000',
      'content-encoding': 'gzip',
      'content-type': 'application/json; charset=UTF-8',
      date: 'Thu, 05 Feb 2026 12:54:59 GMT',
      server: 'scaffolding on HTTPServer2',
      'server-timing': 'gfet4t7; dur=16482',
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
  modelVersion: 'gemini-3-flash-preview',
  responseId: 'I5OEafDLAvSa1e8P1emxqQg',
  usageMetadata: {
    promptTokenCount: 203,
    candidatesTokenCount: 724,
    totalTokenCount: 1512,
    promptTokensDetails: [ [Object] ],
    thoughtsTokenCount: 585
  }
}
This is a design for a vibrant, kid-friendly infographic. You can imagine this as a glossy page in a "Nature’s Kitchen" cookbook.

***

# 🌿 Chef Chlorophyll’s Famous Sun-Sizzled Snack! ☀️
**Prep time:** 1 nanosecond (It’s fast!)  
**Yields:** 1 batch of pure Energy and a side of Fresh Air.

---

### 🛒 The Ingredients
*   **1 Cup of "Invisible Airy-Fizz" (Carbon Dioxide)**
    *   *Where to find it:* Floating all around us in the air!
*   **3 Tablespoons of "Cool Cloud Juice" (Water)**
    *   *Where to find it:* Deep in the soil. The roots act like giant straws to suck it up!
*   **A Generous Dusting of "Sunbeam Sprinkles" (Sunlight)**
    *   *Where to find it:* Straight from the big yellow oven in the sky.

---

### 🍳 Preparation Steps

**1. Set Up the Kitchen!**  
Every plant has millions of tiny green kitchens inside its leaves called **Chloroplasts**. These are filled with **Chlorophyll**, a magic green pigment that catches the Sunbeam Sprinkles like a solar-powered net.

**2. Mix the Air and Water!**  
The leaf opens up tiny "mouths" on its bottom called **Stomata** to breathe in the Invisible Airy-Fizz. Meanwhile, the roots send the Cool Cloud Juice up the stem and into the leaf.

**3. Turn Up the Heat!**  
When the Sunbeam Sprinkles hit the leaf, they provide the energy needed to chop the water and air molecules into tiny pieces and stir them all together!

**4. The Chemical Sizzle!**  
*Zap!* The sunlight turns the water and gas into a delicious, sweet treat. This is the part where the magic happens!

---

### 🍽️ The Finished Dish
**The Main Course: "Golden Glow Glucose" (Sugar)**  
This is the plant’s favorite food! It’s the energy that helps the plant grow tall, sprout new leaves, and make pretty flowers.

**The Side Dish: "Fresh Air Puffs" (Oxygen)**  
As the plant "cooks," it makes extra oxygen. Since it doesn't need it, the plant breathes it out through the Stomata for us to breathe! *Thanks, plants!*

---

### 🎨 Design Notes for the Visuals:
*   **Color Palette:** Use "Lime Zest Green," "Sunny Lemon Yellow," and "Sky Blue." 
*   **Characters:** Draw a friendly "Chef Chlorophyll" (a leaf wearing a white chef’s hat and holding a wooden spoon).
*   **Background:** Use a textured paper look, like a real kitchen notebook, with a few "water stains" or "dirt smudges" to make it look like it was used in the garden.
*   **Typography:** Use a chunky, rounded font for the title (like *Bubblegum Sans*) and a neat "handwritten" font for the steps.
*   **Diagram:** In the center, show a bright cartoon flower. Use arrows to show **Sunlight** coming from the sun, **Water** coming up from the roots, and **Oxygen** bubbling out of the leaves like little sparkles.

--- Second turn: Converting to Japanese ---
file:///Users/snsnap1159/Hiroto/ai_products/gemini_api_demo_0/node_modules/@google/genai/dist/node/index.mjs:12089
            const apiError = new ApiError({
                             ^

ApiError: {"error":{"code":400,"message":"Request contains an invalid argument.","status":"INVALID_ARGUMENT"}}
    at throwErrorIfNotOK (file:///Users/snsnap1159/Hiroto/ai_products/gemini_api_demo_0/node_modules/@google/genai/dist/node/index.mjs:12089:30)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async file:///Users/snsnap1159/Hiroto/ai_products/gemini_api_demo_0/node_modules/@google/genai/dist/node/index.mjs:11809:13
    at async Models.generateContent (file:///Users/snsnap1159/Hiroto/ai_products/gemini_api_demo_0/node_modules/@google/genai/dist/node/index.mjs:13152:24)
    at async file:///Users/snsnap1159/Hiroto/ai_products/gemini_api_demo_0/node_modules/@google/genai/dist/node/index.mjs:6551:30
    at async Chat.sendMessage (file:///Users/snsnap1159/Hiroto/ai_products/gemini_api_demo_0/node_modules/@google/genai/dist/node/index.mjs:6567:9)
    at async main (file:///Users/snsnap1159/Hiroto/ai_products/gemini_api_demo_0/src/gemini_image/gemini_image_2.js:74:24) {
  status: 400
}

imageConfig を設定していなければ、英語のテキストを日本語化して返してくれるよ！以下が例
## 🎨 デザインのアドバイス（日本語版）：
*   **タイトル：** 太くて元気なフォントで「緑のはっぱのグルメ」と書き、横に小さく「光合成（こうごうせい）」と書いておくと勉強にもなります。
*   **イラストのラベル：**
    *   太陽 → **「お日さま」**
    *   根っこの水 → **「水（みず）」**
    *   空気の取り込み → **「二酸化炭素（にさんかたんそ）」**
    *   完成したエネルギー → **「ブドウ糖（お砂糖）」**
    *   外に出る空気 → **「酸素（さんそ）」**
*   **雰囲気：** 料理のレシピ本のように「少々」「ひとつまみ」といった言葉を使うと、より低学年にも親しみやすくなります。
*/