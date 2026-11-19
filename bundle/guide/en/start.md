<!-- 원본: bundle/guide/parts/start.md @ 34c59b7072 -->
# Getting started

## What pygaki does

A set of tools that lets you make Ren'Py games without learning Ren'Py code.

* **pygaki** (the [Script] tab of the pygaki app): an editor where you write your script with boxes and lines. Set dialogue, choices, backgrounds, images, sounds and screen shaders, and it exports a Ren'Py script (`game/script_flow.rpy`).
* **pygaki plugins**: four plugins (`ui_kit`, `screen_fx`, `hotkeys`, `splash`) you put in the `game/` folder of a Ren'Py game. They change the title menu, choices, dialogue style and text effects, full-screen shaders and the splash screen, and include an **in-game editor** that lets you adjust things with the mouse while the game runs.
* **pygaki app**: [Script] (write the script) + [GUI] (connects to the running game and drives the in-game editor from the app) + [Effects], [Shaders] (browse effects and hide them).
* **pygaki bundle**: the Ren'Py SDK + the plugin template + launcher buttons + the pygaki app, packed into one folder for Windows.

Language: the language button at the top right of the pygaki app switches the script editor and the app's [Help] to Japanese or English. The in-game editor switches with the [Language] button on its panel, and the pygaki buttons added to the launcher follow the launcher's language setting. This guide gives a translation next to button names as they appear on Korean screens.

| I want to | Where |
| --- | --- |
| Write dialogue, choices and the story flow | pygaki [Script] |
| Branch the story on flags (variables) and conditions | the flag card at the top of pygaki's right panel, and the box's next flow "Condition" (Alt+Enter) |
| Set dialogue text size, font, color, speed and text effects | the text effect card of a dialogue line, the tag box of the text field |
| Set screen shaders, transitions, dialogue sounds, cursor and click-to-continue per box or scene | the ◐ Shader of a box or label |
| Add images, webm videos, music and sound effects | the box's background / image·video / sound·music cards |
| Position dialogue, choices and images | the line's [Move position] → drag on the game screen → [Save] |
| Change the look of the whole game, like the title menu and cursor | pygaki app [GUI] (same as the in-game editor) |
| Browse effects and shaders, hide them from lists | pygaki app [Effects], [Shaders] |
| Fine-tune with values in the settings files | the "Plugin customization guide" chapter of this guide |

## Download and your first project

1. GitHub repository [github.com/halftomatodev/pygaki](https://github.com/halftomatodev/pygaki) · Download [github.com/halftomatodev/pygaki/releases/latest](https://github.com/halftomatodev/pygaki/releases/latest)
2. Start the launcher with `renpy.exe`.
3. In **[+ Create New Project]** at the bottom left of the launcher, choose **Pygaki** and set the name and resolution.
   * The Pygaki template creates a Korean project (sample script and common text). Change the game's language with Ren'Py's settings (`game/options.rpy`, `game/tl/`).
4. Select the project in the list on the left and press **[pygaki로 편집]** (Edit with pygaki); the pygaki app opens that project. The script is saved automatically to `ProjectName.flow.json` in the project folder.
5. Press **[▶ Run in Ren'Py]** in the tabs at the top of the app to start the game and see it. If you start it with the launcher's [Launch Project] instead, the app's [GUI] still connects to the game (green dot).

If Windows shows a "Windows protected your PC" window the first time you start the app, press [More info] → [Run anyway] (the app is not signed). You can reopen this guide with the launcher's **[pygaki 안내서]** (pygaki guide) button or from `pygaki/pygaki_guide_en.html` in the bundle.

## What's in the plugins

Four plugins that change the screens just by putting their folders in `game/`, without editing the `screens.rpy` of Ren'Py's default template. They are tested on Ren'Py 8.6.1 (and also work on 8.5.3). You can pick only the ones you need (each works without the others).

| Folder | What it does | Files you edit |
| --- | --- | --- |
| `ui_kit` | title menu, choices, cursor, click-to-continue indicator, dialogue sounds, text speed, quick menu, per-line dialogue style, name position, speed, text effects, ruby, image and video placement, the effects folder (`ui_kit/effects/`), the in-game editor | `title_menu_config.rpy`, `choice_menu_config.rpy`, `custom_ui_config.rpy`, `say_style_config.rpy`, `stage_config.rpy` |
| `screen_fx` | full-screen shaders. Stacks slot 2 (overlay) on slot 1 (base effect). Per-scene changes and transitions, excluding text, title shimmer | `screen_fx_config.rpy`, `<name>_config.rpy` for each shader |
| `hotkeys` | add and remove hotkeys, descriptions in the controls screen | `hotkeys_config.rpy` |
| `splash` | logo, warning and controls pages shown before the title | `splash_config.rpy` |

## Defaults after installing

* `ui_kit`: the title uses a sample layout on the left, slightly tilted; choices look like Ren'Py's default (fade in); cursor etc. off; dialogue style on; images and videos on (`bg` at the very back, videos in `movies/` registered).
* `screen_fx`: no base effect, VHS overlay on, a shimmer shader on the title. New projects made with the pygaki bundle start with the overlay off. To turn it on, change `define screen_fx.overlay = False` in `game/screen_fx/screen_fx_config.rpy` to `True`.
* `hotkeys`: nothing changes.
* `splash`: on. Three sample pages (author name, warning, controls) are shown.

Each feature can be turned off separately with a switch (`enabled`) in its settings file; when off, it looks exactly like Ren'Py's default.

## Installing only the plugins

For putting them into an existing Ren'Py project without the bundle.

1. Copy the folders you want from `showpy/game/` in the repository into the project's `game/` folder. If an older version is there, first delete that folder including the `.rpyc` files. **If you install the same plugin twice**, you get errors like "given a default a second time".
2. Edit the `*_config.rpy` in each folder. Don't edit the engine files.
3. Run Lint from the launcher.

Detailed settings are in each folder's `README.md` (Korean). `README.md` files are left out automatically when you build the game for release.

## Removing and updating

* Remove: delete the whole folder including the `.rpyc` files and you are back to Ren'Py's default. If `.rpyc` files remain, the deleted code keeps running.
* Update: **[플러그인 올리기]** (Update plugins) on the first screen of the new bundle's launcher. Select a project on the left and press it; it shows "current version → new version" and replaces only the engine and editor files. It keeps the `*_config.rpy` you edited, the `*_layout.rpy` saved from the editor and the `*_off.txt` hide lists (only adding settings files that are missing), cleans up files that existed only in the old version, and deletes `.rpyc` files. The plugins as they were before are kept in `ui_kit_backup/plugins/date_time/` in the project folder. Close the game first. To do it by hand, replace the `ui_kit`, `screen_fx`, `hotkeys` and `splash` folders entirely and delete `.rpyc` files (set aside your edited `*_config.rpy` and the `*_layout.rpy` saved from the editor, and put them back). Update the app to the same version too (a script saved by a newer app makes an older app show a "newer version" warning). What changed in each version is in `showpy/CHANGELOG.md` in the repository.
