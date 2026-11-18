<!-- 원본: bundle/guide/parts/develop.md @ 3129bffd70 -->
# 自分で手を入れる

pygaki を自分のゲームに合わせて直したい、機能を足したい、直したものをほかの人と共有したい人のための章です。設定値を変えるだけなら「プラグイン カスタムガイド」の章で足ります。この章はコードやエフェクトファイルを直接直すときに見ます。

## リポジトリを見て回る

1 つのリポジトリに、2 つのプログラムとパックを作るツールが一緒に入っています。リポジトリの文書とコードのコメントは韓国語です。

| 場所 | 何 |
| --- | --- |
| `pykaki/` | pygaki スクリプトエディターの画面(React + TypeScript)。`src/` がコード、`docs/GUIDE.md` がアプリの [ヘルプ](この案内書の「pygaki でシナリオを書く」の章)、`docs/SPEC.md` が構造の説明 |
| `pykaki/app/` | デスクトップアプリ(Electron)。画面は `pykaki/` をビルドしたものをそのまま使います |
| `showpy/game/` | pygaki プラグイン。`ui_kit`、`screen_fx`、`hotkeys`、`splash` の 4 フォルダーをゲームの `game/` に入れて使います |
| `showpy/game/ui_kit/effects/` | エフェクトフォルダー。文字の登場エフェクトと画像トランジションが `.glsl` ファイル 1 つに 1 つずつ |
| `showpy/docs/` | プラグインの文書:`READ_ME_FIRST.md`(最初に読む)、`CUSTOM_GUIDE.md`(この案内書の「プラグイン カスタムガイド」の章)、`SPEC.md`(構造)、`DEV_RULES.md`(作業ルール) |
| `docs/LINK.md` | 2 つのプログラムが互いに合わせる形式(シナリオファイル、スクリプトの印、リアルタイム連携、エフェクトファイル) |
| `bundle/` | Ren'Py SDK + プラグイン + アプリを Windows 用パックにするスクリプト、ランチャーのボタン、この案内書(`guide/`) |

この案内書もリポジトリの文書から作られます。韓国語版は「pygaki でシナリオを書く」が `pykaki/docs/GUIDE.md`、「プラグイン カスタムガイド」が `showpy/docs/CUSTOM_GUIDE.md` をそのまま読み、残りの章は `bundle/guide/parts/` の文章、「エフェクト見本」はエフェクトファイルと見本動画から作ります。日本語版・英語版は `bundle/guide/ja/`、`bundle/guide/en/` の訳文を読みます(元の文書が訳より新しいと、作るときに知らせます)。直したあと `python bundle/guide/build_guide.py` を実行すると `bundle/guide/` に 3 つの言語の HTML ができ、パックを作るときも自動で作り直して入れます。

## 準備

* **Ren'Py SDK 8.6.1**:プラグインを試し、Lint を実行します。pygaki パックをダウンロードしたなら、そのフォルダーが SDK です。
* **Node.js**(pygaki を直すとき):`pykaki/` と `pykaki/app/` で `npm ci` を 1 回実行します。
* **Python 3**(パックを作るとき):`bundle/make_bundle.py` を実行します。
* 試し用の Ren'Py プロジェクトを 1 つ作っておきます(ランチャーの新しいプロジェクト → Pygaki)。本物のゲームで直接直しません。

## プラグインを直す

1. リポジトリの `showpy/game/` 以下のファイルを直します。
2. 試しのプロジェクトの `game/` にそのフォルダーをコピーし、**`.rpyc` ファイルを消します。**残っていると、消したコードが動き続けます。試しのプロジェクトで保存した `*_layout.rpy`(エディターで保存した値)は消さなくてかまいません。
3. ランチャーで **Lint** を実行し、ゲームを起動して画面を見ます。エラーが出たら、プロジェクトフォルダーの `traceback.txt`、`errors.txt`、`log.txt` を読みます。
4. プラグインは単独で入れても動かなければいけません。`ui_kit` なしで `screen_fx` だけ、`screen_fx` なしで `ui_kit` だけを入れても Lint を試します。

守ること:

