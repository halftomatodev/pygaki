<!-- 원본: showpy/docs/CUSTOM_GUIDE.md @ 0f9fb08b4a -->
# pygaki plugin customization guide

2026-11-25 · pygaki v1.9 (changes per version are in `READ_ME_FIRST.md` and `CHANGELOG.md`)

## How to read this document

This document is for people who installed the pygaki plugins 5.5 to look up **which value in which file changes what**. Full descriptions of setting names are in each folder's `README.md` (Korean); this document starts from "what you want to do". If you write your text in pygaki, start with "Using it with pygaki".

pygaki editor (the in-game editor, F9) follows the pygaki app's language (or your PC's language if it has never connected to the app). This document sometimes gives the Korean screen names next to tab and button names (e.g. "dialogue tab" = 대사 탭). Comments in the settings files are in Korean.

| Folder | What it does | Files you edit |
| --- | --- | --- |
| `ui_kit` | title menu, choices, cursor, click-to-continue indicator, dialogue sounds, text speed, quick menu, per-line dialogue style, name position, speed, text effects, image and video placement (automatic registration of videos in movies/, bg at the very back, position and transitions of show and hide lines; added in 2.8) + editor | `title_menu_config.rpy`, `choice_menu_config.rpy`, `custom_ui_config.rpy`, `quick_menu_config.rpy`, `say_style_config.rpy`, `stage_config.rpy` |
| `screen_fx` | full-screen effects. A **VHS overlay** (on/off, amount of distortion) stacked over a **base effect** (none, ASCII, retro terminal, Game Boy, seven like glitch from 5.0, shimmer from 5.5) (4.0), per-scene effect changes and the TV off/on transition, text exclusion (choosing dialogue, choices or menus to leave out of effects), title screen shimmer | one per effect: `screen_fx_config.rpy`, `vhs_crt_config.rpy`, `ascii_config.rpy`, `retro_term_config.rpy`, `gameboy_config.rpy`, `ripple_config.rpy`, `collage_config.rpy`, etc. |
| `hotkeys` | add and remove hotkeys, descriptions in the controls screen | `hotkeys_config.rpy` |
| `splash` | logo, warning and controls pages shown before the title (added in 2.3) | `splash_config.rpy` |

There are three rules.

1. **Edit only files whose names end in `_config.rpy`.** Don't edit the `engine/` and `editor/` folders or `hotkeys.rpy`.
2. Paths to images, sounds, videos and fonts are all **relative to the `game` folder**. (`"gui/cursor/cursor1.png"` = `game/gui/cursor/cursor1.png`)
3. After editing, press **Shift+R** while the game runs to reload and see it right away. When you're done, run Lint from the launcher.

In the editor (F9 in developer mode), **dialogue and choices are edited one line at a time**, and Ctrl+S **saves straight into that line's parentheses in the script (.rpy)**. The original before editing is kept in `ui_kit_backup/` in the project folder. Defaults for everything are changed in the settings files. Values saved in the other tabs (title menu, cursor/dialogue sound, screen effects) are created as `*_layout.rpy` in each plugin folder and take priority over the same values in the settings files. If editing a settings file changes nothing, check that file first.

## Find at a glance

Find what you want to change and edit the value in the file on the right. Items with an "Editor" entry can also be changed in the F9 editor.

| What to change | File | Value | Editor |
| --- | --- | --- | --- |
| Logo, warning and controls pages before the title | `splash/splash_config.rpy` | `splash.pages` | |
| Common font, color and timing of those pages | `splash/splash_config.rpy` | `splash.default` | |
| Viewing the controls again from the title | `ui_kit/title_menu_config.rpy` | an item's `"action": splash.ShowPage("controls")` | |
| Title menu item text and actions | `ui_kit/title_menu_config.rpy` | `"text"`, `"action"` in `tmenu.items` | |
| Title menu item position, rotation and size | `ui_kit/title_menu_config.rpy` | an item's `"x"`, `"y"`, `"rotate"`, `"skew"`, `"zoom"`, `"size"` | title menu tab |
| Font and color of the whole title menu | `ui_kit/title_menu_config.rpy` | `"font"`, `"color"`, `"hover_color"` in `tmenu.default` | title menu tab, 3 "all items" |
| How far and fast items are pushed aside when the selection moves | `ui_kit/title_menu_config.rpy` | `tmenu.push_before`, `push_after`, `move_time`, `move_warper` | |
| Title background video | `ui_kit/title_menu_config.rpy` | `tmenu.background_movie` | |
| Position and color of the game title on the title screen, version display | `ui_kit/title_menu_config.rpy` | `style main_menu_vbox`, `style main_menu_title`, `tmenu.show_version` | |
| Look of the game menu (save and load screens), the list on the left | `ui_kit/title_menu_config.rpy` | `tmenu.game_menu_side`, `tmenu.game_menu_content_x`, `tmenu.game_menu`, `style navigation_button_text` | |
| ESC menu during play (title menu look) | `ui_kit/title_menu_config.rpy` | `tmenu.pause` (on), `tmenu.pause_dim` (dim the screen behind), `tmenu.pause_background`, `tmenu.pause_items` (3.1) | title menu tab with the ESC menu open → Ctrl+S |
| Position, font and color of one choice | the script (`script.rpy`, etc.) | parentheses after the choice `(x=…, y=…, font=…, color=…)` | choice tab → Ctrl+S (straight into the script) |
| Font, size, color and background of all choices | `ui_kit/choice_menu_config.rpy` | `cmenu.default` | |
| Position of vertical list choices | `ui_kit/choice_menu_config.rpy` | `cmenu.list_pos` | |
| How choices appear | `ui_kit/choice_menu_config.rpy` | `cmenu.appear`, `appear_time`, `appear_stagger` | |
| Mouse cursor | `ui_kit/custom_ui_config.rpy` | `custom_ui.cursor`, `cursor_frames`, `cursor_hold` (every 1/2 frames), `cursor_mode`, `cursor_hotspot` (3.0) | cursor/dialogue sound tab (12 slots) |
| Click-to-continue indicator (ctc) | `ui_kit/custom_ui_config.rpy` | `custom_ui.ctc`, `ctc_frames`, `ctc_hold` (every 1/2 frames), `ctc_position` (3.0) | cursor/dialogue sound tab (12 slots) |
| Sound while dialogue appears | `ui_kit/custom_ui_config.rpy` | `custom_ui.typing_sound`, `typing_volume` | cursor/dialogue sound tab |
| Default text speed | `ui_kit/custom_ui_config.rpy` | `custom_ui.text_cps` | cursor/dialogue sound tab |
| Show the quick menu from the start | `ui_kit/custom_ui_config.rpy` | `custom_ui.quick_menu` | cursor/dialogue sound tab |
| Quick menu item position, hiding, image/video behind | `ui_kit/quick_menu_config.rpy` | `qmenu.enabled`, `qmenu.bar_background`, `qmenu.item_background`, `qmenu.items` (v2.0-beta1) | quick menu tab → Ctrl+S |
| Position, size and color of one dialogue line | the script | parentheses after the line `(x=…, y=…, size=…, color=…)` | dialogue tab → Ctrl+S (straight into the script) |
| Name position, size and color of one dialogue line | the script | parentheses after the line `(name_x=…, name_y=…, name_size=…, name_color=…)` | dialogue tab, Tab to "name" → Ctrl+S |
| A picture or video behind the dialogue text (picture/video box) | the script | parentheses after the line `(box="media", media="images/say/cloud.png")` (5.4) | dialogue tab [Edit: Image] to move, scale and rotate → Ctrl+S |
| A picture or video behind a choice (normal, hover, picked) | the script | parentheses after the choice `(idle_media=…, hover_media=…, select_media=…)` (5.4) | choice tab [Edit: Image behind] → Ctrl+S |
| Tie the text to the picture, warp the four corners, an effect on appearing | the script | `media_link=True`, `media_quad=(…8 numbers)`, `media_text_quad=(…8 numbers)`, `media_fx="vibrate"` (5.4) | [Link text], drag the corner points → Ctrl+S |
| Speed and text effect of one dialogue line | the script | parentheses after the line `(cps=20, effect="jitter")` (`cps` is characters per second), or a ratio `(speed=0.5)` | dialogue tab, speed and effect buttons → Ctrl+S |
| Position and enter/exit transitions of images and videos (show / hide / scene lines) | the script | `show eileen at stage.pos(420, 720) with dissolve`, `hide eileen with moveoutright` | image/video tab → Ctrl+S (straight into the script) |
| Change the image of a show / scene line to another file, add new show / scene lines | the script | `scene fx_bg` → `scene room`, `show hand` below (3.0) | image/video tab "choose image/video" → Ctrl+S |
| Using videos by name only, transparent videos | the `game/movies/` folder + `ui_kit/stage_config.rpy` | `movies/rain.webm` → `show rain`, `movies/mask_ghost.webm` → `show ghost` (transparent), `stage.movie_once` | |
| Always keep bg images at the very back | `ui_kit/stage_config.rpy` | `stage.bg_tag`, `stage.bg_zorder` | |
| Add tags treated as backgrounds (at the back + fixed position in the editor) | `ui_kit/stage_config.rpy` | `stage.bg_tag = [ "bg", "fx_bg" ]` (3.0) | |
| See / turn off screen effects while editing | `screen_fx/screen_fx_config.rpy` | `screen_fx.editor_preview = True` / `False` (3.0) | V key while editing |
| When the editor panel covers the screen | (keys) | drag the title, X to fold, hold Space to hide, B to move aside automatically, P to change corner | |
| When the bottom of the editor panel is cut off | (mouse) | wheel over the panel, or drag the pink scrollbar on the right (2.9) | |
| Change the screen effect from this line (until cancelled) | the script | parentheses after the line `(fx="ascii")`, cancel `(fx="default")`, transition `(fx_transition="fade")` | the "screen effect" row in the dialogue tab, or "this effect from this line" in the screen effects tab → Ctrl+S (straight into the script) |
| Change the screen effect from a non-dialogue line (scene, show, with, $ lines) | the script | right above that line `$ screen_fx.use("ascii", overlay=False, transition="fade")`, `$ screen_fx.clear()`, `$ screen_fx.set_overlay(True)`, `$ screen_fx.set_warp(3)` (4.1) | "insert into line" in the screen effects tab, or "this effect from this line" → Ctrl+S (straight into the script) |
| Turn the VHS overlay on/off and set its curvature from this line | the script | parentheses after the line `(fx_overlay=False)`, `(fx_overlay=True)`, `(fx_warp=3.0)`, `(fx_warp="default")` (4.0) | the "overlay (VHS)" and "overlay curvature" rows in the dialogue tab → Ctrl+S |
| Whether the mouse cursor receives screen effects (per section) | `screen_fx/screen_fx_config.rpy` + the script | `screen_fx.cursor = "effect"` / `"overlay"` / `"top"`, `$ screen_fx.set_cursor("top")`, dialogue parentheses `(fx_cursor="overlay")` (4.2) | the "cursor" row in the dialogue tab, the "cursor" row in insert into line → Ctrl+S |
| Exclude text from this line | the script | parentheses after the line `(fx="gameboy", fx_exclude=("say",))` | the "text exclusion" row in the dialogue tab → Ctrl+S |
| Default dialogue position and font of a character | `ui_kit/say_style_config.rpy` | `define t = Character(what_xpos=…, what_font=…)` | |
| Change or cancel screen effects in a scene | the script | `$ screen_fx.use("ascii")`, `$ screen_fx.use("ascii", overlay=False)`, `$ screen_fx.clear()` | |
| The usual screen effect (base effect) | `screen_fx/screen_fx_config.rpy` | `screen_fx.base` (`"none"`, `"ascii"`, `"retro_term"`, `"gameboy"`) | screen effects tab → base effect, transition |
| Transition when changing effects (TV off/on / dissolve / instant) | `screen_fx/screen_fx_config.rpy` | `screen_fx.transition`, `screen_fx.tv`, `screen_fx.fade_time` | screen effects tab → base effect, transition, "preview" |
| ASCII cell size, ratio, crispness, character list, colors | `screen_fx/ascii_config.rpy` | `"cell"`, `"aspect"`, `"crisp"`, `"chars"`, `"color_mode"` in `ascii.settings`, `ascii.presets` | screen effects tab → ASCII |
| ASCII font | `screen_fx/ascii_config.rpy` | `ascii.font` (`None` = the included NeoDunggeunmo) | |
| Turn the VHS overlay on/off (on by default) | `screen_fx/screen_fx_config.rpy` | `screen_fx.overlay` (`True` / `False`) | screen effects tab → base effect, transition "overlay (VHS)" |
| Whether each effect turns on the overlay (off by default for retro terminal) | each effect's settings file | `ascii.overlay`, `retro_term.overlay`, `gameboy.overlay` (`True` / `False`) | screen effects tab → effect button → "overlay (VHS)" |
| Amount of overlay distortion (curvature, shift, color bleed) | `screen_fx/vhs_crt_config.rpy` | `warp_amount`, `distort_intensity`, `aberration` in `vhs_crt.settings`. During play `$ screen_fx.set_warp(3.0)`, `$ vhs_crt.set(…)` | screen effects tab → VHS overlay sliders, "overlay curvature" in the dialogue tab |
| Leave dialogue, choices and menus out of effects (text exclusion) | each effect's settings file | `vhs_crt.exclude`, `ascii.exclude`, `retro_term.exclude`, `gameboy.exclude` (choose from `"say"`, `"choice"`, `"screens"`) | screen effects tab → effect button → "text exclusion" |
| Retro terminal colors (phosphor, background), curved CRT, built-in VHS | `screen_fx/retro_term_config.rpy` | `"phosphor"`, `"background"`, `"crt"`, `"vhs"` in `retro_term.settings`, `retro_term.presets` | screen effects tab → retro terminal |
| Game Boy dithering/pixelation, dot size, four colors, LCD feel | `screen_fx/gameboy_config.rpy` | `"mode"`, `"pixel_size"`, `"color1"`–`"color4"`, `"grid"`, `"shadow"` in `gameboy.settings`, `gameboy.presets` | screen effects tab → Game Boy |
| Scene effects on images added to a screen too | that screen | `add "map.png" at screen_fx.scene` | |
| Strength of the title shimmer (a shader since 5.5) | `screen_fx/ripple_config.rpy` | `"amount"`, `"scale"`, `"speed"`, `"shine"` in `ripple.settings`, `ripple.presets`. Whether the title gets it: `screen_fx.title_shaders` in `screen_fx_config.rpy` | GUI → title shader, shader defaults |
| Hide effects and shaders from pickers (5.1) | `ui_kit/effects/effects_off.txt`, `screen_fx/shaders_off.txt` | one name per line (text after `#` is a note). Scripts already using them keep working | [Hide] in the app's [Effects] and [Shaders] (hidden ones gather at the bottom with [Hidden to bottom]) |
| Add or remove text effects and image transitions (5.1) | the `ui_kit/effects/` folder | one `.glsl` file per effect. See "Effects folder" below | the app's [Effects] |
| VHS overlay strength and scope | `screen_fx/vhs_crt_config.rpy` | `vhs_crt.settings`, `vhs_crt.scope` | screen effects tab → VHS overlay |
| VHS presets (sets to switch during play) | `screen_fx/vhs_crt_config.rpy` | `vhs_crt.presets` | screen effects tab → VHS overlay, choose a preset in "editing target" |
| Add and remove hotkeys | `hotkeys/hotkeys_config.rpy` | `hotkeys.bindings`, `hotkeys.unbind` | |
| Descriptions in the controls screen | `hotkeys/hotkeys_config.rpy` | `hotkeys.keyboard_help` | |
| Turn off a whole feature | top of each settings file | `tmenu.enabled`, `cmenu.enabled`, `custom_ui.enabled`, `say_style.enabled`, `watermorph.enabled`, `vhs_crt.enabled`, `ascii.enabled`, `retro_term.enabled`, `gameboy.enabled`, `splash.enabled` | |

## Using it with pygaki

