<!-- 원본: showpy/docs/CUSTOM_GUIDE.md @ 9716e03b8d -->
# pygaki プラグイン カスタムガイド (5.1)

2026-11-13 · バージョン 5.1(5.1 での変更:エフェクトフォルダーと画像トランジション、エフェクト・シェーダーの非表示ファイル、フォトコラージュ(ずれる破片の代わり)、ゆらぎシェーダー `ripple`、シェーダー行の詳細値と場面ごとのセリフ音・カーソル、シェーダートランジションにピクセルソート・データモッシュ、系統図、pygaki はデスクトップアプリのみ。5.0 での変更:新しい画面エフェクト 7 つ(グリッチ、ジリジリ、網点、ホログラム、暗視スコープ、ずれる破片、破片の飛散)、画像 1 枚にかけるエフェクト、文字の登場エフェクト 11 個、テキストボックス(吹き出し、丸い枠)、スプラッシュを画面で直す、ゲーム内編集画面の「UI テキスト」タブ。4.22 での変更:シェーダーが変わる行と行ごとのトランジション、カーソルとシェーダーの「ここから」、セリフタブの整理、カーソル・CTC 画像のフォルダー。4.21 での変更:シェーダー欄の詳細属性を 1 番、2 番の下へ、行を押すとゲームもその行へ。4.20 での変更:シェーダーの 2 枠と「ここから適用」、タイトル/ゲーム内メニューのシェーダー、タイトルの背景とタイトル、サブタイトル、文字エフェクト、回転ハンドル)

## この文書の見方

pygaki プラグイン 5.1 を入れた人が、**どのファイルのどの値を直すと何が変わるか** を探すための文書です。設定名の詳しい説明は各フォルダーの `README.md`(韓国語)にあり、この文書は「やりたいこと」から出発します。文章を pygaki で書くなら「pygaki と一緒に使う」から見てください。

ゲーム内編集画面(Shift+M)は、パネルの [言語] ボタンで日本語・英語にできます(最初はゲームの言語に合わせます)。この文書では、タブやボタンの名前を韓国語の画面の名前と並べて書いているところがあります(例:「セリフタブ」= 대사 탭)。設定ファイルのコメントは韓国語です。

| フォルダー | すること | 直すファイル |
| --- | --- | --- |
| `ui_kit` | タイトルメニュー、選択肢、カーソル・クリック待ち表示・セリフ音・テキスト速度・クイックメニュー、セリフ 1 行ごとのスタイル・名前の位置・速度・登場エフェクト、画像・動画の配置(movies/ の動画の自動登録、bg がいちばん後ろ、show・hide の行の位置とトランジション。2.8 で追加)+ エディター | `title_menu_config.rpy`、`choice_menu_config.rpy`、`custom_ui_config.rpy`、`say_style_config.rpy`、`stage_config.rpy` |
| `screen_fx` | 画面全体のエフェクト。**基本エフェクト**(なし、ASCII、レトロターミナル、ゲームボーイ、5.0 からグリッチなど 7 つ、5.5 からゆらぎ)の上に **VHS オーバーレイ**(オン/オフ、ゆがみの度合い)を重ねる(4.0)、場面ごとのエフェクト切り替えと TV オフ・オンのトランジション、文字の除外(セリフ・選択肢・メニューを選んでエフェクトから外す)、タイトル画面のゆらぎ | `screen_fx_config.rpy`、`vhs_crt_config.rpy`、`ascii_config.rpy`、`retro_term_config.rpy`、`gameboy_config.rpy`、`ripple_config.rpy`、`collage_config.rpy` などエフェクトごとに 1 つ |
| `hotkeys` | ショートカットキーの追加・解除、操作方法画面の説明 | `hotkeys_config.rpy` |
| `splash` | タイトルの前に出るロゴ・注意・操作方法のページ(2.3 で追加) | `splash_config.rpy` |

決まりは 3 つです。

1. **名前が `_config.rpy` で終わるファイルだけを直します。** `engine/`、`editor/` フォルダーと `hotkeys.rpy` は直しません。
2. 画像・サウンド・動画・フォントのパスはすべて **`game` フォルダー基準** です。(`"gui/cursor/cursor1.png"` = `game/gui/cursor/cursor1.png`)
3. 直したあとゲームの実行中に **Shift+R** を押すと読み直してすぐ見えます。すべて直したら、ランチャーで Lint を実行します。

エディター(開発モードで Shift+M)では **セリフ・選択肢はその行だけ** を直し、Ctrl+S を押すと **スクリプト(.rpy)のその行の括弧にすぐ保存** されます。直す前の元はプロジェクトフォルダーの `ui_kit_backup/` に残ります。すべてに当てはめる初期値は設定ファイルで直します。そのほかのタブ(タイトルメニュー、カーソル/セリフ音、画面エフェクト)で保存した値は各プラグインフォルダーに `*_layout.rpy` としてでき、設定ファイルの同じ値より優先されます。設定ファイルを直したのに変わらないときは、まずそのファイルを確かめてください。

## ひと目で探す

変えたいものを探して、右のファイルの値を直せば OK です。「エディター」欄に書いてあるものは、Shift+M のエディターでも直せます。

| 変えたいもの | ファイル | 値 | エディター |
| --- | --- | --- | --- |
| タイトル前のロゴ・注意・操作方法のページ | `splash/splash_config.rpy` | `splash.pages` |  |
| それらのページの共通フォント・色・現れる時間 | `splash/splash_config.rpy` | `splash.default` |  |
| タイトルで操作方法をもう一度見る | `ui_kit/title_menu_config.rpy` | 項目の `"action": splash.ShowPage("controls")` |  |
| タイトルメニューの項目の文字・動作 | `ui_kit/title_menu_config.rpy` | `tmenu.items` の `"text"`、`"action"` |  |
| タイトルメニューの項目の位置・回転・大きさ | `ui_kit/title_menu_config.rpy` | 項目の `"x"`、`"y"`、`"rotate"`、`"skew"`、`"zoom"`、`"size"` | タイトルメニュータブ |
| タイトルメニュー全体のフォント・色 | `ui_kit/title_menu_config.rpy` | `tmenu.default` の `"font"`、`"color"`、`"hover_color"` | タイトルメニュータブ、3 番「すべての項目共通」 |
| 選択を動かすときに押しのけられる距離・速度 | `ui_kit/title_menu_config.rpy` | `tmenu.push_before`、`push_after`、`move_time`、`move_warper` |  |
| タイトルの背景動画 | `ui_kit/title_menu_config.rpy` | `tmenu.background_movie` |  |
| タイトルのゲーム名の位置・色、バージョン表示 | `ui_kit/title_menu_config.rpy` | `style main_menu_vbox`、`style main_menu_title`、`tmenu.show_version` |  |
| ゲームメニュー(セーブ・ロード画面)の形、左の一覧 | `ui_kit/title_menu_config.rpy` | `tmenu.game_menu_side`、`tmenu.game_menu_content_x`、`tmenu.game_menu`、`style navigation_button_text` |  |
| ゲーム中の ESC メニュー(タイトルメニューの形) | `ui_kit/title_menu_config.rpy` | `tmenu.pause`(オン)、`tmenu.pause_dim`(後ろの画面を暗く)、`tmenu.pause_background`、`tmenu.pause_items`(3.1) | ESC メニューを開いたままタイトルメニュータブ → Ctrl+S |
| 選択肢 1 つの位置・フォント・色 | スクリプト(`script.rpy` など) | 選択肢の後ろの括弧 `(x=…, y=…, font=…, color=…)` | 選択肢タブ → Ctrl+S(スクリプトにすぐ) |
| すべての選択肢のフォント・サイズ・色・背景 | `ui_kit/choice_menu_config.rpy` | `cmenu.default` |  |
| 縦の一覧の選択肢の位置 | `ui_kit/choice_menu_config.rpy` | `cmenu.list_pos` |  |
| 選択肢の登場演出 | `ui_kit/choice_menu_config.rpy` | `cmenu.appear`、`appear_time`、`appear_stagger` |  |
| マウスカーソル | `ui_kit/custom_ui_config.rpy` | `custom_ui.cursor`、`cursor_frames`、`cursor_hold`(1/2 フレームごと)、`cursor_mode`、`cursor_hotspot`(3.0) | カーソル/セリフ音タブ(マス 12 個) |
| クリック待ち表示(ctc) | `ui_kit/custom_ui_config.rpy` | `custom_ui.ctc`、`ctc_frames`、`ctc_hold`(1/2 フレームごと)、`ctc_position`(3.0) | カーソル/セリフ音タブ(マス 12 個) |
| セリフが出るときの音 | `ui_kit/custom_ui_config.rpy` | `custom_ui.typing_sound`、`typing_volume` | カーソル/セリフ音タブ |
| テキスト速度の初期値 | `ui_kit/custom_ui_config.rpy` | `custom_ui.text_cps` | カーソル/セリフ音タブ |
| クイックメニューを最初から見せる | `ui_kit/custom_ui_config.rpy` | `custom_ui.quick_menu` | カーソル/セリフ音タブ |
| セリフ 1 行の位置・サイズ・色 | スクリプト | セリフの後ろの括弧 `(x=…, y=…, size=…, color=…)` | セリフタブ → Ctrl+S(スクリプトにすぐ) |
| セリフ 1 行の名前の位置・サイズ・色 | スクリプト | セリフの後ろの括弧 `(name_x=…, name_y=…, name_size=…, name_color=…)` | セリフタブ、Tab で「名前」→ Ctrl+S |
| セリフ 1 行の出る速度・登場エフェクト | スクリプト | セリフの後ろの括弧 `(cps=20, effect="jitter")`(`cps` は 1 秒に出る文字数)、または倍率 `(speed=0.5)` | セリフタブ、速度・エフェクトのボタン → Ctrl+S |
| 画像・動画の位置と登場・退場のトランジション(show / hide / scene の行) | スクリプト | `show eileen at stage.pos(420, 720) with dissolve`、`hide eileen with moveoutright` | 画像/動画タブ → Ctrl+S(スクリプトにすぐ) |
| show / scene の行の画像をほかのファイルに、新しい show / scene の行を入れる | スクリプト | `scene fx_bg` → `scene room`、下に `show hand`(3.0) | 画像/動画タブ「画像/動画を選ぶ」→ Ctrl+S |
| 動画を名前だけで使う、透明な動画 | `game/movies/` フォルダー + `ui_kit/stage_config.rpy` | `movies/rain.webm` → `show rain`、`movies/mask_ghost.webm` → `show ghost`(透明)、`stage.movie_once` |  |
| bg の画像をいつもいちばん後ろに | `ui_kit/stage_config.rpy` | `stage.bg_tag`、`stage.bg_zorder` |  |
| 背景として扱うタグを足す(いちばん後ろ + エディターで位置固定) | `ui_kit/stage_config.rpy` | `stage.bg_tag = [ "bg", "fx_bg" ]`(3.0) |  |
| 編集中も画面エフェクトを見る / 切る | `screen_fx/screen_fx_config.rpy` | `screen_fx.editor_preview = True` / `False`(3.0) | 編集中に V キー |
| エディターのパネルが画面を隠すとき | (キー) | タイトルをドラッグ、X でたたむ、Space を押している間隠す、B で自動でよける、P で隅を変える |  |
| エディターのパネルの下が切れるとき | (マウス) | パネルの上でホイール、または右のピンクのスクロールバーをドラッグ(2.9) |  |
| このセリフから画面エフェクトを変える(取り消すまで続く) | スクリプト | セリフの後ろの括弧 `(fx="ascii")`、取り消し `(fx="default")`、トランジション `(fx_transition="fade")` | セリフタブの「画面エフェクト」の行、または画面エフェクトタブ「このセリフからこのエフェクト」→ Ctrl+S(スクリプトにすぐ) |
| セリフでない行(scene、show、with、$ の行)から画面エフェクトを変える | スクリプト | その行のすぐ上に `$ screen_fx.use("ascii", overlay=False, transition="fade")`、`$ screen_fx.clear()`、`$ screen_fx.set_overlay(True)`、`$ screen_fx.set_warp(3)`(4.1) | 画面エフェクトタブ「行に入れる」、または「この行からこのエフェクト」→ Ctrl+S(スクリプトにすぐ) |
| このセリフから VHS オーバーレイのオン/オフ、曲がり | スクリプト | セリフの後ろの括弧 `(fx_overlay=False)`、`(fx_overlay=True)`、`(fx_warp=3.0)`、`(fx_warp="default")`(4.0) | セリフタブ「オーバーレイ(VHS)」、「オーバーレイの曲がり」の行 → Ctrl+S |
| マウスカーソルが画面エフェクトを受けるか(区間ごと) | `screen_fx/screen_fx_config.rpy` + スクリプト | `screen_fx.cursor = "effect"` / `"overlay"` / `"top"`、`$ screen_fx.set_cursor("top")`、セリフの括弧 `(fx_cursor="overlay")`(4.2) | セリフタブ「カーソル」の行、行に入れるの「カーソル」の行 → Ctrl+S |
| このセリフから文字を除く | スクリプト | セリフの後ろの括弧 `(fx="gameboy", fx_exclude=("say",))` | セリフタブ「文字の除外」の行 → Ctrl+S |
| キャラクターのセリフの基本の位置・フォント | `ui_kit/say_style_config.rpy` | `define t = Character(what_xpos=…, what_font=…)` |  |
| 場面で画面エフェクトを変える・取り消す | スクリプト | `$ screen_fx.use("ascii")`、`$ screen_fx.use("ascii", overlay=False)`、`$ screen_fx.clear()` |  |
| ふだんの画面エフェクト(基本エフェクト) | `screen_fx/screen_fx_config.rpy` | `screen_fx.base`(`"none"`、`"ascii"`、`"retro_term"`、`"gameboy"`) | 画面エフェクトタブ → 基本エフェクト、トランジション |
| エフェクトを変えるときのトランジション(TV オフ・オン / ふわっと / すぐ) | `screen_fx/screen_fx_config.rpy` | `screen_fx.transition`、`screen_fx.tv`、`screen_fx.fade_time` | 画面エフェクトタブ → 基本エフェクト、トランジション、「プレビュー」 |
| ASCII の文字マスの大きさ・比率・くっきり、文字の一覧、色 | `screen_fx/ascii_config.rpy` | `ascii.settings` の `"cell"`、`"aspect"`、`"crisp"`、`"chars"`、`"color_mode"`、`ascii.presets` | 画面エフェクトタブ → ASCII |
| ASCII のフォント | `screen_fx/ascii_config.rpy` | `ascii.font`(`None` = 同梱の Neo둥근모) |  |
| VHS オーバーレイのオン/オフ(基本はオン) | `screen_fx/screen_fx_config.rpy` | `screen_fx.overlay`(`True` / `False`) | 画面エフェクトタブ → 基本エフェクト、トランジション「オーバーレイ(VHS)」 |
| エフェクトごとにオーバーレイをオンにするか(レトロターミナルは基本オフ) | 各エフェクトの設定ファイル | `ascii.overlay`、`retro_term.overlay`、`gameboy.overlay`(`True` / `False`) | 画面エフェクトタブ → エフェクトのボタン →「オーバーレイ(VHS)」 |
| オーバーレイのゆがみの度合い(曲がり、ずれ、色のにじみ) | `screen_fx/vhs_crt_config.rpy` | `vhs_crt.settings` の `warp_amount`、`distort_intensity`、`aberration`。ゲーム中は `$ screen_fx.set_warp(3.0)`、`$ vhs_crt.set(…)` | 画面エフェクトタブ → VHS オーバーレイのスライダー、セリフタブ「オーバーレイの曲がり」 |
| エフェクトからセリフ・選択肢・メニューを外す(文字の除外) | 各エフェクトの設定ファイル | `vhs_crt.exclude`、`ascii.exclude`、`retro_term.exclude`、`gameboy.exclude`(`"say"`、`"choice"`、`"screens"` から選ぶ) | 画面エフェクトタブ → エフェクトのボタン →「文字の除外」 |
| レトロターミナルの色(蛍光体・背景)、曲面 CRT、内蔵 VHS | `screen_fx/retro_term_config.rpy` | `retro_term.settings` の `"phosphor"`、`"background"`、`"crt"`、`"vhs"`、`retro_term.presets` | 画面エフェクトタブ → レトロターミナル |
| ゲームボーイのディザリング/ピクセル化、点の大きさ、4 つの色、LCD っぽさ | `screen_fx/gameboy_config.rpy` | `gameboy.settings` の `"mode"`、`"pixel_size"`、`"color1"`〜`"color4"`、`"grid"`、`"shadow"`、`gameboy.presets` | 画面エフェクトタブ → ゲームボーイ |
| スクリーンに入れた画像にも場面のエフェクト | そのスクリーン | `add "map.png" at screen_fx.scene` |  |
| タイトルのゆらぎの強さ(5.5 からシェーダー) | `screen_fx/ripple_config.rpy` | `ripple.settings` の `"amount"`、`"scale"`、`"speed"`、`"shine"`、`ripple.presets`。タイトルにかけるかは `screen_fx_config.rpy` の `screen_fx.title_shaders` | GUI編集 → タイトルシェーダー、シェーダーの初期値 |
| 選択の一覧からエフェクト・シェーダーを隠す(5.1) | `ui_kit/effects/effects_off.txt`、`screen_fx/shaders_off.txt` | 1 行に名前 1 つ(`#` の後ろは説明)。すでに使ったスクリプトはそのまま動く | アプリ [エフェクト]、[シェーダー] の [非表示](隠したものは [非表示は下へ] で一覧の下に集める) |
| 文字の登場エフェクト、画像トランジションの追加・削除(5.1) | `ui_kit/effects/` フォルダー | `.glsl` ファイル 1 つがエフェクト 1 つ。下の「エフェクトフォルダー」 | アプリ [エフェクト] |
| VHS オーバーレイの強さ・範囲 | `screen_fx/vhs_crt_config.rpy` | `vhs_crt.settings`、`vhs_crt.scope` | 画面エフェクトタブ → VHS オーバーレイ |
| VHS のプリセット(ゲーム中に切り替えるセット) | `screen_fx/vhs_crt_config.rpy` | `vhs_crt.presets` | 画面エフェクトタブ → VHS オーバーレイ、「直す対象」でプリセットを選ぶ |
| ショートカットキーの追加・解除 | `hotkeys/hotkeys_config.rpy` | `hotkeys.bindings`、`hotkeys.unbind` |  |
| 操作方法画面の説明 | `hotkeys/hotkeys_config.rpy` | `hotkeys.keyboard_help` |  |
| 機能 1 つを丸ごとオフにする | 各設定ファイルのいちばん上 | `tmenu.enabled`、`cmenu.enabled`、`custom_ui.enabled`、`say_style.enabled`、`watermorph.enabled`、`vhs_crt.enabled`、`ascii.enabled`、`retro_term.enabled`、`gameboy.enabled`、`splash.enabled` |  |

## pygaki と一緒に使う

