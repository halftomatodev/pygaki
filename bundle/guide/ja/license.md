<!-- 원본: bundle/guide/parts/license.md @ 02e968934b -->
# 注意とライセンス

## ほかのコードと一緒に使うとき

- `ui_kit` は Ren'Py 標準のスクリーン `main_menu`、`navigation`、`choice` を、`hotkeys` は `keyboard_help` を代わりに定義します。ほかのプラグインや自分で直したコードが同じスクリーンをまた定義すると、あとから実行される方が勝ちます。
- `splash` は Ren'Py の `splashscreen` ラベルにつながります。スクリプトにすでに `label splashscreen:` があれば、その中に `call splash_play` を入れてください。スプラッシュはゲームを最初に起動したときだけ出て、Shift+R では再表示されません(`splash.preview()` で確認)。
- `screen_fx` の VHS エフェクトをほかの CRT シェーダーと一緒に使うと、エフェクトが二重にかかります。
- `screen_fx` はセリフ窓を `sfx_say`、選択肢を `sfx_choice` レイヤーに出します(`config.say_layer`、`config.choice_layer`)。ほかのコードがセリフ窓のレイヤーを `"screens"` と決めて探しているなら、`screen_fx/screen_fx_config.rpy` の `screen_fx.split_text_layers` を `False` に。
- `screen_fx` はセリフの括弧の `fx=`(`fx_transition`、`fx_overlay`、`fx_exclude`)を受け取るために `config.say_arguments_callback` を使います。ほかのコードがすでに設定している関数は続けて呼びます。`screen_fx` フォルダーを消すと `fx=` を書いたセリフでエラーになるので、その括弧も消してください。
- `ui_kit` のエディターは画面エフェクトがかからないいちばん上のレイヤーに描かれます。エフェクトタブ以外のタブを使っている間は、`screen_fx` のエフェクトが一時的にオフになります。
- 透明な webm 動画は Ren'Py の side_mask 方式(左半分が色、右半分が透明度)を使います。作り方は `ui_kit/README.md` にあります。

## ライセンス

- VHS シェーダーの元は CC0 です(クレジットは任意)。ASCII シェーダーは MIT ライセンスのシェーダーのアイデアを、レトロターミナルは cool-retro-term(GPL)の見た目を、ゲームボーイは Retro dither(CC0)のディザ模様と Gameboy Classic Shader(GPL)の LCD の見た目を参考に、コードを新しく書きました(クレジットは `screen_fx/README.md` 15 章)。
- `screen_fx/fonts/neodgm.ttf`(Neo둥근모)は SIL OFL 1.1 です。ゲームに入れて配布・販売でき、配布するときは `neodgm_OFL.txt` も一緒に置いてください。
- 新しいプロジェクトの `game/fonts/` にある `Galmuri*.ttf`、`GalmuriMono*.ttf`(Galmuri)も SIL OFL 1.1 です。配布するときは `Galmuri-OFL.txt` も一緒に置いてください。
- pygaki editor(ゲーム内編集画面)のパネルのフォント `ui_kit/editor/fonts/Galmuri9.ttf`(Galmuri9、SIL OFL 1.1、`Galmuri-OFL.txt` が同じフォルダーに)は開発モードでだけ使い、配布版からは外れます。
- 新しいプロジェクトの `game/fonts/` の `Galmuri*.ttf`、`GalmuriMono*.ttf`(Galmuri)も SIL OFL 1.1 です。配布するときは `Galmuri-OFL.txt` も一緒に置いてください。
- pygaki editor(ゲーム内の編集画面)のパネルのフォント `ui_kit/editor/fonts/Galmuri9.ttf`(Galmuri9、SIL OFL 1.1、`Galmuri-OFL.txt` が同じフォルダに)は開発モードでだけ使い、配布版からは外れます。
- pygaki プラグインは MIT ライセンスです。フォントのようにライセンスが違うファイルは、リポジトリの `THIRD_PARTY.md` を見てください。
- pygaki アプリは MIT ライセンスです。同梱のフォントとライブラリのライセンスはリポジトリの `pykaki/licenses/` フォルダーにあります。
