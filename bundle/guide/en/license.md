<!-- 원본: bundle/guide/parts/license.md @ 02e968934b -->
# Notes and licenses

## Using it with other code

- `ui_kit` redefines Ren'Py's default screens `main_menu`, `navigation` and `choice`, and `hotkeys` redefines `keyboard_help`. If another plugin or your own code defines the same screen again, whichever runs later wins.
- `splash` hooks into Ren'Py's `splashscreen` label. If your script already has `label splashscreen:`, put `call splash_play` inside it. The splash shows only when the game is first started and not again with Shift+R (check it with `splash.preview()`).
- Using the `screen_fx` VHS effect together with another CRT shader applies the effect twice.
- `screen_fx` shows the dialogue window on the `sfx_say` layer and choices on the `sfx_choice` layer (`config.say_layer`, `config.choice_layer`). If other code expects the dialogue window on the `"screens"` layer, set `screen_fx.split_text_layers` in `screen_fx/screen_fx_config.rpy` to `False`.
- `screen_fx` uses `config.say_arguments_callback` to accept `fx=` (`fx_transition`, `fx_overlay`, `fx_exclude`) in dialogue parentheses. A function that other code already set is still called after it. If you delete the `screen_fx` folder, dialogue lines with `fx=` raise errors, so remove those parentheses too.
- The `ui_kit` editor is drawn on the top layer that screen effects don't reach. While you use any tab other than the effects tab, `screen_fx` effects are turned off for the moment.
- Transparent webm videos use Ren'Py's side_mask style (left half color, right half alpha). How to make them is in `ui_kit/README.md`.

## Licenses

- The original VHS shader is CC0 (credit optional). The code was written anew, taking the idea of an MIT-licensed shader for the ASCII shader, the look of cool-retro-term (GPL) for the retro terminal, and the dither pattern of Retro dither (CC0) and the LCD look of Gameboy Classic Shader (GPL) for the Game Boy shader (credits in chapter 15 of `screen_fx/README.md`).
- `screen_fx/fonts/neodgm.ttf` (NeoDunggeunmo) is SIL OFL 1.1. You may include it in a game and distribute or sell it; when you distribute, put `neodgm_OFL.txt` alongside.
- `Galmuri*.ttf` and `GalmuriMono*.ttf` (Galmuri) in `game/fonts/` of a new project are also SIL OFL 1.1. When you distribute, put `Galmuri-OFL.txt` alongside.
- The pygaki editor (in-game editor) panel font `ui_kit/editor/fonts/Galmuri9.ttf` (Galmuri9, SIL OFL 1.1, with `Galmuri-OFL.txt` in the same folder) is used only in developer mode and is left out of distributions.
- `Galmuri*.ttf` and `GalmuriMono*.ttf` (Galmuri) in `game/fonts/` of new projects are also SIL OFL 1.1; when you distribute, put `Galmuri-OFL.txt` alongside.
- The pygaki editor (in-game editing screen) panel font `ui_kit/editor/fonts/Galmuri9.ttf` (Galmuri9, SIL OFL 1.1, with `Galmuri-OFL.txt` in the same folder) is used only in developer mode and is left out of distributions.
- The pygaki plugins are MIT-licensed. For files with other licenses, like fonts, see `THIRD_PARTY.md` in the repository.
- The pygaki app is MIT-licensed. Licenses of the bundled fonts and libraries are in the `pykaki/licenses/` folder of the repository.