pygaki は、ボックスと線でシナリオを書くエディターです。pygaki パックのデスクトップアプリとして出ていて、Ren'Py ランチャーでプロジェクトを選んで **[pygaki로 편집]**(pygaki で編集)を押すと開きます(Web 版は 5.1 で廃止)。2 つのプログラムを一緒に使うと、**文章は pygaki で、画面は Ren'Py で** 合わせます。Ren'Py のコードを知らなくてもかまいません。アプリの使い方はアプリの [ヘルプ](F1、この案内書の「pygaki でシナリオを書く」の章)にあります。

| やりたいこと | どこで |
|---|---|
| セリフ、選択肢、物語の流れを書く | pygaki [スクリプト編集] |
| セリフの文字サイズ、フォント、色、速度、登場エフェクト | pygaki セリフ行の文字エフェクトカード。カードの上のプレビューですぐ見えます |
| ボックス・場面ごとの画面シェーダー、トランジション、セリフ音、カーソル・クリック待ち | pygaki ボックスや label の **◐ シェーダー** |
| 画像、webm 動画、BGM、効果音を入れる | pygaki ボックスの背景 / 画像・動画 / 効果音・BGM カード(ゲーム内編集画面で入れてもシナリオに書き込まれる) |
| セリフ・選択肢・画像の位置 | 行の **[位置を移動]** → ゲーム画面でドラッグ → [保存]。座標は pygaki に書き込まれます |
| タイトルメニュー、カーソルなどゲーム全体の見た目 | pygaki [GUI編集](ゲーム内編集画面と同じもの) |
| エフェクト・シェーダーを見る、一覧から隠す | pygaki [エフェクト]、[シェーダー](エフェクトの追加・削除は `ui_kit/effects/` フォルダーで) |

### 最初に一度だけする準備

1. pygaki パックの `renpy.exe` でランチャーを起動し、**[+ Create New Project]**(新しいプロジェクトを作成)で **Pygaki** を選んで作ります。pygaki プラグインとカーソル・クリック待ちのサンプル画像が最初から入っています。(既存のプロジェクトなら、プラグインのフォルダーを `game` に入れます)
2. プロジェクトを選んで **[pygaki로 편집]**(pygaki で編集)を押します。

これで終わりです。アプリがそのプロジェクトのシナリオ(`プロジェクト名.flow.json`)を開き、直すたびに保存し、`game/script_flow.rpy` に書き出します。Ren'Py で実行すると、pygaki の最初のボックスから始まります。

`script.rpy` はそのままでかまいません。書き出したファイルに下の行が入っているので、ゲームの開始が最初のボックスにつながり、`script.rpy` の `label start:` は実行されません。

```renpy
init python:
    config.label_overrides["start"] = "prologue"
```

pygaki の新しいシナリオの最初の label 名は `prologue` です。ほかの名前に変えたり開始ボックスを動かしたりすると、書き出すときその値に従います。

知っておくこと:
- キャラクターの id を `e` にすると、`script.rpy` の `define e` と重なります。Lint に警告が出て、どちらの名前が使われるか保証されないので、ほかの id を使うか `script.rpy` を消してください。
- シナリオに名前が `start` の label を自分で作ると、`script.rpy` の `label start:` と重なって Ren'Py がエラーを出します。この場合だけ、そのファイルの `label start:` を消します。

### ふだんの作業の順番

```
① pygaki [スクリプト編集] で文章を書く (手を止めると自動で書き出し、Ctrl+E ですぐ書き出し)
② 右上の [▶ Ren'Pyで実行] でゲームを起動 (開発モード)
   → これで、書き出すたびにゲームが変わったスクリプトを自動で読み直します
③ ボックスカードの [Ren'Pyでここへ移動] でゲームをそのボックスへ
④ 画像はボックスの画像・動画カードで押して入れ、行の [位置を移動] でゲーム画面でドラッグして位置を合わせてから [保存]
⑤ タイトル、カーソル、セリフのボックスの最初の見た目は [GUI編集] でゲーム画面を見ながら直す
```

### 画像、動画、サウンドを入れる

[画像/動画/サウンドを選ぶ] 画面には、`game/images`、`game/movies`、`game/audio` のファイルが出ます。

| 選んだもの | ボタン | スクリプトに入る行 |
|---|---|---|
| `images/bg hall.png` | scene | `scene bg hall` |
| `images/mina scared.png` | show | `show mina scared` |
| `images/ghost.png` | show | `show ghost` |
| `movies/rain.webm` | show | `show rain` |
| `movies/mask_ghost.webm` | show | `show ghost`(透明な動画) |
| `audio/hum.wav` | BGM | `play music "audio/hum.wav"` |
| `audio/knock.wav` | 効果音 | `play sound "audio/knock.wav"` |

- 名前が `bg ` で始まる画像は背景です。
- 名前の最初の単語がキャラクターの id と同じなら、そのキャラクターの表情です。pygaki でキャラクター `mina` を登録しておいてください。
- ファイル名は英字、数字、`_` で付けてください。そうすればどこでも問題が起きません。

pygaki では、ボックスの背景 / 画像・動画 / 効果音・BGM カードで同じファイルを押して入れます。キャラクターのセリフを書いている最中なら、画像・動画カードのいちばん上にそのキャラクターの画像(表情)が出ます。

### 位置を保存する範囲

画像/動画タブの **位置を保存** ボタンで選びます。

| ボタン | 意味 | `ui_kit/stage_layout.rpy` に書かれるもの |
|---|---|---|
| このボックスだけ | 今の pygaki のボックスでだけこの位置 | `("n4", "ghost"): "stage.pos(420, 720)"` |
| どこでも | この画像はどのボックスでもこの位置 | `"ghost": "stage.pos(900, 720)"` |

位置は pygaki に渡らず、このファイルにだけ保存されるので、pygaki で書き出し直しても消えません。同じボックスで同じ画像を 2 か所に出すなら、pygaki の「直接コマンド」の行に書きます。

```renpy
show ghost at stage.pos(420, 720)
```

### Ren'Py のエディターで保存されないもの

pygaki が作ったスクリプトは書き出し直すと上書きされるので、セリフタブでは位置とシェーダー・カーソルの行だけが保存されてシナリオに書き込まれ、選択肢タブと画面エフェクトの「行に入れる」は保存されずに理由が出ます。**文章と文字の形、速度、登場エフェクトは pygaki で直してください。** タイトルメニュー、カーソルのようにゲーム全体で使う値(`*_layout.rpy`)と、画像の行のトランジション、画像の差し替えはそのまま保存されます。

### 元に戻す

pygaki の **[バージョン一覧]** で戻してから **Ctrl+E** を押すと、Ren'Py もついてきます。

- 保存版は、変更があれば 5 分ごと、書き出すとき、取り込む前に自動で残ります。自動保存版は最近の 30 個だけを置きます。
- シナリオの元データはプロジェクトフォルダーの `.flow.json` で、直すたびに保存されます。保存版(バージョン一覧)はこのパソコンのアプリの中にしかないので、プロジェクトフォルダーをバックアップしておいてください。
- 画像の位置は保存版では戻りません。

### 問題が起きたとき

| 症状 | 理由と解決 |
|---|---|
| `The label start is defined twice` | シナリオに名前が `start` の label があり、ほかの `.rpy` にも `label start:` があります。シナリオの label 名を変えるか、そのファイルの `label start:` を消します |
| `ValueError: unsupported format character` | セリフの `%` のせいです。pygaki の設定の **% を文字のまま** をオンにします。新しいプロジェクトはオンになっています |
| Ren'Py で入れた画像が pygaki に出ない | pygaki 上のプロジェクトフォルダーのメニューの **[再読み込み]** を押すか、Ctrl+E を押してください |
| Ren'Py で入れた画像が消えた | `showpy_inbox.json` に残っているので、pygaki で [再読み込み] のあと Ctrl+E を押すと戻ります |
| 「この行の印がありません」 | スクリプトエディターで pygaki プラグイン連携をオンにして、書き出し直してください |
| キャラクター id のエラー | `stage`、`ascii`、`t`、`n1` などは pygaki プラグインが使う名前です。ほかの id に変えてください |

## アセットを替える

ファイルを `game` フォルダーの下のどこかに入れ、下の値にそのパスを書きます。配布用の初期設定は表の「初期のパス」を使うので、同じ名前で上書きすれば設定を直さなくてもかまいません。

| アセット | 初期のパス | 形式・条件 | 直す値 |
| --- | --- | --- | --- |
| フォント | `game/fonts/` に好きな名前 | .ttf / .otf / .ttc、使う言語の文字が入ったフォント。ファイル名の大文字小文字をコードとまったく同じに(Mac・Android・Web は区別する) | タイトル:`tmenu.default["font"]` · 選択肢:`cmenu.default["font"]` · セリフ:`Character(what_font=…)` · ゲーム全体:`gui.rpy` の `gui.text_font` など |
| カーソルのフレーム | `gui/cursor/cursor1.png` 〜 `cursor6.png` | PNG、エディターのマスは 12 枚(順に再生)。例:64×64 | `custom_ui.cursor_frames`、`cursor_hold`(1/2 フレームごと、24fps)、`cursor_hotspot`(クリックの基準点) |
| クリック待ち表示のフレーム | `gui/ctc/ctc1.png` 〜 `ctc6.png` | PNG、エディターのマスは 12 枚 | `custom_ui.ctc_frames`、`ctc_hold`(1/2 フレームごと、24fps) |
| セリフ音 | なし(`None`) | .ogg 推奨。短い音なら文字が出ている間くり返す | `custom_ui.typing_sound` · キャラクターごと:`Character(cb_typing_sound=…)` |
| 選択肢の hover 動画 | なし(`None`) | WebM(VP9)、透明にするなら side_mask 形式(ファイルの横幅 = 表示の横幅 × 2) | `cmenu.default["hover_movie"]`、`hover_movie_size`、`hover_movie_zoom` · 選択肢 1 つだけ:括弧の `hover_movie=…` |
| タイトルメニューの hover 動画 | なし | WebM(VP9)、side_mask。文字の後ろに敷かれる | 項目の `"hover_movie"`、`"hover_movie_pos"`、`"hover_movie_size"` |
| タイトルメニューの文字の代わりの動画 | なし | WebM(VP9)、side_mask | 項目の `"hover_label_movie"` |
| タイトルの背景動画 | なし | WebM(VP9)。透明でなければそのまま、一緒に流れるほかの動画とフレームレートを合わせる | `tmenu.background_movie`、`tmenu.background_side_mask` |
| タイトルの背景画像 | `gui/main_menu.png` | ゲームの解像度の大きさの PNG | ファイルを上書き(または `gui.rpy` の `gui.main_menu_background`) |
| メニューの後ろの半透明の板 | `gui/overlay/main_menu.png` | PNG。完全に透明にすると板が消える | ファイルを上書き、または `tmenu.main_menu_frame = False` |
| 選択肢のボタンの背景 | `gui/button/choice_idle_background.png`、`choice_hover_background.png` | PNG(9 分割の枠 `gui.choice_button_borders`) | ファイルを上書き、または `cmenu.default["button_background"]`、`["button_hover_background"]` |
| 効果音(メニューの移動・決定) | なし | .ogg | `tmenu.hover_sound`、`activate_sound` · `cmenu.hover_sound`、`activate_sound` |
| 名前の背景 | `gui/namebox.png` | PNG(9 分割の枠 `gui.namebox_borders`)。セリフの括弧の `name_x`、`name_y` で動かすと一緒についてくる | ファイルを上書き |
| スプラッシュの背景の動画・画像 | なし(推奨:`movies/`、`gui/splash/`) | WebM(VP9)または PNG、ゲームの解像度の大きさ。動画は画面の大きさに合わせて再生 | ページの `"background"`。動画が終わったら進む:`"duration": "movie"` |
| スプラッシュのロゴの動画・画像 | なし | 透明な動画は side_mask 形式(透明でなければ `"image_side_mask": False`) | ページの `"image"`、`"image_pos"`、`"image_zoom"` |
| スプラッシュの効果音・BGM | なし | .ogg。BGM をタイトルまでつなぐなら `config.main_menu_music` と同じファイル | ページの `"sound"`、`"music"` |
| TV オフ・オンの音 | なし(`None`) | .ogg。消え始めるとき、点き始めるときに 1 回ずつ。効果音の音量に従う | `screen_fx.tv` の `"off_sound"`、`"on_sound"`、`"volume"` |

透明な動画(side_mask)の作り方:After Effects などで透明背景の ProRes 4444 `.mov` に書き出してから、ffmpeg で変換します。コマンドは `ui_kit/README.md` の「動画の準備」にあります。

## タイトル前の画面 — `splash/splash_config.rpy`

ゲームを起動したとき、タイトルより先に出るページを `splash.pages` に順に書きます。ページに書かなかった値は `splash.default` に従い、文字の形は接頭辞(`title_`、`body_`、`key_`、`desc_`、`prompt_`、`option_`)+ Ren'Py の文字スタイルのプロパティで書きます。

**コードを初めて見るなら**、まず下の表を見てください。設定ファイルのすべての行がこれらの形でできています。

| 書き方 | 意味 |
| --- | --- |
| `# …` | その後ろは説明(コメント)なのでゲームは読まない。設定ファイルでは `##` は説明、`# "…": …` のように `#` の後ろにコードがあれば、オフにしてあるコード。オンにするには先頭の `# ` だけを消す(VS Code:行を選んで → Ctrl+/) |
| `define splash.名前 = 値` | 設定を 1 つ決める。`splash.` はこのプラグインの設定という意味 |
| `"文字"` | 引用符の中は文字(文字列)。ファイルのパス、色コード、名前など |
| `_("文字")` | 画面に出る文。あとで翻訳できるように印を付けるもので、囲まなくても同じに見える |
| `2.0`、`1.5` | 数。時間は秒、位置・大きさはピクセル |
| `True` / `False` | オン / オフ(最初の文字は大文字) |
| `None` | 「なし」または「決めていない」 |
| `"#d23c3c"` | 色コード(`#` の後ろに赤・緑・青を 2 桁ずつ)。`"#ffffffaa"` のように 2 桁足すと不透明度 |
| `(640, 200)` | 数 2 つ = (横, 縦)または (x, y) |
| `{ "名前": 値, … }` | 名前と値を組にしたまとまり。ページ 1 つがこの形 |
| `[ 値, 値, … ]` | 順番のある一覧。ページたち、操作方法の表の行たち |
| `,`(カンマ) | 値と値の間に必ず。最後の値の後ろにあってもかまわない。抜けるとゲームが起動せず、エラー画面が出る |
| `\n` | 文字の中の改行 |

ファイルのパスは `game` フォルダー基準です。`"movies/logo.webm"` = `プロジェクト/game/movies/logo.webm`。大文字小文字をファイル名とまったく同じに書いてください。

### 基本のページ 3 つ(値ごとに選べる場合と説明)

`splash_config.rpy` に入っているそのままです(コメントはここで訳したもので、実際のファイルは韓国語。画面に出る文 `_("…")` はファイルどおり韓国語のまま載せています)。先頭に `#` がない行は今オンになっている値、`#` がある行は画像・動画・サウンドのファイルが必要なのでオフにしてある値で、ファイルを入れてから `#` だけを消せばオンになります。すべてのページで共通に使う `splash.default` の値も、設定ファイルの 2 章で同じやり方で説明されています。

```py
define splash.pages = [

    ## ── 基本 1. ロゴ ──────────────────────────────────────────────────────
    ## 今は文字だけのロゴです。画像や動画に変えるには、下の # の行をオンにしてください。
    {
        "id": "logo",

        ## 背景 ─ 4 つのうち 1 つを書きます。書かなければ "color" の色だけが見えます。
        ##   "background": "#202020",               色で塗る
        ##   "background": "gui/splash/bg.png",     画像 (ゲームの解像度の大きさで作る)
        ##   "background": "black",                 Ren'Py の画像の名前 (image 文で作ったもの)
        ##   "background": "movies/bg.webm",        動画。画面の大きさに合わせて伸び、基本はくり返し再生
        # "background": "movies/logo.webm",

        ## 背景の動画をくり返すか (背景が動画のときだけ使う)
        ##   "background_loop": True,               終わったら最初から (基本)
        ##   "background_loop": False,              1 回だけ再生して終わると消える (そのあとは color の色が見える)
        ##   "duration" が "movie" なら、書かなくても 1 回だけ再生されます。
        # "background_loop": False,

        ## 背景の動画が透明な動画 (side_mask 形式) か (ふつうは書かない)
        ##   "background_side_mask": False,         ふつうの動画 (基本)
        ##   "background_side_mask": True,          左半分が色 + 右半分が透明度で作った動画
        # "background_side_mask": False,

        ## 中央の画像・動画 (ロゴ) ─ タイトルの上に置かれます。
        ##   "image": "gui/splash/logo.png",        透明背景の PNG 画像
        ##   "image": "movies/logo_alpha.webm",     透明な動画 (side_mask 形式。作り方は ui_kit/README.md「動画の準備」)
        # "image": "gui/splash/logo.png",

        ## 画像をタイトルと別の好きな位置に置く (書かなければタイトルのすぐ上)
        ##   "image_pos": (640, 200),               画面の横 640、縦 200 の位置に画像の中心が来るように
        # "image_pos": (640, 200),

        ## 画像の大きさの倍率
        ##   "image_zoom": 1.0,                     元の大きさ (基本)
        ##   "image_zoom": 0.5,                     半分
        ##   "image_zoom": 2.0,                     2 倍
        # "image_zoom": 1.0,

        ## ロゴの位置の動画の表示サイズ (動画のときだけ。書かなければ動画の大きさのまま)
        ##   "image_size": (400, 200),              横 400、縦 200 ピクセルに
        # "image_size": (400, 200),

        ## ロゴの位置の動画が透明な動画 (side_mask 形式) か
        ##   "image_side_mask": True,               透明な動画 (基本)
        ##   "image_side_mask": False,              ふつうの動画 (四角のまま見える)
        # "image_side_mask": True,

        ## ロゴの位置の動画をくり返すか
        ##   "image_loop": True,                    くり返す (基本)
        ##   "image_loop": False,                   1 回だけ
        # "image_loop": True,

        ## タイトル ─ 画面に出る文字は _( ) で囲みます。
        "title": _("만든 사람 이름"),
        "title_size": 56,                          # このページだけタイトルを大きく (ほかは splash.default の 44)

        ## 進むとき ─ 2 秒見せて自動で。動画のロゴなら "movie" に変えると、動画が終わったときに進む
        "duration": 2.0,
        "fade_in": 0.6,
        "fade_out": 0.6,

        ## 効果音 ─ ページが現れるときに 1 回再生 (.ogg 推奨)
        ##   "sound": "audio/logo.ogg",
        # "sound": "audio/logo.ogg",

        ## BGM ─ BGM のチャンネルでくり返し再生。
        ##   次のページにも同じファイルを書けば、切れずにつながる。
        ##   options.rpy の config.main_menu_music と同じファイルなら、タイトルまでつながる。
        ##   違えば最後のページのあとにゆっくり消える (4 章 splash.music_fadeout)
        # "music": "audio/title.ogg",
    },

    ## ── 基本 2. 注意 ──────────────────────────────────────────────────────
    {
        "id": "warning",

        ## 注意の文の後ろにくり返す動画を敷きたいなら
        # "background": "movies/noise_loop.webm",
        # "background_loop": True,

        "title": _("경고"),
        "title_color": "#d23c3c",                  # このページだけタイトルを赤く

        ## 本文 ─ \n は改行です。行が長ければ "width" の幅で自動でも改行されます。
        "body": _("이 게임에는 공포 연출과 갑작스러운 소리, 깜빡이는 화면이 포함되어 있습니다.\n빛에 민감하신 분은 플레이에 주의해 주세요."),

        ## 本文の行のそろえ方を変えたいなら
        ##   "body_text_align": 0.5,                中央 (基本)
        ##   "body_text_align": 0.0,                左寄せ
        # "body_text_align": 0.0,

        ## 進めるようになったら下に点滅する案内。書かなければ案内なし
        "prompt": _("클릭하면 계속합니다"),

        "duration": None,                          # クリックするまで待つ
        "min_time": 1.5,                           # すべて現れてから 1.5 秒はクリックしても進まない (必ず読ませる)
        "skippable": True,

        ## 「次から表示しない」のチェックボタン ─ 右下に出ます。
        ##   プレイヤーがチェックして進むと、次の起動からこのページを飛ばします。
        ##   いらなければこの行を消してください。
        "dont_show_again": _("다음부터 보지 않기"),

        ## 最初の 1 回だけ見せるか
        ##   "once": False,                         ゲームを起動するたびに (基本)
        ##   "once": True,                          最初に起動したときの 1 回だけ
        "once": False,

        ## 表示の条件 ─ 引用符の中の条件が真のときだけ出ます。
        ##   "show_if": None,                       いつも (基本)
        ##   "show_if": "not persistent.cleared",   persistent.cleared が True になってからは出ない
        ##                                          (スクリプトのエンディングで $ persistent.cleared = True としておいた場合)
        "show_if": None,
    },

    ## ── 基本 3. 操作方法 ─────────────────────────────────────────────────
    {
        "id": "controls",

        "title": _("조작 방법"),

        ## 操作方法の表 ─ (キー, 説明) の 1 組が 1 行です。
        ##   行を増やすには ( _("キー"), _("説明") ), の 1 行をコピーして貼り、文字だけを変えてください。
        ##   キーが英字 1 文字だけなら _( ) なしで "H" のように書いてもかまいません。
        ## こう書く代わりに "keys": "auto", と書くと、
        ##   ゲームメニューの操作方法画面と同じ一覧が出ます。
        ##   (hotkeys プラグインがあれば hotkeys_config.rpy の hotkeys.keyboard_help、なければ Ren'Py 標準の説明)
        "keys": [
            (_("클릭 / 엔터 / 스페이스"), _("대사 넘기기, 선택하기")),
            (_("마우스 휠 위 / Page Up"), _("이전 대사 다시 보기")),
            (_("오른쪽 클릭 / Esc"), _("메뉴 열기 (저장, 불러오기, 환경설정)")),
            (_("Ctrl (누르고 있기)"), _("대사 빨리 넘기기")),
            ("H", _("대사창 숨기기")),
        ],

        ## 表の形 (説明は 2 章 splash.default)
        "key_width": 300,
        "key_color": "#ffffff",
        "desc_color": "#bbbbbb",

        "prompt": _("클릭하면 타이틀로 넘어갑니다"),

        ## 最初に起動したときの 1 回だけ。タイトルでもう一度見せるなら 5 章の splash.ShowPage
        "once": True,

        ## 行が多くて下の案内と重なるなら yalign を小さく (0.45 → 0.35)
        "xalign": 0.5,
        "yalign": 0.45,
        "width": 960,
    },
]
```