* ユーザーが直す値は `*_config.rpy` に置き、エンジン(`engine/`、`editor/`)はその値を読むだけにします。
* `init` の数字とファイルの `init offset` を足した値が -999〜999 に収まるようにします(`init 999` は 1000 になり Lint の警告)。
* 画面に出る文字に `·`(中黒)、`≡` を使いません。Ren'Py 標準の韓国語フォントになく、四角で表示されます。画面の文字の `[` は `[[` と書きます。
* シェーダーの色は透明度を掛けた値です。色を変えるときは `rgb / a` で戻し、`vec4(col * a, a)` で出します。
* インターネットで手に入れたシェーダーやコードはライセンスを確認し、そのまま持ってこず、見た目だけを参考に新しく書きます(GPL のコードは持ってきません)。
* 版を上げるときは、エンジンの `VERSION`、そのフォルダーの `README.md`、`showpy/docs/` の文書、`showpy/CHANGELOG.md` を一緒に直します。

## エフェクトを 1 つ足す(エフェクトフォルダー)

文字の登場エフェクトや画像トランジションは、コードを直さず **`ui_kit/effects/` に `.glsl` ファイルを 1 つ足す**ことで入れます。ファイルを入れてゲームを再起動すると、Ren'Py の `effect="名前"`、`img_fx.use("名前")` と pygaki の一覧に自動で出ます。ファイルを消すとなくなり、その名前を使ったスクリプトは止まらず基本の見た目で動きます。アプリの [エフェクト] 画面では一覧から隠すことだけができます。

ファイルは `@` で始まる印の行と、字下げした GLSL コードでできています。

| 印 | 意味 |
| --- | --- |
| `@effect 名前 表示名` | 文字の登場エフェクトの始まり |
| `@transition 名前 表示名` | 画像トランジションの始まり |
| `@time 秒` | 画像トランジションにかかる時間の初期値 |
| `@set u__名前 値` | 値の初期値。スクリプトで変える(`img_fx.use("bands", count=10)`、`effect="名前:u__名前=値"`) |
| `@param u__名前 最小 最大 表示名` | pygaki のスライダーの範囲と名前 |
| `@variables` | uniform の行 |
| `@fragment` | 点ごとに色を決めるコード |

画像トランジションの `@fragment` では `l__t`(進み具合 0→1)、`l__uv`(点の位置 0〜1)、`l__size`(横縦のピクセル)、`l__old`(前の画像の色)、`l__new`(新しい画像の色)を使い、ほかの位置は `texture2D(tex0, 位置)`(前の画像)、`texture2D(tex1, 位置)`(新しい画像)で読みます。最後に `gl_FragColor` に色を入れます。シェーダートランジションに使う画像トランジションは、`@set u__cut 値`(0〜1)で画面シェーダーが切り替わる時点を決めます。

フォルダーに入っているエフェクト(文字 `maskup`、`tracking`、`sweep`、`backbox`、`karaoke`、`meltglitch`、`droplets`、`scramble`、画像 `irisin`、`bands`、`pixelsort`、`datamosh`、`slide`、`mosaic`、`blinds`、`static`、`calibrate`、`tapestretch`、`blink`、`pushup`)がお手本です。詳しい形式と、AI に新しいエフェクトを頼むときの依頼文は `ui_kit/effects/README.md` にあります。文字エフェクトの基本エフェクトは `ui_kit/engine/text_effects.glsl` 1 ファイルにあり、pygaki もビルド時にこのファイルをそのまま取り込んで、Ren'Py と同じ見た目で描きます。

## 画面シェーダーを 1 つ足す

画面シェーダーもエフェクトと同じく **シェーダー 1 つにファイル 2 つ** で分かれているので、新しいシェーダーを入れるときに画面エフェクトのエンジン全体(`screen_fx/engine/screen_fx.rpy`)は直しません。シェーダーのコードと値の一覧が入った `screen_fx/engine/<名前>.rpy`、ユーザーが直す値が入った `screen_fx/<名前>_config.rpy` の 2 ファイルだけを足します。`screen_fx/README.md` 12 章の見本(モノクロ `mono`)の 2 ファイルを新しい名前で保存し、中の `mono` を新しい名前に変えてから、値の一覧(`PARAMS`)、スライダー(`GROUPS`)、シェーダーのコードを直します。外すにはその 2 ファイルを消し(`.rpyc` まで)、消さずに選択の一覧から隠すだけなら `screen_fx/shaders_off.txt` に名前を書きます。エフェクトフォルダーの `.glsl` 1 つよりは書くことが多めです(値の一覧とスライダーを Python で書く)。`screen_fx.register_shader` で登録すると、`$ screen_fx.use("名前")`、セリフの括弧 `(fx="名前")`、ゲーム内編集画面の画面エフェクトタブ、pygaki のシェーダー一覧に自動で出ます。詳細値のスライダー(`PARAMS`、`GROUPS`)を直したら、試しのプロジェクトで Lint を 1 回実行して `screen_fx/shader_list.json` を作り直し、リポジトリの同じ場所にコピーしてから pygaki をビルドし直します。

