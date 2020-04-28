# Play FLV in Browser

DEMO → https://play-flv-in-browser.netlify.app/

Play FLV in Browser.

## Supported Codecs

- FLV1
- VP6
- H.264
- MP3
- AAC

see <ffmpeg/build_ffmpeg.sh> .

## 解説

上記コーデックのdecoder、FLV/MP4のdemuxer、MP3/MP4のmuxer(音声用) を入れた FFmpeg を WebAssembly にコンパイルし、JavaScriptから呼び出した後、結果をcanvasに描画しています。
また、WebAssembly と JavaScript の世界の行き来は遅いので、なるべく行き来する回数を減らすために `wasm/*.{cpp,hpp}` でWebAssembly内にFFmpegのラッパーを作り、JavaScriptからWebAssemblyの世界を呼び出す回数をなるべく減らしています。

音声は FFmpeg で音声トラックだけ remux し、mp3もしくはmp4にしてからブラウザのネイティブ`<audio>`で再生しています。
(当初はMP3でもmp4コンテナに入れていましたが、Safariが対応していないようなのでコーデックによって出し分けることにしました)

動画と音声の同期は`<audio>`の`currentTime`を見て動画をどこまで再生するか決めていますが、このプロパティは Chrome / Safari だと問題ない頻度で更新されるものの、Firefox だと毎秒25FPS前後でしか更新されず60FPSの動画の同期には使えないので、Firefoxでだけ `performance.now()`等を駆使していい感じに再生するモードを有効化しています (有効化されている場合Developer ToolsのConsoleにメッセージが出ます) 。

## ライセンス

このプロジェクトのソースコードは MIT License ですが、ビルド後の成果物には FFmpeg 由来の LGPL 2.1 or later なバイナリが含まれます。