### 場面別の例

そのままコピーして、`splash.pages` の一覧の中の好きな順番の位置に貼れば OK です。設定ファイルの 3 章の終わりにも同じ例が `#` でオフのまま入っているので、そこで `#` だけを消してもかまいません。すべての例は実際に実行して確かめました。(画面に出る文は韓国語の例のままです。自分の言語に書き換えてください)

**A. ロゴの動画が終わったら自動で進む**

- 必要なファイル:`game/movies/logo.webm`(ゲームの解像度、WebM VP9)

```py
{
    "id": "ex_movie_logo",
    "background": "movies/logo.webm",       # 画面いっぱいに再生
    "duration": "movie",                    # 動画が終わったら次のページへ (くり返しは自動でオフ)
    "fade_in": 0.3,
    "fade_out": 0.5,
},
```

**B. 画像のロゴ + 背景色、2 秒後に自動で**

- 必要なファイル:`game/gui/splash/logo.png`(透明背景の PNG)

```py
{
    "id": "ex_png_logo",
    "color": "#101018",                     # とても暗い紺色の背景
    "image": "gui/splash/logo.png",
    "image_zoom": 1.0,
    "duration": 2.0,
    "sound": "audio/logo.ogg",              # 現れるときの効果音 (ファイルがなければこの行だけ消す)
},
```

**C. 透明なロゴの動画を背景色の上に、動画が終わったら進む**

- 必要なファイル:`game/movies/logo_alpha.webm`(side_mask 形式:左半分が色、右半分が透明度)

```py
{
    "id": "ex_alpha_logo",
    "color": "#203040",
    "image": "movies/logo_alpha.webm",
    "image_side_mask": True,                # 透明な動画なので True (初期値なので省いてもよい)
    "image_size": (400, 200),               # 表示サイズ
    "title": _("스튜디오 이름"),             # ロゴの下に文字も一緒に
    "duration": "movie",                    # ロゴの動画が終わったら進む
},
```

**D. くり返す動画の上に注意の文、必ず 3 秒は読ませる**

- 必要なファイル:`game/movies/noise_loop.webm`(短くくり返す動画)

```py
{
    "id": "ex_warning_movie",
    "background": "movies/noise_loop.webm",
    "background_loop": True,                # クリックするまでくり返し続ける
    "title": _("주의"),
    "title_color": "#ff5050",
    "body": _("이 이야기는 허구이며\n실제 인물이나 단체와 관계가 없습니다."),
    "prompt": _("클릭하면 계속합니다"),
    "duration": None,
    "min_time": 3.0,                        # すべて現れてから 3 秒はクリックしても進まない
},
```

**E. 最初の 1 回だけ出る操作方法(操作方法画面と同じ一覧)**

- 必要なファイル:なし

```py
{
    "id": "ex_controls_auto",
    "title": _("조작 방법"),
    "keys": "auto",                         # hotkeys の設定 (なければ Ren'Py 標準) と同じ一覧
    "key_size": 20,                         # 行が多いので少し小さく
    "desc_size": 20,
    "keys_spacing": 8,
    "yalign": 0.35,                         # 下の案内と重ならないよう少し上へ
    "prompt": _("클릭하면 타이틀로 넘어갑니다"),
    "once": True,
},
```

**F. エンディングを見たあとは出ないページ**

- 必要なファイル:なし
- スクリプトのエンディング部分にこの 1 行を入れておいてください:`$ persistent.cleared = True`

```py
{
    "id": "ex_before_ending",
    "body": _("이 게임은 헤드폰을 권장합니다."),
    "show_if": "not persistent.cleared",    # エンディングを見るまでだけ出る
    "duration": 2.5,
},
```

**G. クリックで進めないページ(決まった時間だけ見せる)**

- 必要なファイル:なし

```py
{
    "id": "ex_no_skip",
    "body": _("……"),
    "body_size": 40,
    "skippable": False,                     # クリックしても進まない
    "duration": 3.0,                        # なので時間を必ず決める (決めないと Lint が知らせる)
    "fade_in": 1.5,
    "fade_out": 1.5,
},
```

**H. BGM をスプラッシュからタイトルまで途切れずに**

- 必要なファイル:`game/audio/title.ogg`
- options.rpy でタイトルの BGM も同じファイルに:`define config.main_menu_music = "audio/title.ogg"`
- このまとまりをいちばん前のページに移し、後ろのページにも同じ `"music"` の行を入れると、ずっとつながります。

```py
{
    "id": "ex_music",
    "title": _("만든 사람 이름"),
    "music": "audio/title.ogg",             # ここから始まってタイトルまでつながる
    "duration": 2.0,
},
```

**I. 文字の形を飾る(フォント、縁取り、字間、太字)**

- 必要なファイル:`game/fonts/MyFont.ttf`(使う言語の文字が入ったフォント。名前は手持ちのファイルに合わせて変える)

```py
{
    "id": "ex_text_style",
    "color": "#e8e0d0",                     # 明るい紙の色の背景
    "title": _("제 1 장"),
    "title_font": "fonts/MyFont.ttf",
    "title_size": 64,
    "title_color": "#222222",
    "title_kerning": 8,                     # 文字の間を広く
    "title_outlines": [ (2, "#ffffff", 0, 0), (2, "#00000055", 4, 4) ],   # 白い縁 + 薄い影
    "body": _("그날 밤, 학교에는 아무도 없었다."),
    "body_color": "#444444",
    "body_bold": True,
    "duration": 3.0,
},
```

**J. 文字を左上に、本文は左寄せ**

- 必要なファイル:なし

```py
{
    "id": "ex_left_top",
    "xalign": 0.08,                         # まとまりを左へ
    "yalign": 0.15,                         # 上へ
    "width": 700,
    "title": _("기록 #001"),
    "title_xalign": 0.0,                    # タイトルもまとまりの中で左
    "body": _("2026년 10월 23일\n오후 11시 47분\n녹화 시작"),
    "body_xalign": 0.0,
    "body_text_align": 0.0,                 # 行も左寄せ
    "prompt": _("클릭하면 재생합니다"),
    "prompt_xalign": 0.08,                  # 案内も左下へ
},
```

### 値のまとめ

| やりたいこと | ページに書く値 |
| --- | --- |
| 背景 | `"background"`:色 `"#202020"`、画像 `"gui/splash/bg.png"`、動画 `"movies/bg.webm"`(くり返し再生)。その下の色は `"color"` |
| 中央のロゴ | `"image"`(画像か side_mask の動画)、別に置くなら `"image_pos": (640, 200)`、大きさ `"image_zoom"` |
| 文字 | `"title"`、`"body"`(`\n` で改行)、操作方法の表 `"keys": [ (キー, 説明), … ]` または `"auto"`(操作方法画面と同じ一覧)、`"hotkeys"`(ショートカット編集の表に従う。表示する機能は `"keys_show": [ "screenshot", … ]`、splash 2.5) |
| 進むとき | `"duration"`:秒 / `None`(クリックするまで)/ `"movie"`(動画が終わるまで) |
| うっかり進まないように | `"min_time"`(すべて現れてからこの時間はクリックを無視)、進めないようにするなら `"skippable": False` と `"duration"` を一緒に |
| 現れて消える時間 | `"fade_in"`、`"fade_out"`(ページの間は黒い画面) |
| 最初の 1 回だけ | `"once": True` |
| プレイヤーが切れるように | `"dont_show_again": _("다음부터 보지 않기")`(右下のチェックボタン) |
| 条件付きで | `"show_if": "not persistent.cleared"` |
| 音 | `"sound"`(1 回)、`"music"`(くり返し。タイトルの BGM と同じファイルならつながる) |
| 文字のまとまりの位置 | `"xalign"`、`"yalign"`、最大の幅 `"width"`、間隔 `"spacing"` |
| 文字の形 | `"title_font"`、`"title_size"`、`"body_color"`、`"body_text_align"`、`"prompt_yalign"` … |

| 全体の設定 | 意味 |
| --- | --- |
| `splash.enabled` | オフにするとすぐタイトル |
| `splash.movie_wait` | 動画がこの時間(秒)以内に始まらなければ次のページへ(初期値 5.0) |
| `splash.developer_skip` | `True` なら開発モードでは飛ばす(配布版ではいつも出る) |
| `splash.start_delay`、`splash.gap` | 最初のページの前、ページの間の黒い画面(秒) |
| `splash.end_transition` | 最後のページのあとにタイトルが現れるトランジション(初期値 `Dissolve(0.6)`) |
| `splash.min_time_once` | `min_time` は最初に見るときだけ |
| `splash.music_fadeout` | スプラッシュの BGM がタイトルの BGM と違うとき、ゆっくり消す時間 |

- タイトルメニューでもう一度見る:項目の `"action": splash.ShowPage("controls")`。見た記録・表示しないを消すボタンは `splash.Reset()`。
- スクリプトにすでに `label splashscreen:` があれば、その中に `call splash_play` を入れます。
- スプラッシュはゲームを最初に起動したときだけ出て、**Shift+R では再表示されません。** 起動し直すか、コンソール(Shift+O)で `splash.preview()`。
- 設定のエラー(ないファイル、ファイル名の大文字小文字、間違った名前)は、Lint で `splash:` で始まる行で知らせます。

## タイトルメニュー — `ui_kit/title_menu_config.rpy`

メニューの項目は `tmenu.items` の一覧に 1 つずつ書き、書かなかった値は `tmenu.default` に従います。名前の前に `hover_` を付けると「選択時」の値です。

```py
define tmenu.default = {
    "font": "fonts/NeoDGMpro.ttf",
    "size": 35,
    "color": "#fff6f6",
    "hover_color": "#ffffff",
}

define tmenu.items = [
    {
        "id": "start",                 # エディターの保存に使う名前 (変えない)
        "text": _("시작한다"),
        "action": Start(),
        "x": 639, "y": 375,           # 整数 = ピクセル、小数 = 画面の比率
        "rotate": -5,
        "hover_text": "START",         # 選択時に文字を差し替え
        "hover_movie": "movies/menu_start.webm",
    },
]
```

