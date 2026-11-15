<!-- 원본: bundle/guide/parts/overview.md @ 0b9822cd07 -->
# At a glance: where docs and files are

What is where in the bundle you downloaded, in a game project you made, and in the repository. Look here when you wonder "can I delete this file?" or "where is my work saved?".

## Where your work is saved

| What | Where | Good to know |
| --- | --- | --- |
| Script (the source) | `ProjectName.flow.json` at the top of the project folder | Saved automatically on every change. **This is the source**, so always include it in backups. It is not included in the game's release build |
| Exported script | `game/script_flow.rpy` | The result made from the script. Exporting again overwrites it, so don't edit this file directly |
| Snapshots (version list) | inside the pygaki app on this computer | Kept automatically every 5 minutes when something changed, on export, and before importing (the latest 30 automatic snapshots). They don't move to other computers |
| Image positions | `game/ui_kit/stage_layout.rpy` | Positions saved with a line's [Move position]. Snapshots don't restore them |
| Values saved in the in-game editor | `*_layout.rpy` in each plugin folder (e.g. `ui_kit/title_menu_layout.rpy`, `screen_fx/screen_fx_layout.rpy`) | Take priority over the same value in the settings file (`*_config.rpy`). Set them aside and put them back when updating |
| Settings you edited | `*_config.rpy` in each plugin folder | Don't edit the engine files (`engine/`, `editor/`) |
| Originals before script edits, plugins before updates | `ui_kit_backup/` in the project folder | Kept before the in-game editor changes parentheses in the script, and before the launcher's [플러그인 올리기] (Update plugins) replaces files (`plugins/`). For development, so leave it out of releases |
| Files the game and app exchange | `game/showpy_inbox.json`, `game/showpy_live.json`, `game/pykaki_preview.json`, `game/pykaki_goto.json` | Link files that only appear during development. Don't put them in the game's release (they come back if deleted) |

When you build the game for release, leave out `*.flow.json`, `ui_kit_backup/` and the link files above. Each plugin's `README.md` is left out automatically when building.

## Inside the bundle you downloaded

| Where | What |
| --- | --- |
| `renpy.exe`, `launcher/`, `renpy/`, `lib/` … | the Ren'Py SDK as is (not in the add-on zip) |
| `launcher/game/pygaki_launcher.rpy` | the [pygaki로 편집] (Edit with pygaki), [pygaki 안내서] (pygaki guide) and [플러그인 올리기] (Update plugins) buttons on the launcher's first screen, and the "기본 (Vanilla)" / "Pygaki" choice when creating a project. It doesn't change Ren'Py's own files; it only adds this one file |
| `pygaki/template/` | the plugin template laid over new Pygaki projects |
| `pygaki/app/pygaki.exe` | the pygaki desktop app. Started on its own, it asks you to choose a project folder |
| `pygaki/pygaki_안내서.html`, `pygaki_guide_ja.html`, `pygaki_guide_en.html` | this guide (Korean, Japanese, English) |
| `pygaki/읽어주세요.txt` | short instructions (Korean) |
| `pygaki/LICENSE-pygaki.txt` | the pygaki license (MIT) |
| `pygaki_넣는법.txt` | (add-on only) how to add it to and remove it from the SDK folder (Korean) |

To remove the add-on, delete `launcher/game/pygaki_launcher.rpy` (and its `.rpyc`) and the `pygaki` folder.

## Inside a new game project

| Where | What |
| --- | --- |
| `ProjectName.flow.json` | the script (saved by the app) |
| `game/script.rpy` | Ren'Py's default script. You can leave it (starting the game goes to the first box of the script) |
| `game/script_flow.rpy` | the script exported by pygaki |
| `game/images/`, `game/movies/`, `game/audio/` | images, webm videos, sounds. They appear in the app's pickers. Name files with English letters, digits and `_` |
| `game/gui/cursor/`, `game/gui/ctc/` | cursor and click-to-continue images (samples included) |
| `game/ui_kit/` | the plugin for title, choices, dialogue, cursor, image placement and the in-game editor. Text effect and image transition files (`.glsl`) in `effects/` |
| `game/screen_fx/` | the screen shader plugin. `<name>_config.rpy` for each shader; names to hide from lists go in `shaders_off.txt` |
| `game/hotkeys/`, `game/splash/` | hotkeys, splash |
| `game/tl/None/common.rpym` | Korean for Ren'Py's common text (quit confirmation and so on) |