## pygaki を直す

```bash
cd pykaki && npm ci            # 最初に 1 回
cd pykaki && npm run dev       # 開発サーバー http://localhost:5173 (例のシナリオ。Ren'Py プロジェクトは開けない)
cd pykaki && npx tsc --noEmit  # 型チェック
cd pykaki && npm run build     # pykaki/dist/index.html 1 ファイル
cd pykaki/app && npm ci && npm start -- --project "Ren'Py プロジェクトフォルダー"   # デスクトップアプリで起動
cd pykaki/app && npm run dist  # Windows アプリのフォルダー (pykaki/app/out/win-unpacked)
```

* 画面を直したあとは `npx tsc --noEmit` と `npm run build` を実行します。アプリはビルドした画面をコピーして使います。
* 新しい文字エフェクトを入れたら、見本動画(`pykaki/public/effects/*.webm`)を `pykaki/tools/record_effect_clips.py` で撮り直し、案内書も作り直します。
* アプリ側(`pykaki/app/`)を直したら、`npm run web && node smoke.cjs` で本物の Electron を起動する試験を実行します。GitHub Actions「pygaki 앱」も同じ試験を行い、Windows アプリのフォルダーを作ります。
* ヘルプの文章は `pykaki/docs/GUIDE.md` を直すと次のビルドに入ります。
* 画面の文字を足したり変えたりしたら、`pykaki/i18n/strings.tsv` に日本語・英語を足し、`pykaki/i18n/README.md` の手順で辞書を作り直します。
* シナリオファイル(`.flow.json`)に古い版の知らない値を足したら、`pykaki/src/version.ts` の `FEATURE` を 1 上げます(古いアプリが「より新しい版」の警告を出す)。保存形式の名前 `"format": "renpy-flow"`、ファイル名 `.flow.json` は変えません。
* アプリはユーザーの許可なく外へ通信しません。ゲームとのリアルタイム連携は `127.0.0.1` だけを使います。

## 2 つのプログラムの形式を合わせる

pygaki が書き出すスクリプト(`game/script_flow.rpy`)の行の形、行末の目印(`# @l:…`)、ゲームが pygaki に返すファイル(`showpy_inbox.json`)、リアルタイム連携のコマンドは、すべて `docs/LINK.md` に書いてあります。この形式を変えたら、`docs/LINK.md` と両方のコード(`pykaki/`、`showpy/`)を同じコミットで直します。スクリプトに新しい種類の行を入れたら、ゲーム側(`ui_kit/engine/script_edit.rpy`)と pygaki 側(`pykaki/src/inbox.ts`)を一緒に合わせます。

## パックを作る

Ren'Py SDK + プラグインのテンプレート + ランチャーのボタン + アプリを Windows 用の zip にまとめます。リポジトリにタグを上げると(`git tag v1.0 && git push origin v1.0`)、GitHub Actions「배포 파일」がまとめて Releases に下書きとして上げます。自分のパソコンではこう作ります。

```bash
python bundle/make_bundle.py --sdk Ren'PySDKフォルダー --app pykaki\app\out\win-unpacked --zip --tag v1.0
```

`bundle/out/` に、Ren'Py 入りのパックと、SDK をすでに持っている人向けの追加用ができます。テンプレートに入れるプラグインと、テンプレートだけで変えておく設定(最初は VHS オーバーレイをオフ)は、`make_bundle.py` の `PLUGINS`、`TEMPLATE_SETTINGS` で直します。パックに作った人のパソコンのパスが入っていると、作成が止まります。詳しくは `bundle/README.md`。

配布版とパックには、開発用ファイル(`showpy_live.json`、`showpy_inbox.json`、`pykaki_preview.json`、`pykaki_goto.json`、`ui_kit_backup/`、`*.flow.json`)が入らないようにします。

## AI と一緒に直すとき

リポジトリ直下の `CLAUDE.md` と `showpy/docs/DEV_RULES.md` に、AI が守るルールがあります。新しい機能は、まずできるかどうか、短い計画、見込み時間を聞いてから始めさせ、終わったら何を変えて何を確認したかをまとめさせます。試験は試しのプロジェクトでさせます。
