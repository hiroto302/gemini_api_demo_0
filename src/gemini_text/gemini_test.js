import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

//NOTE: The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: "Explain how AI works in a few words",
  });
  console.log(response);
  console.log(response.candidates[0].content);
}

main();

// 実行結果 '$node gemini-test.js'
// GenerateContentResponse {
//   sdkHttpResponse: {
//     headers: {
//       'alt-svc': 'h3=":443"; ma=2592000,h3-29=":443"; ma=2592000',
//       'content-encoding': 'gzip',
//       'content-type': 'application/json; charset=UTF-8',
//       date: 'Fri, 30 Jan 2026 05:28:14 GMT',
//       server: 'scaffolding on HTTPServer2',
//       'server-timing': 'gfet4t7; dur=3122',
//       'transfer-encoding': 'chunked',
//       vary: 'Origin, X-Origin, Referer',
//       'x-content-type-options': 'nosniff',
//       'x-frame-options': 'SAMEORIGIN',
//       'x-xss-protection': '0'
//     }
//   },
//   candidates: [ { content: [Object], finishReason: 'STOP', index: 0 } ],
//   modelVersion: 'gemini-3-flash-preview',
//   responseId: 'bUF8adGVPOC9vr0PvJ_O6As',
//   usageMetadata: {
//     promptTokenCount: 9,
//     candidatesTokenCount: 15,
//     totalTokenCount: 271,
//     promptTokensDetails: [ [Object] ],
//     thoughtsTokenCount: 247
//   }
// }

/* リスポンス結果の内容
  * レスポンスの構造の全体像
  GenerateContentResponse {
    sdkHttpResponse: { ... },    // HTTP通信の情報
    candidates: [ ... ],          // 生成された回答
    modelVersion: '...',          // 使用したモデル
    responseId: '...',            // リクエストの識別ID
    usageMetadata: { ... }        // トークン使用量
  }

  * 1. sdkHttpResponse
  javascriptsdkHttpResponse: {
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      date: 'Fri, 30 Jan 2026 05:28:14 GMT',
      // ...
    }
  }
  HTTPレスポンスのメタ情報

  * 2. candidates
  javascriptcandidates: [
    {
      content: [Object],      // 実際の回答内容
      finishReason: 'STOP',   // 終了理由
      index: 0                // 候補のインデックス
    }
  ]
  生成された回答の配列
    contentAI : 生成したテキスト本体
    finishReason : なぜ生成が終わったか
    index : 複数候補がある場合の番号

  finishReason の種類
    値意味STOP → 正常に完了 ✅
    MAX_TOKENS → トークン上限に達した
    SAFETY → 安全性フィルターで停止


  * 3. modelVersion
  javascriptmodelVersion: 'gemini-3-flash-preview'
  使用したモデルのバージョン

  * 4. responseId
  javascriptresponseId: 'bUF8adGVPOC9vr0PvJ_O6As'
  リクエストごとに一意なID
    問い合わせやデバッグ時に使用

  * 5. usageMetadata
  トークン使用量の詳細情報

  javascriptusageMetadata: {
    promptTokenCount: 9,          // プロンプトで使用したトークン数
    candidatesTokenCount: 15,     // 生成された回答で使用したトークン数
    totalTokenCount: 271,         // 合計トークン数
    promptTokensDetails: [ ... ], // プロンプトの詳細なトークン情報
    thoughtsTokenCount: 247       // モデルの思考過程で使用したトークン数
  }

  **トークンとは？**
    - AIがテキストを処理する単位（だいたい1単語 ≒ 1〜2トークン）
    - **API利用料金はトークン数で計算される**
*/

/* esponse.candidates[0].content の内容
* 全体構造
{
  parts: [
    {
      text: '...',              // 実際の回答テキスト
      thoughtSignature: '...'   // 思考の署名（内部用）
    }
  ],
  role: 'model'                 // 誰の発言か
}

* 各プロパティの意味
1. parts（配列）
  回答のパーツを格納する配列
  javascriptparts: [
    { text: '...', thoughtSignature: '...' }
  ]
  なぜ配列なのか？

  回答がテキストだけでなく、画像やコードなど複数の種類を含む可能性があるため
  今回はテキストのみなので1つだけ

2. text
  javascripttext: 'Learning patterns from data to make predictions.'
  これがAIの実際の回答です！ ✅
  response.text で取得できるのは、実はここの値を取り出しています。

  3. thoughtSignature
    javascriptthoughtSignature: 'EswJCskJAXLI2nynNN/o4byFV59UQV...'
    モデルの「思考プロセス」の暗号化された署名
      目的 思考の検証・追跡用
      中身 Base64でエンコードされたデータ
      用途 Google内部での品質管理・監査

  4. role
  javascriptrole: 'model'
  この発言が誰のものかを示す
  roleの種類
    model → AIモデルの発言 ✅
    user → ユーザー（あなた）の発言
*/