| やりたいこと | 値 |
| --- | --- |
| 項目の追加・削除・順番の入れ替え | `tmenu.items` に `{ … },` のまとまりを入れる・抜く・動かす。一覧の順番 = キーボードで動く順番 |
| 押したときにすること | `"action"`:`Start()`、`ShowMenu("load")`、`ShowMenu("preferences")`、`ShowMenu("about")`、`Quit(confirm=False)`、`Jump("ラベル")` |
| 条件付きで見せる | `"show_if": "persistent.cleared"` |
| 位置・基準点 | `"x"`、`"y"`(または `"xalign"`、`"yalign"`)、`"anchor"`(基本は文字の真ん中) |
| 形 | `"rotate"`(度)、`"skew"`(度)、`"zoom"`、`"alpha"` · 選択時:`"hover_rotate"`、`"hover_zoom"`、`"hover_offset": (20, 0)` |
| 文字のスタイル | Ren'Py のテキストスタイルのプロパティすべて:`"font"`、`"size"`、`"color"`、`"outlines"`、`"kerning"`、`"bold"` …(`hover_` を付けると選択時) |
| 縁取り | `"outlines": [ (4, "#000000", 0, 0), (2, "#e0245e", 6, 6) ]`(太さ、色、x、y) |
| 選ぶとほかの項目が押される度合い | `tmenu.push_before`、`tmenu.push_after`(方向・ピクセル)、`tmenu.push_falloff`、項目ごとの `"push": False` / `"push_scale"` |
| 動きの速さ | `tmenu.move_time`(秒)、`tmenu.move_warper`(`"ease"`、`"easeout_back"` …)、`tmenu.fade_time` |
| 最初に現れる演出 | `tmenu.intro`(オン)、`intro_delay`、`intro_time`、`intro_offset` |
| 最初に選ばれている項目 | `tmenu.start_index`(`None` なら何も選ばれない) |
| クリックの範囲を広げる | `tmenu.hit_padding` または項目の `"hit_padding"` |
| ゲーム名の位置・色 | `style main_menu_vbox:` `xalign` / `yalign`、`style main_menu_title:` `color` |
| バージョン番号を隠す | `tmenu.show_version = False` |
| メニューの後ろの半透明の板をなくす | `tmenu.main_menu_frame = False` |
| タイトルから開いた環境設定画面の左の一覧を隠す | `tmenu.title_game_menu_navigation = False` |
| ゲームメニュー画面を以前の形(Ren'Py 標準)に | `tmenu.game_menu_side = False` |
| ゲームメニューの内容が始まる位置 | `tmenu.game_menu_content_x = 400`(None ならメニューの右端 + `tmenu.game_menu_gap`) |
| メニューと内容の間の縦線 | `tmenu.game_menu_line = "#ffffff33"` |
| ゲームメニューの左の一覧を変える(`game_menu_side = False` のとき) | `tmenu.game_menu = [ (_("대사록"), ShowMenu("history"), "not main_menu"), … ]` |
| ゲームメニューのボタンの文字 | `style navigation_button_text:` `size`、`color`、`hover_color`、`hover_strikethrough` |

書き間違いがあると、タイトル画面が出るときに、どの項目のどの名前が間違っているかをエラー画面で知らせます。

### ゲーム中の ESC メニュー (3.1)

ゲーム中に ESC か右クリックを押すと、ゲーム画面が暗く敷かれ、タイトルメニューと同じ形のメニューが出ます。フォント、サイズ、色、選択時の形(`tmenu.default`)、登場演出、音はタイトルメニューの設定を一緒に使い、項目と位置だけが別です。

| やりたいこと | 値(`title_menu_config.rpy`) |
| --- | --- |
| オフにする(Ren'Py 標準:ESC → セーブ画面) | `define tmenu.pause = False` |
| 後ろの画面を暗くする度合い | `define tmenu.pause_dim = "#000000b3"`(最後の 2 桁 = 濃さ:`66` 薄く、`ff` 真っ黒、`None` 暗くしない) |
| 暗くする代わりに画像 | `define tmenu.pause_background = "gui/game_menu.png"` |
| 項目を変える | `define tmenu.pause_items = [ { "id": "return", "text": _("계속하기"), "action": Return(), "xalign": 0.08, "yalign": 0.35 }, … ]` |
| 項目の位置 | ESC メニューを開いたまま Shift+M →「タイトルメニュー」タブでドラッグして Ctrl+S(`tmenu.pause_layout` に保存) |

基本の項目は、戻る(`Return()`)、セーブ(`ShowMenu("save")`)、ロード(`ShowMenu("load")`)、環境設定(`ShowMenu("preferences")`)、履歴(`ShowMenu("history")`)、メインメニュー(`MainMenu()`)、終了(`Quit()`)です。セーブ画面の中の「戻る」は、Ren'Py 標準と同じくゲームに戻ります。

## 選択肢 — スクリプトの括弧 + `ui_kit/choice_menu_config.rpy`

選択肢 1 つだけを変えるときは **スクリプト** の選択肢の後ろの括弧に、すべての選択肢を変えるときは **設定ファイル** の `cmenu.default` に書きます。括弧に `x` か `y` を 1 つでも書くと、その選択肢は縦の一覧から外れてその位置に置かれます。

```py
menu:
    "꺼져, 듣고 싶지 않으니까!" (x=300, y=350, font="fonts/ChosunGu.TTF", size=25, color="#aa0000", hover_color="#ff4444", rotate=-4):
        jump angry
    "그냥 세로 목록에 나오는 선택지":
        jump normal

## メニュー全体に共通の値 (選択肢の括弧が優先)
menu (font="fonts/KBLJump_c.ttf", size=28, appear="slide"):
    "첫 번째":
        pass
```

| やりたいこと | 括弧(選択肢 1 つ) | 設定ファイル(すべての選択肢) |
| --- | --- | --- |
| 位置 | `x=300, y=350`(または `xalign`、`yalign`)、`anchor=(0.0, 0.5)` | 縦の一覧の位置:`define cmenu.list_pos = (640, 270)` |
| フォント・サイズ・色 | `font=`、`size=`、`color=`、`hover_color=` | `cmenu.default` の `"font"`、`"size"`、`"color"`、`"hover_color"` |
| 字間・行間・縁取り | `kerning=2`、`line_spacing=-10`、`outlines=[…]` | 同じ名前を `cmenu.default` に |
| 折り返しの幅 | `width=400`(`None` なら折り返さない) | `"width"` |
| 回転・傾き・拡大 | `rotate=`、`skew=`、`zoom=`、ホバー時 `hover_rotate=`、`hover_zoom=`、`hover_offset=(8, 0)` | 同じ名前 |
| 登場演出 | `appear="pop"` / `"fade"` / `"slide"` / `None`、`delay=0.5` | `cmenu.appear`、`appear_time`、`appear_stagger`、`appear_offset` |
| ホバー時に後ろに動画 | `hover_movie="movies/red.webm"`(`None` ならオフ) | `"hover_movie"`、`"hover_movie_size"`、`"hover_movie_zoom"`、`"hover_movie_offset"` |
| ボタンの背景・余白・幅 | `button_background=…`、`button_padding=(30, 8)`、`button_xsize=500` | `"button_background"`、`"button_hover_background"`、`"button_padding"`、`"button_xsize"` |
| 選べない選択肢の色 | `insensitive_color="#555"` | `"insensitive_color"` |
| 効果音 | `hover_sound=`、`activate_sound=` | `cmenu.hover_sound`、`cmenu.activate_sound` |
| ホバー時の反応の速さ |  | `cmenu.hover_time`、`cmenu.hover_warper` |
| 縦の一覧の間隔 |  | `style choice_vbox:` `spacing 30` |

位置を書いた選択肢どうしは互いによけないので、重ならないように配置してください。

## カーソル・クリック待ち表示・セリフ音・テキスト速度・クイックメニュー — `ui_kit/custom_ui_config.rpy`

配布用の初期設定はすべてオフなので、Ren'Py 標準と同じです。使いたい機能だけ `True` にしてパスを書きます。

| やりたいこと | 値 | 参考 |
| --- | --- | --- |
| カーソルのアニメーションをオン | `custom_ui.cursor = True` |  |
| カーソルの画像を変える | `custom_ui.cursor_frames = [ "gui/cursor/cursor1.png", … ]` | 順に再生。エディターのマスは 12 個 |
| カーソルの速さ | `custom_ui.cursor_hold = 2` | 毎秒 24 フレーム固定(3.0)。`1` は 1 枚を 1 フレーム(毎秒 24 枚)、`2` は 2 フレーム(毎秒 12 枚) |
| カーソルの方式 | `custom_ui.cursor_mode = "software"` | `"software"` Ren'Py が描く(24fps 正確、基本)/ `"hardware"` OS のカーソル(反応がいちばん速い、最大 20fps) |
| カーソルが画面エフェクト(ASCII、VHS など)を受けるか | `screen_fx.cursor = "effect"`(screen_fx_config.rpy) | `"effect"` エフェクトまで(基本)/ `"overlay"` オーバーレイの下 / `"top"` エフェクトを受けない。ソフトウェアカーソルのときだけ。下の「カーソルの位置」 |
| カーソルのクリックの基準点 | `custom_ui.cursor_hotspot = (0, 0)` | 画像の左上から x、y ピクセル。矢印の先が真ん中ならその座標 |
| クリック待ち表示をオン | `custom_ui.ctc = True` |  |
| クリック待ち表示の画像・速さ | `custom_ui.ctc_frames = [ … ]`、`custom_ui.ctc_hold = 2` | カーソルと同じく 24fps、`1` / `2` フレームごと(3.0) |
| クリック待ち表示の位置 | `custom_ui.ctc_position = "nestled"` | `"nestled"` 文字のすぐ後ろ、`"fixed"` say スクリーンで決めた位置 |
| 特定のキャラクターだけ違う表示 | `Character("名前", ctc="別の画像")` | その値が優先 |
| セリフ音のオン・変更 | `custom_ui.typing_sound = "audio/type.ogg"` | `None` ならオフ |
| セリフ音の音量・くり返し | `custom_ui.typing_volume = 1.0`、`custom_ui.typing_loop = True` | 環境設定の「効果音の音量」にも従う |
| キャラクターごとに違う音・オフ | `Character("名前", cb_typing_sound="audio/beep.ogg")`、`cb_typing_sound=None` | ナレーション:`define narrator = Character(None, cb_typing_sound=None)` |
| テキスト速度の初期値 | `custom_ui.text_cps = 20` | 1 秒に出る文字数、0 = 一度に、`None` = options.rpy の値 |
| クイックメニューを最初から隠す | `custom_ui.quick_menu = False` | ゲーム中に `$ quick_menu = True` でオン |

テキスト速度は **最初に起動したときと、この値を変えたときだけ** 当てはまり、そのあとはプレイヤーが環境設定で選んだ値が保たれます。

```py
## custom_ui_config.rpy: カーソルとクリック待ち表示 (3.0、毎秒 24 フレーム固定)
define custom_ui.cursor = True
define custom_ui.cursor_frames = [
    "gui/cursor/cursor1.png", "gui/cursor/cursor2.png", "gui/cursor/cursor3.png",
    "gui/cursor/cursor4.png", "gui/cursor/cursor5.png", "gui/cursor/cursor6.png",
]
define custom_ui.cursor_hold = 2            # 2 フレームごと → 6 枚なら 0.5 秒で 1 周
define custom_ui.cursor_mode = "software"   # "hardware" にすると以前の方式 (最大 20fps)
define custom_ui.cursor_hotspot = (0, 0)

define custom_ui.ctc = True
define custom_ui.ctc_frames = [ "gui/ctc/ctc1.png", "gui/ctc/ctc2.png", "gui/ctc/ctc3.png" ]
define custom_ui.ctc_hold = 1               # 1 フレームごと → 3 枚なら 1/8 秒で 1 周
```

| 枚数 | 1 フレームごと(`_hold = 1`) | 2 フレームごと(`_hold = 2`) |
| --- | --- | --- |
| 6 枚 | 0.25 秒で 1 周 | 0.5 秒で 1 周 |
| 12 枚 | 0.5 秒で 1 周(1 秒に 2 周) | 1 秒で 1 周 |

エディターの「カーソル/セリフ音」タブでは、**マス 12 個** を押して画像を 1 つずつ選びます(選ぶと次のマスへ)。「このフォルダーを丸ごと入れる」はフォルダーの画像を名前の順に 12 枚まで入れ、「このマスを空にする」で外します。空のマスは飛ばします。

## セリフのスタイル — スクリプトの括弧 + `ui_kit/say_style_config.rpy`

セリフ 1 行だけを変えるときはセリフの後ろの括弧に短い名前を書き、キャラクターの基本の見た目は設定ファイルのキャラクター定義で変えます。

```py
## スクリプト: この 1 行だけ
t "글쎄, 난 봤다니까요." (x=520, y=300, size=30, color="#aa0000")
e "어디 갔었어?" (name_x=820, name_y=-60, name_size=34, speed=0.5, effect="jitter")

## say_style_config.rpy: キャラクターの初期値
define t = Character(None,
    window_yalign=0.0, window_ysize=720,     # セリフ窓を画面全体に
    what_font=gui.text_font,                  # 基本のフォント
    what_size=22,                             # 基本のサイズ
    what_xpos=400, what_ypos=157)             # 基本の位置

define n2 = Character(kind=t, what_xpos=400, what_ypos=210)   # 位置のプリセット
```

| 括弧に書く短い名前 | キャラクター定義での同じ値 | 意味 |
| --- | --- | --- |
| `x`、`y`、`pos` | `what_xpos`、`what_ypos`、`what_pos` | 位置(セリフ窓の左上基準。`t` はセリフ窓が画面全体なので画面基準) |
| `font` | `what_font` | フォント |
| `size` | `what_size` | 文字サイズ |
| `color` | `what_color` | 文字の色 |
| `outline` | `what_outlines` | 縁取り `[(太さ, 色, x, y)]` |
| `spacing` | `what_line_spacing` | 行間 |
| `bold`、`italic` | `what_bold`、`what_italic` | 太字、斜体 |
| `kerning` | `what_kerning` | 字間 |
| `width` | `what_xmaximum` | 1 行の最大の幅 |
| `align` | `what_text_align` | 行のそろえ 0.0 〜 1.0 |
| `speed` | `what_slow_cps_multiplier` | 出る速さの倍率(プレイヤーのテキスト速度に掛ける。0.5 = 半分) |
| `effect` | `what_textshader` | 登場エフェクト:`"dissolve"` ふわっと、`"typewriter"` タイプライター、`"slowalpha"` ぼかして待つ、`"flip"` 裏返りながら、`"zoom"` 大きくなりながら、`"jitter"` 震え、`"wave"` 波。pygaki プラグインのエフェクト:`"scatter"` 散らばって集まる、`"drop"` 落ちる、`"shuffle"` ランダムな順番、`"flash"` 色のフラッシュ、`"slam"` 大きく押される、`"typecursor"` カーソルタイプライター、`"echo"` 色の残像、`"glitch"` グリッチ、`"blurin"` ぼやけてからくっきり、`"blockglitch"` ブロックグリッチ、`"liquid"` ゆらぎ、`"vhs"` VHS ノイズ、`"rise"` 浮かび上がる、`"lean"` 傾いて入る、`"stretch"` 伸びて入る、`"slidein"` 滑って止まる、`"shake"` 軽い揺れ、`"glyphbox"` 文字ごとのボックス、`"stamp"` スタンプ、`"squash"` つぶれて弾む、`"extrude"` 立体文字。エフェクトフォルダー(`ui_kit/effects/`):`"maskup"` 下から上がってくる、`"tracking"` 字間が狭まりながら、`"sweep"` 光が通り過ぎる、`"backbox"` 後ろにボックス、`"karaoke"` カラオケ、`"meltglitch"` 溶けるグリッチ、`"droplets"` 水滴、`"spring"` 弾んで落ち着く、`"marquee"` 横に流れる、`"bubble"` 吹き出し、`"scramble"` 文字デコード。消したエフェクトの名前が残ったスクリプトは、止まらず 1 文字ずつ出ます。2 つのエフェクトを重ねるなら `effect="slidein|shake"` |
| `name_x`、`name_y` | `namebox_xpos`、`namebox_ypos` | 名前のボックスの位置(セリフ窓の左上基準、名前の背景ごと動く) |
| `name_font`、`name_size`、`name_color` | `who_font`、`who_size`、`who_color` | 名前のフォント、サイズ、色 |

**テキストボックス**(ui_kit 4.0):括弧に `box` を書くと、セリフの文字をボックスが囲みます。基本の形は設定ファイルの `say_style.box_styles`。

```py
e "안녕!" (box="bubble")                                    # 白い吹き出し、黒い線、しっぽは下、飛び出して現れる
e "어디?" (box="bubble", tail="top")                         # しっぽ: "bottom" "top" "left" "right" None、または (x, y)
e "빨간 말풍선." (box="bubble", bubble_color="#ffeeee", bubble_border=(5, "#aa0000"))
e "쾅!" (box="pill", box_rotate=-4)                          # 丸い枠、ボックスと文字を 4 度傾ける
e "속까지." (box="pill", pill_fill="#ffd23b", pill_line=None, color="#000000")
```

| 名前 | 意味 |
| --- | --- |
| `box` | `"bubble"` 吹き出し、`"pill"` 丸い枠 |
| `tail` | しっぽの向き、またはしっぽの先 `(x, y)`(文字の左上基準のピクセル) |
| `box_rotate` | ボックスと文字の傾き(度) |
| `bubble_color` / `pill_fill` | 中の色(`pill_fill=None` なら中が空) |
| `bubble_border` / `pill_line` | 線 `(太さ, 色)`、`None` ならなし |
| `bubble_radius`、`bubble_padding`、`bubble_tail_pos`、`bubble_tail_size`、`bubble_tail_width`、`bubble_pop`、`bubble_text_color` | 角、文字とボックスの間、しっぽの位置・長さ・幅、飛び出し、文字の色(`pill_…` も同じ) |

- ボックスは文字全体の大きさに合わせ、文字がすべて出る前からすべての大きさで出ます。行全体が動けば(位置、画面の揺れ)ボックスも一緒に動き、`shake` のように文字ごとに動くエフェクトは文字だけが動きます。
- しっぽは話している人を自動では探しません。向きか `(x, y)` で決めます。
- エディターのセリフタブの「ボックス」欄、pygaki の文字エフェクト欄の [ボックス] でも選べます。

- 新しい短い名前が必要なら、設定ファイルの `say_style.alias` に `"alpha": "what_alpha",` のように足します。
- ふつうのキャラクターはセリフ窓が画面の下にあるので、名前を窓の上に上げると `name_y` が負の数になります。エディターのパネルには画面基準の位置も一緒に出ます。
- テキスト速度が「即時」(Ren'Py の新しいプロジェクトの初期値)だと、`speed` やふわっとのようなエフェクトは見えません。波・震えは見えます。`custom_ui.text_cps` を決めるか、環境設定で速度を下げてください。
- 1 行の中で一部の文字だけを変えるときはテキストタグ:`"それは {color=#a00}嘘{/color}だよ"`。一部の文字だけに登場エフェクトをかけるときは `"前の文 {shader=shake}揺れる文{/shader} 後ろの文"` のように書きます(エフェクトの名前と値は `effect` と同じ。行にエフェクトがなければ残りの文字は 1 文字ずつ出ます。色の残像 `echo` は行全体にしかかけられません)。
- スクリプトですでに `n1`〜`n3` や `t` を定義していれば、設定ファイルの方の定義を消してください。同じ名前が 2 回定義されます。

## エディターで直す (Shift+M)

ランチャーでゲームを実行した状態(開発モード)で **Shift+M** を押すとエディターが開きます。配布版では開きません。エディターが開いている間、クリック・キーボードはゲームに行きません。

パネルの **[言語]** ボタンを押すたびに、エディターの文字が 한국어 → 日本語 → English に変わります(4.12)。選んだ言語はそのゲームに記憶され(`persistent`)、最初はゲームの言語に合わせます。ゲーム画面の文字(セリフ、メニュー、編集中の文字)と保存する値は変わりません。訳は `ui_kit/editor/editor_lang.tsv`(1 行に韓国語、日本語、英語)にあり、辞書にない文字は韓国語で見えます。

| タブ | 開く場所 | 直せるもの | Ctrl+S すると |
| --- | --- | --- | --- |
| タイトルメニュー | タイトル画面、ゲーム中の ESC メニュー(3.1) | 項目の位置・回転・傾き・拡大・文字サイズ・フォント・色、選択時の値。ESC メニューを開いたまま開くと ESC メニューを直す | `ui_kit/title_menu_layout.rpy`(`tmenu.layout`、ESC メニューは `tmenu.pause_layout`) |
| 選択肢 | 選択肢が出ているとき | 選択肢 1 つの位置・形・フォント・色、ホバー時の値 | **スクリプトのその選択肢の行** |
| セリフ | セリフが出ているとき | セリフ 1 行の位置・文字サイズ・フォント・色、名前の位置・サイズ・フォント・色、出る速さ・登場エフェクト、**このセリフからオンにする画面エフェクト・取り消し・トランジション、オーバーレイ、カーソルの位置** | **スクリプトのそのセリフの行** |
| カーソル/セリフ音 | どこでも | テキスト速度、セリフ音・音量、クリック待ち表示・カーソル(オン、**マス 12 個に画像を選ぶ**、1/2 フレームごと、カーソルの方式)、クイックメニュー | `ui_kit/custom_ui_layout.rpy` |
| タイトルのゆらぎ | タイトル画面(`screen_fx` があるとき) | オン、かける対象、強さ・波の大きさ・速さ・渦・反射光、品質 | `screen_fx/watermorph_layout.rpy` |
| 画面エフェクト | どこでも(`screen_fx` があるとき) | 上のボタンで VHS オーバーレイ / ASCII / レトロターミナル / ゲームボーイ / 基本エフェクト、トランジションを選ぶ。エフェクトごとのオン、オーバーレイのオン/オフ、値のスライダー、プリセット、**「このセリフからこのエフェクト」**、**「この行からこのエフェクト」**。基本エフェクト、オーバーレイのオン/オフ、TV の時間、閃光、音量とプレビュー。(これらのページは設定値を直すところなので、保存しても今の場面のエフェクトは変わらない) | `screen_fx/<エフェクト名>_layout.rpy`、`screen_fx_layout.rpy` |
| 画面エフェクト → 行に入れる(4.1) | ゲーム中 | スクリプトの行 1 つ(セリフでなくてもよい)を選び、画面エフェクト、オーバーレイ、オーバーレイの曲がり、トランジションを選ぶ | **スクリプトのその行のすぐ上** に `$ screen_fx.use(…)` のような行 |

順にやれば OK です。

1. 直したい画面まで行って Shift+M。その画面に合ったタブが開きます。(T でタブを切り替え)
2. 項目をマウスでドラッグして動かし、ホイールで回転(Shift+ホイールは文字サイズ。ホイールはパネルの外で回す必要あり、パネルの上ではパネルのスクロール)。キーボード:方向キーで移動、Q/E 回転、Z/C 傾き、A/D 拡大、S/W 文字サイズ、Tab 次の項目。
3. 2 を押すと「選択時(ホバー時)」の値、1 はふだんの値を直します。H は選択時の形のプレビュー。
4. タイトルメニュータブでは 3 で「この項目だけ」↔「すべての項目共通」を切り替えます。セリフタブでは Tab で「セリフ」↔「名前」を切り替え、速度・エフェクトのボタンを押すとその行をもう一度見せます(R でもう一度見る)。
5. フォントと色はパネルのボタンで選びます。フォントの一覧は `game` フォルダーのフォントファイルをすべて見せ、色はスライダー・色コード・よく使う色で選びます。
6. **Ctrl+S で保存**、Esc で閉じる。間違えたら Backspace(今選んでいるものだけを戻す)。

選択肢とセリフは **Ctrl+S を押すとスクリプト(.rpy)のその行の括弧にすぐ保存** され、ゲームが読み直されて同じ場面に戻ってきます。もともと書いてあった値と、行の後ろの `with dissolve` などはそのままにして、変えた値だけを直します。直す前の元はプロジェクトフォルダーの `ui_kit_backup/` に残ります。

複数行にまたがるセリフのように自動で直せない行や、編集中にほかのエディターでスクリプトを直して行が変わったときは、スクリプトに触れずに理由を知らせます。そのときは **Ctrl+C でコピーして、その行の括弧に貼り付けてください。** VS Code などでスクリプトを開いたまま保存していない変更があれば、エディターで保存する前にそちらを先に保存してください。

保存した `*_layout.rpy` の値を設定ファイルに移したいなら、Ctrl+C で設定のコードをコピーして貼り付け、`*_layout.rpy` を消せば OK です。カーソルの設定とクリック待ち表示のオン・オフは、保存するとゲームが自動で読み直されたあとに当てはまります。

## 画像・動画の配置 — スクリプト + `ui_kit/stage_config.rpy` (2.8)

**動画の自動登録**:`game/movies/` フォルダー(中のフォルダーも含む)に入れた `.webm` は、ファイル名ですぐ使えます。画像は Ren'Py がもともと `images/` を自動登録します。

| ファイル | スクリプトで | 読み方 |
| --- | --- | --- |
| `movies/rain.webm` | `show rain`、`scene rain` | ふつうの動画 |
| `movies/mask_ghost.webm` | `show ghost` | 透明な動画(side_mask:左半分が色、右半分が透明度)。名前の前の `mask_` は外して書く |
| `movies/bg rain.webm` | `scene bg rain` | ふつうの動画。bg タグなのでいつもいちばん後ろ |

**bg はいつもいちばん後ろ**:`bg` タグの画像・動画は、`zorder` を書いてもいつもほかの画像の後ろに描きます。

```py
## stage_config.rpy
define stage.enabled = True            # False なら動画の登録、bg の固定、画像/動画タブがすべてオフ
define stage.movies_dir = "movies"     # 動画のフォルダー (game 基準)
define stage.mask_prefix = "mask_"     # この文字で始まる動画 = 透明な動画
define stage.movie_once = [ ]          # 1 回だけ再生する動画の名前。例: [ "door_open" ]
define stage.bg_tag = [ "bg" ]         # 背景のタグの一覧: いつもいちばん後ろに描き、エディターで位置を動かさない
# define stage.bg_tag = [ "bg", "fx_bg" ]   # fx_bg も背景に (3.0)

## スクリプト (エディターが書くものと同じで、自分で書いてもよい)
show eileen happy at stage.pos(420, 720)          # 画像の下の中央を画面の (420, 720) に
show eileen with stage.move("inleft", 0.8)        # 左から入る、0.8 秒
hide eileen with stage.ease("outright", 1.2)      # 右へなめらかに出る、1.2 秒
show ghost with Dissolve(1.0)                     # ふわっと 1 秒
```

**エディターの「画像/動画」タブ**(ゲームの進行中に Shift+M → T):スクリプトの show・hide・scene の行を 1 つ選んで直します。

| 直すもの | 方法 |
| --- | --- |
| 選ぶ行 | 画面の画像・動画を押す、Tab、`[` `]`、行の一覧、行番号の入力 |
| 位置 | 画像をドラッグ、方向キー、位置のボタン(基本・左・中央・右・真ん中・画面の外)。**背景(bg)は固定**(3.0):スクリプトに位置が書いてあれば「基本の位置に戻す」だけが出る |
| トランジション | なし、ふわっと、黒くフェード、ピクセル、移動、なめらかに移動、ワイプ、スライド、プッシュ、拡大/縮小、揺らす + 方向 + 時間 |
| 画像の差し替え、新しい行(3.0) | 「画像/動画を選ぶ」→ `game/images`、`game/movies` のファイルを選び、[この行の画像を替える] または [下に show を入れる] / [下に scene を入れる] |
| エフェクト(4.0) | 「エフェクト:」でグリッチ、ホログラムのような画面エフェクトをその画像 1 枚だけにかけます。スクリプトには `show ghost at truecenter, screen_fx.image_fx("hologram")`(`screen_fx` があるとき。pygaki のスクリプトは不可) |
| 保存 | Ctrl+S → その行の at・with の部分(画像を替えたなら名前も)だけがスクリプトに書かれ、新しい行はその行の下に(直す前の元は `ui_kit_backup/`) |

```renpy
## 保存前                  ## [room] → この行の画像を替える、[hand] → 下に show を入れる → Ctrl+S
    scene fx_bg                scene room
                               show hand
```

- 画像の名前は、ファイル名から拡張子を除いて小文字にしたものです(Ren'Py の自動登録)。`images/Room.PNG` → `room`、`images/bg/bg hall.png` → `bg hall`。名前に `-` のような文字があるとスクリプトに書けないので、薄く出ます。
- 新しく入れた行の位置とトランジションは、保存してからその行を選んで直します。
- パネルの上に「script.rpy 9 行目」のように今の行が出て、同じファイルの show・hide・scene の行が番号と一緒に一覧で出ます。「その行へ移動」は Ren'Py の行移動(warp)なので、その前の変数の値は空のことがあります。
- `onlayer`、`as`、`zorder`、ATL ブロック、コメントには触れません。画像の名前は「この行の画像を替える」を押したときだけ変えます。

**パネルが画面を隠すとき**(すべてのタブ):タイトル(= UI エディター)をドラッグして動かす、**X** で 1 行にたたむ、**Space** を押している間隠す、**B** で自動でよける(選んだものがパネルの下にあればほかの隅へ)、**P** で隅を変える、**L** で行の一覧をたたむ(画像/動画タブ)、**F1** で案内をたたむ。パネルが画面より長ければ、パネルの上で **ホイール** か右の **スクロールバー** で下の方を見ます(2.9)。

**編集中の画面エフェクト**(すべてのタブ、`screen_fx` 3.4 以上):エディターを開いても画面エフェクトはオンのまま見え、パネルはその上にきれいに見えます。**V** でオン・オフします。曲がるエフェクト(VHS・CRT など)は、端で見える位置と押される位置が少しずれるので、正確にドラッグして置くときは V で少しの間オフにしてください。最初からオフにするなら `define screen_fx.editor_preview = False`。

詳しい説明は `ui_kit/README.md` 4-6、4-7、13 章。

## ショートカットキー — `hotkeys/hotkeys_config.rpy`

新しいショートカットキーは `hotkeys.bindings` に、Ren'Py 標準のショートカットキーから外すキーは `hotkeys.unbind` に、操作方法画面の説明は `hotkeys.keyboard_help` に書きます。配布用の初期設定は 3 つとも空なので、Ren'Py 標準と同じです。

```py
define hotkeys.bindings = [
    { "keys": [ "K_v" ], "action": ShowMenu("preferences") },   # V: 環境設定
    { "keys": [ "K_F5" ], "action": QuickSave() },               # F5: クイックセーブ
]

define hotkeys.unbind = {
    "self_voicing": [ "K_v" ],      # V の「セリフの読み上げ」を外して Alt+V だけに
}

define hotkeys.keyboard_help = [
    (_("엔터(Enter)"), _("대사 진행 및 UI (선택지 포함) 선택.")),
    ("V", _("볼륨 설정 열기.")),
]
```

| 知っておくこと | 内容 |
| --- | --- |
| キーの名前 | `K_v`(V)、`shift_K_s`(Shift+S)、`ctrl_K_l`(Ctrl+L)、`alt_K_v`(Alt+V)、`K_F5`、`K_SPACE` |
| よく外す標準のショートカットキーの名前 | `screenshot`(S)、`toggle_fullscreen`(F)、`hide_windows`(H)、`self_voicing`(V)、`accessibility`(Shift+A)、`skip`(Ctrl)、`toggle_skip`(Tab)、`rollback`(Page Up) |
| 重なるとき | 新しいキーが標準のショートカットキーと重なると両方が実行されるので、`unbind` で標準の方から外します |
| 説明の画面 | `keyboard_help` が `None` なら Ren'Py 標準の説明。`unbind` で外したキーは標準の説明のその行に自動で合わせます(1.3。V を外すと「V」の行が「Alt+V」に、キーが残らなければ行を消す)。一覧を自分で書いたなら、説明も一緒に直します |
| エディターのキーと重なる | UI Kit のエディターは Shift+M を使います。変えるなら `define ui_kit.editor_key = "shift_K_e"` |
| 決まった動作 (1.1) | `"action"` の代わりに `"do": "quick_save"` のように名前で。`"help": _("クイックセーブ")` を書くと操作方法画面の一覧に入ります(同じキーの行があればその説明を置き換え)。名前の一覧は `hotkeys/README.md` |

**編集画面で直す**(`hotkeys` 1.2、`ui_kit` があるとき):Shift+M の編集画面の「ショートカット編集」タブ(단축키 수정。スプラッシュタブのすぐ後ろ。スプラッシュタブのページボタンでも操作案内画面の横、pygaki アプリの [GUI 編集] では「操作案内画面」の下)に、行ごとに機能名とキーボタンがあります。キーボタンを押してゲームウィンドウで新しいキーを押すと変わります(Esc でやめる)。[+] はキーをもう 1 つ、機能名を押すと [キーボタンで](키 단추로)、[キーを外す](키 빼기)、[最初のキーに](처음 키로)、説明欄。ほかの機能が使っているキーなら警告と案内が出て、[あちらから外して変える](그쪽에서 빼고 바꾸기)を押すと変わります。[案内画面へ書き出す](안내 화면으로 내보내기)を押すとスプラッシュの操作案内画面の表が `"keys": "hotkeys"` になってこの表に従い、表示する機能はスプラッシュタブの操作案内表の一覧で押して選びます(`"keys_show"`)。変えたキーは ESC の操作方法画面の一覧にも自動で入ります。直している間すぐ反映され、保存すると `hotkeys/hotkeys_layout.rpy` の `"keys"`(機能ごとのキー)、`"desc"`(説明)に書かれて設定ファイルの値に足されます。

## 画面エフェクトを変える — `screen_fx/screen_fx_config.rpy`

画面は **シェーダーを 2 つ重ねて** 描きます(4.0)。

```
[ゲーム画面] → 基本エフェクト (なし / ASCII / レトロターミナル / ゲームボーイ) → オーバーレイ (VHS、オン / オフ) → 目に見える画面
```

ふだんは **基本エフェクトなし + VHS オーバーレイがオン**(= 画面全体に VHS)です。スクリプトの好きなところでほかのエフェクトに変えると、**取り消す(`clear`)まで** そのエフェクトが続き、変えるときに **TV が消えて点くトランジション** が入ります。今オンのエフェクト、オーバーレイ、オーバーレイの曲がりは、セーブ・巻き戻しに一緒に保存されます。新しいゲームを始めるかタイトルに戻ると、設定どおりに戻ります。

| 基本エフェクトの名前 | 意味 | 設定ファイル |
| --- | --- | --- |
| `"none"` | エフェクトなし(配布設定の基本エフェクト。オーバーレイは設定どおり) |  |
| `"ascii"` | 画面を文字で描き直す。文字 1 つ = ピクセル 1 つ(基本は場面だけ。セリフはそのまま読める) | `ascii_config.rpy` |
| `"retro_term"` | レトロターミナル:蛍光体の単色モニター、内蔵の曲面 CRT・VHS。**使っている間、オーバーレイは基本でオフ** | `retro_term_config.rpy` |
| `"gameboy"` | ゲームボーイ:大きな点と 4 色の LCD 画面、ディザリング / ピクセル化 | `gameboy_config.rpy` |
| `"glitch"` | グリッチ(5.1):ときどきランダムに画面が裂け、ブロックがずれ、色が分かれる | `glitch_config.rpy` |
| `"boil"` | ジリジリ(5.1):手描きアニメのように輪郭がカクカク震える | `boil_config.rpy` |
| `"halftone"` | 網点(5.1):印刷物のような点の模様、1 色 / 4 色 | `halftone_config.rpy` |
| `"hologram"` | ホログラム(5.1):1 色、流れる走査線、にじんだ複製。人物 1 人に `show 名前 at screen_fx.image_fx("hologram")` | `hologram_config.rpy` |
| `"nightvision"` | 暗視スコープ(5.1):緑の暗視ゴーグル、画面の文字と録画時間 | `nightvision_config.rpy` |
| `"collage"` | フォトコラージュ(5.3):同じ場面を写真で何枚も撮って重ねて貼った形。かけらごとに少しずれて拡大される。`$ collage.preset("joiner")` 基本に近い、`"scatter"` 広く多く、`"calm"` かけら 4 つで落ち着いて。以前の名前 `"tiles"`(ずれる破片、5.3 で廃止)はフォトコラージュとして読む。場面の転換 `scene bg with screen_fx.TileSwap(1.0)` はそのまま | `collage_config.rpy` |
| `"ripple"` | ゆらぎ(5.5):画面を透明な液体越しに見るようにゆっくりゆらぐ。以前のタイトルのゆらぎをシェーダーに移したもので、タイトル・ゲーム内メニュー・ゲーム中のどこでも。`$ ripple.preset("calm")` 軽く、`"dream"` 大きく | `ripple_config.rpy` |
| `"shards"` | 破片の飛散(5.1):小さなとがったかけらが風に舞う。`$ shards.preset("embers")` 火の粉、`"ash"` 灰、`"dread"` 暗い画面に赤い破片 | `shards_config.rpy` |
| `"waves"` | 波紋(5.7):1 点から丸い波が広がって画面が屈折 | `waves_config.rpy` |
| `"wobble"` | ゆらめき(5.7):ノイズの模様でかげろう・手描きのようにゆらめく | `wobble_config.rpy` |
| `"filmgrain"` | 古いフィルム(5.7):粒子、ほこり、傷、ちらつき、がたつき、あせた色 | `filmgrain_config.rpy` |
| `"fisheye"` | 魚眼レンズ(5.7):中央がふくらみ端が曲がる、丸いレンズの画面も | `fisheye_config.rpy` |
| `"photocopy"` | コピー機(5.7):何度もコピーしてすり減った紙 | `photocopy_config.rpy` |
| `"relief"` | 浮き彫り(5.7):金属板に押して刻んだ形、沈み彫りも | `relief_config.rpy` |
| `"gradmap"` | グラデーションマップ(5.7):明るさに応じて選んだ色で塗り直す、ポスターのようにも | `gradmap_config.rpy` |
| `"rings"` | 同心円のずれ(5.7):丸い輪ごとに回してずらす | `rings_config.rpy` |
| `"camcorder"` | 古いカムコーダー(5.7):低い画質に移した昔のカムコーダー映像の画面のトーン。プリセット `light`、`tape`、`cold` | `camcorder_config.rpy` |
| `"macroblock"` | ブロック崩れ(5.8):デジタル映像が壊れるときのように四角いマスが 1 色でつぶれ、縞・ずれ・色のずれ。ふだんはときどき、`always` ならずっと。プリセット `subtle`、`broken`、`smear` | `macroblock_config.rpy` |
| `"default"` | 基本エフェクトに戻る(= 取り消し) | `screen_fx_config.rpy` の `screen_fx.base` |
| (オーバーレイ) | VHS。オン / オフだけを選び、見た目は `vhs_crt.settings` | `vhs_crt_config.rpy` |

> 4.0 でモノクロ(`mono`)は消しました。以前の名前 `"vhs_crt"` を基本エフェクトに使うと、「なし + オーバーレイがオン」として読みます。

### 系統図で区間にシェーダーを入れる (screen_fx 5.2)

スクリプトを直接書かず、ゲームを動かしたままマウスで入れる方法です。

1. ゲームを開発モードで起動して Shift+M →「画面エフェクト」タブ → **G**(または [G 系統図を開く])。ゲーム画面の横に系統図が出ます。左の数字がスクリプトの行番号、黄色い四角が `label`、横に分かれる黄色い枝が選択肢と `if`、`-> 名前` が `jump` です。右の色の帯は、その行にかかっているシェーダー(左が 1 番、右が 2 番)です。
2. シェーダーを入れたい最初の行の節を押したまま、終わりの行までドラッグします。区間がピンクに塗られます。
3. パネルで 1 番、2 番のシェーダーを選び **[この区間に適用]** → **Ctrl+S**。スクリプトがこう変わります。
   ```renpy
       $ screen_fx.shaders("glitch", "vhs_crt")   # 区間の最初の行の上
       e "세 번째 대사."
       ...
       $ screen_fx.shaders("ascii", "none")       # 区間の終わりの次の行の上: 元の 2 枠に
       e "가지가 합쳐진 대사."
   ```
4. トランジションを変える:系統図の右端の四角い点(シェーダーが変わるところ)を押して選び、パネルの「選んだトランジションの点」で 設定どおり / TV / ふわっと / すぐ。複数の点を一度に変えられます。保存すると `transition="fade"` のような値が入ります。

- 区間の終わりが選択肢の枝の中なら、ほかの枝へ行った人は終わりの次の行を通りません。パネルで、戻すところを **枝が合流するところ**(メニューが終わった次の行)に選べます。
- 消す:区間をドラッグして選ぶか四角い点を選んでから **Delete** → Ctrl+S。そのシェーダーの行がスクリプトから抜け、点もなくなります。前でオンにしたシェーダーがあれば、その区間はそのシェーダーで続いて見えます(メッセージで知らせる)。
- 節をドラッグせず押すだけなら、ゲームがその行へ移ります。もう一度 G を押すと系統図がしまわれます。
- pygaki アプリでは系統図を開きません(アプリ [GUI編集] の欄の名前は「シェーダー」)。pygaki のシナリオなら、[スクリプト編集] でボックスや label の右上の ◐ シェーダーでかけます。

### スクリプトで

```py
label start:
    scene bg room
    e "평소 화면 (효과 없음 + VHS 덮개)."

    ## ASCII に。TV が消えて点いてから次のセリフが出ます。
    $ screen_fx.use("ascii")
    e "세계가 글자로 무너진다."
    e "다음 줄에서도 계속 ASCII."

    ## 取り消し: 基本エフェクトとオーバーレイを設定どおりに
    $ screen_fx.clear()
    e "현재로 돌아왔다."

    ## トランジションを選ぶ (書かなければ screen_fx.transition の設定に従う)
    $ screen_fx.use("gameboy", transition="tv")      # TV オフ・オン (基本)
    $ screen_fx.use("gameboy", transition="fade")    # 前のエフェクトがゆっくり抜け、新しいエフェクトがゆっくり入る
    $ screen_fx.use("gameboy", transition=None)      # すぐ

    ## そのほかの値
    $ screen_fx.use("ascii", duration=2.0)         # トランジション全体を 2 秒に (TV は消える・黒い画面・点くの比率はそのまま)
    $ screen_fx.use("ascii", wait=False)           # トランジションを待たずにすぐ次の行へ
    $ screen_fx.use("none", overlay=False)         # 何のエフェクトもないきれいな画面
    $ screen_fx.clear(transition="fade", duration=2.0)   # 2 秒かけてゆっくり基本に

    ## オーバーレイ (VHS) のオン・オフ
    $ screen_fx.use("ascii", overlay=False)        # ASCII だけ (オーバーレイはオフ)
    $ screen_fx.use("retro_term", overlay=True)    # レトロターミナルだがオーバーレイもオン (基本はオフ)
    $ screen_fx.set_overlay(False)                 # エフェクトはそのまま、オーバーレイだけオフ
    $ screen_fx.set_overlay(True)                  # エフェクトはそのまま、オーバーレイだけオン

    ## オーバーレイのゆがみの度合い
    $ screen_fx.set_warp(3.0)                      # 端の曲がり 3 (0 平ら、1 基本、5 大きく)
    $ screen_fx.set_warp(0.0, duration=2.0)        # 2 秒かけてゆっくり平らに
    $ screen_fx.set_warp("default")                # 設定ファイルの値に
    $ vhs_crt.set(distort_intensity=0.15, aberration=0.2, duration=1.0)   # 画面のずれ、色のにじみも一緒に

    ## 文字の除外: 今回だけ変える (書かなければそのエフェクトの設定ファイルの exclude)
    ##   "say" セリフ・名前 / "choice" 選択肢 / "screens" メニュー・画面 (クイックメニュー、セーブ画面など)
    $ screen_fx.use("ascii", exclude=())                               # 何も除かない: セリフ窓まですべて文字に
    $ screen_fx.use("gameboy", exclude=("say",))                       # セリフ・名前だけ元の色 (1 つのときもカンマ)
    $ screen_fx.use("gameboy", exclude=("say", "choice", "screens"))   # 文字はすべて元の色、背景・キャラクターだけ

    ## ゲームボーイの値を変える
    $ gameboy.set(mode="pixel")                  # ピクセル化に (模様なしでくっきり)

    ## 今オンのエフェクトで分けて使う
    if screen_fx.current_effect() == "ascii":      # 今の基本エフェクト (なければ "none")
        e "아직 글자 화면이야."
    if screen_fx.is_default():                      # use() で変えていないか、clear() で戻った状態
        e "평소 화면이야."
    if screen_fx.overlay_on():                      # 今オーバーレイ (VHS) がオンか
        e "VHS가 덮여 있어."
    if "say" in screen_fx.current_exclude():        # 今のエフェクトから除いた文字のまとまり (タプル)
        e "대사창은 멀쩡해."
```

### セリフの行の括弧で (エディターのセリフタブで選ぶとこう保存される)

```py
e "평소 화면."
e "어? 화면이…" (fx="ascii")                              # このセリフが出る前に ASCII に、そのあとも続く
e "아직 ASCII야."                                          # 前から続く
e "돌아왔다." (fx="default")                               # 取り消し → 基本
e "서서히 바뀐다." (fx="gameboy", fx_transition="fade")     # この行だけふわっと
e "번쩍." (fx="none", fx_overlay=False, fx_transition=None)  # すぐきれいな画面に
e "크고 빨갛게." (size=40, color="#aa0000", fx="gameboy")  # セリフのスタイルの値と一緒に使ってもよい
e "덮개 없이." (fx="ascii", fx_overlay=False)              # ASCII だけ
e "덮개만 다시 켜자." (fx_overlay=True)                     # エフェクトはそのまま、オーバーレイだけオン
e "화면이 크게 휜다." (fx_warp=3.0)                         # オーバーレイの曲がり 3
e "원래대로 휨." (fx_warp="default")                        # 曲がりを設定値に
e "전부 글자로." (fx="ascii", fx_exclude=())               # 今回だけ何も除かない
e "대사만 또렷하게." (fx="gameboy", fx_exclude=("say",))    # 今回だけセリフ・名前を除く
e "접속 중…" (fx="retro_term")                             # レトロターミナル (オーバーレイは基本でオフ)
```

- `fx=` を使ったセリフは、TV がまた点いてから文字が出始めます。
- TV のトランジション中にクリックすると、すぐ新しいエフェクトに変わります。そのクリックで次のセリフに進むことはありません。
- **トランジションなしですぐ変わるとき**:巻き戻し・早送り、セーブのロード、スキップ(Ctrl・Tab)、エディターを開いている間、プレイヤーが `screen_fx.Toggle()` でエフェクトを切っている間。
- `screen_fx` フォルダーを消すと、`fx=`、`fx_overlay=`、`fx_warp=` を書いたセリフでエラーになるので、その括弧も一緒に消してください。
- エディターのセリフタブで直して Ctrl+S すると、スクリプトを読み直します。Ren'Py は直した行を同じ行と見分けられないので、**その前のセリフから** もう一度出ます。1 回進めると直した行が見えます。
- エディターの「画面エフェクト」タブのエフェクトのページは、エフェクトの **設定値** を直すところなので、そこで保存しても今の場面のエフェクトは変わりません。今の場面に使うなら、そのページの **「このセリフからこのエフェクト」**(セリフの括弧に。セリフタブへ渡す)または **「この行からこのエフェクト」**(選んだ行の上に `$ screen_fx.use(…)`。「行に入れる」のページへ渡す、4.1)→ Ctrl+S。

### セリフでない行で変える (エディターの「行に入れる」、4.1)

Shift+M →「画面エフェクト」タブ →「エフェクト:」で **[行に入れる]**。行を選び(`[` `]` で 1 行ずつ、行番号の入力、[今の行に]、L で一覧)、エフェクトを選んでから Ctrl+S すると、その行の **すぐ上** にこんな行が入ります。同じ行にまた保存すると前に入れた行を書き換え、[この行の上のエフェクトの行を消す] → Ctrl+S で消します。

```renpy
label start:
    $ screen_fx.use("ascii", overlay=False, transition="fade")   # ← エディターが入れた行
    scene fx_bg
    with dissolve

    $ screen_fx.clear()            # [取り消し → エフェクトなし]
    $ screen_fx.set_overlay(True)  # エフェクトはそのまま、オーバーレイだけ [オン]
    $ screen_fx.set_warp(3)        # オーバーレイの曲がり [3]
    $ screen_fx.set_warp("default")  # オーバーレイの曲がり [設定値]
```

### 設定ファイル (`screen_fx_config.rpy`)

```py
## 基本エフェクト: use() で変えていないとき、clear() で戻るときのエフェクト
##   "none"        なし (配布設定。オーバーレイがオンなら VHS だけ見える)
##   "ascii"       ASCII (ゲーム全体が文字の画面)
##   "retro_term"  レトロターミナル
##   "gameboy"     ゲームボーイ
define screen_fx.base = "none"

## オーバーレイ (VHS): 基本エフェクトの上にもう一度かぶせる。オン / オフだけ
##   True   オン (配布設定)。ただし、エフェクトごとの <名前>.overlay が False なら、そのエフェクトを使っている間はオフ
##   False  オフ。use(…, overlay=True) や fx_overlay=True でオンにするときだけ
define screen_fx.overlay = True

## エフェクトを変えるときの基本のトランジション
##   "tv"    TV が消えて点くように (下の screen_fx.tv の値)
##   "fade"  前のエフェクトがゆっくり抜け、新しいエフェクトがゆっくり入る
##   None    すぐ変える (トランジションの演出なし)
define screen_fx.transition = "tv"

define screen_fx.fade_time = 1.0      # "fade" トランジション全体の時間 (秒)
define screen_fx.wait = True          # True: トランジションが終わってから次の行へ / False: トランジションを始めてすぐ次の行へ
define screen_fx.skippable = True     # True: クリックするとトランジションを飛ばす / False: 終わるまでクリックを受けない
define screen_fx.editor_preview = True   # エディターを開いている間もエフェクトを見せる (編集中に V でオン・オフ)

## TV オフ・オン
##   オフ: 画面が上下につぶれて明るい横線 → 横線が真ん中の点に
##   黒い画面 (このときエフェクトが変わる)
##   オン: 点 → 横線 → 画面が広がる (ノイズがゆっくり抜ける)
define screen_fx.tv = {
    "off_time": 0.35,       # 消える時間 (秒)
    "black_time": 0.25,     # 消えたままの黒い画面 (秒)
    "on_time": 0.45,        # 点く時間 (秒)
    "line": 3,              # 横線・点の太さ (ピクセル)
    "flash": 0.8,           # 消えるときに白く光る度合い (0 = 光らない、1 = 真っ白に)
    "noise": 0.5,           # 点くときのノイズ (0 = なし、1 = 画面がノイズでいっぱい)
    "off_sound": None,      # 例: "audio/tv_off.ogg" (消え始めるとき。None = 音なし)
    "on_sound": None,       # 例: "audio/tv_on.ogg"  (点き始めるとき)
    "volume": 1.0,          # 2 つの音の音量 (0〜1)。環境設定の効果音の音量にも従う
}
```

| やりたいこと | 値 |
| --- | --- |
| ふだんはきれいで、特定の場面だけエフェクト | `define screen_fx.overlay = False`(基本エフェクトは `"none"` のまま) |
| ゲーム全体をゲームボーイの画面に | `define screen_fx.base = "gameboy"` |
| ゲームボーイを使っている間は平らな LCD だけ(オーバーレイはオフ) | `gameboy_config.rpy` に `define gameboy.overlay = False` |
| オーバーレイの曲がりを少なく / 平らに | `vhs_crt_config.rpy` の `vhs_crt.settings` で `"warp_amount": 0.5` / `0.0` |
| トランジションの演出なしで、いつもすぐ変える | `define screen_fx.transition = None` |
| 基本のトランジションをふわっとに | `define screen_fx.transition = "fade"`、`define screen_fx.fade_time = 1.5` |
| ゆっくり重い TV | `define screen_fx.tv = { "off_time": 0.8, "black_time": 0.6, "on_time": 1.0, "flash": 1.0, "noise": 0.8 }` |
| 点滅を少なく(光に敏感なプレイヤー向け) | `define screen_fx.tv = { "flash": 0.0, "noise": 0.1 }` |
| 画面のボタンで変える | `textbutton "ASCII" action screen_fx.Use("ascii")`、`textbutton "元に戻す" action screen_fx.Clear()` |
| 画面のボタンでオーバーレイだけ | `textbutton "VHS をかける" action screen_fx.SetOverlay(True)`、`textbutton "オーバーレイを外す" action screen_fx.SetOverlay(False)` |
| プレイヤーがすべての画面エフェクトを切れるように | 環境設定画面に `textbutton _("画面エフェクト") action screen_fx.Toggle()`(TV のトランジションの演出もオフ。ゲームを再起動しても保たれる) |

### カーソルの位置 — `screen_fx/screen_fx_config.rpy` + スクリプト (4.2)

UI Kit のソフトウェアカーソル(`custom_ui.cursor = True`)を画面エフェクトのどこに描くかを、シェーダーと同じくスクリプトの区間ごとに選びます。また変えるまで続き、セーブ・巻き戻しに保存されます。

```renpy
## screen_fx_config.rpy: ふだんの値
define screen_fx.cursor = "effect"       # エフェクトまで: ASCII ならカーソルも文字、ゲームボーイなら 4 色の点、VHS の色のにじみと曲がりも
# define screen_fx.cursor = "overlay"    # オーバーレイ (VHS) の下: 基本エフェクトは受けない
# define screen_fx.cursor = "top"        # エフェクトを受けない: いちばん上にきれいに (4.1 までと同じ)

## スクリプト
$ screen_fx.set_cursor("top")                    # この行からエフェクトを受けない
$ screen_fx.set_cursor("default")                # 設定値に
$ screen_fx.use("ascii", cursor="overlay")       # エフェクトを変えながら一緒に
e "커서가 깨끗해졌다." (fx_cursor="top")          # セリフの括弧
```

- エディター:セリフタブの「カーソル」の行(`fx_cursor=`)、画面エフェクトタブ「行に入れる」の「カーソル」の行(`$ screen_fx.set_cursor(…)`)。
- エディター(Shift+M)を開いている間と、OS のカーソル(`cursor_mode = "hardware"`)のときは、いつもいちばん上です。

### VHS オーバーレイ — `screen_fx/vhs_crt_config.rpy` (4.0)

オーバーレイはオン / オフだけを選び、見た目は `vhs_crt.settings` の値で決めます。ゆがみに関係する値:

```py
define vhs_crt.settings = {
    "warp_amount": 1.0,              # 端の曲がり (0 = 平ら、1 = 基本、3 以上 = 大きく曲がる。0〜5)
    "distort_intensity": 0.05,       # 帯が通るときに画面が横にずれる度合い (0〜0.2)
    "aberration": 0.03,              # 色のにじみ (赤・緑のずれ)
    "roll": True,                    # 上下に流れる帯
    "noise_opacity": 0.4,            # 帯に沿ってできるノイズ (0〜1)
    "vignette_opacity": 0.5,         # 端の暗さ (0〜1)
    "strength": 1.0,                 # オーバーレイ全体の強さ (0 なら見えない)
    # … すべての値は vhs_crt_config.rpy と screen_fx/README.md 11-2
}

## エフェクトごとにオーバーレイを基本でオンにするか (各エフェクトの設定ファイル)
define ascii.overlay = True         # オン (配布設定)
define gameboy.overlay = True       # オン (配布設定)。False なら平らな LCD だけ
define retro_term.overlay = False   # オフ (配布設定)。内蔵の曲面 CRT と二重に曲がらないように
```

```py
## ゲーム中に (セーブ・巻き戻しに保存)
$ screen_fx.set_warp(3.0, duration=1.0)                  # 曲がりだけ 1 秒かけて 3 に
$ vhs_crt.set(warp_amount=0.0, distort_intensity=0.0)    # 複数の値を一度に
$ vhs_crt.preset("broken", duration=0.5)                 # 壊れた画面に
$ vhs_crt.reset(duration=1.0)                            # set() で変えた値をすべて設定値に
e "화면이 휜다." (fx_warp=3.0)                            # セリフの括弧で
```

- エディター:「画面エフェクト」タブ → **「VHS オーバーレイ」** のスライダー(端の曲がりなど)でふだんの値を、セリフタブの **「オーバーレイの曲がり」** の行でそのセリフからの値を選びます。
- 曲がりが大きいと、画面の端のボタンの見える位置とクリックされる位置がずれます。

### オーバーレイと文字の除外

**文字の除外** は、エフェクトをかけない文字を選ぶことです。**基本は文字まですべてかけます**(ASCII だけは文字をすべて除くのが基本)。除いた文字は元の姿のまま、くっきり残ります。

| 名前 | 除くもの |
| --- | --- |
| `"say"` | セリフ・名前(セリフ窓、NVL 画面) |
| `"choice"` | 選択肢 |
| `"screens"` | メニュー・画面(クイックメニュー、セーブ・ロード・環境設定の画面、`show screen` で出した画面) |

`scene`・`show` で出した背景・キャラクターはいつもエフェクトを受けます。そのため、セリフ窓は `sfx_say`、選択肢は `sfx_choice` のレイヤーに出ます。Ren'Py 標準のままにするなら `define screen_fx.split_text_layers = False`(そうすると文字はすべて除くか、除かないかだけになる)。

```py
## 各エフェクトの設定ファイルで基本の文字の除外を決める
define vhs_crt.exclude = ()                            # vhs_crt_config.rpy (オーバーレイ。配布設定: 除かない)
define ascii.exclude = ("say", "choice", "screens")    # ascii_config.rpy (配布設定: 文字をすべて除く)
define retro_term.exclude = ()                         # retro_term_config.rpy (配布設定: 除かない)
define gameboy.exclude = ()                            # gameboy_config.rpy (配布設定: 除かない。除かなかった文字は色だけ変わる)
define gameboy.exclude = ("say",)                      # 例: セリフ・名前だけ元の色 (1 つのときもカンマ)

## use() は呼ぶたびにオーバーレイを新しく決める (書かなければ設定どおり)
$ screen_fx.use("ascii", overlay=False)
$ screen_fx.use("gameboy")                       # ← オーバーレイは設定どおり (gameboy.overlay = True ならまたオン)
$ screen_fx.use("gameboy", overlay=False)        # ← オフのまま続けるなら、また書く

## "screens" (メニュー・画面) を除いたとき、スクリーンに add した画像もエフェクトを受けるにはこうする
screen map_view():
    add "images/map.png" at screen_fx.scene     # 地図の画像にも ASCII
    textbutton "닫기" action Hide("map_view")     # ボタンの文字はそのまま
```

- タイトル画面の背景画像(背景動画を含む)と、スプラッシュの背景・ロゴには、場面のエフェクトが **自動で** かかります。文字(メニュー・タイトル・本文)はそのままです。
- オーバーレイの文字の除外:基本エフェクトが「なし」なら `vhs_crt.exclude` に従い、基本エフェクトがあれば、そのエフェクトが何も除かないときはオーバーレイも何も除きません(オーバーレイがいつも上に来るように)。
- ゲームボーイは何も除かなくてもレイヤーごとにかけて、場面は点に変え、文字のレイヤー(セリフ・選択肢・メニュー)には 4 色だけをのせます(`"text_pixel": False`)。そのため小さいセリフも読めます。
- 1 つでも除くと、レイヤーごとに別々にかけます。曲がり(VHS・レトロターミナルの曲面)が除いた文字にはかからず、セリフ窓だけがまっすぐ浮いて見えます。
- オーバーレイは画面をもう一度描くので、とても遅いパソコンでは少し重くなることがあります。
- エディター:「画面エフェクト」タブのエフェクトのボタンごとに「オーバーレイ(VHS)」のオン/オフ、「文字の除外」の行(セリフと名前 / 選択肢 / メニューと画面 / 除かない / すべて除く。オン = 除く)、「基本エフェクト、トランジション」に「オーバーレイ(VHS)」の行、セリフタブに「オーバーレイ(VHS)」、「オーバーレイの曲がり」、「文字の除外」の行。

### ASCII — `screen_fx/ascii_config.rpy` (2.5)

画面を **文字のマス** に分け、マスごとに明るさに合った文字で描き直します。文字 1 つがピクセル 1 つの役割をします(昔のテキスト画面・ダンジョンクロールのコンソール)。文字の画像は文字の一覧とフォントからゲーム中に直接作るので、画像を別に用意する必要はありません。基本のフォントはプラグインに入っている **Neo둥근모**(`screen_fx/fonts/neodgm.ttf`、SIL OFL 1.1)です。

```py
define ascii.enabled = True
define ascii.exclude = ("say", "choice", "screens")   # 文字の除外 (基本: 文字をすべて除く)。() ならセリフまで文字に
define ascii.font = None           # None = Neo둥근모。ほかのフォント: "fonts/DungGeunMo.ttf"

define ascii.settings = {
    "strength": 1.0,        # 全体の強さ (0 = 元の画面、1 = 完全に文字に)
    "cell": 16,             # 文字のマスの高さ (ピクセル)。8 とても細かい、16 基本、32 大きめ、48 以上は絵が崩れる
    "aspect": 0.5,          # マスの横 ÷ 縦。0.5 = 半角文字 (8×16)、1.0 = 正方形のタイル
    "crisp": True,          # True: マスの高さを 8 の倍数に。16・32・48 でいちばんくっきり
    "chars": " .:-=+*#%@",  # 文字の一覧 (暗いマス → 明るいマス)。ダンジョン風 " .,:;ox%#@"、ブロック " ░▒▓█"、"01"
    "color_mode": "color",  # "mono" 1 色 (fg) / "color" 元の色 / "palette16" 昔の PC の 16 色
    "fg": "#c8c8c8",        # "mono" のときの文字の色。"#33ff66" 緑の端末、"#ffb000" 琥珀色
    "bg": "#000000",        # 背景色 (文字の間の空いたところ)
    "color_boost": 1.3,     # 元の色を明るくする倍率
    "bg_tint": 0.0,         # 背景に元の絵を透かす。0.15〜0.3 なら暗くならない (VHS をかぶせるときにおすすめ)
    "brightness": 1.0,      # 大きいと @・# のような詰まった文字が多くなる
    "contrast": 1.0,
    "invert": False,        # 明るさを反転
}
## 入っているプリセット: "terminal" 緑の端末、"amber" 琥珀色、"dungeon" 16 色 + ダンジョン風、"blocks" ブロック、"big" 大きい文字、"glow" VHS オーバーレイ用

## ゲーム中に (VHS と同じやり方)
$ screen_fx.use("ascii")                     # ASCII に変えて続ける
$ ascii.preset("dungeon", duration=0.5)      # ローグライクのコンソールっぽく
$ ascii.set(cell=48, duration=2.0)           # 2 秒かけて文字が大きくなり絵が崩れる
$ ascii.reset(duration=1.0)                  # 設定ファイルの値に
```

| やりたいこと | 値 |
| --- | --- |
| 絵をもっとよく見せる | `"cell"` を 8〜12 に(文字は読みにくくなる) |
| 文字を大きく見せる | `"cell": 32` または `ascii.preset("big")` |
| 正方形のタイル(ローグライクの地図) | `"aspect": 1.0` |
| 中途半端な大きさ(12、20 など)のまま | `"crisp": False`(文字が少しぼやける) |
| 緑の単色モニター | `ascii.preset("terminal")` |
| ASCII + VHS オーバーレイが暗すぎる | `ascii.preset("glow")` または `"bg_tint": 0.2`、`"color_boost": 1.6` |
| セリフ窓まですべて文字に(演出) | `$ screen_fx.use("ascii", exclude=())` |
| ほかの文字・記号で文字の一覧 | `"chars": " .·:∴※#"`(フォントにある文字だけ。なければ四角) |

エディターの「画面エフェクト」タブ →「ASCII」ボタンで、マスの大きさ・比率・くっきりはスライダーとボタンで、文字の一覧・色付けはボタンで選びます。詳しい値の説明は `screen_fx/README.md` 6 章。

### レトロターミナル — `screen_fx/retro_term_config.rpy` (2.6)

昔の単色モニター(蛍光体の画面)で見るように変えます。画面の **明るさを蛍光体の色で塗る** ので、緑の蛍光体 + 黒い背景なら、白い文字が緑に光ります。**曲面 CRT**(曲がり・端を暗く・丸い画面の縁)と **VHS**(流れる帯・水平の揺れ)を、このエフェクトの中で別々にオン・オフします。VHS_CRT エフェクト(オーバーレイ)とは別の値なので、オーバーレイを切ってもこのエフェクトだけでブラウン管の形になります。参考:cool-retro-term(コードは持ってこず、新しく書いた)。

```py
define retro_term.exclude = ()     # 文字の除外 (基本: 除かない → セリフまで蛍光体の色で光る)

define retro_term.settings = {
    "phosphor": "#5cff8a",      # 蛍光体の色: 文字と明るいところが光る色 ("#ffb000" 琥珀色、"#c8f0ff" 空色)
    "background": "#061208",    # 背景色: いちばん暗いところの色 ("#000000" 黒、"#1f6aa0" 青い背景)
    "color_keep": 0.0,          # 元の色を残す (0 = 蛍光体の 1 色、1 = 元の色)
    "bloom": 0.6,               # 光のにじみ (明るい文字のまわりに光が広がる)
    "raster": "scanlines",      # 画面のきめ: "none"、"scanlines" 走査線、"pixels" ピクセルの格子、"subpixels" RGB サブピクセル
    "flicker": 0.04,            # ちらつき
    "glow_line": 0.25,          # 上から下へ通り過ぎる明るい線
    "static_noise": 0.06,       # 静的なノイズ
    "crt": True,                # 曲面 CRT をオン (False = 平らな画面)
    "curvature": 0.25,          # 曲がり
    "frame": True,              # 画面のまわりの縁 (モニターの枠)
    "frame_size": 0.035,        # 縁の太さ
    "vhs": False,               # このエフェクトの中の VHS をオン (流れる帯・水平の揺れ)
    "vhs_wobble": 0.4,          # 水平の揺れ
}
## 入っているプリセット: "green" 緑、"blue" 青い画面、"amber" 琥珀色、"white" 白、"flat" 平らな画面、"broken" 故障

## ゲーム中に
$ screen_fx.use("retro_term")                     # レトロターミナルに (TV が消えて点きながら)
$ retro_term.preset("blue", duration=1.0)         # 1 秒かけて青い画面に
$ retro_term.set(vhs=True)                        # このエフェクトの VHS をオン
$ retro_term.reset(duration=0.5)                  # 設定ファイルの値に
e "접속 중…" (fx="retro_term", font="screen_fx/fonts/neodgm.ttf", size=32)   # セリフのフォントも端末の文字に
```

| やりたいこと | 値 |
| --- | --- |
| 緑の端末 | 初期値のまま、または `retro_term.preset("green")` |
| 青い画面 | `retro_term.preset("blue")` |
| セリフだけ元の色に | `define retro_term.exclude = ("say",)` |
| 曲面・縁なしで色ときめだけ | `"crt": False` または `retro_term.preset("flat")` |
| VHS オーバーレイと一緒に使うとき | このエフェクトを使っている間、オーバーレイは基本でオフ(`retro_term.overlay = False`)。オーバーレイをオンにすると曲がりが二重にかかるので、このエフェクトの `"crt": False` |
| 縁が端のボタンを隠す | `"frame_size"`、`"curvature"` を小さく(クリックの範囲はそのままなのでずれる) |
| 遅いパソコン | `"bloom": 0` |

エディターの「画面エフェクト」タブ →「レトロターミナル」ボタンで、色・光・画面のきめ・曲面 CRT・VHS のまとまりごとにスライダーを直します。残像(焼き付き)はありません。詳しい値の説明は `screen_fx/README.md` 7 章。

### ゲームボーイ — `screen_fx/gameboy_config.rpy` (2.7)

昔の携帯ゲーム機の LCD 画面のように変えます。画面を **大きな点** に分け、明るさに応じて **4 つの色(または 2 つの色)** だけで塗ります。色と色の間の明るさの描き方は 2 つから選びます。

| 表現の方式 | 色の間の明るさ | 似合う絵 |
| --- | --- | --- |
| `"dither"` ディザリング(基本) | 点の模様(市松・格子)で混ぜてなめらかにつなぐ | 写真のような CG、暗い場面、光 |
| `"pixel"` ピクセル化 | いちばん近い色でくっきり区切って階段のように | 単純な絵、ドット絵、広い面 |

文字は基本で **4 色だけをのせ、点に分けない** ので、小さいセリフもそのまま読めます(`"text_pixel": False`)。参考:Retro dither(CC0)のディザ模様、Gameboy Classic Shader(GPL)の LCD の見た目(コードは持ってこず、新しく書いた)。

```py
define gameboy.exclude = ()     # 文字の除外 (基本: 除かない → セリフもゲームボーイの色。形はそのままなので読める)

define gameboy.settings = {
    "mode": "dither",           # 表現の方式: "dither" ディザリング (点の模様で混ぜる) / "pixel" ピクセル化 (くっきり区切る)
    "pixel_size": 4.0,          # 点 1 つの大きさ (ピクセル)。1280×720 で 4 = 横 320 点、6 = 213 点、2 = 640 点
    "dither": "4x4",            # ディザの模様: "4x4" 太い模様 / "8x8" 細かい模様
    "dither_strength": 1.0,     # ディザの強さ (0.5 = 色が変わる近くにだけ模様、0 = ピクセル化と同じ)
    "text_pixel": False,        # True なら文字も点に分ける (大きい文字やピクセルフォントのときだけ)
    "colors": 4,                # 色の数: 4 または 2 (2 なら 1 番と 4 番の色だけを使う)
    "color1": "#1c3f04",        # 1 番: いちばん暗い色
    "color2": "#456306",        # 2 番: 暗い色
    "color3": "#74870a",        # 3 番: 明るい色
    "color4": "#939f06",        # 4 番: いちばん明るい色 (消えた LCD の背景)
    "gamma": 1.0,               # ガンマ (0.6〜0.8 = 暗いところが明るくなる。暗い CG がつぶれるとき)
    "grid": 0.4,                # 点の間のすき間 (0 = なし)
    "shadow": 0.4,              # 点の影: 暗い点の影が右下へ (0 = なし)
    "texture": 0.2,             # LCD のむら (0 = なし)
}
## 入っているプリセット: "dmg" オリーブグリーン (基本)、"green" 鮮やかな緑、"pocket" 灰色、"light" 青緑のバックライト、
##                   "bw" 白黒、"blood" 黒っぽい赤 (ホラーの場面用)、"1bit" 2 色、"clean" LCD の質感なし

## ゲーム中に
$ screen_fx.use("gameboy")                        # ゲームボーイの画面に (TV が消えて点きながら)
$ gameboy.set(mode="pixel")                       # ピクセル化に (表現の方式はすぐ変わる)
$ gameboy.preset("blood", duration=1.0)           # 1 秒かけて赤い画面に
$ gameboy.set(pixel_size=24.0, duration=2.0)      # 2 秒かけて点が 1 段ずつ大きくなる (モザイクのように)
$ gameboy.reset(duration=0.5)                     # 設定ファイルの値に
e "삐빅." (fx="gameboy", font="screen_fx/fonts/neodgm.ttf", size=32)   # セリフのフォントもピクセル文字に
```

| やりたいこと | 値 |
| --- | --- |
| オリーブグリーンのゲームボーイの画面 | 初期値のまま、または `gameboy.preset("dmg")` |
| グラデーションを点の模様で | `"mode": "dither"`(基本)。もっと細かく:`"dither": "8x8"` |
| 模様なしでくっきり区切ったドット感 | `"mode": "pixel"` |
| 画面が模様だらけに見える(暗い CG) | `"gamma": 0.7`、`"dither_strength": 0.5`、または `"mode": "pixel"` |
| 赤いホラーの場面 + ピクセル化 | `gameboy.preset("blood")` のあとに `gameboy.set(mode="pixel")`(プリセットは前に set() で変えた値を消すのでこの順番) |
| セリフまで点に(本物のゲーム機のように) | `"text_pixel": True` に大きいピクセルフォント(点 2 ピクセルなら文字 32、点 4 ピクセルなら 64) |
| セリフは元の色のまま | `define gameboy.exclude = ("say",)` |
| 遅いパソコン | `"shadow": 0` |

エディターの「画面エフェクト」タブ →「ゲームボーイ」ボタンで、画面・色・LCD のまとまりごとにスライダーを直します(4 つの色はボタンを押すと色の選択画面が開く)。本物の LCD の残像はなく、画面の大きさもそのままです。詳しい値の説明は `screen_fx/README.md` 8 章。

### 新しいシェーダーを入れるとき

`screen_fx/README.md` 12-1 のモノクロの見本コードを新しいファイルに保存して名前を変え(例:`glitch`)、シェーダーの部分を直します。入れるだけで `$ screen_fx.use("glitch")`、セリフの括弧 `(fx="glitch")`、エディターの「画面エフェクト」タブとセリフタブのボタンが自動でできます。段階ごとのやり方は `screen_fx/README.md` 12 章。文字のレイヤーだけを違うふうに描くエフェクト(ゲームボーイのような)は、`layered()` と `u_sfx_text` を使います(同じ章)。

## エフェクトフォルダー — `ui_kit/effects/` (5.1)

このフォルダーに `.glsl` ファイルを入れると、その中のエフェクトがゲームと pygaki アプリに自動ででき、ファイルを抜くとなくなります。エフェクト 1 つにファイル 1 つです。ファイルを入れたり抜いたりしたあとは、ゲームを再起動します。pygaki アプリの [エフェクト] 画面でサンプルを流してみたり、オン・オフしたり、入れたり抜いたりもできます(抜いたファイルは `ui_kit_backup/effects/` に残る)。

| 種類 | 使うところ | スクリプト |
| --- | --- | --- |
| 文字の登場エフェクト(`@effect`) | pygaki 文字エフェクトカードの登場エフェクトの一覧 | `e "아래에서 올라온다." (cps=30, effect="maskup")` |
| 画像トランジション(`@transition`) | pygaki 背景・表示の行の「現れ方」 | `scene bg hall with img_fx.use("irisin")`、時間と値は `img_fx.use("bands", 1.4, count=10)` |

入っているエフェクト:文字 `maskup` 下から上がってくる、`tracking` 字間が狭まりながら、`sweep` 光が通り過ぎる、`backbox` 後ろにボックス、`karaoke` カラオケ、`meltglitch` 溶けるグリッチ、`droplets` 水滴、`spring` 弾んで落ち着く、`marquee` 横に流れる、`scramble` 文字デコード、`bubble` 吹き出し(形は 4 つ、画像への差し替えはエフェクトフォルダーの README)/ 画像 `irisin` 円で開く、`bands` 帯で覆って開く、`pixelsort` ピクセルソート(クラッシュ)、`datamosh` データモッシュ(クラッシュ)、`slide` 横に押す、`mosaic` モザイクで変わる、`blinds` 横のブラインド、`static` TV ノイズ、`calibrate` 調整画面、`tapestretch` テープの伸び、`blink` 点滅、`pushup` 押し上げる。アプリの [エフェクト] 画面では一覧から [非表示] にすることだけができ、入れたり抜いたりするには、このフォルダーにファイルを入れるか消します。

**シェーダーが変わるときに画像トランジションで**:`pixelsort`、`datamosh` は、画面シェーダーを変えるときのトランジションとしても使います。前の画面が壊れたまま少し止まってから新しい画面へぷつっと移り、シェーダーもその瞬間に変わります。pygaki では、ボックスの ◐ シェーダー → トランジションの「始まるとき」「終わるとき」で選び、その下の「方向」を決めます。スクリプトに直接書くときはこう書きます。

```renpy
$ screen_fx.shaders("glitch", "none", transition="datamosh", duration=1.4, tv={"mode": 1.0})   # 拡散 (0 なら回転)
scene bg room
with screen_fx.pending_with()
```

ピクセルソートの方向は `tv={"dir": 0}` 横、`1` 縦、`2` 回転、`3` 拡散です。新しいエフェクトの書き方と、Claude に渡す依頼文は、そのフォルダーの `README.md` にあります。

## ボックス・場面ごとのシェーダー、セリフ音、カーソル (pygaki、5.1)

pygaki でボックスや label の右上の **◐ シェーダー** で決めると、書き出すときにボックスごとの最初の行に、下のような行が書かれます。自分でスクリプトを書くときも同じ行を使います。

```renpy
$ screen_fx.shaders("vhs_crt", "none", transition="tv", tv={"off_time": 0.6}, values={"vhs_crt": {"warp_amount": 2.0}})
$ custom_ui.scene(typing_sound="audio/beep.ogg", ctc="gui/ctc/heart", cursor="gui/cursor/hand")
```

- `values`:その場所でだけ使うシェーダーの詳細値(`{}` なら設定どおり)。`tv`:今回の TV トランジションにだけ使う値。
- `custom_ui.scene`:場面ごとのセリフ音(`None` ならオフ)、クリック待ち表示とカーソルの画像フォルダー(フォルダーの中の画像を名前の順に流す)。`custom_ui.scene()` ならゲームの初期値に。セーブと巻き戻しに残ります。

## タイトルのゆらぎ — `screen_fx/watermorph_config.rpy`(以前の方式)

5.5 から、タイトルのゆらぎはシェーダー `ripple`(`ripple_config.rpy`、上の基本エフェクトの表)でかかります。新しいプロジェクトは `screen_fx_config.rpy` の `screen_fx.title_shaders = ("ripple", "none")` が初期値で、`watermorph.enabled = False` です。下は以前の方式をそのまま使うときの値です(2 つを一緒にオンにすると二重にゆらぐ)。

| 値 | 配布の初期値 | 変えると |
| --- | --- | --- |
| `watermorph.enabled` | `False`(5.5 から) | `True` なら以前の方式でゆらぐ(`title_shaders` から `"ripple"` を外す) |
| `watermorph.target` | `"screen"` | `"background"` なら背景だけがゆらぎ、メニューの文字はくっきり |
| `watermorph.amount` | `6.0` | ゆらぎの強さ(ピクセル)。`"screen"` のときはクリックの位置がずれないよう 8 以下 |
| `watermorph.scale` | `180.0` | 波 1 つの大きさ(ピクセル)。大きいほどゆったりした大きな波 |
| `watermorph.speed` | `0.6` | 流れる速さ |
| `watermorph.flow` | `1.2` | 渦の度合い。0 なら単純な波 |
| `watermorph.shine` | `0.15` | 表面の反射光。黒い背景で煙のように見えるなら 0 |
| `watermorph.quality` | `2` | 1〜3。低スペックの PC・モバイル・Web は 1 |
| `watermorph.in_title_menus` | `False` | タイトルから開いた環境設定・ロード画面にもかける |

エディターの「タイトルのゆらぎ」タブで、スライダーをドラッグして見ながら直せます。エディターでほかのタブを使っている間もエフェクトが見え、V でオン・オフします。

## VHS・CRT エフェクト — `screen_fx/vhs_crt_config.rpy`

入れるだけで画面全体にかぶさります。VHS は **基本エフェクト**(`screen_fx.base = "vhs_crt"`)なので、`screen_fx.use()` でほかのエフェクトをオンにしている間は休み、取り消す(`screen_fx.clear()`)と戻ります。範囲は `vhs_crt.scope`、見た目は `vhs_crt.settings` の辞書の値で決めます。

| やりたいこと | 値 |
| --- | --- |
| エフェクトをオフ | `vhs_crt.enabled = False` |
| ゲーム中だけ / タイトルだけ | `vhs_crt.scope = "game"` / `"main_menu"`(タイトル前のスプラッシュはタイトルの方に入る) |
| セリフ窓・メニューはくっきり、場面だけに | `vhs_crt.auto = False` のあと、スクリプトで `camera at vhs_crt.effect` |
| 全体の強さ | `settings` の `"strength"`(0 元の画面 〜 1) |
| 走査線・格子 | `"scanlines_opacity"`、`"scanlines_width"`、`"grille_opacity"`、`"pixelate"`、`"resolution"` |
| 流れる帯・画面のずれ | `"roll"`、`"roll_speed"`、`"roll_size"`、`"distort_intensity"` |
| ノイズ | `"noise_opacity"`、`"static_noise_intensity"` |
| 色 | `"aberration"`(色のにじみ)、`"brightness"`、`"discolor"`、`"saturation"`、`"contrast"` |
| ブラウン管の形 | `"warp_amount"`(端の曲がり。大きいと端のボタンのクリックがずれる)、`"vignette_intensity"`、`"vignette_opacity"` |
| 画面が暗すぎる | `"brightness"` を上げる、または `scanlines_opacity`・`grille_opacity`・`vignette_opacity` を下げる |
| 低スペック向け | `vhs_crt.redraw = 1.0/30`、`"pixelate": False`、`"noise_opacity": 0` |
| ゲーム中に切り替えるセット | `vhs_crt.presets` に名前と値を足す(`"clean"`、`"broken"` が入っている) |

ゲーム中はスクリプトで変えます。変えた値はセーブ・巻き戻しに一緒に保存されます。

```py
$ vhs_crt.preset("broken")                     # 一瞬の故障
pause 0.3
$ vhs_crt.reset(duration=0.5)                 # 設定ファイルの値にゆっくり
$ vhs_crt.set(noise_opacity=0.9, duration=1.0)
$ vhs_crt.off(duration=2.0)                   # ゆっくりオフ
```

プレイヤーがオフにできるようにするなら、`screens.rpy` の環境設定画面に `textbutton _("VHS エフェクト") action vhs_crt.Toggle()` の 1 行を入れます。すべての画面エフェクトと TV のトランジションの演出を一度に切るボタンは `textbutton _("画面エフェクト") action screen_fx.Toggle()` です。エディターの「画面エフェクト」タブ(VHS ボタン)では、エフェクトをオンにしたままスライダーをドラッグして直せ、「直す対象」をプリセットに変えると、そのプリセットをプレビューしながら直します。エディターでほかのタブを使っている間もエフェクトが見え、V でオン・オフします。

## 値が当てはまる順番と問題の解決

同じ値が何か所にもあると、右へ行くほど勝ちます。

| 機能 | 順番(→ 後ろが優先) |
| --- | --- |
| タイトルメニュー | `tmenu.default` → エディターの共通の値 → 項目に書いた値 → エディターの項目の値(`title_menu_layout.rpy`) |
| 選択肢 | `cmenu.default` →(以前のエディターが保存した)`choice_menu_layout.rpy` → `menu (…)` の括弧 → 選択肢の括弧 |
| カーソル・セリフ音 | `custom_ui_config.rpy` → `custom_ui_layout.rpy` |
| セリフ | キャラクター定義 →(以前のエディターが保存した)`say_style_layout.rpy` → セリフの括弧 |
| テキスト速度 | `options.rpy` → `custom_ui.text_cps` → プレイヤーが環境設定で選んだ値 |
| タイトルのゆらぎ | `watermorph_config.rpy` → `watermorph_layout.rpy` |
| 今オンの画面エフェクト | `screen_fx.base` → `screen_fx_layout.rpy` の base → ゲーム中の `screen_fx.use()` / セリフの `fx=`(`clear()` すると base に) |
| エフェクトを変えるときのトランジション | `screen_fx_config.rpy` → `screen_fx_layout.rpy` → `use(transition=…)` / セリフの `fx_transition=` |
| オーバーレイのオン/オフ | `screen_fx.overlay` とエフェクトごとの `<名前>.overlay` → `screen_fx_layout.rpy`、`<名前>_layout.rpy` → `use(overlay=…)` / `set_overlay()` / セリフの `fx_overlay=` |
| オーバーレイの曲がり | `vhs_crt.settings` の `warp_amount` → `vhs_crt_layout.rpy` → `screen_fx.set_warp()` / `vhs_crt.set()` / セリフの `fx_warp=` |
| 文字の除外 | エフェクトの基本(ASCII は文字すべて、ほかは除かない)→ 各エフェクトの exclude(`ascii.exclude` など)→ 各エフェクトの配置ファイル(`ascii_layout.rpy` など)→ `use(exclude=…)` / セリフの `fx_exclude=` |
| VHS オーバーレイ・ASCII・レトロターミナル・ゲームボーイのエフェクトの値 | `vhs_crt.settings`・`ascii.settings`・`retro_term.settings`・`gameboy.settings` → `vhs_crt_layout.rpy`・`ascii_layout.rpy` → ゲーム中の `vhs_crt.set()`・`screen_fx.set_warp()`・`ascii.set()` など |
| スプラッシュ | エンジンの初期値 → `splash.default` → ページに書いた値 |

| 症状 | 確かめること |
| --- | --- |
| 設定を直したのにそのまま | 同じ名前の `*_layout.rpy` がないか(エディターの値が優先) |
| 文字が四角で出る | そのフォントにその文字がない |
| ほかのパソコンでだけフォントが出ない | ファイル名の大文字小文字(`ChosunGu.TTF` ≠ `ChosunGu.ttf`) |
| 動画が出ない、または透明なところが黒い | パス、VP9 コーデック、side_mask 形式か、`…_side_mask` の値 |
| セリフ音が二重に鳴る | キャラクターに以前の `callback=` の音の関数が残っていないか |
| エディターで変えた選択肢・セリフの値がスクリプトに入らない | パネルの下のメッセージに理由が出る。Ctrl+C でコピーしてその行に貼り付け |
| スクリプトを間違って直した | プロジェクトフォルダーの `ui_kit_backup/` に、直す前の元が時刻ごとにある |
| 速度・エフェクトを変えても見えない | テキスト速度が「即時」でないか(波・震えはいつも見える) |
| プラグインを入れたら "given a default a second time" エラー | 同じプラグインのフォルダーが 2 つ入っている。古いフォルダーを `.rpyc` ごと消す |
| エディターが開かない | ランチャーから実行したか(開発モードでだけ開く) |
| 消したファイルが当てはまり続ける / スクリーンが 2 回定義される | `.rpyc` も一緒に消したか、以前の `title_menu` などのフォルダーが残っていないか |
| エディターの保存に失敗 | プロジェクトが Dropbox の中なら、同期を少し止めてから保存し直す |
| スプラッシュを直したのに見えない | Shift+R では出ない。再起動するか `splash.preview()`。`developer_skip`、`once`・表示しないで抜けていないかは、エディターのスプラッシュタブの「今は出ない: …」の行で見て、[また表示する] で記録を消す(splash 2.1) |
| 自分で書いた `splashscreen` ラベルだけが出る | そのラベルの中に `call splash_play` |
| スプラッシュの操作方法の表が下の案内と重なる | ページの `"yalign"` を小さくするか、`"key_size"`、`"keys_spacing"` を小さく |
| 文字の間の中黒(·)が四角 | Ren'Py の新しいプロジェクトの韓国語フォントにない文字。`/` や `,` を使うかフォントを変える |
| `use()` や `fx=` をしたのにエフェクトが見えない | そのエフェクトの `enabled`、プレイヤーが切っていないか(`persistent.screen_fx_off`)、`strength`、エディターでほかのタブを使っていないか |
| 「…というエフェクトがありません」エラー | エフェクト名の書き間違い。使える名前がエラー画面に出る |
| セリフの括弧の `fx=` で "unknown keyword" エラー | `screen_fx` フォルダーがないか古いバージョン(2.8 のパックに替える。`fx_overlay` は 2.5 から、`fx_exclude` は 2.6 から) |
| `show rain` で "image not found" エラー | 動画が `game/movies/` にあるか、拡張子が `.webm` か、同じ名前の画像が `images/` にないか(画像が優先) |
| 透明な動画が 2 枚の絵が横に並んだまま出る | ファイル名の前に `mask_` があるか(side_mask の動画) |
| 画像/動画タブで画像を選べない | スクリプトの show・scene の行で出した画像だけを選べる。セーブをロードした直後なら、行の一覧から選ぶ |
| ASCII でセリフが読めない | `ascii.exclude` に `"say"` があるか、`exclude=()` や `fx_exclude=()` を使っていないか |
| 文字を除いたのにエフェクトがかかったまま | 1 つだけ書くときにカンマを落としていないか(`("say")` ではなく `("say",)`)、`screen_fx.split_text_layers = False` になっていないか |
| ほかのコードがセリフ窓を見つけられない | そのコードが `layer="screens"` でセリフ窓を探している。`define screen_fx.split_text_layers = False` |
| レトロターミナル + VHS オーバーレイで画面が二重に曲がる | `retro_term.overlay = False`(基本)のままにするか、オーバーレイをオンにするならこのエフェクトの `"crt": False` |
| ゲームボーイの画面が点の模様だらけ | 暗い CG は 1 番・2 番の色の間を模様で混ぜる。`"gamma"` を 0.6〜0.8 に、`"dither_strength"` を 0.5 に、または `"mode": "pixel"` |
| ゲームボーイでセリフが読めない | `"text_pixel": True` なら文字も点に分かれる。`False` にするか `exclude=("say",)` |
| ゲームボーイでメニュー画面の中の画像が点にならない | メニュー・画面のレイヤーは色だけが変わる(`"text_pixel": False`)。エフェクトから `"screens"` を除き、その画像に `at screen_fx.scene` |
| ASCII が暗すぎる | `"color_boost"`・`"bg_tint"`・`"brightness"` を上げる。VHS をかぶせたなら `ascii.preset("glow")` |
| ASCII の文字がぼやける / 四角で出る | `"crisp": True` に `"cell"` を 16 の倍数 / 文字の一覧の文字がフォントにない |
| スクリーンに入れた画像にエフェクトがかからない | エフェクトから `"screens"`(メニュー・画面)を除いた。画像に `at screen_fx.scene` |
| オーバーレイが消える / またオンになる | `use()` は呼ぶたびにオーバーレイを設定どおりに決め直す。続けるなら `overlay=` を書く |
| VHS が見えない | `screen_fx.overlay` が `True` か(3.x の設定ファイルの `None` が残っていないか)、今のエフェクトの `<名前>.overlay`、`fx_overlay=False` を使っていないか |
| 画面エフェクトタブで保存したのに画面がそのまま | そのタブはエフェクトの設定値を直す。今の場面に使うなら「このセリフからこのエフェクト」ボタンかセリフタブ → Ctrl+S |
| 「'mono' というエフェクトがありません」エラー | 4.0 でモノクロを消した。スクリプトの `use("mono")`、`fx="mono"` を変えるか、`screen_fx/README.md` 12-1 の見本でまた入れる |
| エフェクトを最初に変えるとき 1 回止まる | そのシェーダーを初めて使うときにグラフィックカードが準備する時間。同じ実行の間はまた止まらない |
| TV のトランジションなしですぐ変わる | スキップ中、巻き戻し・ロードの直後、エディターを開いている間は、もともとすぐ変わる。`screen_fx.transition` も確かめる |
| トランジション中にセリフが先に出る | `screen_fx.wait = False` か `use(…, wait=False)` |
| エディターに「VHS エフェクト」タブがない | 2.4 から「画面エフェクト」タブの中の「VHS」ボタン |

## よくあるカスタム

**ロゴの動画をタイトルの前に入れる**

1. webm(VP9、ゲームの解像度)を `game/movies/logo.webm` に入れます。
2. `splash_config.rpy` の `splash.pages` のいちばん前にまとまりを入れます。
   ```py
   {
       "id": "logo",
       "background": "movies/logo.webm",
       "duration": "movie",
   },
   ```
3. ゲームを再起動するかコンソールで `splash.preview()` で確かめ、ランチャーで Lint。

**タイトルメニューに「操作方法」の項目を足す**

1. `title_menu_config.rpy` の `tmenu.items` にまとまりを 1 つ入れます。
   ```py
   {
       "id": "howto",
       "text": _("조작 방법"),
       "action": splash.ShowPage("controls"),
   },
   ```
2. 押すとスプラッシュの `controls` のページがタイトルの上に出て、クリックするとタイトルに戻ります。位置は Shift+M で決めます。

**タイトルメニューに「ギャラリー」の項目を足す**

1. `title_menu_config.rpy` の `tmenu.items` の中の、好きな順番の位置にまとまりを 1 つ入れます。
   ```py
   {
       "id": "gallery",
       "text": _("갤러리"),
       "action": ShowMenu("gallery"),
       "show_if": "persistent.cleared",
   },
   ```
2. ゲームを実行してタイトルで Shift+M → 新しい項目をドラッグして位置を決める → Ctrl+S。

**タイトルメニューのフォントをまとめて変える**

1. フォントファイルを `game/fonts/` に入れます。
2. `tmenu.default` の `"font"` をそのパスに変えるか、エディターのタイトルタブで 3(すべての項目共通)→ フォントのボタン → 選ぶ → Ctrl+S。

**選択肢 1 つを画面の好きなところに出す**

1. 選択肢が出るところまで進める → Shift+M(選択肢タブ)。
2. 選択肢をドラッグして置き、Q/E で傾け、フォント・色のボタンで変えます。
3. Ctrl+S。スクリプトのその選択肢の行の括弧が変わり、同じ場面に読み直されます。

**セリフ 1 行で名前をほかの位置に出して震わせる**

1. そのセリフまで進める → Shift+M(セリフタブ)。
2. Tab で「名前」を選んで名前をドラッグして置き、S/W で大きさ、色のボタンで色。
3. エフェクト「震え」、速度 ×0.5 → その行がもう一度出て確かめられます。
4. Ctrl+S。

**すべての選択肢に hover 動画を敷く**

1. side_mask 形式の webm を `game/gui/button/choice_hover.webm` に入れます。
2. `choice_menu_config.rpy` の `cmenu.default` に `"hover_movie": "gui/button/choice_hover.webm",` と `"hover_movie_size": (160, 150),`(表示サイズ)を書きます。

**カーソル・クリック待ち表示を自分の画像に**

1. フレームの画像を `game/gui/cursor/`、`game/gui/ctc/` に入れます。名前は 1、2、3… の順に。
2. エディターのカーソル/セリフ音タブ → オン → `<` `>` でそのフォルダーを選ぶ → 速度のスライダー → Ctrl+S(自動で読み直される)。

**セリフ音をキャラクターごとに変える**

```py
define custom_ui.typing_sound = "audio/type.ogg"                  # custom_ui_config.rpy: 基本の音
define e = Character("에일린", cb_typing_sound="audio/type_soft.ogg")   # スクリプト: このキャラクターだけ
define narrator = Character(None, cb_typing_sound=None)            # ナレーションは音なし
```

**ホラーの演出:1 行だけ大きく赤く、画面にノイズ**

```py
$ vhs_crt.preset("broken")
t "뒤를 돌아보지 마." (x=640, y=360, size=40, color="#aa0000")
$ vhs_crt.reset(duration=0.5)
```

**機能 1 つを少しの間切って、Ren'Py 標準と比べる**

設定ファイルのいちばん上のスイッチを `False` に(`tmenu.enabled`、`cmenu.enabled` …)→ Shift+R。切ると Ren'Py で作ったばかりのプロジェクトとまったく同じに見え、スクリプトの選択肢・セリフの括弧の値は無視されます。

**VHS エフェクトを見ながら合わせ、場面用のプリセットを作る**

1. エフェクトを見たい画面(セリフの場面など)で Shift+M → T で「画面エフェクト」タブ → 上の「VHS オーバーレイ」ボタン。
2. 「基本」・「走査線」・「揺れ」… のまとまりのボタンでスライダーを変えながら、ふだんの姿を合わせます。
3. 「直す対象」を「プリセット: broken」に変えると、そのプリセットをプレビューしながら直します。基本の設定に従わせる値は「外す」。
4. Ctrl+S で保存。スクリプトで `$ vhs_crt.preset("broken", duration=0.5)` としてその場面に使います。

**回想の場面だけゲームボーイの画面に(TV が消えて点きながら)**

```py
$ gameboy.preset("pocket")        # 灰色のプリセットの値に (画面はまだそのまま)
$ screen_fx.use("gameboy")        # TV が消えて点きながらゲームボーイに。次の指示まで続く
e "그해 여름, 우리는…"
e "아직 회상 중."
$ screen_fx.clear()               # 取り消し: エフェクトなし + VHS オーバーレイに
$ gameboy.reset()                 # 次に使うときのために元の値に
```

**エディターで「このセリフからゲームボーイ」を決める**

1. エフェクトを変えるセリフまで進める → Shift+M(セリフタブ)。(または「画面エフェクト」タブ → [ゲームボーイ] → [このセリフからこのエフェクト])
2. 「画面エフェクト」の行で [ゲームボーイ]。トランジションを変えるなら「トランジション」の行で [ふわっと] / [すぐ]。オーバーレイを切るなら「オーバーレイ(VHS)」の行で [オフ]、曲がりは「オーバーレイの曲がり」の行。
3. Ctrl+S → スクリプトのその行が `e "…" (fx="gameboy", fx_transition="fade")` のように変わり、スクリプトを読み直します。直した行はその前のセリフからもう一度出るので、1 回進めると見えます。行の後ろの `with dissolve` などはそのままです。
4. 戻すセリフで同じやり方で [取り消し → 基本(エフェクトなし)] → Ctrl+S。スクリプトには `(fx="default")` と書かれます。[そのまま] はこの行で変えない(括弧の `fx` を消す)ことです。

**このセリフから画面を大きく曲げる(オーバーレイのゆがみ)**

```py
e "어지러워…" (fx_warp=3.0)               # オーバーレイの端の曲がり 3
e "괜찮아졌다." (fx_warp="default")        # 設定ファイルの値に
$ screen_fx.set_warp(5.0, duration=2.0)   # スクリプトで: 2 秒かけてゆっくり大きく
```

**ダンジョンの場面を ASCII に、ブラウン管越しのように(セリフはそのまま読める)**

```py
label dungeon:
    scene bg cave
    $ ascii.preset("glow")                        # オーバーレイをかぶせても暗くならないように (画面はまだそのまま)
    $ screen_fx.use("ascii", overlay=True)        # TV が消えて点きながら ASCII + VHS オーバーレイ
    e "던전에 들어왔다."                      # 背景・キャラクターだけが文字、セリフは元のフォント
    $ ascii.set(cell=48, duration=2.0)            # 視界が崩れる演出
    e "눈앞이 흐려진다…"
    $ screen_fx.clear()                           # 取り消し: エフェクトなし + VHS オーバーレイに
    $ ascii.reset()                               # 次に ASCII を使うときのために
```

**エディターで「このセリフから ASCII + VHS オーバーレイ」を決める**

1. 変えるセリフまで進める → Shift+M(セリフタブ)。
2. 「画面エフェクト」の行で [ASCII] →「オーバーレイ(VHS)」の行で [オン]。セリフ窓まで文字にするなら、「文字の除外」の行でオンになっている [セリフと名前]・[選択肢]・[メニューと画面] を押してオフにします。
3. Ctrl+S → スクリプトのその行が `e "…" (fx="ascii", fx_overlay=True)` のように変わります。

**ASCII の文字の大きさを見ながら合わせる**

1. Shift+M → T で「画面エフェクト」タブ → 上の [ASCII]。
2. 「文字のマスの高さ」、「マスの横 ÷ 縦」のスライダーをドラッグし、「くっきり」をオン・オフします。文字の一覧と色付けはボタンで選びます。
3. 「文字の除外」で [除かない] / [すべて除く] を切り替えながら比べます。
4. Ctrl+S → `screen_fx/ascii_layout.rpy` に保存され、設定ファイルより優先されます。

**TV オフ・オンに音を入れて、もっとゆっくり重く**

1. 音のファイルを `game/audio/tv_off.ogg`、`game/audio/tv_on.ogg` に入れます。
2. `screen_fx_config.rpy` の `screen_fx.tv` を下のように直します。時間・閃光の値は、エディターの「画面エフェクト」タブ →「基本エフェクト、トランジション」でスライダーで合わせ、[プレビュー: TV] で確かめてもかまいません(音のパスは設定ファイルでだけ)。

```py
define screen_fx.tv = {
    "off_time": 0.8,                  # 消える時間 (秒)
    "black_time": 0.6,                # 黒い画面 (秒)
    "on_time": 1.0,                   # 点く時間 (秒)
    "line": 3,                        # 横線の太さ (ピクセル)
    "flash": 1.0,                     # 消えるとき真っ白に
    "noise": 0.8,                     # 点くときのノイズを多く
    "off_sound": "audio/tv_off.ogg",
    "on_sound": "audio/tv_on.ogg",
    "volume": 1.0,
}
```
