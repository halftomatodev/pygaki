<!-- 원본: bundle/guide/parts/develop.md @ 5655515d9c -->
# Changing it yourself

For people who want to adapt pygaki to their game, add features, or share their changes with others. If you only want to change settings values, the "Plugin customization guide" chapter is enough; this chapter is for editing code and effect files directly.

## A tour of the repository

One repository holds the two programs and the tools that make the bundle. Documents and code comments in the repository are in Korean.

| Where | What |
| --- | --- |
| `pykaki/` | the screens of the pygaki script editor (React + TypeScript). Code in `src/`, the app's [Help] in `docs/GUIDE.md` (this guide's "Writing scripts with pygaki" chapter), structure in `docs/SPEC.md` |
| `pykaki/app/` | the desktop app (Electron). It uses the build of `pykaki/` as its screens |
| `showpy/game/` | the pygaki plugins. Put the four folders `ui_kit`, `screen_fx`, `hotkeys` and `splash` into a game's `game/` |
| `showpy/game/ui_kit/effects/` | the effects folder. One text effect or image transition per `.glsl` file |
| `showpy/docs/` | plugin docs: `READ_ME_FIRST.md` (read first), `CUSTOM_GUIDE.md` (this guide's "Plugin customization guide" chapter), `SPEC.md` (structure), `DEV_RULES.md` (working rules) |
| `docs/LINK.md` | the formats the two programs agree on (script file, marks in the exported script, live link, effect files) |
| `bundle/` | scripts that pack the Ren'Py SDK + plugins + app into a Windows bundle, the launcher buttons, this guide (`guide/`) |

This guide is also built from the repository's documents. The Korean version reads `pykaki/docs/GUIDE.md` for "Writing scripts with pygaki" and `showpy/docs/CUSTOM_GUIDE.md` for "Plugin customization guide" as they are, the other chapters from `bundle/guide/parts/`, and makes "Effect samples" from the effect files and sample videos. The Japanese and English versions read the translations in `bundle/guide/ja/` and `bundle/guide/en/` (the build tells you when an original is newer than its translation). After editing, run `python bundle/guide/build_guide.py` to rebuild the HTML in three languages in `bundle/guide/`; making the bundle also rebuilds and includes them automatically.

## Setup

* **Ren'Py SDK 8.6.1**: to test plugins and run Lint. If you downloaded the pygaki bundle, that folder is the SDK.
* **Node.js** (to change pygaki): run `npm ci` once in `pykaki/` and `pykaki/app/`.
* **Python 3** (to make the bundle): runs `bundle/make_bundle.py`.
* Make a test Ren'Py project (launcher's new project → Pygaki). Don't edit your real game directly.

## Changing the plugins

1. Edit files under `showpy/game/` in the repository.
2. Copy that folder into the test project's `game/` and **delete the `.rpyc` files.** If they remain, deleted code keeps running. You don't need to delete the `*_layout.rpy` saved in the test project (values saved from the editor).
3. Run **Lint** from the launcher, then start the game and look at the screens. On errors, read `traceback.txt`, `errors.txt` and `log.txt` in the project folder.
4. Each plugin must work on its own. Run Lint with only `screen_fx` (no `ui_kit`) and with only `ui_kit` (no `screen_fx`) too.

Rules:

* Put values users change in `*_config.rpy`; the engine (`engine/`, `editor/`) only reads them.
* An `init` number plus the file's `init offset` must stay within -999 to 999 (`init 999` becomes 1000 and Lint warns).
* Don't use `·` (middle dot) or `≡` in text shown on screen. Ren'Py's default Korean font lacks them and shows boxes. Write `[` in screen text as `[[`.
* Shader colors are premultiplied by alpha. To change a color, unpremultiply with `rgb / a` and output `vec4(col * a, a)`.
* For shaders or code from the internet, check the license and don't copy them; write new code using only the look as reference (no GPL code).
* When raising a version, update the engine's `VERSION`, that folder's `README.md`, the documents in `showpy/docs/` and `showpy/CHANGELOG.md` together.

## Adding an effect (effects folder)

Text effects and image transitions are added **by putting one `.glsl` file in `ui_kit/effects/`**, without changing code. Add the file and restart the game, and it appears automatically in Ren'Py's `effect="name"` and `img_fx.use("name")` and in pygaki's lists. Delete the file and it is gone; scripts that use that name keep running with the default look instead of stopping. The app's [Effects] screen can only hide effects from lists.

A file is made of marker lines starting with `@` and indented GLSL code.

| Marker | Meaning |
| --- | --- |
| `@effect name label` | start of a text effect |
| `@transition name label` | start of an image transition |
| `@time seconds` | default duration of an image transition |
| `@set u__name value` | default of a value. Change it in the script (`img_fx.use("bands", count=10)`, `effect="name:u__name=value"`) |
| `@param u__name min max label` | range and name of a pygaki slider |
| `@variables` | uniform lines |
| `@fragment` | code that sets the color of each pixel |

In an image transition's `@fragment`, use `l__t` (progress 0→1), `l__uv` (pixel position 0–1), `l__size` (width and height in pixels), `l__old` (color of the old image) and `l__new` (color of the new image); read other positions with `texture2D(tex0, pos)` (old image) and `texture2D(tex1, pos)` (new image). At the end, put the color in `gl_FragColor`. Image transitions used for shader transitions set the moment the screen shader switches with `@set u__cut value` (0–1).