## Inside the repository (for people who want to change it)

| Where | What |
| --- | --- |
| `README.md` | about the repository |
| `pykaki/` | the pygaki screens (React + TypeScript). Code in `src/` |
| `pykaki/app/` | the desktop app (Electron). It uses the build of `pykaki/` as its screens |
| `pykaki/docs/GUIDE.md` | the app's [Help] (F1). Source of this guide's "Writing scripts with pygaki" chapter |
| `pykaki/docs/SPEC.md` | how pygaki is built (for people changing it) |
| `pykaki/public/effects/` | sample videos of text effects (used in this guide's "Effect samples" chapter) |
| `pykaki/i18n/` | the dictionary for the screen language button (`strings.tsv`) |
| `pykaki/licenses/` | licenses of fonts and libraries bundled in the app |
| `showpy/game/` | the four pygaki plugin folders (exactly as they go into a game's `game/`) |
| `showpy/docs/CUSTOM_GUIDE.md` | settings reference. Source of this guide's "Plugin customization guide" chapter |
| `showpy/docs/READ_ME_FIRST.md` | changes per version, install and removal, cautions |
| `showpy/docs/SPEC.md`, `DEV_RULES.md` | plugin structure and working rules (for people changing it) |
| `showpy/CHANGELOG.md` | what changed in each version |
| `showpy/game/*/README.md` | full description of each plugin's settings |
| `showpy/samples/`, `showpy/examples/` | sample cursor and click-to-continue images, sample pygaki scripts |
| `docs/LINK.md` | the formats the two programs agree on (script file, marks in the exported script, live link, effect files) |
| `bundle/` | making the bundle (`make_bundle.py`), launcher buttons (`launcher/`), this guide (`guide/`) |
| `.github/workflows/` | app checks and Windows build; pushing a tag makes a Releases draft |

The repository's documents are in Korean. The Japanese and English versions of this guide are in `bundle/guide/ja/` and `bundle/guide/en/`.

## What to read first

| I | Read |
| --- | --- |
| just downloaded it | this guide's "Getting started" → "Writing scripts with pygaki" |
| wrote the script and want to adjust the game screens | "Using it with pygaki" in the "Plugin customization guide" |
| want to change the look with settings files | "Find at a glance" in the "Plugin customization guide" → each plugin's `README.md` |
| want to choose effects | "Effect samples" |
| want to add effects or code | "Changing it yourself" → `showpy/docs/DEV_RULES.md`, `ui_kit/effects/README.md` |
| am moving from an older version | `showpy/docs/READ_ME_FIRST.md`, `showpy/CHANGELOG.md` |

## Versions so far

| Version | Plugins | Highlights |
| --- | --- | --- |
| v1.0 | 4.13 | first bundle: Ren'Py SDK + plugins + launcher [pygaki로 편집] + pygaki app |
| v1.1 | 4.22 | app renamed to pygaki, app [Script]·[GUI], two shader slots (1 + 2) and [Apply from here], lines that change shaders and per-line transitions, cursor and click-to-continue image folders, title and ESC menu decoration, splash editing |
| v1.2 | 4.23 | edit the splash on screen (drag, edit text in place, add pages), effects on a single image, tag box (bold, color, pause, speed), development files left out of the bundle |
| v1.3 | 5.0 | seven new screen shaders (glitch, jitter, halftone, hologram, night vision, etc.), eleven text effects, text boxes (speech bubble, rounded frame), the in-game editor's "UI text" tab, Korean common text |
| v1.4 | 5.1 | conditions and flags in scripts, copy, paste and duplicate boxes, handles on choice and condition branches (drag to reorder, delete), the effects folder and twelve image transitions, shader transitions (pixel sort, datamosh, TV static, etc.), nine more screen shaders (ripple, old film, fisheye, old camcorder, etc.), more text effects (speech bubble, karaoke, box behind, droplets, etc.), missing effects fall back to defaults instead of stopping, tag box (cards, sliders, sample tooltips), ruby, `{clear}`, speed as "characters per second", app [Effects]·[Shaders] galleries and hiding (hidden ones go to the bottom), pygaki as a desktop app only, this HTML guide |
| v1.5 | 5.2 | language button (Japanese, English), [Screen] tab and calling screens, voice card, find and replace, following flags, music and sound details, pause and shake lines, front/behind for shown images, choice questions, image name checks, [⇔ Beside game], shader block corruption, VHS worn tape |

Details for each version are in `showpy/CHANGELOG.md`.