pygaki is an editor for writing scripts with boxes and lines. It ships as the desktop app in the pygaki bundle and opens when you select a project in the Ren'Py launcher and press **[Edit with pygaki]** (the web version was removed in 5.1). Using the two programs together, you set **the text in pygaki and the screens in Ren'Py**. You don't need to know Ren'Py code. How to use the app is in its [Help] (F1; this guide's "Writing scripts with pygaki" chapter).

| I want to | Where |
|---|---|
| Write dialogue, choices and the story flow | pygaki [Script] |
| Set dialogue text size, font, color, speed and text effects | the text effect card of a dialogue line in pygaki. The preview above the card shows it right away |
| Set screen shaders, transitions, dialogue sounds, cursor and click-to-continue per box or scene | the **◐ Shader** of a box or label in pygaki |
| Add images, webm videos, music and sound effects | the box's background / image·video / sound·music cards in pygaki (also written into the script when added in the pygaki editor) |
| Position dialogue, choices and images | the line's **[Move position]** → drag on the game screen → [Save]. Coordinates are written into pygaki |
| Change the look of the whole game, like the title menu and cursor | pygaki [GUI] (the same as the pygaki editor) |
| Browse effects and shaders, hide them from lists | pygaki [Effects], [Shaders] (add and remove effects in the `ui_kit/effects/` folder) |

### One-time setup

1. Start the launcher with `renpy.exe` in the pygaki bundle and create a project with **Pygaki** in **[+ Create New Project]**. The pygaki plugins and sample cursor and click-to-continue images are included from the start. (For an existing project, put the plugin folders into `game`)
2. Select the project and press **[Edit with pygaki]**.

That's all. The app opens that project's script (`ProjectName.flow.json`), saves on every change, and exports to `game/script_flow.rpy`. Run it in Ren'Py and it starts from pygaki's first box.

You can leave `script.rpy` as it is. The exported file contains the lines below, so starting the game goes to the first box and `label start:` in `script.rpy` isn't run.

```renpy
init python:
    config.label_overrides["start"] = "prologue"
```

The first label of a new pygaki script is named `prologue`. If you rename it or move the start box, export follows that.

Good to know:
- Using `e` as a character id clashes with `define e` in `script.rpy`. Lint warns and which name is used isn't guaranteed, so use another id or delete `script.rpy`.
- If you make a label named `start` in your script yourself, it clashes with `label start:` in `script.rpy` and Ren'Py raises an error. Only in that case, delete `label start:` from that file.

### Everyday workflow

```
① Write in pygaki [Script] (exports by itself when you pause; Ctrl+E exports right away)
② Start the game with [▶ Run in Ren'Py] at the top right (developer mode)
   → from now on, the game reloads the changed script by itself on every export
③ Move the game to a box with [Go here in Ren'Py] in the box card
④ Add images by clicking them in the box's image/video card, line them up with the line's [Move position] by dragging on the game screen, then [Save]
⑤ Adjust the title, cursor and default dialogue box look in [GUI] while watching the game screen
```

### Adding images, videos and sounds

The [Choose image/video/sound] window shows files in `game/images`, `game/movies` and `game/audio`.

| Chosen | Button | Line put in the script |
|---|---|---|
| `images/bg hall.png` | scene | `scene bg hall` |
| `images/mina scared.png` | show | `show mina scared` |
| `images/ghost.png` | show | `show ghost` |
| `movies/rain.webm` | show | `show rain` |
| `movies/mask_ghost.webm` | show | `show ghost` (transparent video) |
| `audio/hum.wav` | music | `play music "audio/hum.wav"` |
| `audio/knock.wav` | sound | `play sound "audio/knock.wav"` |

- Images whose names start with `bg ` are backgrounds.
- If the first word of the name matches a character id, it's that character's expression. Register the character `mina` in pygaki.
- Name files with English letters, digits and `_`. That way nothing breaks anywhere.

In pygaki, click the same files in the box's background / image·video / sound·music cards. While writing a character's line, the top of the image·video card shows that character's images (expressions).

### Scope of saved positions

Choose with the **save position** buttons in the image/video tab.

| Button | Meaning | Written to `ui_kit/stage_layout.rpy` |
|---|---|---|
| This box only | this position only in the current pygaki box | `("n4", "ghost"): "stage.pos(420, 720)"` |
| Everywhere | this image is at this position in every box | `"ghost": "stage.pos(900, 720)"` |

Positions don't go to pygaki; they're saved only in this file, so exporting again from pygaki doesn't erase them. To show the same image in two places in the same box, write it in a pygaki "direct command" line.

```renpy
show ghost at stage.pos(420, 720)
```

### What the Ren'Py editor doesn't save

Scripts made by pygaki are overwritten on the next export, so in the dialogue tab only positions and shader/cursor lines are saved and written into the script; the choice tab and screen effects' "insert into line" aren't saved and tell you why. **Edit text, text styling, speed and text effects in pygaki.** Values used across the game, like the title menu and cursor (`*_layout.rpy`), image line transitions and image swaps are saved as usual.

### Undoing

Restore from pygaki's **[Version list]** and press **Ctrl+E**, and Ren'Py follows.

- Snapshots are kept automatically every 5 minutes when something changed, on export, and before importing. Only the latest 30 automatic snapshots are kept.
- The script's source is the `.flow.json` in the project folder, saved on every change. Snapshots (version list) live only inside the app on this computer, so back up the project folder.
- Snapshots don't restore image positions.

### When something goes wrong

| Symptom | Cause and fix |
|---|---|
| `The label start is defined twice` | Your script has a label named `start` and another `.rpy` also has `label start:`. Rename the script's label or delete `label start:` from that file |
| `ValueError: unsupported format character` | Caused by `%` in dialogue. Turn on **% as literal text** in pygaki's settings. It's on in new projects |
| Images added in Ren'Py don't appear in pygaki | Press **[Reload]** in pygaki's project folder menu at the top, or press Ctrl+E |
| Images added in Ren'Py disappeared | They remain in `showpy_inbox.json`; press [Reload] in pygaki and then Ctrl+E to bring them back |
| "This line has no mark" | Turn on the pygaki plugin link in the script editor and export again |
| Character id errors | `stage`, `ascii`, `t`, `n1` and so on are names the pygaki plugins use. Use a different id |

## Replacing assets

Put a file anywhere under the `game` folder and write its path in the values below. The default release settings use the "default path" in the table, so if you overwrite with the same name you don't need to change any settings.

| Asset | Default path | Format and conditions | Value to change |
| --- | --- | --- | --- |
| Font | any name in `game/fonts/` |.ttf /.otf /.ttc, a font that has the characters of your language. Match the file name's case exactly to the code (Mac, Android and web are case-sensitive) | title: `tmenu.default["font"]` · choices: `cmenu.default["font"]` · dialogue: `Character(what_font=…)` · whole game: `gui.text_font` in `gui.rpy`, etc. |
| Cursor frames | `gui/cursor/cursor1.png` – `cursor6.png` | PNG, the editor has 12 slots (played in order). E.g. 64×64 | `custom_ui.cursor_frames`, `cursor_hold` (every 1/2 frames, 24fps), `cursor_hotspot` (click hotspot) |
| Click-to-continue frames | `gui/ctc/ctc1.png` – `ctc6.png` | PNG, the editor has 12 slots | `custom_ui.ctc_frames`, `ctc_hold` (every 1/2 frames, 24fps) |
| Dialogue sound | none (`None`) |.ogg recommended. A short sound repeats while text appears | `custom_ui.typing_sound` · per character: `Character(cb_typing_sound=…)` |
| Choice hover video | none (`None`) | WebM (VP9); for transparency, side_mask format (file width = display width × 2) | `cmenu.default["hover_movie"]`, `hover_movie_size`, `hover_movie_zoom` · one choice only: parentheses `hover_movie=…` |
| Title menu hover video | none | WebM (VP9), side_mask. Laid behind the text | an item's `"hover_movie"`, `"hover_movie_pos"`, `"hover_movie_size"` |
| Video instead of title menu text | none | WebM (VP9), side_mask | an item's `"hover_label_movie"` |
| Title background video | none | WebM (VP9). If not transparent, used as is; match the frame rate with other videos playing alongside | `tmenu.background_movie`, `tmenu.background_side_mask` |
| Title background image | `gui/main_menu.png` | PNG at the game's resolution | overwrite the file (or `gui.main_menu_background` in `gui.rpy`) |
| Translucent panel behind menus | `gui/overlay/main_menu.png` | PNG. Make it fully transparent and the panel disappears | overwrite the file, or `tmenu.main_menu_frame = False` |
| Choice button backgrounds | `gui/button/choice_idle_background.png`, `choice_hover_background.png` | PNG (9-slice borders `gui.choice_button_borders`) | overwrite the files, or `cmenu.default["button_background"]`, `["button_hover_background"]` |
| Sound effects (menu move and select) | none |.ogg | `tmenu.hover_sound`, `activate_sound` · `cmenu.hover_sound`, `activate_sound` |
| Name background | `gui/namebox.png` | PNG (9-slice borders `gui.namebox_borders`). Follows along when moved with `name_x`, `name_y` in dialogue parentheses | overwrite the file |
| Splash background video or image | none (recommended: `movies/`, `gui/splash/`) | WebM (VP9) or PNG at the game's resolution. Videos play fitted to the screen | the page's `"background"`. Advance when the video ends: `"duration": "movie"` |
| Splash logo video or image | none | transparent videos in side_mask format (if not transparent, `"image_side_mask": False`) | the page's `"image"`, `"image_pos"`, `"image_zoom"` |
| Splash sound effect or music | none |.ogg. To carry music on to the title, use the same file as `config.main_menu_music` | the page's `"sound"`, `"music"` |
| TV off/on sounds | none (`None`) |.ogg. Once when it starts turning off and once when it starts turning on. Follows the sound effect volume | `"off_sound"`, `"on_sound"`, `"volume"` in `screen_fx.tv` |

Making transparent videos (side_mask): export a ProRes 4444 `.mov` with a transparent background from After Effects or similar, then convert it with ffmpeg. The command is in "Preparing videos" in `ui_kit/README.md`.

## Screens before the title — `splash/splash_config.rpy`

Write the pages shown before the title when the game starts, in order, in `splash.pages`. Values not written on a page follow `splash.default`, and text styling is written as a prefix (`title_`, `body_`, `key_`, `desc_`, `prompt_`, `option_`) + a Ren'Py text style property.

**If you're new to code**, look at the table below first. Every line in the settings file is made of these forms.

| Form | Meaning |
| --- | --- |
| `# …` | everything after it is a note (comment) the game doesn't read. In settings files `##` is a note, and if there's code after `#` like `# "…": …`, it's code turned off. To turn it on, delete only the leading `# ` (VS Code: select lines → Ctrl+/) |
| `define splash.name = value` | sets one setting. `splash.` means it's this plugin's setting |
| `"text"` | inside quotes is text (a string). File paths, color codes, names, etc. |
| `_("text")` | a sentence shown on screen. It marks it so it can be translated later; it looks the same without it |
| `2.0`, `1.5` | numbers. Times in seconds, positions and sizes in pixels |
| `True` / `False` | on / off (first letter capitalized) |
| `None` | "none" or "not set" |
| `"#d23c3c"` | a color code (two digits each for red, green and blue after `#`). Add two more digits like `"#ffffffaa"` for opacity |
| `(640, 200)` | two numbers = (width, height) or (x, y) |
| `{ "name": value, … }` | a group pairing names with values. One page has this form |
| `[ value, value, … ]` | an ordered list. The pages, the rows of the controls table |
| `,` (comma) | always between values. Fine after the last value too. If you leave one out, the game won't start and shows an error screen |
| `\n` | a line break inside text |

File paths are relative to the `game` folder. `"movies/logo.webm"` = `project/game/movies/logo.webm`. Write the case exactly as in the file name.

### The three default pages (choices for each value, with explanations)

This is exactly what's in `splash_config.rpy` (the comments are translated here; the real file is in Korean, and on-screen text `_("…")` is shown in Korean as in the file). Lines without a leading `#` are values currently on; lines with `#` are off because they need image, video or sound files — add the file and delete just the `#` to turn them on. The values of `splash.default`, shared by all pages, are explained the same way in chapter 2 of the settings file.

```py
define splash.pages = [

    ## ── Default 1. Logo ───────────────────────────────────────────────────
    ## Currently a text-only logo. To use an image or video, turn on the # lines below.
    {
        "id": "logo",

        ## Background ─ write one of four. If none, only the "color" color shows.
        ##   "background": "#202020",               fill with a color
        ##   "background": "gui/splash/bg.png",     an image (make it at the game's resolution)
        ##   "background": "black",                 a Ren'Py image name (made with an image statement)
        ##   "background": "movies/bg.webm",        a video. Stretched to the screen and looped by default
        # "background": "movies/logo.webm",

        ## Whether to loop the background video (only when the background is a video)
        ##   "background_loop": True,               restart when it ends (default)
        ##   "background_loop": False,              play once and disappear when it ends (then the color shows)
        ##   If "duration" is "movie", it plays only once without writing this.
        # "background_loop": False,

        ## Whether the background video is a transparent video (side_mask format) (usually not written)
        ##   "background_side_mask": False,         a normal video (default)
        ##   "background_side_mask": True,          a video made of color on the left half + alpha on the right half
        # "background_side_mask": False,

        ## Center image or video (logo) ─ placed above the title.
        ##   "image": "gui/splash/logo.png",        a PNG image with a transparent background
        ##   "image": "movies/logo_alpha.webm",     a transparent video (side_mask format; how to make it: ui_kit/README.md "Preparing videos")
        # "image": "gui/splash/logo.png",

        ## Place the image anywhere apart from the title (if not written, right above the title)
        ##   "image_pos": (640, 200),               the image's center at 640 across, 200 down
        # "image_pos": (640, 200),

        ## Image scale
        ##   "image_zoom": 1.0,                     original size (default)
        ##   "image_zoom": 0.5,                     half
        ##   "image_zoom": 2.0,                     double
        # "image_zoom": 1.0,

        ## Display size of a video in the logo position (videos only; if not written, the video's own size)
        ##   "image_size": (400, 200),              400 by 200 pixels
        # "image_size": (400, 200),

        ## Whether the video in the logo position is a transparent video (side_mask format)
        ##   "image_side_mask": True,               a transparent video (default)
        ##   "image_side_mask": False,              a normal video (shown as a rectangle)
        # "image_side_mask": True,

        ## Whether to loop the video in the logo position
        ##   "image_loop": True,                    loop (default)
        ##   "image_loop": False,                   once only
        # "image_loop": True,

        ## Title ─ wrap text shown on screen in _().
        "title": _("만든 사람 이름"),
        "title_size": 56,                          # a bigger title on this page only (the rest use 44 from splash.default)

        ## When to advance ─ show for 2 seconds and move on by itself. For a video logo, change it to "movie" to advance when the video ends
        "duration": 2.0,
        "fade_in": 0.6,
        "fade_out": 0.6,

        ## Sound effect ─ played once when the page appears (.ogg recommended)
        ##   "sound": "audio/logo.ogg",
        # "sound": "audio/logo.ogg",

        ## Music ─ looped on the music channel.
        ##   Write the same file on the next page and it continues without a break.
        ##   If it's the same file as config.main_menu_music in options.rpy, it continues into the title.
        ##   Otherwise it fades out after the last page (chapter 4 splash.music_fadeout)
        # "music": "audio/title.ogg",
    },

    ## ── Default 2. Warning ────────────────────────────────────────────────
    {
        "id": "warning",

        ## To lay a looping video behind the warning text
        # "background": "movies/noise_loop.webm",
        # "background_loop": True,

        "title": _("경고"),
        "title_color": "#d23c3c",                  # a red title on this page only

        ## Body ─ \n is a line break. Long lines also wrap automatically at the "width".
        "body": _("이 게임에는 공포 연출과 갑작스러운 소리, 깜빡이는 화면이 포함되어 있습니다.\n빛에 민감하신 분은 플레이에 주의해 주세요."),

        ## To change the alignment of body lines
        ##   "body_text_align": 0.5,                centered (default)
        ##   "body_text_align": 0.0,                left-aligned
        # "body_text_align": 0.0,

        ## A blinking prompt below once it can be skipped. If not written, no prompt
        "prompt": _("클릭하면 계속합니다"),

        "duration": None,                          # wait for a click
        "min_time": 1.5,                           # for 1.5 seconds after it has fully appeared, clicks don't advance (so it gets read)
        "skippable": True,

        ## "Don't show next time" checkbox ─ appears at the bottom right.
        ##   If the player checks it and moves on, this page is skipped from the next launch.
        ##   Delete this line if you don't need it.
        "dont_show_again": _("다음부터 보지 않기"),

        ## Whether to show only the first time
        ##   "once": False,                         every time the game starts (default)
        ##   "once": True,                          only once, on the first launch
        "once": False,

        ## Show condition ─ shown only when the condition in quotes is true.
        ##   "show_if": None,                       always (default)
        ##   "show_if": "not persistent.cleared",   not shown after persistent.cleared becomes True
        ##                                          (when the script's ending does $ persistent.cleared = True)
        "show_if": None,
    },

    ## ── Default 3. Controls ───────────────────────────────────────────────
    {
        "id": "controls",

        "title": _("조작 방법"),

        ## Controls table ─ one (key, description) pair is one row.
        ##   To add rows, copy a ( _("key"), _("description")), line, paste it and change only the text.
        ##   If the key is a single English letter, you can write it without _(), like "H".
        ## Instead of this, write "keys": "auto", and
        ##   it shows the same list as the controls screen of the game menu.
        ##   (with the hotkeys plugin, hotkeys.keyboard_help in hotkeys_config.rpy; otherwise Ren'Py's default descriptions)
        "keys": [
            (_("클릭 / 엔터 / 스페이스"), _("대사 넘기기, 선택하기")),
            (_("마우스 휠 위 / Page Up"), _("이전 대사 다시 보기")),
            (_("오른쪽 클릭 / Esc"), _("메뉴 열기 (저장, 불러오기, 환경설정)")),
            (_("Ctrl (누르고 있기)"), _("대사 빨리 넘기기")),
            ("H", _("대사창 숨기기")),
        ],

        ## Table look (explained in chapter 2, splash.default)
        "key_width": 300,
        "key_color": "#ffffff",
        "desc_color": "#bbbbbb",

        "prompt": _("클릭하면 타이틀로 넘어갑니다"),

        ## Only once, on the first launch. To let players see it again from the title, splash.ShowPage in chapter 5
        "once": True,

        ## If many rows overlap the prompt below, lower yalign (0.45 → 0.35)
        "xalign": 0.5,
        "yalign": 0.45,
        "width": 960,
    },
]
```

### Examples by situation

Copy one as is and paste it into the `splash.pages` list at the position you want. The same examples are also at the end of chapter 3 of the settings file, turned off with `#`, so you can just delete the `#` there. Every example was run and checked. (On-screen text is left as the Korean examples; rewrite it in your language)

**A. Advance automatically when the logo video ends**

- File needed: `game/movies/logo.webm` (game resolution, WebM VP9)

```py
{
    "id": "ex_movie_logo",
    "background": "movies/logo.webm",       # plays full screen
    "duration": "movie",                    # next page when the video ends (looping turns off by itself)
    "fade_in": 0.3,
    "fade_out": 0.5,
},
```

**B. Image logo + background color, automatically after 2 seconds**

- File needed: `game/gui/splash/logo.png` (PNG with a transparent background)

```py
{
    "id": "ex_png_logo",
    "color": "#101018",                     # a very dark navy background
    "image": "gui/splash/logo.png",
    "image_zoom": 1.0,
    "duration": 2.0,
    "sound": "audio/logo.ogg",              # sound effect when it appears (if you have no file, delete just this line)
},
```

**C. A transparent logo video over a background color, advancing when the video ends**

- File needed: `game/movies/logo_alpha.webm` (side_mask format: color on the left half, alpha on the right half)

```py
{
    "id": "ex_alpha_logo",
    "color": "#203040",
    "image": "movies/logo_alpha.webm",
    "image_side_mask": True,                # True because it's a transparent video (the default, so it can be omitted)
    "image_size": (400, 200),               # display size
    "title": _("스튜디오 이름"),             # text below the logo too
    "duration": "movie",                    # advance when the logo video ends
},
```

**D. Warning text over a looping video, read for at least 3 seconds**

- File needed: `game/movies/noise_loop.webm` (a short looping video)

```py
{
    "id": "ex_warning_movie",
    "background": "movies/noise_loop.webm",
    "background_loop": True,                # keeps looping until a click
    "title": _("주의"),
    "title_color": "#ff5050",
    "body": _("이 이야기는 허구이며\n실제 인물이나 단체와 관계가 없습니다."),
    "prompt": _("클릭하면 계속합니다"),
    "duration": None,
    "min_time": 3.0,                        # for 3 seconds after it has fully appeared, clicks don't advance
},
```

**E. Controls shown only the first time (the same list as the controls screen)**

- Files needed: none

```py
{
    "id": "ex_controls_auto",
    "title": _("조작 방법"),
    "keys": "auto",                         # the same list as the hotkeys settings (or Ren'Py's default)
    "key_size": 20,                         # a bit smaller because there are many rows
    "desc_size": 20,
    "keys_spacing": 8,
    "yalign": 0.35,                         # a little higher so it doesn't overlap the prompt below
    "prompt": _("클릭하면 타이틀로 넘어갑니다"),
    "once": True,
},
```

**F. A page that stops showing after the ending has been seen**

- Files needed: none
- Put this line in the ending part of your script: `$ persistent.cleared = True`

```py
{
    "id": "ex_before_ending",
    "body": _("이 게임은 헤드폰을 권장합니다."),
    "show_if": "not persistent.cleared",    # shown only until the ending is seen
    "duration": 2.5,
},
```

**G. A page that can't be skipped by clicking (shown for a set time)**

- Files needed: none

```py
{
    "id": "ex_no_skip",
    "body": _("……"),
    "body_size": 40,
    "skippable": False,                     # clicks don't advance
    "duration": 3.0,                        # so always set a time (Lint tells you if you don't)
    "fade_in": 1.5,
    "fade_out": 1.5,
},
```

**H. Music without a break from the splash through the title**

- File needed: `game/audio/title.ogg`
- In options.rpy, use the same file for the title music: `define config.main_menu_music = "audio/title.ogg"`
- Move this block to be the first page, and put the same `"music"` line on the pages after it, and it keeps playing.

```py
{
    "id": "ex_music",
    "title": _("만든 사람 이름"),
    "music": "audio/title.ogg",             # starts here and continues into the title
    "duration": 2.0,
},
```

**I. Styling text (font, outline, letter spacing, bold)**

- File needed: `game/fonts/MyFont.ttf` (a font with the characters of your language; change the name to match your file)

```py
{
    "id": "ex_text_style",
    "color": "#e8e0d0",                     # a light paper-colored background
    "title": _("제 1 장"),
    "title_font": "fonts/MyFont.ttf",
    "title_size": 64,
    "title_color": "#222222",
    "title_kerning": 8,                     # wider spacing between letters
    "title_outlines": [ (2, "#ffffff", 0, 0), (2, "#00000055", 4, 4) ],   # white outline + faint shadow
    "body": _("그날 밤, 학교에는 아무도 없었다."),
    "body_color": "#444444",
    "body_bold": True,
    "duration": 3.0,
},
```

**J. Text at the top left, body left-aligned**

- Files needed: none

```py
{
    "id": "ex_left_top",
    "xalign": 0.08,                         # the block to the left
    "yalign": 0.15,                         # toward the top
    "width": 700,
    "title": _("기록 #001"),
    "title_xalign": 0.0,                    # the title left within the block too
    "body": _("2026년 10월 23일\n오후 11시 47분\n녹화 시작"),
    "body_xalign": 0.0,
    "body_text_align": 0.0,                 # lines left-aligned too
    "prompt": _("클릭하면 재생합니다"),
    "prompt_xalign": 0.08,                  # the prompt to the bottom left too
},
```

### Values at a glance

| I want to | Value to write on the page |
| --- | --- |
| Background | `"background"`: a color `"#202020"`, an image `"gui/splash/bg.png"`, a video `"movies/bg.webm"` (looped). The color underneath is `"color"` |
| Logo in the center | `"image"` (an image or a side_mask video); to place it separately `"image_pos": (640, 200)`, size `"image_zoom"` |
| Text | `"title"`, `"body"` (line breaks with `\n`), controls table `"keys": [ (key, description), … ]` or `"auto"` (the same list as the controls screen), `"hotkeys"` (follows the edit shortcuts table; functions to show in `"keys_show": [ "screenshot", … ]`) |
| When to advance | `"duration"`: seconds / `None` (until a click) / `"movie"` (until the video ends) |
| Avoid skipping by accident | `"min_time"` (clicks ignored for this long after fully appearing); to prevent skipping, `"skippable": False` together with `"duration"` |
| Fade in and out times | `"fade_in"`, `"fade_out"` (a black screen between pages) |
| Only the first time | `"once": True` |
| Let players turn it off | `"dont_show_again": _("다음부터 보지 않기")` (checkbox at the bottom right) |
| Conditionally | `"show_if": "not persistent.cleared"` |
| Sound | `"sound"` (once), `"music"` (looped; continues if it's the same file as the title music) |
| Position of the text block | `"xalign"`, `"yalign"`, maximum width `"width"`, spacing `"spacing"` |
| Text styling | `"title_font"`, `"title_size"`, `"body_color"`, `"body_text_align"`, `"prompt_yalign"` … |

| Global setting | Meaning |
| --- | --- |
| `splash.enabled` | off goes straight to the title |
| `splash.movie_wait` | if a video doesn't start within this many seconds, go to the next page (default 5.0) |
| `splash.developer_skip` | if `True`, skipped in developer mode (always shown in releases) |
| `splash.start_delay`, `splash.gap` | black screen (seconds) before the first page and between pages |
| `splash.end_transition` | transition as the title appears after the last page (default `Dissolve(0.6)`) |
| `splash.min_time_once` | `min_time` only on the first viewing |
| `splash.music_fadeout` | fade-out time when the splash music differs from the title music |

- Viewing again from the title menu: an item's `"action": splash.ShowPage("controls")`. A button that clears the viewed record and "don't show" is `splash.Reset()`.
- If your script already has `label splashscreen:`, put `call splash_play` inside it.
- The splash shows only when the game is first started and **doesn't show again with Shift+R.** Restart the game, or use `splash.preview()` in the console (Shift+O).
- Setting errors (missing files, file name case, wrong names) are reported by Lint in lines starting with `splash:`.

## Title menu — `ui_kit/title_menu_config.rpy`

Write menu items one by one in the `tmenu.items` list; values not written follow `tmenu.default`. Putting `hover_` before a name makes it the "selected" value.

```py
define tmenu.default = {
    "font": "fonts/NeoDGMpro.ttf",
    "size": 35,
    "color": "#fff6f6",
    "hover_color": "#ffffff",
}

define tmenu.items = [
    {
        "id": "start",                 # the name used for editor saves (don't change it)
        "text": _("시작한다"),
        "action": Start(),
        "x": 639, "y": 375,           # integer = pixels, decimal = fraction of the screen
        "rotate": -5,
        "hover_text": "START",         # replace the text when selected
        "hover_movie": "movies/menu_start.webm",
    },
]
```

| I want to | Value |
| --- | --- |
| Add, remove or reorder items | add, remove or move `{ … },` blocks in `tmenu.items`. List order = keyboard navigation order |
| What happens on click | `"action"`: `Start()`, `ShowMenu("load")`, `ShowMenu("preferences")`, `ShowMenu("about")`, `Quit(confirm=False)`, `Jump("label")` |
| Show conditionally | `"show_if": "persistent.cleared"` |
| Position and anchor | `"x"`, `"y"` (or `"xalign"`, `"yalign"`), `"anchor"` (the center of the text by default) |
| Shape | `"rotate"` (degrees), `"skew"` (degrees), `"zoom"`, `"alpha"` · when selected: `"hover_rotate"`, `"hover_zoom"`, `"hover_offset": (20, 0)` |
| Text style | any Ren'Py text style property: `"font"`, `"size"`, `"color"`, `"outlines"`, `"kerning"`, `"bold"` … (`hover_` for selected) |
| Outlines | `"outlines": [ (4, "#000000", 0, 0), (2, "#e0245e", 6, 6) ]` (thickness, color, x, y) |
| How much other items get pushed when one is selected | `tmenu.push_before`, `tmenu.push_after` (direction and pixels), `tmenu.push_falloff`, per item `"push": False` / `"push_scale"` |
| Movement speed | `tmenu.move_time` (seconds), `tmenu.move_warper` (`"ease"`, `"easeout_back"` …), `tmenu.fade_time` |
| Intro animation | `tmenu.intro` (on), `intro_delay`, `intro_time`, `intro_offset` |
| Initially selected item | `tmenu.start_index` (`None` selects nothing) |
| Enlarge the click area | `tmenu.hit_padding` or an item's `"hit_padding"` |
| Game title position and color | `style main_menu_vbox:` `xalign` / `yalign`, `style main_menu_title:` `color` |
| Hide the version number | `tmenu.show_version = False` |
| Remove the translucent panel behind the menu | `tmenu.main_menu_frame = False` |
| Hide the left list in preferences opened from the title | `tmenu.title_game_menu_navigation = False` |
| Return the game menu screens to the old look (Ren'Py default) | `tmenu.game_menu_side = False` |
| Where game menu content starts | `tmenu.game_menu_content_x = 400` (None: the menu's right edge + `tmenu.game_menu_gap`) |
| Vertical line between menu and content | `tmenu.game_menu_line = "#ffffff33"` |
| Change the game menu's left list (when `game_menu_side = False`) | `tmenu.game_menu = [ (_("대사록"), ShowMenu("history"), "not main_menu"), … ]` |
| Game menu button text | `style navigation_button_text:` `size`, `color`, `hover_color`, `hover_strikethrough` |

If there's a typo, an error screen tells you which name of which item is wrong when the title screen appears.

### ESC menu during play (3.1)

Pressing ESC or right-clicking during play dims the game screen and shows a menu that looks like the title menu. It shares the title menu's font, size, color, selected look (`tmenu.default`), intro animation and sounds; only the items and positions are separate.

| I want to | Value (`title_menu_config.rpy`) |
| --- | --- |
| Turn it off (Ren'Py default: ESC → save screen) | `define tmenu.pause = False` |
| How much to dim the screen behind | `define tmenu.pause_dim = "#000000b3"` (last two digits = strength: `66` light, `ff` pitch black, `None` no dimming) |
| An image instead of dimming | `define tmenu.pause_background = "gui/game_menu.png"` |
| Change items | `define tmenu.pause_items = [ { "id": "return", "text": _("계속하기"), "action": Return(), "xalign": 0.08, "yalign": 0.35 }, … ]` |
| Item positions | with the ESC menu open, F9 → drag in the "title menu" tab and Ctrl+S (saved to `tmenu.pause_layout`) |

The default items are return (`Return()`), save (`ShowMenu("save")`), load (`ShowMenu("load")`), preferences (`ShowMenu("preferences")`), history (`ShowMenu("history")`), about (`ShowMenu("about")`), help (`ShowMenu("help")`, PC only), main menu (`MainMenu()`) and quit (`Quit()`). "Return" inside the save screen goes back to the game, like Ren'Py's default.

## Choices — script parentheses + `ui_kit/choice_menu_config.rpy`

To change just one choice, write in the parentheses after the choice in the **script**; to change all choices, write in `cmenu.default` in the **settings file**. If the parentheses contain even one of `x` or `y`, that choice leaves the vertical list and is placed at that position.

```py
menu:
    "꺼져, 듣고 싶지 않으니까!" (x=300, y=350, font="fonts/ChosunGu.TTF", size=25, color="#aa0000", hover_color="#ff4444", rotate=-4):
        jump angry
    "그냥 세로 목록에 나오는 선택지":
        jump normal

## values common to the whole menu (choice parentheses take priority)
menu (font="fonts/KBLJump_c.ttf", size=28, appear="slide"):
    "첫 번째":
        pass
```

| I want to | Parentheses (one choice) | Settings file (all choices) |
| --- | --- | --- |
| Position | `x=300, y=350` (or `xalign`, `yalign`), `anchor=(0.0, 0.5)` | vertical list position: `define cmenu.list_pos = (640, 270)` |
| Font, size, color | `font=`, `size=`, `color=`, `hover_color=` | `"font"`, `"size"`, `"color"`, `"hover_color"` in `cmenu.default` |
| Letter spacing, line spacing, outlines | `kerning=2`, `line_spacing=-10`, `outlines=[…]` | the same names in `cmenu.default` |
| Wrap width | `width=400` (`None`: no wrapping) | `"width"` |
| Rotation, tilt, scale | `rotate=`, `skew=`, `zoom=`, on hover `hover_rotate=`, `hover_zoom=`, `hover_offset=(8, 0)` | the same names |
| Intro animation | `appear="pop"` / `"fade"` / `"slide"` / `None`, `delay=0.5` | `cmenu.appear`, `appear_time`, `appear_stagger`, `appear_offset` |
| Picture or video behind the text (5.4) | `idle_media=`, `hover_media=`, `select_media=`, `select_time=0.8`. See "Picture/video box" below | |
| Video behind on hover | `hover_movie="movies/red.webm"` (`None`: off) | `"hover_movie"`, `"hover_movie_size"`, `"hover_movie_zoom"`, `"hover_movie_offset"` |
| Button background, padding, width | `button_background=…`, `button_padding=(30, 8)`, `button_xsize=500` | `"button_background"`, `"button_hover_background"`, `"button_padding"`, `"button_xsize"` |
| Color of choices that can't be picked | `insensitive_color="#555"` | `"insensitive_color"` |
| Sound effects | `hover_sound=`, `activate_sound=` | `cmenu.hover_sound`, `cmenu.activate_sound` |
| Hover response speed | | `cmenu.hover_time`, `cmenu.hover_warper` |
| Vertical list spacing | | `style choice_vbox:` `spacing 30` |

Choices with positions don't avoid each other, so place them so they don't overlap.

## Cursor, click-to-continue, dialogue sound, text speed, quick menu — `ui_kit/custom_ui_config.rpy`

In the default release settings everything is off, so it's the same as Ren'Py's default. Set only the features you want to `True` and write the paths.

| I want to | Value | Notes |
| --- | --- | --- |
| Turn on the cursor animation | `custom_ui.cursor = True` | |
| Change cursor images | `custom_ui.cursor_frames = [ "gui/cursor/cursor1.png", … ]` | played in order. The editor has 12 slots |
| Cursor speed | `custom_ui.cursor_hold = 2` | fixed at 24 frames per second (3.0). `1` holds each image 1 frame (24 per second), `2` holds 2 frames (12 per second) |
| Cursor mode | `custom_ui.cursor_mode = "software"` | `"software"` drawn by Ren'Py (accurate 24fps, default) / `"hardware"` the OS cursor (fastest response, up to 20fps) |
| Whether the cursor receives screen effects (ASCII, VHS, etc.) | `screen_fx.cursor = "effect"` (screen_fx_config.rpy) | `"effect"` including effects (default) / `"overlay"` under the overlay / `"top"` no effects. Software cursor only. See "Cursor position" below |
| Cursor click hotspot | `custom_ui.cursor_hotspot = (0, 0)` | x, y pixels from the image's top left. If the arrow tip is in the center, use that coordinate |
| Turn on the click-to-continue indicator | `custom_ui.ctc = True` | |
| Click-to-continue images and speed | `custom_ui.ctc_frames = [ … ]`, `custom_ui.ctc_hold = 2` | 24fps like the cursor, every `1` / `2` frames (3.0) |
| Click-to-continue position | `custom_ui.ctc_position = "nestled"` | `"nestled"` right after the text, `"fixed"` at the position set in the say screen |
| A different indicator for one character | `Character("name", ctc="other_image")` | that value takes priority |
| Turn on or change the dialogue sound | `custom_ui.typing_sound = "audio/type.ogg"` | `None` is off |
| Dialogue sound volume and looping | `custom_ui.typing_volume = 1.0`, `custom_ui.typing_loop = True` | also follows "sound volume" in preferences |
| A different sound per character, or off | `Character("name", cb_typing_sound="audio/beep.ogg")`, `cb_typing_sound=None` | narration: `define narrator = Character(None, cb_typing_sound=None)` |
| Default text speed | `custom_ui.text_cps = 20` | characters per second, 0 = all at once, `None` = the value in options.rpy |
| Hide the quick menu from the start | `custom_ui.quick_menu = False` | turn it on during play with `$ quick_menu = True` |

Text speed applies **only on the first launch and when you change this value**; after that, the value the player chose in preferences is kept.

```py
## custom_ui_config.rpy: cursor and click-to-continue (3.0, fixed at 24 frames per second)
define custom_ui.cursor = True
define custom_ui.cursor_frames = [
    "gui/cursor/cursor1.png", "gui/cursor/cursor2.png", "gui/cursor/cursor3.png",
    "gui/cursor/cursor4.png", "gui/cursor/cursor5.png", "gui/cursor/cursor6.png",
]
define custom_ui.cursor_hold = 2            # every 2 frames → 6 images loop every 0.5 s
define custom_ui.cursor_mode = "software"   # "hardware" is the old way (up to 20fps)
define custom_ui.cursor_hotspot = (0, 0)

define custom_ui.ctc = True
define custom_ui.ctc_frames = [ "gui/ctc/ctc1.png", "gui/ctc/ctc2.png", "gui/ctc/ctc3.png" ]
define custom_ui.ctc_hold = 1               # every frame → 3 images loop every 1/8 s
```

| Images | Every frame (`_hold = 1`) | Every 2 frames (`_hold = 2`) |
| --- | --- | --- |
| 6 | one loop in 0.25 s | one loop in 0.5 s |
| 12 | one loop in 0.5 s (two per second) | one loop in 1 s |

In the editor's "cursor/dialogue sound" tab, click the **12 slots** to choose images one by one (it moves to the next slot after a choice). "Add this whole folder" adds up to 12 images from the folder in name order, and "clear this slot" removes one. Empty slots are skipped.

## Decorating the quick menu — `ui_kit/quick_menu_config.rpy` (pygaki v2.0-beta1)

Move, hide, or put an image, video or color behind each item of the quick menu at the bottom of the screen during play (Back, History, Skip, Auto, Save, Q.Save, Q.Load, Prefs). Right after you add it, it looks the same as Ren'Py's default. Items you don't move stay in one row at the bottom center.

| What you want | Value | Notes |
| --- | --- | --- |
| Turn the feature off | `qmenu.enabled = False` | The quick menu from that game's `screens.rpy` shows as it is. Turn it off for games whose `screens.rpy` quick menu you edited by hand |
| Background behind the whole bar | `qmenu.bar_background = "gui/quick_bar.png"` | An image, a video (webm) or a color (`"#00000088"`). Drawn behind the items left in the bottom row |
| Bar padding | `qmenu.bar_padding = (20, 6)` | Between the bar background and the items in it (horizontal, vertical pixels) |
| Background behind every item | `qmenu.item_background = "#30306088"` | Stretched to the button size |
| Item position, hiding, background | `qmenu.items = [ { "id": "back", "text": _("되감기"), "action": Rollback(), "x": 80, "y": 680 }, … ]` | `"x"`, `"y"` item center (pixels), `"hidden": True` hide, `"background"` this item's background, `"show_if"` condition to show |

The labels are the ones written in that game's `screens.rpy` quick menu. Font, size and color come from `gui.quick_button_text_*` in `gui.rpy`, as in Ren'Py's default. To change the labels, use the editor's "UI text" tab ("Confirm dialog, UI text" in the app's [GUI edit]).

The editor's **Quick menu** tab (while the quick menu is shown during play): drag items to move them, Delete to hide/show, G to put an item back in the row, and pick images or videos in [This item's background], [All items' background] and [Bar background]. Hidden items show faintly only while editing. Ctrl+S saves to `ui_kit/quick_menu_layout.rpy`.

The touch-screen (phone) quick menu is not changed.

## Dialogue style — script parentheses + `ui_kit/say_style_config.rpy`

To change just one dialogue line, write short names in the parentheses after the line; change a character's default look in the character definition in the settings file.

```py
## script: this one line only
t "글쎄, 난 봤다니까요." (x=520, y=300, size=30, color="#aa0000")
e "어디 갔었어?" (name_x=820, name_y=-60, name_size=34, speed=0.5, effect="jitter")

## say_style_config.rpy: character defaults
define t = Character(None,
    window_yalign=0.0, window_ysize=720,     # dialogue window covers the whole screen
    what_font=gui.text_font,                  # default font
    what_size=22,                             # default size
    what_xpos=400, what_ypos=157)             # default position

define n2 = Character(kind=t, what_xpos=400, what_ypos=210)   # a position preset
```

| Short name in parentheses | Same value in a character definition | Meaning |
| --- | --- | --- |
| `x`, `y`, `pos` | `what_xpos`, `what_ypos`, `what_pos` | position (from the dialogue window's top left; for `t` the window is the whole screen, so from the screen) |
| `font` | `what_font` | font |
| `size` | `what_size` | text size |
| `color` | `what_color` | text color |
| `outline` | `what_outlines` | outlines `[(thickness, color, x, y)]` |
| `spacing` | `what_line_spacing` | line spacing |
| `bold`, `italic` | `what_bold`, `what_italic` | bold, italic |
| `kerning` | `what_kerning` | letter spacing |
| `width` | `what_xmaximum` | maximum line width |
| `align` | `what_text_align` | line alignment 0.0 – 1.0 |
| `speed` | `what_slow_cps_multiplier` | speed multiplier (multiplied by the player's text speed; 0.5 = half) |
| `effect` | `what_textshader` | text effect: `"dissolve"` dissolve, `"typewriter"` typewriter, `"slowalpha"` blurred wait, `"flip"` flip, `"zoom"` grow, `"jitter"` jitter, `"wave"` wave. pygaki plugin effects: `"scatter"` scatter and gather, `"drop"` fall, `"shuffle"` random order, `"flash"` color flash, `"slam"` big stamp in, `"typecursor"` cursor typewriter, `"echo"` color trail, `"glitch"` glitch, `"blurin"` blur to sharp, `"blockglitch"` block glitch, `"liquid"` shimmer, `"vhs"` VHS static, `"rise"` float up, `"lean"` tilt in, `"stretch"` stretch in, `"slidein"` slide and stop, `"shake"` slight shake, `"glyphbox"` box per character, `"stamp"` stamp, `"squash"` squash and bounce, `"extrude"` 3D text. Effects folder (`ui_kit/effects/`): `"maskup"` rise from below, `"tracking"` letter spacing closing in, `"sweep"` light sweep, `"backbox"` box behind, `"karaoke"` karaoke, `"meltglitch"` melting glitch, `"droplets"` droplets, `"spring"` spring into place, `"marquee"` scroll sideways, `"bubble"` speech bubble, `"scramble"` decode. Scripts that still use a deleted effect name don't stop; text appears one character at a time. Stack two effects with `effect="slidein|shake"` |
| `name_x`, `name_y` | `namebox_xpos`, `namebox_ypos` | name box position (from the dialogue window's top left; moves together with the name background) |
| `name_font`, `name_size`, `name_color` | `who_font`, `who_size`, `who_color` | name font, size, color |

**Text boxes**: write `box` in the parentheses and a box surrounds the dialogue text. Default shapes are in `say_style.box_styles` in the settings file.

```py
e "안녕!" (box="bubble")                                    # white speech bubble, black line, tail down, pops in
e "어디?" (box="bubble", tail="top")                         # tail: "bottom" "top" "left" "right" None, or (x, y)
e "빨간 말풍선." (box="bubble", bubble_color="#ffeeee", bubble_border=(5, "#aa0000"))
e "쾅!" (box="pill", box_rotate=-4)                          # rounded frame, box and text tilted 4°
e "속까지." (box="pill", pill_fill="#ffd23b", pill_line=None, color="#000000")
```

| Name | Meaning |
| --- | --- |
| `box` | `"bubble"` speech bubble, `"pill"` rounded frame |
| `tail` | tail direction, or the tail tip `(x, y)` (pixels from the text's top left) |
| `box_rotate` | tilt of box and text (degrees) |
| `bubble_color` / `pill_fill` | fill color (`pill_fill=None` leaves it empty) |
| `bubble_border` / `pill_line` | line `(thickness, color)`, `None` for none |
| `bubble_radius`, `bubble_padding`, `bubble_tail_pos`, `bubble_tail_size`, `bubble_tail_width`, `bubble_pop`, `bubble_text_color` | corners, space between text and box, tail position, length and width, pop-in, text color (same for `pill_…`) |

- The box fits the size of the whole text and appears at full size even before all the text has appeared. When the whole line moves (position, screen shake), the box moves too; per-character effects like `shake` move only the characters.
- The tail doesn't find the speaker by itself. Set a direction or `(x, y)`.
- You can also choose it in the "box" field of the editor's dialogue tab and in [Box] of pygaki's text effect field.

**Picture/video box** (5.4, –4.18): write `box="media"` to lay a picture or video behind the dialogue text. It is centered on the text, and the default dialogue window and name box backgrounds become transparent so only the picture shows. Use it for a cloud-shaped thought bubble, a bursting sound-effect word, text on a note paper picture and so on.

```py
e "It was a dream." (box="media", media="images/say/cloud.png")                    # stretched to the text size + padding
e "Boom!" (box="media", media="movies/boom.webm", media_fit="image", media_zoom=0.6)  # the picture's own size (0.6x)
e "Tilted." (box="media", media="images/say/cloud.png", media_offset=(20, -10), media_angle=8)
e "Shake!" (box="media", media="images/say/boom.png", media_link=True, media_fx="vibrate")   # the text shakes in with it
```

| Name | Meaning |
| --- | --- |
| `media` | picture or video file (relative to the game folder). `.webm` `.ogv` `.mp4` `.mkv` are videos |
| `media_fit` | `"text"` stretch to the text size + padding (default), `"image"` keep the picture's own size |
| `media_zoom`, `media_offset`, `media_angle` | scale, move (x, y pixels), rotate only the picture (degrees; to rotate the text too, use `box_rotate` or `media_link`) |
| `media_padding`, `media_alpha` | space between the text and the picture's edge, opacity (0.0–1.0) |
| `media_mask`, `media_loop` | transparent video mode, loop playback (default `True`). A video whose name starts with `mask_` is a transparent video automatically |
| `media_pop` | pop in (`True`, `False`, or seconds) |
| `media_link` | tie the text to the picture. With `True` (or the `(scale, rotation, x, y)` at the time of tying) the text also takes later changes in scale, rotation and offset. The speaker name of the line is drawn in front of the picture too and moves with it |
| `media_quad`, `media_text_quad` | move the four corners of the picture or the text separately to warp it (8 numbers: how far the top-left, top-right, bottom-right and bottom-left corners move across and down, as a ratio of the size) |
| `media_fx`, `media_fx_time`, `media_fx_values` | a picture effect from the effects folder when the text box appears (e.g. `"vibrate"`, `"springin"`), its seconds, detail values `{"amount": 20}`. If tied, the text too. Ren'Py's built-in transitions (`dissolve` etc.) can't be used |

- **Choices** use the same box. Write `idle_media` (normal), `hover_media` (on mouse hover; the normal picture if missing) and `select_media` (shown for `select_time` seconds when picked, then it moves on; default 0.5). `media_fit` `media_zoom` `media_offset` `media_angle` `media_link` `media_quad` `media_fx` mean the same. A choice with a picture drops the default button background and shrinks to the text size + `media_padding` (`media_button=True` keeps the button).
- **Editing in the game**: in the editor (F9), use [Edit: Image] on the dialogue tab or [Edit: Image behind] on the choice tab. Drag the picture to move it, the wheel or A/D to scale, Q/E to rotate. Turn on [Link text] and the text follows; drag the corner points (pink for the picture, sky blue for the text) for a four-corner warp, and undo with [Reset corners] and [Reset image]. Ctrl+S writes it on that script line, and for pygaki scripts the script editor takes it in.
- **Transparent videos**: Ren'Py (up to 8.6.1) can't play a webm with alpha as is. Turn transparent webm, animated GIF/WebP/PNG, PNG sequences and green-screen videos into `movies/mask_name.webm` (color on the left, alpha on the right) with [🎞 Make transparent video] in the pygaki app.
- In the pygaki script editor, pick them in [Picture/video] under [Text box] on a dialogue line, and with [🖼] on a choice line. If the game's plugin is older, the script editor's check tab tells you.

- If you need a new short name, add it to `say_style.alias` in the settings file, like `"alpha": "what_alpha",`.
- Ordinary characters have the dialogue window at the bottom of the screen, so moving the name above the window makes `name_y` negative. The editor panel also shows the screen-based position.
- If the text speed is "instant" (the default for new Ren'Py projects), effects like `speed` and dissolve aren't visible. Wave and jitter are. Set `custom_ui.text_cps` or lower the speed in preferences.
- To change only some characters within a line, use text tags: `"That's a {color=#a00}lie{/color}"`. To put a text effect on only some characters, write `"text before {shader=shake}shaking text{/shader} text after"` (effect names and values are the same as `effect`. If the line has no effect, the remaining characters appear one at a time. The color trail `echo` works only on whole lines).
- If your script already defines `n1`–`n3` or `t`, delete the definitions in the settings file. Otherwise the same names are defined twice.

## Editing with the editor (F9)

With the game running from the launcher (developer mode), press **F9** to open the editor (pygaki editor). While it's open, each press of F9 changes the panel Compact → Full → Hidden; Esc closes it. It doesn't open in releases. While the editor is open, clicks and keys don't go to the game.

The editor's text language (한국어, 日本語, English) follows the pygaki app's language (pygaki v1.9). When the app connects it sends its language, and the game remembers the last one it received (`persistent`). If it has never connected to the app, it follows your PC's language (Japanese, English, otherwise Korean). The game screen's text (dialogue, menus, the text you're editing) and saved values don't change. Translations live in `ui_kit/editor/editor_lang.tsv` (Korean, Japanese, English per line); text missing from it shows in Korean.

| Tab | Where it opens | What you can change | Ctrl+S saves to |
| --- | --- | --- | --- |
| Title menu | title screen, the ESC menu during play (3.1) | item position, rotation, tilt, scale, text size, font, color, selected values. Opened with the ESC menu open, it edits the ESC menu | `ui_kit/title_menu_layout.rpy` (`tmenu.layout`; the ESC menu `tmenu.pause_layout`) |
| Choice | while choices are shown | position, shape, font and color of one choice, hover values, position, scale, rotation and four-corner warp of the back picture with [Edit: Image behind] (5.4) | **that choice's line in the script** |
| Dialogue | while dialogue is shown | position, text size, font and color of one line, name position, size, font and color, speed and text effects, **screen effects to turn on from this line, cancel, transitions, overlay, cursor position**, position, scale, rotation, tie to text and four-corner warp of the picture/video box with [Edit: Image] (5.4) | **that dialogue line in the script** |
| Quick menu | while the quick menu is shown during play | drag items to move, hide (Delete), back to the row (G), image/video behind this item, all items or the bar (v2.0-beta1) | `ui_kit/quick_menu_layout.rpy` (`qmenu.layout`, `qmenu.screen_layout`) |
| Cursor/dialogue sound | anywhere | text speed, dialogue sound and volume, click-to-continue and cursor (on, **choose images for 12 slots**, every 1/2 frames, cursor mode), quick menu | `ui_kit/custom_ui_layout.rpy` |
| Title shimmer | title screen (when `screen_fx` is present) | on, targets, strength, wave size, speed, swirl, glints, quality | `screen_fx/watermorph_layout.rpy` |
| Screen effects | anywhere (when `screen_fx` is present) | choose VHS overlay / ASCII / retro terminal / Game Boy / base effect, transitions with the buttons at the top. Per effect: on, overlay on/off, value sliders, presets, **"this effect from this line"**, **"this effect from this script line"**. Base effect, overlay on/off, TV timing, flash, sound volume and preview. (These pages edit setting values, so saving doesn't change the effect of the current scene) | `screen_fx/<effect name>_layout.rpy`, `screen_fx_layout.rpy` |
| Screen effects → insert into line (4.1) | during play | choose one script line (needn't be dialogue) and pick the screen effect, overlay, overlay curvature and transition | a line like `$ screen_fx.use(…)` **right above that line in the script** |

Just go in order.

1. Go to the screen you want to change and press F9. The tab for that screen opens. (T switches tabs)
2. Drag items with the mouse and rotate with the wheel (Shift+wheel for text size; roll the wheel outside the panel, since over the panel it scrolls the panel). Keyboard: arrow keys move, Q/E rotate, Z/C tilt, A/D scale, S/W text size, Tab next item.
3. Press 2 to edit the "selected (hover)" values, 1 for normal values. H previews the selected look.
4. In the title menu tab, 3 switches "this item only" ↔ "all items". In the dialogue tab, Tab switches "dialogue" ↔ "name", and pressing the speed or effect buttons replays the line (R replays too).
5. Choose fonts and colors with the panel's buttons. The font list shows every font file in the `game` folder; colors are chosen with sliders, color codes or frequent colors.
6. **Save with Ctrl+S**, close with Esc. If you made a mistake, Backspace (undoes only the current selection).

In a game whose screen is scaled up several times in the window, like the retro resolutions, the editor (panel, picker windows, name tags, handles) is drawn at the real screen size so it stays readable at small resolutions. While the editor is open it uses the whole window: the game screen stays at its own size (a whole-number scale with pixel perfect) in the middle of the window, and panels and pickers can use the empty space outside it (for example, a 640x400 game in an 800x800 window gives the editor the whole 800x800). When the window is larger than the game screen, a thin red border is drawn around the game screen to show where it ends. Turn the border on/off with **F8** (remembered by the game) or in the pygaki app's preferences. Closing the editor returns to the normal screen (black bands around it).

Lists with many choices, such as text effects, shaders (slots 1 and 2), image effects, and image transitions, show only the current value and **[Choose in the pygaki app]** on the game-window panel. Pressing it opens that section in the app's [GUI Edit] when the app is connected, or starts the pygaki app from the Ren'Py SDK otherwise. The shortcut help on the game-window panel starts folded; press **F1** to show it. All shortcuts are listed in the pygaki app's preferences under [Shortcuts].

For choices and dialogue, **Ctrl+S saves straight into that line's parentheses in the script (.rpy)**, and the game reloads and returns to the same scene. Values that were already written and things after the line like `with dissolve` are left as they are; only changed values are edited. The original before editing is kept in `ui_kit_backup/` in the project folder.

For lines that can't be edited automatically, like dialogue spanning several lines, or when the script was changed in another editor during editing so the line no longer matches, it leaves the script alone and tells you why. Then **copy with Ctrl+C and paste it into that line's parentheses.** If the script is open in VS Code or similar with unsaved changes, save those first before saving with the editor.

To move values saved in `*_layout.rpy` into the settings file, copy the settings code with Ctrl+C, paste it, and delete the `*_layout.rpy`. Cursor settings and turning the click-to-continue indicator on or off apply after saving, once the game reloads automatically.

## Image and video placement — script + `ui_kit/stage_config.rpy` (2.8)

**Automatic video registration**: `.webm` files put in the `game/movies/` folder (including subfolders) can be used right away by file name. Images are registered automatically from `images/` by Ren'Py itself.

| File | In the script | How it's read |
| --- | --- | --- |
| `movies/rain.webm` | `show rain`, `scene rain` | a normal video |
| `movies/mask_ghost.webm` | `show ghost` | a transparent video (side_mask: color on the left half, alpha on the right half). Drop the `mask_` prefix |
| `movies/bg rain.webm` | `scene bg rain` | a normal video. A bg tag, so always at the very back |

**bg is always at the back**: images and videos with the `bg` tag are always drawn behind other images, even if you write `zorder`.

```py
## stage_config.rpy
define stage.enabled = True            # False turns off video registration, fixed bg, and the image/video tab
define stage.movies_dir = "movies"     # video folder (relative to game)
define stage.mask_prefix = "mask_"     # videos starting with this = transparent videos
define stage.movie_once = [ ]          # names of videos to play only once. E.g. [ "door_open" ]
define stage.bg_tag = [ "bg" ]         # background tags: always drawn at the back, not moved in the editor
# define stage.bg_tag = [ "bg", "fx_bg" ]   # fx_bg as a background too (3.0)

## script (the same as what the editor writes; you can write it yourself)
show eileen happy at stage.pos(420, 720)          # the image's bottom center at screen (420, 720)
show eileen with stage.move("inleft", 0.8)        # enter from the left, 0.8 s
hide eileen with stage.ease("outright", 1.2)      # exit smoothly to the right, 1.2 s
show ghost with Dissolve(1.0)                     # dissolve over 1 s
```

**The editor's "image/video" tab** (F9 → T during play): choose one show, hide or scene line in the script and edit it.

| What to change | How |
| --- | --- |
| The line to choose | click an image or video on screen, Tab, `[` `]`, the line list, or type a line number |
| Position | drag the image, arrow keys, position buttons (default, left, center, right, true center, off screen). **Backgrounds (bg) are fixed** (3.0): if the script has a position, only "back to default position" appears |
| Transition | none, dissolve, fade to black, pixellate, move, ease, wipe, slide, push, zoom, shake + direction + time |
| Swap image, new lines (3.0) | "choose image/video" → choose a file from `game/images` or `game/movies`, then [swap this line's image] or [add show below] / [add scene below] |
| Effects (4.0) | "Effect:" puts a screen effect like glitch or hologram on that one image only. In the script: `show ghost at truecenter, screen_fx.image_fx("hologram")` (when `screen_fx` is present; not for pygaki scripts) |
| Save | Ctrl+S → only the at and with parts of that line (and the name if you swapped the image) are written to the script; new lines go below that line (the original before editing in `ui_kit_backup/`) |

```renpy
## before saving           ## [room] → swap this line's image, [hand] → add show below → Ctrl+S
    scene fx_bg                scene room
                               show hand
```

- Image names are file names without the extension, in lowercase (Ren'Py's automatic registration). `images/Room.PNG` → `room`, `images/bg/bg hall.png` → `bg hall`. Names with characters like `-` can't be written in scripts, so they appear dimmed.
- Set the position and transition of a newly added line by choosing that line after saving.
- The top of the panel shows the current line like "script.rpy line 9", and the show, hide and scene lines in the same file are listed with their numbers. "Go to that line" is Ren'Py's line warp, so variable values from before it may be empty.
- `onlayer`, `as`, `zorder`, ATL blocks and comments are left alone. The image name changes only when you press "swap this line's image".

**When the panel covers the screen** (all tabs): drag the title (= UI editor) to move it, **X** folds it to one line, hold **Space** to hide it, **B** moves it aside automatically (to another corner if the selection is under the panel), **P** changes the corner, **L** folds the line list (image/video tab), **F1** folds the help. If the panel is taller than the screen, see the bottom with the **wheel** over the panel or the **scrollbar** on the right (2.9).

**Screen effects while editing** (all tabs): screen effects stay on while the editor is open, and the panel is drawn cleanly over them. Toggle with **V**. With warping effects (VHS, CRT, etc.), the visible position and the clicked position differ slightly near the edges, so turn them off briefly with V when dragging precisely. To start with them off, `define screen_fx.editor_preview = False`.

Details in chapters 4-6, 4-7 and 13 of `ui_kit/README.md`.

## Hotkeys — `hotkeys/hotkeys_config.rpy`

Write new hotkeys in `hotkeys.bindings`, keys to remove from Ren'Py's default hotkeys in `hotkeys.unbind`, and the controls screen descriptions in `hotkeys.keyboard_help`. In the default release settings all three are empty, so it's the same as Ren'Py's default.

```py
define hotkeys.bindings = [
    { "keys": [ "K_v" ], "action": ShowMenu("preferences") },   # V: preferences
    { "keys": [ "K_F5" ], "action": QuickSave() },               # F5: quick save
]

define hotkeys.unbind = {
    "self_voicing": [ "K_v" ],      # remove "self-voicing" from V, leaving only Alt+V
}

define hotkeys.keyboard_help = [
    (_("엔터(Enter)"), _("대사 진행 및 UI (선택지 포함) 선택.")),
    ("V", _("볼륨 설정 열기.")),
]
```

| Good to know | Details |
| --- | --- |
| Key names | `K_v` (V), `shift_K_s` (Shift+S), `ctrl_K_l` (Ctrl+L), `alt_K_v` (Alt+V), `K_F5`, `K_SPACE` |
| Default hotkey names often removed | `screenshot` (S), `toggle_fullscreen` (F), `hide_windows` (H), `self_voicing` (V), `accessibility` (Shift+A), `skip` (Ctrl), `toggle_skip` (Tab), `rollback` (Page Up) |
| When they overlap | if a new key overlaps a default hotkey, both run, so remove it from the default side with `unbind` |
| The help screen | if `keyboard_help` is `None`, Ren'Py's default descriptions. Keys removed with `unbind` are updated in that default list automatically (1.3: removing V turns the "V" line into "Alt+V", and a line with no keys left is dropped). If you wrote the list yourself, update the descriptions too |
| Overlap with the editor key | the pygaki editor uses F9. To change it, `define ui_kit.editor_key = "shift_K_e"` |
| Preset actions (1.1) | instead of `"action"`, a name like `"do": "quick_save"`. Writing `"help": _("Quick save")` puts it in the controls screen list (if a line with the same key exists, its description is replaced). The list of names is in `hotkeys/README.md` |

**Changing them in the editor** (with `ui_kit`): the "Edit shortcuts" tab (단축키 수정) of the F9 editor (right after the splash tab; also next to the controls guide in the splash tab's page buttons, and under "Controls guide" in the pygaki app's [GUI edit]) has a function name and a key button on each line. Press the key button, then press the new key in the game window (Esc cancels). [+] adds one more key; clicking a function name shows [Key buttons] (키 단추로), [Remove keys] (키 빼기), [First keys] (처음 키로) and a description cell. If another function uses the key, a warning and guidance appear, and it only changes when you press [Remove it there and change] (그쪽에서 빼고 바꾸기). Press [Export to the guide screen] (안내 화면으로 내보내기) and the splash controls guide table becomes `"keys": "hotkeys"` and follows this table; pick which functions to show by clicking them in the controls guide list of the splash tab (`"keys_show"`). Changed keys also go into the ESC controls screen list automatically. Changes apply right away while you edit; saving writes `"keys"` (keys per function) and `"desc"` (descriptions) in `hotkeys/hotkeys_layout.rpy`, which are added to the settings file's values.

## Changing screen effects — `screen_fx/screen_fx_config.rpy`

The screen is drawn by **stacking two shaders** (4.0).

```
[game screen] → base effect (none / ASCII / retro terminal / Game Boy) → overlay (VHS, on / off) → the visible screen
```

Normally it's **no base effect + VHS overlay on** (= VHS over the whole screen). Change to another effect anywhere in the script and that effect stays **until cancelled (`clear`)**, with a **TV off-and-on transition** when it changes. The current effect, overlay and overlay curvature are saved with saves and rollback. Starting a new game or returning to the title goes back to the settings.

| Base effect name | Meaning | Settings file |
| --- | --- | --- |
| `"none"` | no effect (the base effect of the release settings; the overlay follows the settings) | |
| `"ascii"` | redraws the screen as characters. One character = one pixel (by default only the scene; dialogue stays readable) | `ascii_config.rpy` |
| `"retro_term"` | retro terminal: a single-color phosphor monitor with its own curved CRT and VHS. **The overlay is off by default while it's used** | `retro_term_config.rpy` |
| `"gameboy"` | Game Boy: big dots and a 4-color LCD screen, dithering / pixelation | `gameboy_config.rpy` |
| `"glitch"` | glitch (5.1): now and then the screen randomly tears, blocks shift and colors split | `glitch_config.rpy` |
| `"boil"` | jitter (5.1): outlines tremble jerkily like hand-drawn animation | `boil_config.rpy` |
| `"halftone"` | halftone (5.1): a printed dot pattern, one color / four colors | `halftone_config.rpy` |
| `"hologram"` | hologram (5.1): one color, flowing scanlines, blurred copies. On one person: `show name at screen_fx.image_fx("hologram")` | `hologram_config.rpy` |
| `"nightvision"` | night vision (5.1): green night-vision goggles, on-screen text and recording time | `nightvision_config.rpy` |
| `"collage"` | photo collage (5.3): the same scene photographed many times and pasted overlapping. Each piece is slightly shifted and enlarged. `$ collage.preset("joiner")` close to the default, `"scatter"` wide and many, `"calm"` four calm pieces. The old name `"tiles"` (shifting shards, removed in 5.3) is read as photo collage. The scene transition `scene bg with screen_fx.TileSwap(1.0)` is unchanged | `collage_config.rpy` |
| `"ripple"` | shimmer (5.5): the screen slowly shimmers as if seen through clear liquid. The old title shimmer moved into a shader, so it works on the title, in-game menu and during play. `$ ripple.preset("calm")` slight, `"dream"` big | `ripple_config.rpy` |
| `"shards"` | flying shards (5.1): small sharp fragments blown by the wind. `$ shards.preset("embers")` embers, `"ash"` ash, `"dread"` red shards on a dark screen | `shards_config.rpy` |
| `"waves"` | ripple (5.7): round waves spread from a point and refract the screen | `waves_config.rpy` |
| `"wobble"` | wobble (5.7): wavers like heat haze or hand drawing with a noise pattern | `wobble_config.rpy` |
| `"filmgrain"` | old film (5.7): grain, dust, scratches, flicker, judder, faded colors | `filmgrain_config.rpy` |
| `"fisheye"` | fisheye (5.7): the center bulges and edges bend; a round lens screen too | `fisheye_config.rpy` |
| `"photocopy"` | photocopy (5.7): paper worn out by repeated copying | `photocopy_config.rpy` |
| `"relief"` | emboss (5.7): pressed into a metal plate; engraved too | `relief_config.rpy` |
| `"gradmap"` | gradient map (5.7): repaints with colors chosen by brightness; poster-like too | `gradmap_config.rpy` |
| `"rings"` | ring shift (5.7): rotates and shifts each circular ring out of line | `rings_config.rpy` |
| `"camcorder"` | old camcorder (5.7): the screen tone of old camcorder footage transferred at low quality. Presets `light`, `tape`, `cold` | `camcorder_config.rpy` |
| `"macroblock"` | block corruption (5.8): square cells smear into single colors like broken digital video, with stripes, shifts and color drift. Occasionally by default, continuously with `always`. Presets `subtle`, `broken`, `smear` | `macroblock_config.rpy` |
| `"default"` | back to the base effect (= cancel) | `screen_fx.base` in `screen_fx_config.rpy` |
| (overlay) | VHS. Only on / off is chosen; its look is `vhs_crt.settings` | `vhs_crt_config.rpy` |

> Monochrome (`mono`) was removed in 4.0. Using the old name `"vhs_crt"` as a base effect is read as "none + overlay on".

### In the script

```py
label start:
    scene bg room
    e "평소 화면 (효과 없음 + VHS 덮개)."

    ## To ASCII. The next line appears after the TV turns off and on.
    $ screen_fx.use("ascii")
    e "세계가 글자로 무너진다."
    e "다음 줄에서도 계속 ASCII."

    ## Cancel: base effect and overlay as in the settings
    $ screen_fx.clear()
    e "현재로 돌아왔다."

    ## Choosing a transition (if not written, follows the screen_fx.transition setting)
    $ screen_fx.use("gameboy", transition="tv")      # TV off/on (default)
    $ screen_fx.use("gameboy", transition="fade")    # the old effect fades out while the new one fades in
    $ screen_fx.use("gameboy", transition=None)      # instant

    ## Other values
    $ screen_fx.use("ascii", duration=2.0)         # the whole transition takes 2 s (TV keeps its off/black/on ratio)
    $ screen_fx.use("ascii", wait=False)           # go on to the next line without waiting for the transition
    $ screen_fx.use("none", overlay=False)         # a clean screen with no effects at all
    $ screen_fx.clear(transition="fade", duration=2.0)   # fade back to the default over 2 s

    ## Overlay (VHS) on and off
    $ screen_fx.use("ascii", overlay=False)        # ASCII only (overlay off)
    $ screen_fx.use("retro_term", overlay=True)    # retro terminal with the overlay on too (off by default)
    $ screen_fx.set_overlay(False)                 # keep the effect, turn off only the overlay
    $ screen_fx.set_overlay(True)                  # keep the effect, turn on only the overlay

    ## Amount of overlay distortion
    $ screen_fx.set_warp(3.0)                      # edge curvature 3 (0 flat, 1 default, 5 strong)
    $ screen_fx.set_warp(0.0, duration=2.0)        # flatten gradually over 2 s
    $ screen_fx.set_warp("default")                # back to the settings file value
    $ vhs_crt.set(distort_intensity=0.15, aberration=0.2, duration=1.0)   # screen shift and color bleed too

    ## Text exclusion: change just this time (if not written, the effect's settings file exclude)
    ##   "say" dialogue and names / "choice" choices / "screens" menus and screens (quick menu, save screen, etc.)
    $ screen_fx.use("ascii", exclude=())                               # exclude nothing: even the dialogue window becomes characters
    $ screen_fx.use("gameboy", exclude=("say",))                       # only dialogue and names keep their colors (comma even for one)
    $ screen_fx.use("gameboy", exclude=("say", "choice", "screens"))   # all text keeps its colors; only backgrounds and characters change

    ## Changing Game Boy values
    $ gameboy.set(mode="pixel")                  # to pixelation (crisp, no pattern)

    ## Branching on the current effect
    if screen_fx.current_effect() == "ascii":      # the current base effect ("none" if none)
        e "아직 글자 화면이야."
    if screen_fx.is_default():                      # not changed with use(), or back with clear()
        e "평소 화면이야."
    if screen_fx.overlay_on():                      # whether the overlay (VHS) is on now
        e "VHS가 덮여 있어."
    if "say" in screen_fx.current_exclude():        # text groups excluded from the current effect (a tuple)
        e "대사창은 멀쩡해."
```

### With dialogue line parentheses (what the editor's dialogue tab saves)

```py
e "평소 화면."
e "어? 화면이…" (fx="ascii")                              # to ASCII before this line appears, and it stays
e "아직 ASCII야."                                          # continues from before
e "돌아왔다." (fx="default")                               # cancel → default
e "서서히 바뀐다." (fx="gameboy", fx_transition="fade")     # dissolve for this line only
e "번쩍." (fx="none", fx_overlay=False, fx_transition=None)  # instantly to a clean screen
e "크고 빨갛게." (size=40, color="#aa0000", fx="gameboy")  # can be combined with dialogue style values
e "덮개 없이." (fx="ascii", fx_overlay=False)              # ASCII only
e "덮개만 다시 켜자." (fx_overlay=True)                     # keep the effect, turn on only the overlay
e "화면이 크게 휜다." (fx_warp=3.0)                         # overlay curvature 3
e "원래대로 휨." (fx_warp="default")                        # curvature back to the setting
e "전부 글자로." (fx="ascii", fx_exclude=())               # exclude nothing, this time only
e "대사만 또렷하게." (fx="gameboy", fx_exclude=("say",))    # exclude dialogue and names, this time only
e "접속 중…" (fx="retro_term")                             # retro terminal (overlay off by default)
```

- Lines with `fx=` start showing text after the TV turns back on.
- Clicking during the TV transition switches to the new effect immediately. That click doesn't advance to the next line.
- **When it changes instantly without a transition**: rollback and roll-forward, loading a save, skipping (Ctrl, Tab), while the editor is open, and while the player has turned effects off with `screen_fx.Toggle()`.
- If you delete the `screen_fx` folder, lines with `fx=`, `fx_overlay=` or `fx_warp=` raise errors, so delete those parentheses too.
- Editing in the editor's dialogue tab and pressing Ctrl+S reloads the script. Ren'Py can't recognize the edited line as the same line, so it replays **from the line before it**. Advance once to see the edited line.
- The effect pages in the editor's "screen effects" tab edit the effect's **settings**, so saving there doesn't change the effect of the current scene. To use it in the current scene, press that page's **"this effect from this line"** (into the dialogue parentheses, handed to the dialogue tab) or **"this effect from this script line"** (`$ screen_fx.use(…)` above the chosen line, handed to the "insert into line" page, 4.1) → Ctrl+S.

### Changing from a non-dialogue line (the editor's "insert into line", 4.1)

F9 → "screen effects" tab → **[insert into line]** under "Effect:". Choose a line (`[` `]` one line at a time, type a line number, [current line], L for the list), choose the effect and press Ctrl+S, and a line like this goes **right above** it. Saving on the same line again rewrites the line inserted before; delete it with [delete the effect line above this line] → Ctrl+S.

```renpy
label start:
    $ screen_fx.use("ascii", overlay=False, transition="fade")   # ← the line the editor inserted
    scene fx_bg
    with dissolve

    $ screen_fx.clear()            # [cancel → no effect]
    $ screen_fx.set_overlay(True)  # keep the effect, overlay only [on]
    $ screen_fx.set_warp(3)        # overlay curvature [3]
    $ screen_fx.set_warp("default")  # overlay curvature [setting]
```

### Settings file (`screen_fx_config.rpy`)

```py
## Base effect: the effect when not changed with use(), and when returning with clear()
##   "none"        none (release setting; with the overlay on, only VHS shows)
##   "ascii"       ASCII (the whole game as a character screen)
##   "retro_term"  retro terminal
##   "gameboy"     Game Boy
define screen_fx.base = "none"

## Overlay (VHS): laid once more over the base effect. Only on / off
##   True   on (release setting). But if an effect's <name>.overlay is False, it's off while that effect is used
##   False  off. Only when turned on with use(…, overlay=True) or fx_overlay=True
define screen_fx.overlay = True

## Default transition when changing effects
##   "tv"    like a TV turning off and on (the screen_fx.tv values below)
##   "fade"  the old effect fades out while the new one fades in
##   None    change instantly (no transition)
define screen_fx.transition = "tv"

define screen_fx.fade_time = 1.0      # total time of the "fade" transition (seconds)
define screen_fx.wait = True          # True: next line after the transition ends / False: start the transition and go to the next line right away
define screen_fx.skippable = True     # True: a click skips the transition / False: clicks aren't accepted until it ends
define screen_fx.editor_preview = True   # show effects while the editor is open too (toggle with V while editing)

## TV off/on
##   off: the screen squashes vertically into a bright horizontal line → the line shrinks to a center dot
##   black screen (the effect changes here)
##   on: dot → line → the screen opens (static fades away)
define screen_fx.tv = {
    "off_time": 0.35,       # turning-off time (seconds)
    "black_time": 0.25,     # black screen while off (seconds)
    "on_time": 0.45,        # turning-on time (seconds)
    "line": 3,              # thickness of the line and dot (pixels)
    "flash": 0.8,           # how bright it flashes when turning off (0 = no flash, 1 = pure white)
    "noise": 0.5,           # static when turning on (0 = none, 1 = the screen full of noise)
    "off_sound": None,      # e.g. "audio/tv_off.ogg" (when it starts turning off; None = no sound)
    "on_sound": None,       # e.g. "audio/tv_on.ogg"  (when it starts turning on)
    "volume": 1.0,          # volume of both sounds (0–1); also follows the sound volume in preferences
}
```

| I want to | Value |
| --- | --- |
| Clean normally, effects only in certain scenes | `define screen_fx.overlay = False` (base effect stays `"none"`) |
| The whole game as a Game Boy screen | `define screen_fx.base = "gameboy"` |
| Only a flat LCD while Game Boy is used (overlay off) | `define gameboy.overlay = False` in `gameboy_config.rpy` |
| Less curvature / a flat overlay | `"warp_amount": 0.5` / `0.0` in `vhs_crt.settings` in `vhs_crt_config.rpy` |
| Always change instantly without transitions | `define screen_fx.transition = None` |
| Dissolve as the default transition | `define screen_fx.transition = "fade"`, `define screen_fx.fade_time = 1.5` |
| A slow, heavy TV | `define screen_fx.tv = { "off_time": 0.8, "black_time": 0.6, "on_time": 1.0, "flash": 1.0, "noise": 0.8 }` |
| Less flashing (for light-sensitive players) | `define screen_fx.tv = { "flash": 0.0, "noise": 0.1 }` |
| Change with screen buttons | `textbutton "ASCII" action screen_fx.Use("ascii")`, `textbutton "Restore" action screen_fx.Clear()` |
| Only the overlay with screen buttons | `textbutton "VHS on" action screen_fx.SetOverlay(True)`, `textbutton "Overlay off" action screen_fx.SetOverlay(False)` |
| Let players turn off all screen effects | in the preferences screen, `textbutton _("Screen effects") action screen_fx.Toggle()` (TV transitions turn off too; kept after restarting the game) |

### Cursor position — `screen_fx/screen_fx_config.rpy` + script (4.2)

Choose where in the screen effects pygaki's software cursor (`custom_ui.cursor = True`) is drawn, per section of the script like shaders. It stays until changed again and is saved with saves and rollback.

```renpy
## screen_fx_config.rpy: the usual value
define screen_fx.cursor = "effect"       # including effects: characters under ASCII, 4-color dots under Game Boy, VHS color bleed and curvature too
# define screen_fx.cursor = "overlay"    # under the overlay (VHS): doesn't receive the base effect
# define screen_fx.cursor = "top"        # no effects: clean on top (same as up to 4.1)

## script
$ screen_fx.set_cursor("top")                    # no effects from this line
$ screen_fx.set_cursor("default")                # back to the setting
$ screen_fx.use("ascii", cursor="overlay")       # together with changing the effect
e "커서가 깨끗해졌다." (fx_cursor="top")          # dialogue parentheses
```

- Editor: the "cursor" row in the dialogue tab (`fx_cursor=`), the "cursor" row of "insert into line" in the screen effects tab (`$ screen_fx.set_cursor(…)`).
- While the editor (F9) is open, and with the OS cursor (`cursor_mode = "hardware"`), it's always on top.

### VHS overlay — `screen_fx/vhs_crt_config.rpy` (4.0)

The overlay is only turned on / off; its look is set by the values of `vhs_crt.settings`. Values related to distortion:

```py
define vhs_crt.settings = {
    "warp_amount": 1.0,              # edge curvature (0 = flat, 1 = default, 3 or more = strongly curved; 0–5)
    "distort_intensity": 0.05,       # how much the screen shifts sideways as a band passes (0–0.2)
    "aberration": 0.03,              # color bleed (red/green misalignment)
    "roll": True,                    # a band rolling up and down
    "noise_opacity": 0.4,            # static along the band (0–1)
    "vignette_opacity": 0.5,         # edge darkening (0–1)
    "strength": 1.0,                 # strength of the whole overlay (0 hides it)
    # … all values in vhs_crt_config.rpy and screen_fx/README.md 11-2
}

## whether each effect turns the overlay on by default (each effect's settings file)
define ascii.overlay = True         # on (release setting)
define gameboy.overlay = True       # on (release setting). False gives only a flat LCD
define retro_term.overlay = False   # off (release setting), so it doesn't curve twice with its own curved CRT
```

```py
## during play (saved with saves and rollback)
$ screen_fx.set_warp(3.0, duration=1.0)                  # only the curvature to 3 over 1 s
$ vhs_crt.set(warp_amount=0.0, distort_intensity=0.0)    # several values at once
$ vhs_crt.preset("broken", duration=0.5)                 # to a broken screen
$ vhs_crt.reset(duration=1.0)                            # all values changed with set() back to the settings
e "화면이 휜다." (fx_warp=3.0)                            # with dialogue parentheses
```

- Editor: set the usual values with the sliders of **"VHS overlay"** (edge curvature, etc.) in the "screen effects" tab, and the value from a line on with the **"overlay curvature"** row in the dialogue tab.
- With strong curvature, the visible and clickable positions of buttons near the screen edges don't match.

### Overlay and text exclusion

**Text exclusion** chooses text that doesn't get the effect. **By default everything, including text, gets it** (only ASCII excludes all text by default). Excluded text stays crisp and unchanged.

| Name | Excludes |
| --- | --- |
| `"say"` | dialogue and names (dialogue window, NVL screen) |
| `"choice"` | choices |
| `"screens"` | menus and screens (quick menu, save, load and preferences screens, screens shown with `show screen`) |

Backgrounds and characters shown with `scene` and `show` always get the effect. That's why the dialogue window is shown on the `sfx_say` layer and choices on the `sfx_choice` layer. To keep Ren'Py's default, `define screen_fx.split_text_layers = False` (then text can only be all excluded or not at all).

```py
## set the default text exclusion in each effect's settings file
define vhs_crt.exclude = ()                            # vhs_crt_config.rpy (overlay; release setting: none)
define ascii.exclude = ("say", "choice", "screens")    # ascii_config.rpy (release setting: all text)
define retro_term.exclude = ()                         # retro_term_config.rpy (release setting: none)
define gameboy.exclude = ()                            # gameboy_config.rpy (release setting: none; unexcluded text only changes color)
define gameboy.exclude = ("say",)                      # e.g. only dialogue and names keep their colors (comma even for one)

## use() sets the overlay anew on every call (if not written, as in the settings)
$ screen_fx.use("ascii", overlay=False)
$ screen_fx.use("gameboy")                       # ← overlay as in the settings (on again if gameboy.overlay = True)
$ screen_fx.use("gameboy", overlay=False)        # ← write it again to keep it off

## when "screens" (menus and screens) is excluded, do this so images added to a screen still get the effect
screen map_view():
    add "images/map.png" at screen_fx.scene     # ASCII on the map image too
    textbutton "닫기" action Hide("map_view")     # button text unchanged
```

- The title screen's background image (including a background video) and the splash's background and logo get scene effects **automatically**. Text (menus, title, body) stays as is.
- Overlay text exclusion: with base effect "none" it follows `vhs_crt.exclude`; with a base effect, when that effect excludes nothing, the overlay excludes nothing either (so the overlay is always on top).
- Game Boy applies per layer even when nothing is excluded: the scene turns into dots and text layers (dialogue, choices, menus) only get the 4 colors (`"text_pixel": False`), so even small dialogue is readable.
- If anything is excluded, it applies to each layer separately. Curvature (VHS, the retro terminal's curved screen) doesn't apply to excluded text, so only the dialogue window looks straight and floating.
- The overlay draws the screen once more, so it can get a little heavy on very slow PCs.
- Editor: per effect button in the "screen effects" tab, "overlay (VHS)" on/off and the "text exclusion" row (dialogue and names / choices / menus and screens / none / all; on = excluded); the "overlay (VHS)" row in "base effect, transition"; and the "overlay (VHS)", "overlay curvature" and "text exclusion" rows in the dialogue tab.

### ASCII — `screen_fx/ascii_config.rpy` (2.5)

Divides the screen into **character cells** and redraws each cell with a character matching its brightness. Each character acts as a pixel (old text screens, dungeon-crawl consoles). Character images are generated during play from the character list and font, so you don't need to prepare images. The default font is **NeoDunggeunmo** (`screen_fx/fonts/neodgm.ttf`, SIL OFL 1.1), included in the plugin.

```py
define ascii.enabled = True
define ascii.exclude = ("say", "choice", "screens")   # text exclusion (default: all text). () turns even dialogue into characters
define ascii.font = None           # None = NeoDunggeunmo. Another font: "fonts/DungGeunMo.ttf"

define ascii.settings = {
    "strength": 1.0,        # overall strength (0 = original screen, 1 = fully characters)
    "cell": 16,             # character cell height (pixels). 8 very dense, 16 default, 32 large, 48+ breaks up the picture
    "aspect": 0.5,          # cell width ÷ height. 0.5 = half-width characters (8×16), 1.0 = square tiles
    "crisp": True,          # True: cell height in multiples of 8. Sharpest at 16, 32, 48
    "chars": ".:-=+*#%@",  # character list (dark cell → bright cell). Dungeon style ".,:;ox%#@", blocks " ░▒▓█", "01"
    "color_mode": "color",  # "mono" one color (fg) / "color" original colors / "palette16" old PC 16 colors
    "fg": "#c8c8c8",        # character color in "mono". "#33ff66" green terminal, "#ffb000" amber
    "bg": "#000000",        # background color (empty space between characters)
    "color_boost": 1.3,     # multiplier that brightens original colors
    "bg_tint": 0.0,         # let the original picture show through the background. 0.15–0.3 avoids darkness (recommended with the VHS overlay)
    "brightness": 1.0,      # higher means more dense characters like @ and #
    "contrast": 1.0,
    "invert": False,        # invert brightness
}
## included presets: "terminal" green terminal, "amber" amber, "dungeon" 16 colors + dungeon style, "blocks" blocks, "big" large characters, "glow" for the VHS overlay

## during play (the same way as VHS)
$ screen_fx.use("ascii")                     # switch to ASCII and keep it
$ ascii.preset("dungeon", duration=0.5)      # a roguelike console feel
$ ascii.set(cell=48, duration=2.0)           # characters grow over 2 s and the picture breaks up
$ ascii.reset(duration=1.0)                  # back to the settings file values
```

| I want to | Value |
| --- | --- |
| See the picture better | `"cell"` at 8–12 (characters become hard to read) |
| Make characters look big | `"cell": 32` or `ascii.preset("big")` |
| Square tiles (roguelike maps) | `"aspect": 1.0` |
| Keep odd sizes (12, 20, etc.) | `"crisp": False` (characters get a bit blurry) |
| A green monochrome monitor | `ascii.preset("terminal")` |
| ASCII + VHS overlay too dark | `ascii.preset("glow")` or `"bg_tint": 0.2`, `"color_boost": 1.6` |
| Even the dialogue window as characters (for effect) | `$ screen_fx.use("ascii", exclude=())` |
| A character list with other characters and symbols | `"chars": ".·:∴※#"` (only characters the font has; others show as boxes) |

In the editor's "screen effects" tab → "ASCII" button, set cell size, ratio and crispness with sliders and buttons, and the character list and coloring with buttons. Detailed descriptions of values are in chapter 6 of `screen_fx/README.md`.

### Retro terminal — `screen_fx/retro_term_config.rpy` (2.6)

Makes it look like an old monochrome monitor (a phosphor screen). The screen's **brightness is painted in the phosphor color**, so with green phosphor + a black background, white text glows green. **Curved CRT** (curvature, darkened edges, rounded screen frame) and **VHS** (rolling band, horizontal wobble) are turned on and off separately within this effect. These values are separate from the VHS_CRT effect (overlay), so this effect alone gives a CRT look even with the overlay off. Reference: cool-retro-term (no code was taken; written anew).

```py
define retro_term.exclude = ()     # text exclusion (default: none → even dialogue glows in the phosphor color)

define retro_term.settings = {
    "phosphor": "#5cff8a",      # phosphor color: the color text and bright areas glow in ("#ffb000" amber, "#c8f0ff" sky blue)
    "background": "#061208",    # background color: the color of the darkest areas ("#000000" black, "#1f6aa0" blue background)
    "color_keep": 0.0,          # keep original colors (0 = one phosphor color, 1 = original colors)
    "bloom": 0.6,               # glow bleed (light spreads around bright text)
    "raster": "scanlines",      # screen texture: "none", "scanlines", "pixels" pixel grid, "subpixels" RGB subpixels
    "flicker": 0.04,            # flicker
    "glow_line": 0.25,          # a bright line passing from top to bottom
    "static_noise": 0.06,       # static noise
    "crt": True,                # curved CRT on (False = flat screen)
    "curvature": 0.25,          # curvature
    "frame": True,              # frame around the screen (monitor bezel)
    "frame_size": 0.035,        # frame thickness
    "vhs": False,               # VHS within this effect on (rolling band, horizontal wobble)
    "vhs_wobble": 0.4,          # horizontal wobble
}
## included presets: "green" green, "blue" blue screen, "amber" amber, "white" white, "flat" flat screen, "broken" broken

## during play
$ screen_fx.use("retro_term")                     # to the retro terminal (with the TV turning off and on)
$ retro_term.preset("blue", duration=1.0)         # to a blue screen over 1 s
$ retro_term.set(vhs=True)                        # turn on this effect's VHS
$ retro_term.reset(duration=0.5)                  # back to the settings file values
e "접속 중…" (fx="retro_term", font="screen_fx/fonts/neodgm.ttf", size=32)   # a terminal font for the dialogue too
```

| I want to | Value |
| --- | --- |
| A green terminal | the defaults as they are, or `retro_term.preset("green")` |
| A blue screen | `retro_term.preset("blue")` |
| Only dialogue in its original colors | `define retro_term.exclude = ("say",)` |
| Only color and texture, without curvature or frame | `"crt": False` or `retro_term.preset("flat")` |
| Using it with the VHS overlay | the overlay is off by default while this effect is used (`retro_term.overlay = False`). If you turn the overlay on, curvature applies twice, so set this effect's `"crt": False` |
| The frame covers buttons at the edges | lower `"frame_size"` and `"curvature"` (click areas stay the same, so they don't line up) |
| A slow PC | `"bloom": 0` |

In the editor's "screen effects" tab → "retro terminal" button, adjust sliders in groups: color, light, screen texture, curved CRT, VHS. There's no burn-in. Detailed descriptions of values are in chapter 7 of `screen_fx/README.md`.

### Game Boy — `screen_fx/gameboy_config.rpy` (2.7)

Makes it look like the LCD screen of an old handheld console. The screen is divided into **big dots** painted with only **4 colors (or 2)** according to brightness. Choose one of two ways to draw brightness between colors.

| Style | Brightness between colors | Suits |
| --- | --- | --- |
| `"dither"` dithering (default) | blended smoothly with dot patterns (checkerboard, grid) | photo-like CGs, dark scenes, light |
| `"pixel"` pixelation | cut sharply to the nearest color, like steps | simple pictures, pixel art, large flat areas |

By default text **gets only the 4 colors and isn't broken into dots**, so even small dialogue stays readable (`"text_pixel": False`). References: the dither pattern of Retro dither (CC0) and the LCD look of Gameboy Classic Shader (GPL) (no code was taken; written anew).

```py
define gameboy.exclude = ()     # text exclusion (default: none → dialogue in Game Boy colors too; shapes stay, so it's readable)

define gameboy.settings = {
    "mode": "dither",           # style: "dither" dithering (blend with dot patterns) / "pixel" pixelation (cut sharply)
    "pixel_size": 4.0,          # size of one dot (pixels). At 1280×720, 4 = 320 dots across, 6 = 213, 2 = 640
    "dither": "4x4",            # dither pattern: "4x4" coarse / "8x8" fine
    "dither_strength": 1.0,     # dither strength (0.5 = patterns only near color changes, 0 = same as pixelation)
    "text_pixel": False,        # True breaks text into dots too (only for large text or pixel fonts)
    "colors": 4,                # number of colors: 4 or 2 (2 uses only colors 1 and 4)
    "color1": "#1c3f04",        # 1: the darkest color
    "color2": "#456306",        # 2: a dark color
    "color3": "#74870a",        # 3: a light color
    "color4": "#939f06",        # 4: the lightest color (the background of an unlit LCD)
    "gamma": 1.0,               # gamma (0.6–0.8 brightens dark areas; when dark CGs get crushed)
    "grid": 0.4,                # gaps between dots (0 = none)
    "shadow": 0.4,              # dot shadow: dark dots cast shadows to the bottom right (0 = none)
    "texture": 0.2,             # LCD blotches (0 = none)
}
## included presets: "dmg" olive green (default), "green" vivid green, "pocket" gray, "light" teal backlight,
##                   "bw" black and white, "blood" dark red (for horror scenes), "1bit" 2 colors, "clean" no LCD texture

## during play
$ screen_fx.use("gameboy")                        # to the Game Boy screen (with the TV turning off and on)
$ gameboy.set(mode="pixel")                       # to pixelation (the style changes immediately)
$ gameboy.preset("blood", duration=1.0)           # to a red screen over 1 s
$ gameboy.set(pixel_size=24.0, duration=2.0)      # dots grow step by step over 2 s (like a mosaic)
$ gameboy.reset(duration=0.5)                     # back to the settings file values
e "삐빅." (fx="gameboy", font="screen_fx/fonts/neodgm.ttf", size=32)   # a pixel font for the dialogue too
```

| I want to | Value |
| --- | --- |
| An olive-green Game Boy screen | the defaults as they are, or `gameboy.preset("dmg")` |
| Gradients as dot patterns | `"mode": "dither"` (default). Finer: `"dither": "8x8"` |
| A crisp pixel look without patterns | `"mode": "pixel"` |
| The screen looks full of patterns (dark CGs) | `"gamma": 0.7`, `"dither_strength": 0.5`, or `"mode": "pixel"` |
| A red horror scene + pixelation | `gameboy.preset("blood")` and then `gameboy.set(mode="pixel")` (presets clear values changed earlier with set(), hence this order) |
| Even dialogue as dots (like a real console) | `"text_pixel": True` with a large pixel font (text 32 for 2-pixel dots, 64 for 4-pixel dots) |
| Dialogue in its original colors | `define gameboy.exclude = ("say",)` |
| A slow PC | `"shadow": 0` |

In the editor's "screen effects" tab → "Game Boy" button, adjust sliders in groups: screen, colors, LCD (pressing the buttons for the 4 colors opens a color picker). There's no real LCD ghosting, and the screen size stays the same. Detailed descriptions of values are in chapter 8 of `screen_fx/README.md`.

### Adding a new shader

Save the monochrome sample code from 12-1 of `screen_fx/README.md` as a new file, rename it (e.g. `glitch`) and edit the shader part. Just adding it creates `$ screen_fx.use("glitch")`, dialogue parentheses `(fx="glitch")`, and buttons in the editor's "screen effects" and dialogue tabs automatically. Step by step in chapter 12 of `screen_fx/README.md`. Effects that draw only the text layers differently (like Game Boy) use `layered()` and `u_sfx_text` (same chapter).

## Effects folder — `ui_kit/effects/` (5.1)

Put a `.glsl` file in this folder and its effect appears automatically in the game and the pygaki app; take the file out and it's gone. One file per effect. Restart the game after adding or removing files. In the pygaki app's [Effects] screen you can play samples, turn them on and off, and add or remove them (removed files are kept in `ui_kit_backup/effects/`).

| Kind | Where it's used | Script |
| --- | --- | --- |
| Text effects (`@effect`) | the text effect list in pygaki's text effect card | `e "아래에서 올라온다." (cps=30, effect="maskup")` |
| Image transitions (`@transition`) | "how it appears" of pygaki background and show lines | `scene bg hall with img_fx.use("irisin")`, duration and values `img_fx.use("bands", 1.4, count=10)` |

Included effects: text `maskup` rise from below, `tracking` letter spacing closing in, `sweep` light sweep, `backbox` box behind, `karaoke` karaoke, `meltglitch` melting glitch, `droplets` droplets, `spring` spring into place, `marquee` scroll sideways, `scramble` decode, `bubble` speech bubble (four shapes; swapping in images is in the effects folder README) / images `irisin` iris open, `bands` bands cover and open, `pixelsort` pixel sort (crash), `datamosh` datamosh (crash), `slide` slide sideways, `mosaic` change through mosaic, `blinds` horizontal blinds, `static` TV static, `calibrate` test pattern, `tapestretch` tape stretch, `blink` blink, `pushup` push up, `vibrate` vibrate, `springin` spring in. The app's [Effects] screen can only [Hide] them in lists; to add or remove one, put the file in this folder or delete it.

**As image transitions when shaders change**: `pixelsort` and `datamosh` are also used as transitions when changing screen shaders. The old screen freezes broken for a moment and cuts to the new screen, and the shader changes at that moment. In pygaki, choose them in the box's ◐ Shader → transition "on start" and "on end", and set "direction" below. Writing the script directly, it looks like this.

```renpy
$ screen_fx.shaders("glitch", "none", transition="datamosh", duration=1.4, tv={"mode": 1.0})   # spread (0 for rotate)
scene bg room
with screen_fx.pending_with()
```

Pixel sort directions are `tv={"dir": 0}` horizontal, `1` vertical, `2` rotate, `3` spread. How to write new effects, and a prompt to give Claude, are in that folder's `README.md`.

## Shaders, dialogue sounds and cursors per box or scene (pygaki, 5.1)

When you set them with the **◐ Shader** at the top right of a box or label in pygaki, export writes lines like these at the first line of each box. Use the same lines when writing scripts yourself.

```renpy
$ screen_fx.shaders("vhs_crt", "none", transition="tv", tv={"off_time": 0.6}, values={"vhs_crt": {"warp_amount": 2.0}})
$ custom_ui.scene(typing_sound="audio/beep.ogg", ctc="gui/ctc/heart", cursor="gui/cursor/hand")
```

- `values`: shader detail values used only there (`{}` follows the settings). `tv`: values used only for this TV transition.
- `custom_ui.scene`: per-scene dialogue sound (`None` turns it off), and image folders for the click-to-continue indicator and cursor (images in the folder play in name order). `custom_ui.scene()` returns to the game defaults. Kept in saves and rollback.

## Title shimmer — `screen_fx/watermorph_config.rpy` (the old way)

Since 5.5, the title shimmer is applied with the shader `ripple` (`ripple_config.rpy`, in the base effects table above). New projects start with `screen_fx.title_shaders = ("ripple", "none")` in `screen_fx_config.rpy` and `watermorph.enabled = False`. Below are the values for using the old way as is (turning both on makes it shimmer twice).

| Value | Release default | When changed |
| --- | --- | --- |
| `watermorph.enabled` | `False` (since 5.5) | `True` shimmers the old way (remove `"ripple"` from `title_shaders`) |
| `watermorph.target` | `"screen"` | `"background"` shimmers only the background; menu text stays crisp |
| `watermorph.amount` | `6.0` | shimmer strength (pixels). With `"screen"`, 8 or less so click positions don't drift |
| `watermorph.scale` | `180.0` | size of one wave (pixels). Larger means slower, bigger waves |
| `watermorph.speed` | `0.6` | flow speed |
| `watermorph.flow` | `1.2` | amount of swirl. 0 gives simple waves |
| `watermorph.shine` | `0.15` | surface glints. 0 if it looks like smoke on a black background |
| `watermorph.quality` | `2` | 1–3. 1 for low-end PCs, mobile and web |
| `watermorph.in_title_menus` | `False` | also apply to preferences and load screens opened from the title |

In the editor's "title shimmer" tab you can adjust it while watching, by dragging sliders. The effect stays visible while using other tabs in the editor; toggle it with V.

## VHS/CRT effect — `screen_fx/vhs_crt_config.rpy`

Just add it and it covers the whole screen. VHS is a **base effect** (`screen_fx.base = "vhs_crt"`), so it rests while another effect is turned on with `screen_fx.use()` and comes back when cancelled (`screen_fx.clear()`). Scope is set by `vhs_crt.scope`, the look by values in the `vhs_crt.settings` dictionary.

| I want to | Value |
| --- | --- |
| Turn the effect off | `vhs_crt.enabled = False` |
| Only during play / only on the title | `vhs_crt.scope = "game"` / `"main_menu"` (the splash before the title counts as the title side) |
| Crisp dialogue window and menus, only the scene | `vhs_crt.auto = False`, then `camera at vhs_crt.effect` in the script |
| Overall strength | `"strength"` in `settings` (0 original screen – 1) |
| Scanlines and grille | `"scanlines_opacity"`, `"scanlines_width"`, `"grille_opacity"`, `"pixelate"`, `"resolution"` |
| Rolling band and screen shift | `"roll"`, `"roll_speed"`, `"roll_size"`, `"distort_intensity"` |
| Noise | `"noise_opacity"`, `"static_noise_intensity"` |
| Color | `"aberration"` (color bleed), `"brightness"`, `"discolor"`, `"saturation"`, `"contrast"` |
| CRT shape | `"warp_amount"` (edge curvature; large values make clicks on edge buttons drift), `"vignette_intensity"`, `"vignette_opacity"` |
| The screen is too dark | raise `"brightness"`, or lower `scanlines_opacity`, `grille_opacity`, `vignette_opacity` |
| For low-end machines | `vhs_crt.redraw = 1.0/30`, `"pixelate": False`, `"noise_opacity": 0` |
| Sets to switch during play | add names and values to `vhs_crt.presets` (`"clean"` and `"broken"` are included) |

During play, change it from the script. Changed values are saved with saves and rollback.

```py
$ vhs_crt.preset("broken")                     # a momentary breakdown
pause 0.3
$ vhs_crt.reset(duration=0.5)                 # slowly back to the settings file values
$ vhs_crt.set(noise_opacity=0.9, duration=1.0)
$ vhs_crt.off(duration=2.0)                   # fade out
```

To let players turn it off, add one line to the preferences screen in `screens.rpy`: `textbutton _("VHS effect") action vhs_crt.Toggle()`. A button that turns off all screen effects and TV transitions at once is `textbutton _("Screen effects") action screen_fx.Toggle()`. In the editor's "screen effects" tab (VHS button) you can adjust sliders with the effect on, and switching "editing target" to a preset lets you edit that preset while previewing it. The effect stays visible while using other tabs in the editor; toggle it with V.

## Order of priority and troubleshooting

When the same value is in several places, the one further right wins.

| Feature | Order (→ later wins) |
| --- | --- |
| Title menu | `tmenu.default` → editor common values → values written on the item → editor item values (`title_menu_layout.rpy`) |
| Choices | `cmenu.default` → `choice_menu_layout.rpy` (saved by older editors) → `menu (…)` parentheses → choice parentheses |
| Cursor and dialogue sound | `custom_ui_config.rpy` → `custom_ui_layout.rpy` |
| Quick menu | `quick_menu_config.rpy` → `quick_menu_layout.rpy` |
| Dialogue | character definition → `say_style_layout.rpy` (saved by older editors) → dialogue parentheses |
| Text speed | `options.rpy` → `custom_ui.text_cps` → the value the player chose in preferences |
| Title shimmer | `watermorph_config.rpy` → `watermorph_layout.rpy` |
| The screen effect currently on | `screen_fx.base` → base in `screen_fx_layout.rpy` → `screen_fx.use()` during play / dialogue `fx=` (`clear()` returns to base) |
| Transition when changing effects | `screen_fx_config.rpy` → `screen_fx_layout.rpy` → `use(transition=…)` / dialogue `fx_transition=` |
| Overlay on/off | `screen_fx.overlay` and each effect's `<name>.overlay` → `screen_fx_layout.rpy`, `<name>_layout.rpy` → `use(overlay=…)` / `set_overlay()` / dialogue `fx_overlay=` |
| Overlay curvature | `warp_amount` in `vhs_crt.settings` → `vhs_crt_layout.rpy` → `screen_fx.set_warp()` / `vhs_crt.set()` / dialogue `fx_warp=` |
| Text exclusion | the effect's default (all text for ASCII, none for the rest) → each effect's exclude (`ascii.exclude`, etc.) → each effect's layout file (`ascii_layout.rpy`, etc.) → `use(exclude=…)` / dialogue `fx_exclude=` |
| Values of the VHS overlay, ASCII, retro terminal and Game Boy effects | `vhs_crt.settings`, `ascii.settings`, `retro_term.settings`, `gameboy.settings` → `vhs_crt_layout.rpy`, `ascii_layout.rpy` → during play `vhs_crt.set()`, `screen_fx.set_warp()`, `ascii.set()`, etc. |
| Splash | engine defaults → `splash.default` → values written on the page |

| Symptom | What to check |
| --- | --- |
| Changed a setting but nothing changed | whether a `*_layout.rpy` with the same name exists (editor values win) |
| Text shows as boxes | the font doesn't have those characters |
| The font doesn't show only on other computers | file name case (`ChosunGu.TTF` ≠ `ChosunGu.ttf`) |
| A video doesn't show, or transparent areas are black | path, VP9 codec, whether it's side_mask format, the `…_side_mask` value |
| Dialogue sound plays twice | whether an old `callback=` sound function remains on the character |
| Choice or dialogue values changed in the editor don't get into the script | the message at the bottom of the panel says why. Copy with Ctrl+C and paste into that line |
| Edited the script wrongly | `ui_kit_backup/` in the project folder has the originals before editing, by time |
| Changing speed or effects shows nothing | whether text speed is "instant" (wave and jitter always show) |
| "given a default a second time" error after adding plugins | the same plugin folder is in twice. Delete the old folder including `.rpyc` |
| The editor doesn't open | whether you ran it from the launcher (it only opens in developer mode) |
| Deleted files still apply / screens defined twice | whether you deleted the `.rpyc` too, whether old folders like `title_menu` remain |
| Editor save fails | if the project is inside Dropbox, pause syncing briefly and save again |
| Changed the splash but don't see it | it doesn't show with Shift+R. Restart or use `splash.preview()`. Whether it was dropped by `developer_skip`, `once` or "don't show" is shown in the "Not showing now: …" row of the editor's splash tab; clear the record with [Show again] |
| Only my own `splashscreen` label shows | `call splash_play` inside that label |
| The splash controls table overlaps the prompt below | lower the page's `"yalign"` or reduce `"key_size"` and `"keys_spacing"` |
| A middle dot (·) between characters shows as a box | a character missing from the Korean font of new Ren'Py projects. Use `/` or `,`, or change the font |
| `use()` or `fx=` shows no effect | the effect's `enabled`, whether the player turned effects off (`persistent.screen_fx_off`), `strength`, whether another tab is in use in the editor |
| "No effect named …" error | a typo in the effect name. Usable names are shown on the error screen |
| "unknown keyword" error on `fx=` in dialogue parentheses | the `screen_fx` folder is missing or old (replace with the 2.8 bundle; `fx_overlay` since 2.5, `fx_exclude` since 2.6) |
| "image not found" error on `show rain` | whether the video is in `game/movies/`, whether the extension is `.webm`, whether an image with the same name exists in `images/` (images win) |
| A transparent video shows as two pictures side by side | whether the file name starts with `mask_` (side_mask video) |
| I added a transparent webm or GIF but the background is black | Ren'Py can't play a webm with alpha. Make a `mask_` video with [Make transparent video] in the pygaki app |
| A game newly made with Ren'Py 8.6 stops at the first line with "Unknown layer None" | the plugin is old. Use [Update plugins] in the bundle launcher to get the new version |
| A shader I wrote gives a syntax error in Ren'Py 8.6 | new 8.6 games use GLSL ES 3.00 for shaders by default. Register shaders written in the old syntax with `glsl=100` (8.5 has no such argument, so only when `hasattr(renpy.config, "glsl_version")`) |
| "unknown keyword" error for `box="media"` in dialogue parentheses / no picture | the pygaki plugin is old. Update the plugins |
| Can't select an image in the image/video tab | only images shown by show or scene lines in the script can be selected. Right after loading a save, choose from the line list |
| Dialogue unreadable under ASCII | whether `ascii.exclude` has `"say"`, whether `exclude=()` or `fx_exclude=()` was used |
| Excluded text still gets the effect | whether you forgot the comma when writing just one (`("say",)`, not `("say")`), whether `screen_fx.split_text_layers = False` |
| Other code can't find the dialogue window | that code looks for it with `layer="screens"`. `define screen_fx.split_text_layers = False` |
| The screen curves twice with retro terminal + VHS overlay | keep `retro_term.overlay = False` (default), or if you turn the overlay on, set this effect's `"crt": False` |
| The Game Boy screen is full of dot patterns | dark CGs blend colors 1 and 2 with patterns. `"gamma"` at 0.6–0.8, `"dither_strength"` at 0.5, or `"mode": "pixel"` |
| Dialogue unreadable under Game Boy | with `"text_pixel": True`, text is broken into dots too. Set it to `False` or `exclude=("say",)` |
| Under Game Boy, images inside menu screens don't turn into dots | menu and screen layers only change color (`"text_pixel": False`). Exclude `"screens"` from the effect and put `at screen_fx.scene` on that image |
| ASCII is too dark | raise `"color_boost"`, `"bg_tint"`, `"brightness"`. If VHS is on top, `ascii.preset("glow")` |
| ASCII characters are blurry / show as boxes | `"crisp": True` with `"cell"` a multiple of 16 / characters in the list aren't in the font |
| Images added to a screen don't get the effect | `"screens"` (menus and screens) is excluded from the effect. Put `at screen_fx.scene` on the image |
| The overlay disappears / comes back on | `use()` resets the overlay to the settings on every call. Write `overlay=` to keep it |
| VHS doesn't show | whether `screen_fx.overlay` is `True` (no `None` left from 3.x settings files), the current effect's `<name>.overlay`, whether `fx_overlay=False` was used |
| Saved in the screen effects tab but the screen didn't change | that tab edits effect settings. To use it in the current scene, the "this effect from this line" button or the dialogue tab → Ctrl+S |
| "No effect named 'mono'" error | monochrome was removed in 4.0. Change `use("mono")` and `fx="mono"` in the script, or add it back with the sample in 12-1 of `screen_fx/README.md` |
| A hitch the first time an effect changes | the time the graphics card needs to prepare that shader the first time. It doesn't happen again in the same run |
| Changes instantly without the TV transition | while skipping, right after rollback or loading, and while the editor is open it always changes instantly. Also check `screen_fx.transition` |
| Dialogue appears before the transition ends | `screen_fx.wait = False` or `use(…, wait=False)` |
| No "VHS effect" tab in the editor | since 2.4 it's the "VHS" button inside the "screen effects" tab |

## Common customizations

**Putting a logo video before the title**

1. Put a webm (VP9, game resolution) at `game/movies/logo.webm`.
2. Put a block at the very front of `splash.pages` in `splash_config.rpy`.
   ```py
   {
       "id": "logo",
       "background": "movies/logo.webm",
       "duration": "movie",
   },
   ```
3. Restart the game or check with `splash.preview()` in the console, then run Lint from the launcher.

**Adding a "Controls" item to the title menu**

1. Put one block in `tmenu.items` in `title_menu_config.rpy`.
   ```py
   {
       "id": "howto",
       "text": _("조작 방법"),
       "action": splash.ShowPage("controls"),
   },
   ```
2. Clicking it shows the splash's `controls` page over the title; a click returns to the title. Set its position with F9.

**Adding a "Gallery" item to the title menu**

1. Put one block in `tmenu.items` in `title_menu_config.rpy`, at the position you want.
   ```py
   {
       "id": "gallery",
       "text": _("갤러리"),
       "action": ShowMenu("gallery"),
       "show_if": "persistent.cleared",
   },
   ```
2. Run the game, press F9 on the title → drag the new item into place → Ctrl+S.

**Changing the font of the whole title menu at once**

1. Put the font file in `game/fonts/`.
2. Change `"font"` in `tmenu.default` to that path, or in the editor's title tab press 3 (all items) → font button → choose → Ctrl+S.

**Putting one choice anywhere on the screen**

1. Play until the choices appear → F9 (choice tab).
2. Drag the choice into place, tilt it with Q/E, change it with the font and color buttons.
3. Ctrl+S. The parentheses of that choice line in the script change and the same scene reloads.

**Moving the name elsewhere and making it shake on one dialogue line**

1. Play until that line → F9 (dialogue tab).
2. Choose "name" with Tab and drag the name into place; size with S/W, color with the color button.
3. Effect "jitter", speed ×0.5 → the line plays again so you can check.
4. Ctrl+S.

**A hover video behind every choice**

1. Put a side_mask format webm at `game/gui/button/choice_hover.webm`.
2. Write `"hover_movie": "gui/button/choice_hover.webm",` and `"hover_movie_size": (160, 150),` (display size) in `cmenu.default` in `choice_menu_config.rpy`.

**Using my own images for the cursor and click-to-continue indicator**

1. Put frame images in `game/gui/cursor/` and `game/gui/ctc/`, named 1, 2, 3… in order.
2. Editor's cursor/dialogue sound tab → on → choose that folder with `<` `>` → speed slider → Ctrl+S (reloads automatically).

**A different dialogue sound per character**

```py
define custom_ui.typing_sound = "audio/type.ogg"                  # custom_ui_config.rpy: default sound
define e = Character("에일린", cb_typing_sound="audio/type_soft.ogg")   # script: only this character
define narrator = Character(None, cb_typing_sound=None)            # no sound for narration
```

**A horror moment: one line big and red, with screen static**

```py
$ vhs_crt.preset("broken")
t "뒤를 돌아보지 마." (x=640, y=360, size=40, color="#aa0000")
$ vhs_crt.reset(duration=0.5)
```

**Turning off one feature briefly to compare with Ren'Py's default**

Set the switch at the top of the settings file to `False` (`tmenu.enabled`, `cmenu.enabled` …) → Shift+R. Turned off, it looks exactly like a freshly made Ren'Py project, and choice and dialogue parentheses values in the script are ignored.

**Tuning the VHS effect while watching it, and making a preset for a scene**

1. On a screen where you want to see the effect (a dialogue scene, etc.), F9 → T to the "screen effects" tab → the "VHS overlay" button at the top.
2. Adjust the usual look by changing sliders with the group buttons "basic", "scanlines", "shake"….
3. Switch "editing target" to "preset: broken" to edit that preset while previewing it. Values that should follow the defaults: "remove".
4. Save with Ctrl+S. Use it in that scene in the script with `$ vhs_crt.preset("broken", duration=0.5)`.

**Only a flashback as a Game Boy screen (with the TV turning off and on)**

```py
$ gameboy.preset("pocket")        # gray preset values (the screen doesn't change yet)
$ screen_fx.use("gameboy")        # to Game Boy with the TV turning off and on; stays until the next instruction
e "그해 여름, 우리는…"
e "아직 회상 중."
$ screen_fx.clear()               # cancel: no effect + VHS overlay
$ gameboy.reset()                 # back to the original values for next time
```

**Setting "Game Boy from this line" with the editor**

1. Play until the line where the effect changes → F9 (dialogue tab). (Or "screen effects" tab → [Game Boy] → [this effect from this line])
2. [Game Boy] in the "screen effect" row. To change the transition, [dissolve] / [instant] in the "transition" row. To turn off the overlay, [off] in the "overlay (VHS)" row; curvature in the "overlay curvature" row.
3. Ctrl+S → that line in the script becomes like `e "…" (fx="gameboy", fx_transition="fade")` and the script reloads. The edited line replays from the line before it, so advance once to see it. Things after the line like `with dissolve` stay as they are.
4. On the line where it should return, do the same with [cancel → default (no effect)] → Ctrl+S. The script gets `(fx="default")`. [Keep] means no change on this line (removes `fx` from the parentheses).

**Strongly curving the screen from this line (overlay distortion)**

```py
e "어지러워…" (fx_warp=3.0)               # overlay edge curvature 3
e "괜찮아졌다." (fx_warp="default")        # back to the settings file value
$ screen_fx.set_warp(5.0, duration=2.0)   # by script: grow gradually over 2 s
```

**A dungeon scene in ASCII, as if through a CRT (dialogue stays readable)**

```py
label dungeon:
    scene bg cave
    $ ascii.preset("glow")                        # so it isn't dark even under the overlay (the screen doesn't change yet)
    $ screen_fx.use("ascii", overlay=True)        # ASCII + VHS overlay with the TV turning off and on
    e "던전에 들어왔다."                      # only backgrounds and characters become characters; dialogue keeps its font
    $ ascii.set(cell=48, duration=2.0)            # vision falling apart
    e "눈앞이 흐려진다…"
    $ screen_fx.clear()                           # cancel: no effect + VHS overlay
    $ ascii.reset()                               # for the next time ASCII is used
```

**Setting "ASCII + VHS overlay from this line" with the editor**

1. Play until the line to change → F9 (dialogue tab).
2. [ASCII] in the "screen effect" row → [on] in the "overlay (VHS)" row. To turn even the dialogue window into characters, click [dialogue and names], [choices] and [menus and screens], which are on in the "text exclusion" row, to turn them off.
3. Ctrl+S → that line in the script becomes like `e "…" (fx="ascii", fx_overlay=True)`.

**Tuning ASCII character size while watching**

1. F9 → T to the "screen effects" tab → [ASCII] at the top.
2. Drag the "cell height" and "cell width ÷ height" sliders and turn "crisp" on or off. Choose the character list and coloring with buttons.
3. Compare by switching [none] / [all] in "text exclusion".
4. Ctrl+S → saved to `screen_fx/ascii_layout.rpy`, which takes priority over the settings file.

**Adding sounds to TV off/on and making it slower and heavier**

1. Put sound files at `game/audio/tv_off.ogg` and `game/audio/tv_on.ogg`.
2. Change `screen_fx.tv` in `screen_fx_config.rpy` as below. You can also tune the time and flash values with sliders in the editor's "screen effects" tab → "base effect, transition" and check with [preview: TV] (sound paths only in the settings file).

```py
define screen_fx.tv = {
    "off_time": 0.8,                  # turning-off time (seconds)
    "black_time": 0.6,                # black screen (seconds)
    "on_time": 1.0,                   # turning-on time (seconds)
    "line": 3,                        # line thickness (pixels)
    "flash": 1.0,                     # pure white when turning off
    "noise": 0.8,                     # lots of static when turning on
    "off_sound": "audio/tv_off.ogg",
    "on_sound": "audio/tv_on.ogg",
    "volume": 1.0,
}
```