The effects in the folder (text `maskup`, `tracking`, `sweep`, `backbox`, `karaoke`, `meltglitch`, `droplets`, `scramble`; image `irisin`, `bands`, `pixelsort`, `datamosh`, `slide`, `mosaic`, `blinds`, `static`, `calibrate`, `tapestretch`, `blink`, `pushup`, `vibrate`, `springin`) are examples. The full format, and a prompt to use when asking an AI for a new effect, are in `ui_kit/effects/README.md`. The base text effects are in the single file `ui_kit/engine/text_effects.glsl`; pygaki also takes this file as is when building and draws effects the same way Ren'Py does.

## Adding a screen shader

Like effects, screen shaders are kept separately as **two files per shader**, so adding one doesn't touch the whole screen effect engine (`screen_fx/engine/screen_fx.rpy`). You add only `screen_fx/engine/<name>.rpy` with the shader code and the value list, and `screen_fx/<name>_config.rpy` with the values users change. Save the two sample files (monochrome `mono`) from chapter 12 of `screen_fx/README.md` under a new name, change `mono` inside to the new name, then edit the value list (`PARAMS`), sliders (`GROUPS`) and shader code. To remove it, delete those two files (including `.rpyc`); to only hide it from the picker without deleting, write its name in `screen_fx/shaders_off.txt`. There is more to write than a single `.glsl` in the effects folder (the value list and sliders are written in Python). Once registered with `screen_fx.register_shader`, it appears automatically in `$ screen_fx.use("name")`, dialogue parentheses `(fx="name")`, the in-game editor's screen effects tab and pygaki's shader list. If you changed the detail sliders (`PARAMS`, `GROUPS`), run Lint once in the test project to regenerate `screen_fx/shader_list.json`, copy it to the same place in the repository, and rebuild pygaki.

## Changing pygaki

```bash
cd pykaki && npm ci            # once at first
cd pykaki && npm run dev       # dev server http://localhost:5173 (sample script; can't open Ren'Py projects)
cd pykaki && npx tsc --noEmit  # type check
cd pykaki && npm run build     # single file pykaki/dist/index.html
cd pykaki/app && npm ci && npm start -- --project "Ren'Py project folder"   # start as the desktop app
cd pykaki/app && npm run dist  # Windows app folder (pykaki/app/out/win-unpacked)
```

* After changing screens, run `npx tsc --noEmit` and `npm run build`. The app copies the built screens.
* When you add a new text effect, re-record the sample videos (`pykaki/public/effects/*.webm`) with `pykaki/tools/record_effect_clips.py` and rebuild the guide.
* If you changed the app side (`pykaki/app/`), run `npm run web && node smoke.cjs` to test by starting real Electron. GitHub Actions "pygaki 앱" runs the same test and builds the Windows app folder.
* Help text goes into the next build when you edit `pykaki/docs/GUIDE.md`.
* If you add or change screen text, add the Japanese and English to `pykaki/i18n/strings.tsv` and rebuild the dictionary following `pykaki/i18n/README.md`.
* If you add values to the script file (`.flow.json`) that older versions don't know, raise `FEATURE` in `pykaki/src/version.ts` by 1 (older apps then show a "newer version" warning). Don't change the format name `"format": "renpy-flow"` or the file name `.flow.json`.
* The app doesn't communicate externally without the user's permission. The live link with the game uses only `127.0.0.1`.

## Keeping the two programs' formats in sync

The shape of lines in the script pygaki exports (`game/script_flow.rpy`), the marks at line ends (`# @l:…`), the file the game sends back to pygaki (`showpy_inbox.json`) and the live link commands are all written in `docs/LINK.md`. If you change these formats, change `docs/LINK.md` and the code on both sides (`pykaki/`, `showpy/`) in the same commit. When you add a new kind of line to the script, update the game side (`ui_kit/engine/script_edit.rpy`) and the pygaki side (`pykaki/src/inbox.ts`) together.

## Making the bundle

Packs the Ren'Py SDK + plugin template + launcher buttons + app into Windows zips. When you push a tag to the repository (`git tag v1.0 && git push origin v1.0`), GitHub Actions "배포 파일" (release files) packs them and uploads a Releases draft. On your own computer, make it like this.

```bash
python bundle/make_bundle.py --sdk RenPySDKFolder --app pykaki\app\out\win-unpacked --zip --tag v1.0
```

`bundle/out/` gets a bundle with Ren'Py and an add-on for people who already have the SDK. The plugins put in the template, and settings that differ only in the template (VHS overlay off at first), are set in `PLUGINS` and `TEMPLATE_SETTINGS` in `make_bundle.py`. If the bundle contains paths from the maker's computer, it stops. Details in `bundle/README.md`.

Keep development files (`showpy_live.json`, `showpy_inbox.json`, `pykaki_preview.json`, `pykaki_goto.json`, `ui_kit_backup/`, `*.flow.json`) out of releases and bundles.

## Working with AI

`CLAUDE.md` at the top of the repository and `showpy/docs/DEV_RULES.md` hold the rules an AI should follow. For a new feature, have it first tell you whether it can be done, a short plan and the expected time before starting, and when done, summarize what it changed and what it checked. Have it test in a test project.
