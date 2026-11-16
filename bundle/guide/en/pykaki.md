<!-- 원본: pykaki/docs/GUIDE.md @ 1f560ebd61 -->
# pygaki user guide

A tool for writing Ren'Py scripts with boxes and lines and exporting them as Ren'Py script files (`.rpy`).

**Where to open it**: in the Ren'Py launcher of the pygaki bundle, select a project and press **[pygaki로 편집]** (Edit with pygaki). The web version (website, installable web app) was removed on 2026-11-12.

The in-app [Help] (F1) is the Korean version of this document. Button names here are the names shown when the language button is set to English.

---

## 1. A tour of the screen

- **Top row, left**: the project title (click to edit) and the big tabs **[Script | GUI | Effects | Shaders]**. In the app, next to them is the **game connection button** (light blue "● Connected to game" when attached to the game, yellow "◐ Game reloading" while the game rereads a changed script (it reattaches by itself when done), gray otherwise. Click it to go to GUI).
- **Top row, far right (green buttons)**: run the game. **[▶ Run in Ren'Py]** and [Follow game line].
- **Second row menu** (from the left): undo ↶ ↷, **[Focus]** (light purple button), settings, **Help**, then file New/Open/Save, project folder (Reload, Open folder, Other project), versions, Export. Dim normally, clear when the mouse is over them.
- **Left**: label (scenes, with box and layout buttons below), Characters, **Check** (errors and warnings that come up on export; click to go to that box), Ren'Py project info (project, script file, save state, number of images and sounds found), **Script** (the script to be exported; [Expand] to see it, [Copy], [Export .rpy]), Settings. Each group is a rounded card.
- **Right**: the same kind of cards as the left, without tabs. Click a box and you get the box, text effects, dialogue and next flow cards; click ◐ Shader and you get the shader and transition cards.
- **Panel size**: hover the border between the left or right panel and the canvas and the cursor becomes ↔. Drag to change that panel's width; double-click the border to reset only that panel. Panel borders in [GUI], [Effects] and [Shaders] drag the same way. **[Start size]** in the left "Settings" resets the panels of every screen at once, and **[Lock]** keeps them from changing when dragged. Sizes and the lock are remembered in this browser (app).
- **Center canvas**: boxes and lines. Zoom with the mouse wheel and drag an empty spot to pan. The small **‹ ›** buttons at both top ends of the canvas fold and unfold the left and right panels separately (they stay folded next time).

The first time you open it, a sample script ("A rainy day") is loaded. Press [New] to start with an empty script.

### Help and ⓘ
- The screen keeps long explanations out of the way. Hover the small **ⓘ** next to a panel name for a one- or two-line note; click it to open that part of this help.
- Open this help any time with **[Help]** in the second row menu or **F1**. It has a table of contents on the left and a search field at the top. Close it with Esc or [Close].
- The help is the same text as `pykaki/docs/GUIDE.md` in the repository (included as is when the app is built; Korean).
- Hovering a button also shows a short note on what it does.

### Canvas controls at a glance
The same list is under **Canvas controls ⓘ** at the top left of the canvas.
- **Double-click** a box to write right inside it. Double-click a dialogue line, title or choice to go to that field. Finish with Esc or a click on an empty spot.
- Click a box once to change the rest of its settings, like label and next flow, on the right.
- **Double-click** an empty spot on the canvas to make a new box.
- Drag the dot (●) under a box onto another box to connect them. Drop it on an empty spot to make a new connected box.
- **Double-click** a line to switch jump ↔ call.
- **Shift+drag** to select several boxes, **Delete** to delete them.
- Boxes in the same label (scene) share a color. Labels are managed in the list on the left.
- Click **◐ Shader** at the top right of a box or label to set screen shaders on the right. Dialogue sounds and speed are set per dialogue line, cursor and click-to-continue per box, in the cards of the box editor.
- Click [Fold] to the right of a card's title to fold it down to its name.

## 2. Basic concepts

| Term | Meaning |
|---|---|
| **Box** | a group of dialogue. You can write several lines in it. |
| **Line** | one of: narration, character dialogue, staging (background, show, hide, music, sound effect, pause, shake), flag change (⚑), direct command (⚙), memo (#) |
| **Connection line** | where to go after a box |
| **label (scene)** | a unit that groups several boxes. It becomes one Ren'Py `label`. Boxes in the same label have the same background color. |

## 3. Writing the script

### Registering characters
Press **Characters [+ Add]** on the left.
- **Color**: name color (exported as `Character(..., color=)`)
- **id**: the Ren'Py variable name. Use only English letters, digits and `_`. E.g. `a`, `alice`
- **Name**: the name shown on screen. E.g. Alice

Narration doesn't need to be registered.

### Making boxes
- **Double-click an empty spot** on the canvas to make a new box. Double-clicking inside a label's background puts it in that label.
- You can also use **[+ Box]** in "Boxes and layout" on the left.
- **Copying boxes**: select boxes (drag to select several), press **Ctrl+C**, then **Ctrl+V** to paste where the mouse is on the canvas. **Ctrl+D** duplicates the selected boxes right beside them. Lines between boxes copied together are reconnected between the new boxes; lines to other boxes still point to the original boxes. New boxes get new names (like n07), so they don't clash in the script. When the cursor is in a text field, Ctrl+C/V copies only text. You can paste between two script windows too (lines to boxes the other script doesn't have are cut). One Ctrl+Z removes everything pasted.

### Writing inside a box
- **Double-click** a box and the view glides and zooms in on it, with the cursor on the line you double-clicked. The box looks the same as when viewing; just edit the text in place.
- A small set of buttons sits **outside to the left** of the line with the cursor.
  - **⠿** drag to reorder lines
  - **Line type**: narration, character, staging, ⚙ command, # memo
  - **＋** new line below, **✕** delete line
- On a choice or condition line, the set **⠿ ◆ Choice (◇ Condition) ＋ ✕** appears outside to the left too. Drag ⠿ to reorder (the lines stay attached), ＋ adds one right below, ✕ deletes it. Deleting the last one with ✕ removes the choices (conditions) entirely and returns to **→ Next box** (connected to the box it was connected to; undo with Ctrl+Z). When hovering, ⠿ shows to the left of lines while viewing too.
- Click a staging line (🖼 background, 🎵 music, etc.) and its input fields appear **outside to the right**.
- A translucent **Next flow** window sits **outside to the right** of the box. Without opening the right panel (even in focus mode), pick one of five cards: **Next box**, **End (return)**, **Choices** (goes to the first choice field), **Condition** (goes to the first condition field), **Continue in next box** (goes to the connected box, or makes and connects a new one; for choices and conditions, the first branch not yet connected). Hover a card or select it with the arrow keys to see a description, a moving sample and the exported script beside it. Which box it connects to is set by dragging lines on the canvas. Click a line twice to switch to call.
  - **Alt+Enter**: enter the next flow window from the keyboard. Choose with the **arrow keys**, confirm with **Enter**. Press **Esc** or **Alt+Enter** again to return to your text.
  - **＋ Continue in a new box**: makes and connects a new box where nothing is connected yet, moves to it and lets you write right away.
  - **Ctrl+Shift+Enter**: continue in the next box. Goes to the connected box, or makes a new one and moves there. Keep pressing it to write box after box.
- **Ctrl+Enter**: new line below with the same speaker
- **Esc** or a click on an empty spot: finish editing. The view returns to where you were looking.

### Text styling and pacing (tag box)
- When the cursor is in a dialogue or narration text field, the **tag box** appears. When writing inside a box it shows **outside the top right** of the box; when writing in the right panel, above the text effect field.
- The tag box has one card per group (Text, Progress, Speed, and under More: Shape, Font and effects, Insert), each row named by a colored bubble.
- Hover the progress, speed, opacity, letter spacing or insert buttons for a moment and a **tooltip** shows the tag it inserts, a description, and a sample sentence playing one character at a time with that tag (click-to-continue shows ▼ and moves on by itself). While you drag a slider, the sample plays with that value.
- Select text and press a button to wrap just that part in a Ren'Py text tag. With nothing selected, it inserts a pair of tags and puts the cursor between them.
  - **B I U S**: bold `{b}`, italic `{i}`, underline `{u}`, strikethrough `{s}`. Shortcuts **Ctrl+B / Ctrl+I / Ctrl+U**. If you're already inside that tag, press again to remove it (select only the middle to remove it from just that part).
  - **Size**: **가−** and **가+** make it 10 smaller or larger (`{size=-10}`, `{size=+10}`, changes each press). Type `30` (that size), `+10`, `-10` or `*1.5` (1.5×) in the middle field and press Enter.
  - **Color**: opens a palette. 32 basic colors, this project's colors (the dialogue window's default text color, character name colors), 8 recently used colors, a `#rrggbb` field and [Custom]. Move with ←↑→↓ and choose with Enter. If you're already inside a color tag, only the color value changes; remove it with [Remove color].
  - **Progress**: [Click-to-continue] `{w}`, [Brief] `{w=0.5}` (the number is selected when inserted, so you can type the seconds right away), [Wait with line break] `{p}`, [Auto] `{nw}` (goes at the end of the text), [Up to here at once] `{fast}`, [Clear and continue] `{clear}`
    - **Clear and continue**: when the text up to here is shown, it waits for a click, makes the earlier text **invisible while keeping its space**, and the same person goes on speaking. With the line breaks and spaces as written, the next text appears in its original place (second line, third line …). E.g. with `Line 1{clear}`(line break)`Line 2{clear}`(line break)`Line 3`, line 1 appears; a click hides line 1 and shows line 2 in the second line's place; another click shows only line 3 in the third line's place. In the exported script it is split there into several dialogue lines by the same speaker. Tags spanning the split, like bold, color and speed, are reapplied to each part, and line settings like text effects and dialogue sounds are applied the same to each part. [Go here in Ren'Py] goes to the first part, and changing the dialogue position in the in-game editor and bringing it back to pygaki works only on the first part.
  - **Speed**: drag the slider or type in the number field and press Enter. Only the selected text appears at **that many characters per second** `{cps=20}` (the same unit as the text speed of the dialogue field). [Normal] removes the tag. A ratio tag inserted earlier, `{cps=*2}`, shows as "2× normal" beside it and changes to characters per second when you move the slider
  - **More ▾**: at the right end of the speed row. Click to unfold the rows below, click again to fold (remembered while unfolded).
    - **Opacity**: drag the slider or type a number to make the selected text faint `{alpha=0.5}`. At 1 the tag is removed.
    - **Letter spacing**: drag the slider or type a number (pixels) to widen the space between characters (negative narrows it) `{k=2}`. At 0 the tag is removed.
    - **Outline color**: the same palette as text color `{outlinecolor=#rrggbb}`. Shown only when the game's text style has outlines (`outlines`).
    - **Font**: with the game folder connected, pick a font file from `game` and `game/fonts` to change only the selected text `{font=file}`.
    - **Effects**: put a text effect on just the selected text `{shader=shake}text{/shader}`. The list shows the text effects that are turned on; open it again and choose [Remove effect tag] to remove it. The rest of the line appears with the line's text effect, or one character at a time if the line has none (on export `effect="typewriter"` is added to that line automatically; without it Ren'Py stops at that line). Effects that use outline layers, like color trails, can only apply to the whole line, so they aren't in the list. After choosing an effect, a **[Details]** button appears beside it; click it to open that effect's sliders. Move a slider and release it, and it is written into the tag like `{shader=wave:u__amplitude=8}`; press ↺ to reset just that value (with the cursor inside that tag). Can't be used in choice text (the [Check] card on the left tells you).
    - **Insert**: [Horizontal spacing] `{space=30}`, [Vertical spacing] `{vspace=30}` (the number is selected so you can retype it right away), [{ character] `{{`, [Ruby], inline images `{image=name}` (from a list when the game folder is connected).
    - **Ruby**: put small text above the selected text `{rb}text{/rb}{rt}reading{/rt}`. With nothing selected, it goes above the previous character. Put the cursor inside ruby text and a **[Ruby text]** row appears to set its size and color right there `{rt}{size=14}{color=#ffcc00}reading{/color}{/size}{/rt}` ([Default] removes both). The pygaki plugin (ui_kit 4.9) places it right above the main text of each dialogue line, and adds the same effect to ruby so dialogue with text effects doesn't stop. If the game sets `yoffset` of `style ruby_text` itself, that value is used.
- Tag text stays visible in the text field. See the result in the text effect field's preview and in the game (the preview draws effects on selected text with the same shaders as the game; ruby is shown as small text rather than placed above, inline images aren't shown, spacing is approximate). In boxes you're not editing, tags look faint and the text inside gets bold, italic, underline, color and opacity (size stays the same so the box shape doesn't change).
- Size, color, font and characters/second in the text effect field apply to **the whole line**; the tag box applies to **only the selected part**.
- If your selection would cross another tag (e.g. spanning the inside and outside of `{b}`), it doesn't insert and tells you.
- If text tags are turned off in the left settings, the tag box shows only [Turn on].

### Staging (background, characters, music, sound effects, pause, shake)
You don't need to know Ren'Py commands: choose **Staging** as the line type and fill in the fields. Below the fields, the Ren'Py command that will actually be exported is shown in green.

| Line type | Fields | Exported command |
|---|---|---|
| 🖼 **Background** | background name, how it appears | `scene bg room with fade` (clears all images on screen and lays down the background; an empty name gives a black screen) |
| 🧍 **Show** | choose character/background/other, name (expression for characters), position, how it appears, front/behind | `show a smile at left with dissolve` · `show a smile zorder 10` · `show ghost behind a` |
| 🙈 **Hide** | choose character/background/other, name | `hide a with dissolve` |
| 🎵 **Music** | play/queue/stop, file name, fade-in seconds, loop | `play music "audio/rain.ogg" fadein 2.0 noloop` · `queue music "audio/b.ogg"` · `stop music fadeout 1.0` |
| 🔊 **Sound effect** | play/stop, one at a time/overlapping, file name | `play sound "audio/door.ogg"` · `play audio "audio/door.ogg"` · `stop sound fadeout 1.0` |
| ⏸ **Pause** | seconds (empty: until click) | `pause 1.5` · `pause` |
| 💥 **Shake** | shake vertically / shake horizontally / white flash | `with vpunch` · `with hpunch` · `with Fade(0.1, 0.0, 0.5, color="#fff")` |

**How it appears** opens a picker when you click its button. At the top is a sample (the hovered effect changing from the old image to the new one), below are the basics (instant, dissolve, fade to black) and the list of image effects from the [Effects] screen. Only effects in the game's effects folder are listed, and effects hidden in the [Effects] screen are left out.

- **Front/behind** (show): which image is in front when they overlap. **Order default** puts the image shown later in front. **Front (number)** puts larger numbers further in front (other images are 0), and **Behind image** puts it behind the image with the tag you write (e.g. `mina`). Positions are set in the in-game editor.
- **Music**: **Play** cuts the current track and starts right away; **Queue** plays after the current track ends. **Fade-in** is the seconds the sound takes to rise (empty: immediately), **Loop** is game default (music loops), on or off. The fade-out of **Stop** is 1 second if empty; 0 stops immediately.
- **Sound effect**: **One at a time** (sound) cuts the previous sound effect with the new one; **Overlapping** (audio) lets several sounds play together. Stop stops the chosen channel. You can also add these with [Stop sound]/[Stop music] in the sound and music cards.
- **Pause and shake** are added right after the current line with [+ Pause] and [+ Shake] in the dialogue card, or chosen in the speaker field.

- Put **image files** in the game's `game/images/` folder with matching names.
  - Backgrounds: `bg name.png` (e.g. `bg room.png`)
  - Characters: `characterid expression.png` (e.g. with character id `a`, `a smile.png`)
  - Image names are safest in lowercase English letters, digits and `_`.
- Put **sound files** in the `game/audio/` folder and write only the file name. (e.g. `rain.ogg`)
- **Attributes** (expressions) on character dialogue use the same images. `a smile "line"` switches to `a smile.png`.

### Voice
Link a voice file to each character line. Click a box and press **[Turn on voice]** in the **[Voice]** card on the right (turns it on for the whole script).

- When on, each character line gets a **number** within its label (`🎙012` at the right of the line in the dialogue card). Once given, a number stays the same even if you insert or move lines, and a new line gets the number after the largest in that label.
- **File name rule**: `characterid_labelname_number` (e.g. character `mina`, label `ward`, number 12 → `mina_ward_012.ogg`). Put files with this name in the `game/audio/voice` folder and they link automatically (case doesn't matter). In the card, set each line to **By name / No voice / Choose file** and listen with ▶.
- Unfold **Lines without voice** at the bottom of the card to list lines in the whole script that have no file (a recording list). Click one to go to that line.
- **[Renumber]**: renumbers each label from 1 in order. Files you already made by name may stop matching.
- In the script, `voice "audio/voice/mina_ward_012.ogg"` goes right before the line. Dialogue split with `{clear}` plays the sound on the first part. Narration doesn't link voices.

### Shaders (on boxes and labels)
Shaders that cover the whole game screen (ASCII, VHS, Game Boy …) are set per box or label. Only works in projects with the pygaki plugins (the "pygaki plugin link" in the left [Settings]).

- Click **◐ Shader** at the top right of a box or label frame and the right panel turns into the shader picker. Click again or use [← Back to box] to return.
- **[Set on this box]**: choose slot 1 and slot 2. The two slots are shown stacked. If both are "None", shaders are off in that box.
- **Set on a label** and it applies to all boxes in that label. Anything set on a box itself comes first. If neither the box nor the label sets one, it looks as the game settings say.
- The button color tells you: filled color is set here; a dotted border is a box following its label.
- **Transitions**: transitions when a box starts and ends. Going from box to box, the next box's "on start" is used first; if that is **None**, the previous box's "on end" is used. The chosen transition plays even if the shader is the same. Only when both are **None** does it continue without a transition. When you first set a shader on a box, both start as **None**. Like shaders, transitions are chosen from a list: **TV off/on**, **Pixel sort**, **Datamosh**, **TV static**, **Test pattern**, **Tape stretch**, **Blink**, **None** (instant change). TV static (noise covers and clears), test pattern (a broadcast test screen shows briefly), tape stretch (the screen waves and stretches) and blink (flashes a few times) play while going from the previous box's last screen to this box's first screen, and the shader changes when the noise is thickest, when the test pattern ends, at the greatest stretch, and at the middle blink. These four also need effect files with the same names in the game's effects folder. When you choose an image transition, that effect's details appear below it. For blink, choose **Color**, **Count**, **On ratio**, **Fade out** and **Coverage**; combined with **Image transition time** below (from 0.1 s) it shows like "one blink 0.20 s". Pixel sort and datamosh are **crashes**. The previous box's last screen (drawn through all lines of that box, including images only shown after dialogue) breaks, freezes broken for a moment, then cuts abruptly to this box's first screen (drawn through the opening background and show lines). The two screens aren't blended, and the shader changes at the cut. The time is set with the **Image transition time** slider below (the first 40–45% is breaking, the rest frozen; at 1.4 s, about 0.6 s breaking and 0.8 s frozen). Pick the direction it breaks in **Direction** right below the chosen transition: datamosh (the previous screen melts as blocks get dragged, like a video that lost its keyframes, with the outline of this box's first screen showing through) has **Rotate** (blocks swirl) and **Spread** (dragged outward from the center); pixel sort has **Horizontal**, **Vertical**, **Rotate** (bands around a circle) and **Spread** (bands outward from the center). The transition plays after the opening background, show and hide lines of the box are drawn, and their "how it appears" is not used. These two need the effect files `pixelsort` and `datamosh` in the game's effects folder (included in new projects; otherwise add them from the [Effects] screen). When you choose TV, **[Details]** below it changes the off time, black screen, on time, scanline thickness, glow, static and volume for this box (label) only. Going to a box with no shader set, the previous box's "on end" still plays. Places set to "dissolve" or "as game settings" in older versions keep playing that way and show "old value" in the field. Choosing either option changes it.
- The picker lists the shaders in the connected game folder (the default shaders if not connected). If you added a new shader to the game, start the game once and press [Reload] to see it in the list.
- The shader panel has three cards: **Shader** (slots 1 and 2), **Transition**, and **Lines that go into script_flow.rpy** (code written at the first line of that box on export).
- Boxes with no shader set show what currently applies below the card: "Now: label's …" or "Now: as game settings".
- If the game uses older plugins, the panel tells you in orange: details need screen effects (screen_fx) 5.5, pixel sort and datamosh need 5.6. Anything unsupported is exported as TV off/on.
- **Details**: after choosing a shader in slot 1 or 2, unfold **[Details]** right below it and change values with sliders. Changed values are used only in this box (label); ↺ resets just that value. Unchanged values follow the game settings (edit those starting values in [GUI] → shader defaults while watching the game screen). Changing to another shader clears that slot's values. Works from pygaki plugin screen effects (screen_fx) 5.5.
- In the **[Shaders]** screen at the top, browse each shader's sample and sliders (not saved) and turn shaders on or off. [Transitions] plays an approximation of TV off/on, and plays pixel sort and datamosh on sample images.
- **[⚠ Apply to all boxes]** at the bottom of the shader card puts the current shader on every label (settings made on individual boxes are cleared). **[⚠ Delete all]** removes shaders from the whole script. Both ask first and can be undone with ↶.

### Dialogue sound and speed (per dialogue line)
The **Dialogue sound and speed** card below the **Text effects** card in the box editor applies to the one dialogue or narration line you're writing.
- For each value choose **[Inherit]** / **[This line]**. Inherit means text speed comes from the game settings (or the chosen text effect's default speed), and the dialogue sound from the sound set on the character → the game defaults ([GUI] → game defaults → cursor, click-to-continue, dialogue sound).
- **Text speed**: characters shown per second (0 shows all at once). Works without the plugins.
- **Dialogue sound**: a sound from the audio folder, or off. Listen with ▶. Exported only when the pygaki plugin link is on.
- **[All lines in this box]**: puts this line's speed and sound on the other dialogue and narration lines in the same box too (values set to [Inherit] on this line are cleared on those lines as well). Undo with ↶.

### Cursor and click-to-continue (per box)
The **Cursor and click-to-continue (CTC)** card in the box editor applies only to that box. Boxes without a setting don't inherit the previous box's; they go back to the game defaults. Works in projects with the pygaki plugins (ui_kit 4.7 or later).
- For each value choose **[Game default]** / **[This box]**.
- **Click-to-continue, cursor**: each folder inside game/gui/ctc and game/gui/cursor is one image set (images in the folder play in name order). Only those turned on in the game defaults change, and the cursor changes only when it's a software cursor.
- **[⚠ Apply to all boxes]** at the bottom of the card puts this box's values on all boxes, and **[⚠ Delete all]** removes them from the whole script. Both ask first and can be undone with ↶.
- Dialogue sound and speed set on boxes or labels in older versions are moved to that box's dialogue lines when the script is opened, and cursor and click-to-continue set on a label are moved to that label's boxes.

### Background, image and sound cards
Click a box and below the dialogue card are the **Background (image, video)**, **Image, video** and **Sound, music** cards. With a Ren'Py project connected, click images and sounds to add them right away (listen to sounds with ▶). **[📂 Pick file]** at the top of a card opens an Explorer window in game/images (game/audio for sounds). If you choose a file outside the game folder, it asks whether to copy it to game/images (movies for webm videos, audio for sounds), then copies and adds it (adding _2 if the name exists). Background card file names must start with bg (e.g. "bg room.png"). Without a connection, type the name. It goes **right before the line you're writing** (at the end of the box if there's none). Change its place by dragging the line in the dialogue card. The top of each card lists those lines already in this box; click one to go to it.

**Dialogue lines only hold text.** Character images (expressions) aren't attached to dialogue lines; choose them in the **[Image, video] card**. While writing a character's line, the top of this card shows that character's images (e.g. `a smile.png`, `a angry.png`); click one to put a show line (`show a smile`) right before that line. Without images, type the expression name. Expressions put on dialogue lines in older versions show as "expression smile ✕" next to the line and are exported as is (click to remove).

**In-use cards**: cards related to the line you're writing get a light green background and an "In use" mark. Writing dialogue: the dialogue and text effect cards; a background line: the background card; show and hide lines: the image card; sound lines: the sound card. Cards without the mark have nothing to do with the current line.

### Go here in Ren'Py, Move position (app)
When the game was started with [▶ Run in Ren'Py] and is connected to the app:
- **[Go here in Ren'Py]** in the box card: the game jumps to the first line of this box.
- Hover a line in the dialogue card and a small set of buttons pops out outside the card's left edge. **[Go here]**: the game jumps to that line. Dialogue and narration lines also have **[Move position]**. Press it and the game jumps to that line and opens the dialogue tab of the in-game editor. Drag it in the game window and press [Save] under that line to write the position into the script (the number in parentheses is how many changes will be saved). Close the editor with [Finish].
- Background and show lines (those lines in the dialogue card, and the line lists at the top of the background and image cards) have **[Move position]** too. The game jumps to that line and opens the image/video tab of the in-game editor with that line selected. Drag the image in the game window or change the transition, then [Save] to write it into the script (pygaki plugin ui_kit 4.8 or later selects the line for you). Hide lines have no position, so they have no button.
- If the next flow is choices, set the choice position the same way with **[Move position]**. The game goes to the box's last line, so advance once and the choices appear.
- Without a game connection, the box card buttons are gray and the per-line buttons are hidden.

### Folding cards
Cards in the left, right and GUI panels fold to a single line with their name (sky blue) when you click the gray **[Fold]** to the right of the title. **[Expand]** opens them again. Left panel cards all start folded each time; right panel cards remember which you folded. **[Fold all]** at the top right of a panel ([Expand all] when all are folded) folds or unfolds all its cards at once. The left panel's scrollbar is on the left.
- Old "✨ Screen effect" lines still work, but if you use box shaders at all, each box re-sets shaders on its first line, so it's best to use only one of the two.

### Line layout in the right panel
Click a box once and the same lines appear in the right panel. Each line has the line type, a handle (⠿) and delete (✕) in the **left column**, and the text in the **right column**.

### Reordering lines
**Drag the ⠿ handle** and drop it above or below another line to reorder. Works in the right panel and inside boxes on the canvas (inside a box, hover a line to see ⠿ on its left; you don't need to be editing text).

The side panels float over the canvas. Gaps between cards and space left by folded cards are see-through, showing the script behind, and clicking there moves the canvas too. Scroll inside a panel with the wheel over the cards.

### Direct commands and memos
- **⚙ Direct command**: write a Ren'Py command that the staging above can't do, as is. E.g. `show eileen at truecenter`, `$ renpy.pause(1.0, hard=True)`
- **# Memo**: a note for the writer. It goes into the script as a comment (`#`) and isn't visible in the game.
- **⚑ Flag change**: changes a flag at this point (e.g. turn on `met_alice`, `love` +1). Add it with [+ Change flag] in the dialogue card or choose it in the speaker field. See "Flags" below.

## 4. Connecting the flow

**Click a box once** and set its "next flow" in the **Edit** tab on the right.

| Kind | Meaning |
|---|---|
| **→ Next box** | Continues to the next box. |
| **◆ Choice** | Each choice goes to a different box. When writing inside a box, delete one with **✕** in the set outside to the left, or with **BackSpace** on an empty choice. Write a **question line** (speaker and text, e.g. "Shall I lend you my umbrella?") in the top row of [Next flow] on the right and it stays in the dialogue window while the choices are shown (a dialogue line right under `menu:`). Leave it empty for choices without a question. |
| **◇ Condition** | Goes to different boxes depending on conditions. On the **If** row, choose a flag with [Pick flag]; for on/off flags choose **is on / is off**, for number flags a number and **at least / at most / greater than / less than / equals / not equal**, for text flags text and **equals / not equal**. Add clauses with [+ Add clause] and they are joined with **and** (all must match) or **or** (any one matches). Press `{ }` to write a Ren'Py condition directly (e.g. `love >= 5 and (met_alice or rich)`; expressions the pickers can't show appear as a text field). Add **Else if** rows with [+ Condition]; if none of the conditions above match, it goes to the **Else** box. |
| **▣ Call screen** | Shows a screen made in the [Screen] tab and goes to a different box for each **return value** of the button pressed. Branches are made automatically from the screen's button values (buttons with the same value share a branch); if no value matches, it goes to **Else**. See "Making screens" below. |
| **⤷ Call and continue** | Calls another scene and, when it ends, comes back and continues to the "After return" box. Handy for scenes used many times. |
| **■ End (return)** | Ends here. In a scene called with call, it goes back to where it was called. |

### Connecting with lines
- **Drag the dot (●)** under a box (for choices and conditions, on the right of each row) and drop it on another box to connect them.
- **Drop it on an empty spot** to make a new connected box. The fastest way to keep writing.
- Click a line and press **Delete** to disconnect.
- **Double-click** a "next" line to change it to call; double-click a call line to change it back to "next".
- You can also pick the target from the list in the right panel.

### Flags (values the story remembers)
Values the story remembers and uses later to branch, like "did we meet Alice" or "affection". The same as Ren'Py variables.
- **Flag card**: always at the top of the right panel. Make one with [+ Add] (see "Flag recipes" below) and write its name (English letters, digits, _), type (**on/off**, **number**, **text**), starting value and a memo. Below it, **Used in** lists where it's used (✎ changes it, ? reads it); click to go to that box. Renaming a flag renames it everywhere it's used.
- **Change**: press **⚑** on a choice row and use [+ Change flag] under **On pick**. Choose a flag and set on, off or toggle (on/off), add, subtract or set (number), or text (text). To change one anywhere in a box, add a **⚑ Flag change** line. Press `{ }` to write an expression directly (e.g. `love += 2`).
- **Read**: write a condition in a choice's **Show if** and the choice is shown only when it holds (always shown if empty). You can also branch automatically with the next flow **◇ Condition**. Conditions are built by picking flags, the same as for conditions.
- On export, starting values like `default love = 0` go at the top of the script, `$ love += 1` where it changes, and `"Text" if love >= 5:` on choices. If a condition uses a name not in the flag card, [Check] tells you (a variable made in another file of the game is fine to use as is).
- **Look**: each flag shows its value as a control. Numbers use a **level indicator** (continuous bar, segmented bar, stars) or a **slider**, on/off uses a **switch**, and text uses a **pull-down** or a **combo box** (you can also type text not in the list). Pick it with [Look ▾] on the right; for numbers set the min and max, for text set the options (text found in the script shows up as + chips). In **Customize**, give each part (fill, background, thumb, ticks, on background and so on) a color or an image from the game folder.
- **Test value**: drag the look with the mouse (arrow keys work too) or click the switch to change the value, and **At this value** below shows what the script does: choices shown or hidden, which ◇ branch runs and what line comes next, and the value after each change. Test values aren't saved; [Back to start value] resets it.
- **Condition marks**: when a condition compares a number flag (a choice's show condition, a ◇ branch), numbered circles sit on top of the look. When the test value passes the threshold the circle turns into ✓, and the list below shows the choice as **Open**/**Locked** and the branch as **This branch**. Drag a circle sideways to change that condition's threshold (the 3 in `courage >= 3`). One undo puts it back.
- **Judgments**: at the bottom of the flag card, each ◇ branch box that splits on number flags gets a group. It has the looks of the flags it uses (drag for test values), each branch's condition (if, elif) and target box; the branch the current values take is shaded green with that box's first line. At the bottom, pick a judgment kind (**If all are enough**, **If any is enough**, **If the sum is enough**, **If it's the largest**), the flags and a threshold, then [+ Add judgment] adds it as the last branch (link its box with a line on the canvas). ↑ reorders branches (they're checked from the top). Open a ◇ box that doesn't use flags yet with [+ Open a ◇ box].

### Flag recipes
Press **[+ Add]** on the flag card to open the flag menu. Pick a common pattern (a recipe) such as affection or a scene seen once, and it makes the flags for you.

- Type a word in the search box at the top (for example affection, key) to filter the recipes. Choose with **↑ ↓** and make it with **Enter**. **Esc** or a click outside closes the menu.
- Hover a row or move to it with the arrows and an **explanation card** appears beside it: what the recipe does, a moving sample (the flag's look changes with the value, with the expression that made it and the line or choice below), where the flag is changed (✎) and read (?), and a few lines of the exported script.
- Choosing a recipe makes its flags with the starting value and memo filled in and moves to the name field. If the name is taken, a number is added, like `love_2`. One undo removes them.
- The menu only makes flags. Add the choice's "when chosen", the show condition and the ◇ condition branch yourself, following the explanation card.
- Use **Blank flag** to set the name, type and starting value yourself.

<!-- flag-recipes -->

### Tracing flags
Press **[▶ Trace]** in the flag card (from the start of the script) or **[▶ Trace]** in the box card (from that box, with flags at their starting values) and a window opens below the canvas. The script isn't changed.

- It shows the current box and the flags changed there (`kindness 0 → 1`), the path taken so far, and the current values of all flags. The canvas moves to that box too.
- **Choices**: choices whose Show if is false are dimmed and blocked; picking one applies its "On pick" changes and goes to that box.
- **Conditions**: the branch that matches the current values gets a green border. You can click other branches to go there too.
- After a call, when the called scene ends (return), it comes back to the "After return" box. **↶** steps back once, **[From start]** starts over.
- Expressions it can compute are numbers, text and on/off values, arithmetic like addition and subtraction, comparisons and and/or/not. Expressions with functions or the game's other variables show as "unknown"; then you choose yourself. `$ name += value` in direct command lines is computed too.

### Flag design
Press **[Design]** in the flag card and a table docks at the bottom of the canvas. It shows at a glance which boxes change and check each flag, and you can fix them right there. The canvas above stays usable.

- Rows are flags (name, type, and the values it can take somewhere in the script); columns are boxes in flow order. At first only boxes that use a flag are shown; turn on **[All boxes]** to see every box. Boxes not reachable from the start of the script are dim italics.
- Cells show where the flag changes **✎** (`+1`, `on`) and where it is checked **?** (`≥ 2`, `on`). Click a box name to move the canvas to that box.
- Click a cell to open a popover. Edit the change line, the choice's "On pick", Show if and condition branches with the pickers, and use **Add** below to put this flag into a change line at the end of the box, a choice's "On pick", Show if, or a condition branch. Empty cells can be clicked to add too. One undo takes it back.
- **Yellow marks**: flags not used yet, flags changed but never checked, flags checked but never changed (always the starting value), choices always shown or never shown, and conditions always true or always false. Values are counted as if every branch and choice is taken, so it only marks what is certain. When there are too many values (a loop, for example) it shows "many values" and does not mark.
- **[Build from template]**: a wizard opens to the right of the table. Go through **Template → Flag → Where it changes → Where it's checked → Review**.
  - The templates are the six flag recipes (affection, scene seen once, get and use an item, locked choice, choose a route, multiple endings). You can rename the flag, and if a flag with the same name and type exists, it is used.
  - **Where it changes**: pick the choices that raise (or turn on) the flag. For a scene seen once, pick the boxes that turn it on and a change line goes at the end of each box. For choose a route, write the text each choice remembers. For multiple endings, pick which flag each choice raises. The box selected on the canvas is highlighted.
  - **Where it's checked**: pick the box that branches with a condition branch, the threshold, and the box each branch goes to (a box that goes to the next box or ends, or one that already branches). For get and use an item and locked choice, pick the choices to put the condition on.
  - **Review** shows everything that will be added and warns ahead if it would get a yellow mark such as always true or always false. **[Create]** adds it all at once, and one undo takes it all back.
- **Esc** closes the popover, and once more closes the table. The save format is unchanged, so the script file and the exported .rpy are not affected.

### Start box
The game starts at the box with the green **Start** mark. To start from another box, click that box and press **[Set as start]**.

### Find and replace
**[Find]** at the top or **Ctrl+F**. Finds text in dialogue and narration, choices, choice questions and box titles (choose with the checkboxes; turn on **Aa** to match case). Enter for next, Shift+Enter for previous; click the list to go to that box. **[Replace]** replaces the current match, **[Replace all]** replaces every match and is undone with one Ctrl+Z. Close with Esc.

## 4-1. Making screens ([Screen] tab)

In the **[Screen]** tab at the top, drag and drop buttons to make a Ren'Py screen. Use it to let players click pictures instead of choices, like choosing a room, a map or an item.

- Make one with **[+ New screen]** on the left and add items with **[+ Text button] [+ Image button] [+ Text] [+ Image]** at the top center. The center shows it at the game's screen size (scaled down). Drag to move; move the selected item 1px at a time with the arrow keys (10px with Shift).
- The **Screen** card on the right: title, name (the Ren'Py screen name, in English), **background** (with none, the game screen underneath shows through; you can pick a color or an image name).
- The selected item's card: text, image name (the name in the `images` folder, e.g. `door`), for image buttons the **On hover** image (e.g. `door hover`), text size and color, position. Always write a **Return value** for buttons (e.g. `door`).
- In a script box's next flow, choose **▣ Call screen** and pick the screen; a branch dot appears for each button value. Connect them with lines.
- On export, the screen goes into `game/pykaki_screens.rpy`, and the script gets `call screen name` followed by `if _return == "door":` branches. Even if you only change a screen, auto export rewrites the screen script.
- Preview the exported text in the bottom card. If you delete a screen, boxes that called it become "No screen" and [Check] tells you.

### HUD (show screen)
The screen card has two **Kinds**. A **full screen** (`call screen`) covers the dialogue and waits until a button is pressed. A **HUD** (`show screen`, an info panel on top of the game screen) stays in a corner while the dialogue keeps going. Affection bars, bags, minimaps and clocks are made this way. The videos below are samples recorded in Ren'Py (choices and buttons were clicked automatically; the text in the videos is Korean).

#### Making a HUD in the [Screen] tab
- **[+ HUD from template]** on the left: pick **Inventory** (shows only items whose on/off flag such as `has_key` is on), **Affection bar** (number flag `love`), **Minimap** (place buttons; the current place is the text flag `place`) or **Use an item** (drag the key onto the door to turn on `door_open`). Hover a menu row to see a video recorded in Ren'Py and the script in the card next to it (↑↓ to pick, Enter to create, Esc to close). It also creates the flags it needs, reusing flags with the same name. You can also switch an existing screen's **Kind** to **HUD**.
- Screen card: **Size** (px), **Anchor** (nine cells: top left, top center … bottom right), **Offset** (px from the anchor), **Order** (`zorder`, higher is in front), **Background** and **Opacity**. You can also drag an empty part of the HUD on the stage. Item positions are measured from the HUD's top-left corner.
- **[+ Bar]**: shows a number flag's value as a bar. Pick the flag, the full value, the size, and the fill and empty colors.
- **[+ Flag look]**: brings in the look made in the flag card (level indicator, slider, switch, pull-down or combo) with its customization (colors, images) as is. Here you only pick the flag, place and size; changing the look updates the HUD right away. In the game it only shows the value (bars move smoothly when the value changes, stars use the DejaVuSans font, text flags show the value as text). Ren'Py's `Solid` has no rounded corners, so put in images for a round thumb or switch.
- Put `[flag name]` in a **Text** to show its value in game (e.g. `Affection [love]`). Insert it with **[Flag ▾]** next to it. The stage draws with the flags' starting values.
- **Show if** for each item: the same field as a choice condition (e.g. if `has_key` is on). On the stage, items hidden right now are faded, and items with a condition get a green **?**.
- A button's **On click**: **Change flag** (any number of changes; dialogue keeps going), **Jump to box** (jumps to that box) or **Open/close HUD** (shows or hides another HUD). Full screens can also **Return a value** (branching as before).
- **Drag and drop**: turn on **Draggable** for a text or image item to let players drag it in game (it snaps back when dropped). Add a box with **[+ Drop zone]** and pick what it **Accepts** (one draggable item, or any) and **On drop** (same as a button's "On click"). On full screens a drop can also return a value to branch. Dragged items move only inside their screen's box. On the stage, draggable items get a **✋** and drop zones are dashed boxes.
- Turn on **Always show** to keep the HUD up without HUD lines (`config.overlay_screens`).
- In the script, use **[+ HUD]** in a box's dialogue (or the line type **📟 HUD**) and pick **Show** (`show screen name`) or **Hide** (`hide screen name`). Once shown, it stays up across boxes until you hide it.
- **▶ Trace** shows the HUDs that are up, small, with the current flag values. The Flags card lists the screens that use a flag as **?** (shows it) and **✎** (a button changes it), and the Flag design table's yellow notes count HUD uses too.

#### HUD template samples
These videos run screens made with [+ HUD from template] in Ren'Py, unchanged (clicks and drags were automated for recording; the text in the videos is Korean). The template menu's card shows the same videos.

**Inventory**: each item appears when its flag turns on (Show if `has_key`, `has_map`).
<!-- clip hud-inventory -->

**Affection bar**: when `love` goes up, the bar and the number follow smoothly.
<!-- clip hud-love -->

**Minimap**: a place button goes to its box (`Jump`), and when the box changes `place` the "Now:" text changes too.
<!-- clip hud-map -->

**Use an item (drag and drop)**: the key dropped elsewhere snaps back; dropped on the door it turns `door_open` on and `has_key` off. Dialogue doesn't advance while you drag.
<!-- clip hud-use -->

```
draggroup:
    if has_key:
        drag:
            drag_name "key"
            dragged _PkBack(24, 64)      # snaps back when dropped
            text "Key"
    drag:
        draggable False
        dropped _PkDrop("key", [SetVariable("door_open", True), SetVariable("has_key", False)])
        text "Door (drop here)"
```

Below is how HUDs behave in Ren'Py and what the script looks like.

| | call screen ([Screen] tab) | show screen (HUD) |
|---|---|---|
| Dialogue | Waits until the screen closes | Keeps going while the screen stays up |
| Size | Usually the whole screen (`modal True`) | Small, in a corner. You set position and size |
| Closing | A button returns a value and closes it (`Return`) | `hide screen`, or a button that opens and closes it (`ToggleScreen`) |
| Result | Branch on the returned value `_return` | Buttons change flags (`SetVariable`) or go somewhere else (`Jump`) |
| Used for | Location maps, big menus | Status panels, minimaps, bags, clocks |

#### call screen vs. show screen
<!-- clip screen-compare -->
The first half is what the [Screen] tab makes: the screen covers the dialogue and you must pick something to move on. The second half is a HUD: once shown, it stays while you advance several lines, and `hide screen` closes it.

```
call screen big_map          # waits until you pick
if _return == "cafe":
    jump cafe

show screen mini_map         # stays up, dialogue goes on
e "The map stays in the top right."
e "It doesn't go away when you advance."
hide screen mini_map
```

#### Affection bar (a HUD that shows a flag)
<!-- clip screen-hud -->
A HUD reads flags directly. When `love` goes up with each choice, the bar and the number follow on their own. Nothing else in the script needs to change.

```
screen love_hud():
    frame:
        xpos 16 ypos 70
        vbox:
            text "Mina's affection"
            bar value AnimatedValue(love, 5, 0.6)
            text "[love] / 5"

label cafe:
    show screen love_hud
```

#### Bag (inventory)
<!-- clip screen-bag -->
An always-visible [Bag] button opens and closes the bag window. The bag shows only what you have, using on/off flags, and item buttons change flags. The script reads those flags to continue.

```
screen bag_button():
    textbutton "Bag":
        action ToggleScreen("bag_panel")

screen bag_panel():
    frame:
        vbox:
            if has_key:
                textbutton "Key (use)":
                    action SetVariable("door_open", True)
            text "Note"

if door_open:
    "You use the key and the door opens."
```

#### Minimap
<!-- clip screen-map -->
A place button jumps straight to that scene (`Jump`). The current place is remembered in the text flag `place`, and the map uses it to highlight where you are.

```
default place = "home"

screen mini_map():
    frame:
        xalign 1.0 ypos 70
        vbox:
            for key, nm in (("home", "Home"), ("cafe", "Cafe")):
                textbutton nm:
                    action Jump("map_" + key)
                    selected place == key

label map_cafe:
    $ place = "cafe"
    scene bg cafe
```

#### Words used with HUDs
| Ren'Py | Meaning |
|---|---|
| `show screen name` / `hide screen name` | Show or close it from the script (**📟 HUD** line) |
| `config.overlay_screens` | Keep it up for the whole game (screen card "Always show") |
| `zorder` | Which is on top when screens overlap |
| `text "[love]"`, `bar value …` | Show a flag's value as text or a bar |
| `if has_key:` / `showif` | Show only when a condition holds |
| `SetVariable`, `ToggleVariable` | A button changes a flag |
| `Jump("label")` | A button goes to that scene |
| `ToggleScreen("name")` | Open or close another HUD |
| `Return("value")` | Close a call screen and return a value (the [Screen] tab's "Return value") |
| `draggroup`, `drag` | Drag and drop (the [Screen] tab's "Draggable", "Drop zone") |

- Use the flags you made in pygaki's flag card as they are (`default love = 0` is added on export).
- HUDs made in the [Screen] tab go into `pykaki_screens.rpy` (hand edits are overwritten on the next export). For things the tab can't make (`for` loops, `selected`, scrolling `viewport`), write a new `.rpy` file in the `game` folder (e.g. `my_screens.rpy`).

## 5. Managing labels (scenes)

- Change names, display titles and colors in the **label list** on the left.
  - The **name** is the Ren'Py label name, so use only English letters, digits and `_`. E.g. `chapter1_rain`
  - The **display title** can be anything.
- Click a number button to move the view to that label's boxes.
- To move a box to another label, choose it under **label** in the right panel. There's also **[+ Split into new label]**.
- Select several boxes with **Shift+drag** and you can **group them into one label** on the right.
- **[Make first box of label]**: sets the box where that label starts.

## 6. Tidying up (auto layout)

In the "Boxes and layout" panel on the left.

- **[Arrange all]**: arranges top→bottom in flow order from the start. Boxes of the same label are gathered in one cluster.
- **[Arrange label]**: arranges only the label the selected box belongs to.
- **[Arrange selection]**: arranges only the boxes selected with Shift+drag.
- You can change the direction (top→bottom / left→right).
- If you don't like it, undo with **Ctrl+Z**.

## 7. Checking in the game, text effects

The play screen inside pygaki was removed. You view the script by running it as a Ren'Py game.

- **[▶ Run in Ren'Py]**: exports the current script and starts the game in Ren'Py right away. If the game is already running, it doesn't start it again; it only exports the script (the game reloads by itself). To start another one on every press, turn off "Ignore if the game is already running" in [Settings]. Works in the app inside the Ren'Py SDK bundle. If Ren'Py can't be found it tells you; start it with the launcher's [Launch Project].
- **Beside the game window**: turn on "Move this window beside the game window when connected" in [Settings], and every time the game connects this window moves to the free space beside the game window (right, or left if there's no room). The game window stays as it is. If the side is too narrow, it overlaps at the screen edge (Windows only).
- **[Go here in Ren'Py]**: moves the game to that box or line (chapter 3 "Go here in Ren'Py, Move position").
- **Text effect field**: below the box card in the right panel, following the dialogue line you're writing. Choose size, color, font, characters/second and text effects per line. Left empty, they follow the game settings. Hidden together with the panels in focus mode.
  - **Effect 1 and 2**: text effects come in two rows, "1" and "2". Choose an effect in each row and remove it with ✕. Choose both and the two effects run together (e.g. slide and stop + slight shake).
  - **Details**: press [Details] beside an effect to adjust its values (duration, distance, strength, color, etc.) with sliders. Shown in the preview right away; ↺ resets to the default. If values were changed, the button shows how many.
  - **Text box**: change [No box] to [Speech bubble] or [Rounded frame] and a box surrounds the dialogue text. For the speech bubble you can choose the tail direction (down, up, left, right, none), and for both a tilt (degrees). Speech bubbles use dark text unless you set a text color. The preview is an approximation; see the exact shape in Ren'Py. Exported only for games with the pygaki plugins.
  - **Effects folder**: put effect files (`.glsl`) in the game's `game/ui_kit/effects` folder and they appear at the end of the text effect list and at the end of the "how it appears" list of background/show lines. Take a file out and it disappears from the lists (the samples too). Adding, removing and hiding can be done by clicking in the **[Effects] screen** (chapter 7-1). By hand, to only hide one from lists without deleting it, write effect names one per line in `effects_off.txt` in that folder. Lines that already use a hidden effect keep working. Samples included: rise from below, letter spacing closing in, light sweep (text), iris open, bands cover and open (images). See the image ones in the [Effects] screen samples and in the game. How to make a new effect is in that folder's `README.md`.
  - **Preview**: the top field shows this line's text with its effects. You don't need to start Ren'Py. Text effects are drawn with the same shader code as Ren'Py. Changing a value plays it again; click the field or ↺ to see it again. Text is fitted to fill the field, so the size field's value doesn't show here.
  - **Text effects**: Ren'Py's built-in effects (dissolve, flip, grow, jitter, wave) and pygaki plugin effects (scatter and gather, fall, random order, color flash, big stamp in, cursor typewriter, color trail, glitch, blur to sharp, block glitch, shimmer, VHS static, float up, tilt in, stretch in, slide and stop, slight shake, box per character, stamp, squash and bounce, 3D text). pygaki plugin effects are exported only for games with the pygaki plugins. If an old script still has effects removed from the list (typewriter, blurred wait, melt, datamosh, flip out, LED board, split up and down, spin, light bleed, draw from top, outline fill, pop zoom, pop out), they show by name in the field and appear one character at a time in the game.
  - **Default characters/second**: effects that only show when characters appear one at a time (all except jitter, wave, shimmer and VHS static) appear at 30 when the field is empty, and are exported that way. Write another value to use it.
  - **Ren'Py sample**: choose an effect and a short video of it recorded in Ren'Py appears. The sentence is an example.
  - Typing one character at a time: no effect, only characters/second (e.g. 30)
  - Shaking after appearing all at once: characters/second empty, effect `jitter`

## 7-1. Managing effects ([Effects] screen)

Press **[Effects]** at the left of the toolbar to see text effects (how dialogue text appears) and image effects (how backgrounds and characters appear) in one place. Press **[Script]** to go back.

- **[Shaders] section**: press Shaders in [Text effects | Image effects | Shaders] at the top to list the shaders that cover the whole screen (the ones chosen in the ◐ Shader of boxes and labels). **[Hide]** removes one only from the picker (boxes already using it keep working); **[Unhide]** brings it back. On the right you see a **sample** (a sample image with the shader applied using the same shader code as the game; [Choose] lets you use your own image), **detail sliders** and where it's used. Values set with the sliders are only for viewing and aren't saved. [View] takes you to that box's shader panel. The ASCII shader needs the game to generate character images, so the app can't show its sample.
- **Gallery / list**: **[▦ Gallery]** at the top left (the default) shows a grid of cards with a preview image for each effect, so you can scroll and compare many effects at once. Text effects show the moment when text is half shown, image effects mid-change, shaders over the sample image. Hover a card to animate just that card; click it to adjust details in the right panel. **[▶ Animate]** keeps up to 6 cards on screen animating (newly visible cards take over as you scroll). It makes the computer work a bit more; [❚❚ Stop] returns to still images. Card images are made one at a time; while they're being made, **"Making images 12/35"** and a progress bar show beside it and disappear when done. **[☰ List]** shows just the names, one per line. The [Shaders] screen works the same.
- **Left list**: switch with [Text effects | Image effects] at the top and filter by typing a name in the search field. Each row shows the display name, the English name, how many lines use it in the script, and where it comes from (Ren'Py / default / project).
- **Hide / Unhide**: press **[Hide]** on a card and that effect is removed only from the pickers in [Script] and the in-game editor (the card is marked "Hidden"). Dialogue already using it keeps working. Press **[Unhide]** to bring it back. The effect file isn't deleted. Use it to hide effects you don't use when the list is long.
- **Hidden to bottom**: while **[Hidden to bottom]** at the top is on (on at first), hidden effects gather at the bottom of the list and gallery. Pressing Hide moves that card down right away. Turn it off to see them mixed in their original order. The number on the button is how many are hidden. The [Shaders] section has the same button.
- **Effect files**: only effects in the game's `game/ui_kit/effects` folder are shown. Updating the pygaki plugins brings new effects along. The app doesn't add or remove effect files. Even in a game where effect files were deleted by hand, lines using those effects don't stop; they run with the default look (text one character at a time, images dissolve, no shader).
- **Copy new effect prompt**: copies text to give Claude when asking for a new effect. Add the look you want and hand it over. The app sends nothing out.
- **Sample on the right**: the chosen text effect plays on sample text. You can change the sample text; click the field or [Replay] to see it again. Moving the **Details** sliders replays it right away. Values set here aren't saved (values are set per dialogue line in [Script]).
- **Image effect sample**: the chosen image effect plays as a change from the "old image" to the "new image" (drawn with the same shader code as the game). [Choose] lets you try your own image file as the new image (not saved). The sliders include the duration. The **How to write it in the script** row shows the current values like `with img_fx.use("bands", 1.4, count=10)`; [Copy] it to use in a direct command line. In background, show and hide lines, choose an image effect in "how it appears", then press **[Details]** beside it to set the duration and values with sliders (applies only to that line).
- **Used in**: lists the lines using that effect; [View] takes you to that box in [Script].
- Without a connected Ren'Py folder (a game with the pygaki plugins), you can only browse. Hiding works after connecting.

## 8. Checking and exporting

- **Check** tab: shows things that would be problems in Ren'Py, like unconnected lines, empty dialogue and bad names. Click an item to go to that box.
- **Image name check**: with a Ren'Py project connected, it checks whether the images of background and show lines exist in the game. Image names are "tag attributes" (e.g. `mina smile`), so it warns when none of that tag's images, among file names in the `images` folder (`movies` for videos) and `image` definitions in the game's code, has all the attributes written on the line (and shows that tag's image names). It only warns and doesn't block export. Tags made with `layeredimage` aren't checked for attributes.
- **Script** tab: preview and copy the `.rpy` to be exported.
- **[Export .rpy]**: choose the game folder's **`game/` folder** as the location. `script_flow.rpy` is the recommended file name, so it doesn't clash with the existing `script.rpy`.
- After exporting once, **Ctrl+E** (or [Again to same place]) overwrites it right away.
- Press **Shift+R** with Ren'Py running to reload the changed script.
- **Auto export** (with a Ren'Py folder connected, pygaki plugin ui_kit 4.2 or later): edit the script and pause for a moment, and `script_flow.rpy` is written without pressing Ctrl+E; a game running in developer mode reloads by itself. If the [Check] card on the left has errors, it doesn't export until they're fixed.
- **[Follow game line]** (toolbar): when on, the reloaded game goes to the line you're writing (rolling back if it's a line already passed, otherwise skipping ahead to it). Turn it off if you want to look through from the start after editing many places. When off, the game stays where it was.

> **Caution**: if you edit the exported `.rpy` directly in VSCode, it will be overwritten on the next export. Always edit the script in this tool.

### Special characters in dialogue
- `[` is converted automatically so it shows as is (`[[`).
- Ren'Py text tags like `{b}bold{/b}` can be used as is (or inserted with the tag box). To turn this off, change it in **Settings** on the left.
- Mismatched tag pairs show up in the [Check] card on the left. `{/b}` without an opening tag stops Ren'Py, so it's an error; unclosed tags and tags Ren'Py doesn't know are warnings.
- A bare `%` stops Ren'Py. New scripts convert it to `%%` automatically. If an old script shows a `%` error in the [Check] card on the left, turn on **Settings → % as literal text**.

## 9. Saving and backups (important)

| Method | Description |
|---|---|
| **Auto save** | Saved inside the browser on every change. Even if you close the tab, reopen it and continue. |
| **[Save version]** | Keeps that moment with a memo. Restore from **[Version list]**. Automatic backups are made before Open, New and Restore. |
| **Automatic snapshots** | Kept in [Version list] every 5 minutes when something changed. Only the latest 30 are kept. |
| **[Save] (Ctrl+S)** | Saves to a `.flow.json` file. **This is the real backup.** |

- Auto saves and versions live **only inside that browser**. Clearing browser data or moving to another browser or computer loses them.
- So at important points, always save a file with **Ctrl+S** and keep that file in a **synced folder like Dropbox**.
- In Chrome/Edge, after saving once, Ctrl+S overwrites the same file right away.
- To continue on another computer or browser, load the `.flow.json` with **[Open]**.
- An **orange ●** on the file save row in "Ren'Py project info" on the left means "there are changes not saved to a file". The time of the last auto save is shown below it.

## 9-1. Using it with the pygaki plugins

The [pygaki plugins](https://github.com/halftomatodev/pygaki/tree/main/showpy) are Ren'Py plugins for adjusting the screens with the mouse while the game runs. **Text and text styling can be set here; images, videos, sounds, positions and screen effects in Ren'Py.**

Press **[Connect Ren'Py project]** in "Ren'Py project info" on the left and choose the project folder, and you're done. After connecting, [Change folder] [Reload] [Disconnect] appear in the top row.

- It finds and connects the `game` folder, and turns on the link if the pygaki plugins are there.
- It makes `game/script_flow.rpy` right away. Run it in Ren'Py and it starts from the first box. You can leave `script.rpy` as it is.
- From then on, export with **Ctrl+E**.
- Add images or sounds in the Ren'Py editor and come back to this window, and the added lines appear in the script.
- **The script file is also saved in that project folder**: `ProjectName.flow.json`. It is written when you press Ctrl+S or Ctrl+E. If the folder already has a script file, it asks whether to open that script or use the current one.
- When you reopen the browser, you need to allow permission once more.
- If you choose the `game` folder directly, the script file isn't saved to the folder. To keep writing in the app, choose the project folder above game.
- Using `e` as a character id clashes with `define e` in `script.rpy`. Use another id.

What changes when the link is on:
- The **position** of dialogue and names and per-line **screen effects** are set in the dialogue tab of the Ren'Py editor (Shift+M). Save, come back to this window, and the values show in the text effect field; they stay when you export again.
- Staging line fields suggest file names from the folder.
- The image position field disappears. Positions are set by dragging in the Ren'Py editor.
- **It doesn't overwrite another script's export**: on the first export after opening the window, if the folder's `script_flow.rpy` has many boxes that aren't in the current script, auto export stops and tells you at the bottom. To overwrite with this script, press Ctrl+E and choose [OK]. The script before overwriting is kept as `script_flow.rpy.bak`.
- For games without the pygaki plugins, it exports with this link off. Text styling, speed and text effects still apply.

For detailed steps and troubleshooting, see the [pygaki plugin customization guide](https://github.com/halftomatodev/pygaki/blob/main/showpy/docs/CUSTOM_GUIDE.md) (this guide's "Plugin customization guide" chapter).

## 9-2. Desktop app (Ren'Py bundle)

In the Ren'Py launcher of the pygaki bundle, select a project and press **[pygaki로 편집]** (Edit with pygaki) to open the pygaki app.

- That project's script opens right away. No folder linking or permission windows.
- The script is **saved automatically on every change** to `ProjectName.flow.json` at the top of the project folder. This file is the source of the script.
- Exporting with Ctrl+E writes straight to `game/script_flow.rpy`.
- Image and sound lines added in the in-game editor are written into the script as soon as they're saved.
- In the top row, [Open folder] opens the project folder and [Other project] opens another project in a new window. [Reload] rereads the folder's images and sounds and the lines added by the in-game editor.
- Choosing another `.flow.json` with [Open] shows both scripts (number of boxes, lines, save time); [OK] brings its content into this project's script. [New] empties this project's script (the current script is backed up in the version list).
- If the project folder has several `.flow.json` files, you choose which one to open the first time. After that it opens the chosen file; choose again with [Choose another script file] in "Ren'Py project info" on the left.

### Scripts written in the old web version
The web version was removed. If you have a `.flow.json` saved with Ctrl+S on the web, bring it in with the app's [Open]. Script files record which version saved them; a script written by a newer version than the app shows a "newer version" warning in the left panel.

### The [GUI] screen (side by side with the game)

Press **GUI** in **[Script | GUI | Effects | Shaders]** at the left of the toolbar to switch to decorating the game screens. If you start the game with [Launch Project] in the Ren'Py launcher (developer mode), it connects by itself and the game connection button at the top turns light blue. "GUI ⓘ" at the very top has a short guide, and the ⓘ on each left panel card explains that section. Use it with the game window and the app window side by side.

- **Center**: shows which screen the game is on, which script line it's running and the lines around it. For a script written in pygaki, press [Script box: …] to go to that box. Click a script line and the game goes to it (rolling back if already passed, otherwise restarting the game and skipping to that line). [Hide marks: on/off] hides marks like `# @l:` only on screen (line numbers and the script file are unchanged). If the game's pygaki plugins are new (`ui_kit` 4.5 or later), marks are attached at line ends like `"line"  # @l:l1` instead of on separate lines above, making the script much shorter. Games with older plugins get the old style.
- **Left**: the list of things to adjust, in group cards: splash (logo, warning, controls guide and your own pages, one each; clicking moves the in-game editor to that page too; edit shortcuts sits right below the controls guide) / title menu (title menu, title shader, shader defaults) / in-game menu (ESC menu, in-game menu shader) / confirm dialogs, UI text / **game defaults** (dialogue box, choices, image and video placement, cursor, click-to-continue, dialogue sound). Things changed per box are done in [Script] (dialogue and choice positions with [Move position], images and sounds in the box's background, image and sound cards, dialogue sound and speed in the dialogue line's card, cursor and click-to-continue in the box's card). The right panel is cards too (saving and the in-game editor / the editing section).
- **Right**: the editing section.
  - **Title menu, in-game menu**: choose an image or webm video from the game folder in **Background** at the top. Without one, the title is a black screen and the ESC menu is transparent (the game screen shows behind). Choose **Title, subtitle** at the bottom of the list to write their text (empty: hidden). Select an item or text and change position, rotation, tilt, scale, text size, color, font and **text effects** (the same list as dialogue text effects). Drag the pink square above the selected text in the game screen to rotate it (Shift: 15° steps). (pygaki plugin 4.20, ui_kit 3.19 or later) Dragging an item in the game screen updates the numbers too. [Normal/Selected] and [This item only/All items] are chosen here too. If the game isn't on that screen, [Go to title] and [Open ESC menu] appear.
  - **Cursor, click-to-continue (CTC), dialogue sound**: change text speed, dialogue sound and volume ([Listen] plays in the game), click-to-continue indicator and cursor on/off, 12 image slots, every frame/every 2 frames, cursor mode and click hotspot, and the quick menu here. Click a slot to show the game folder's images below; click an image to put it in that slot and move to the next. See text speed and the image animation in the preview at the bottom. Turning the cursor or click-to-continue indicator on or off shows after saving, once the game reloads. Put cursor images in `game/gui/cursor/` and click-to-continue images in `game/gui/ctc/` (in order from 1, 64×64 recommended; new pygaki projects include samples). Image slots have a checkered background so white images are visible. **Cursor and shaders**: choose whether the cursor receives shaders (both slots / slot 2 only / no shaders), then pick a line and [Apply from here] like in the shader section. (pygaki plugin ui_kit 3.15 or later; cursor and shaders 4.22 or later)
  - **Title shader, in-game menu shader**: choose slots 1 and 2 for shaders that apply only to that screen from this game's shaders (default, ASCII, VHS, shimmer …). The two slots stack. "Cancel all shaders" sets both to default. Choose the in-game menu shader with the ESC menu open (during play, [Open ESC menu] appears).
  - **Shader defaults**: opening the section shows slots 1 and 2 right away. A choice shows on the game screen immediately, and the chosen effect's detail properties (text exclusion, presets, sliders) appear right below that row ([Fold details] at the end of the row). Here you adjust the **look** of shaders while watching the game screen and [Save]. **Which scenes get them is set in [Script]** with the ◐ Shader at the top right of boxes and labels (chapter 3 "Shaders"). For the shader at game start, use [Expand initial state] at the bottom. The panel's line list and [Apply from here] are the same as in the in-game editor; for scripts written in pygaki, box shaders are easier (if you mix the two, the shader on the box's first line applies first). The tree diagram isn't opened in the app (G in the editor in the game window).
  - **Dialogue, choices, image placement, quit message and button text**: the same buttons, sliders and input fields as the in-game editor panel appear here. Font, color and image pickers open at the top of the section. Dragging in the game screen and shortcuts (like R to replay) are done in the game window. On the title, choosing the dialogue or image section shows [Start game]; during play, choosing the title shader shows [Go to title]. (pygaki plugin ui_kit 3.16 or later. With older versions it's marked "in game" and opens in the in-game panel)
  - **Splash**: choose a page and change background color, background and logo images, title and body text, position, when to advance and duration. [View this page] shows that page in the game window (click to close). Saving writes it to `splash/splash_layout.rpy`. Title and body sentences are edited in `splash/splash_config.rpy`. (pygaki plugin 4.18, splash 1.2 or later) Add or remove pages with [Show] [Don't show] under "On game start" at the top, and the row below tells you whether it shows when the game starts now and, if not, why. [Show again] clears "don't show next time" and the viewed record. (splash 2.1 or later)
  - **Edit shortcuts** (below the splash controls guide): each line has a function name and a key button. Ren'Py's default functions (advance dialogue, skip, screenshot …) and the preset actions (quick save, open preferences …) are there from the start. Press the key button, then press the new key in the game window (Esc cancels; pressing and releasing Ctrl alone gives Ctrl). [+] adds one more key. Clicking a function name shows [키 단추로] (pick with key buttons, for the app), [키 빼기] (remove keys), [처음 키로] (back to the first keys) and a description cell. If another function already uses the key, a warning and guidance appear, and it only changes when you press [그쪽에서 빼고 바꾸기] (remove it there and change). Press **[안내 화면으로 내보내기] (export to the guide screen)** and the splash controls guide table follows these settings; pick which functions to show by clicking them in the list in the controls guide section. Changed keys also go into the ESC controls screen list automatically. Changes apply to the game right away, and saving writes `hotkeys/hotkeys_layout.rpy`. (pygaki plugin hotkeys 1.2, splash 2.5 or later)
- **[Save]** (or Ctrl+S) is the same as saving in the in-game editor. Values are saved to `*_layout.rpy` in the game folder or to the script.
- While connected to the app, the editor panel in the game window is hidden. To show it in the game window too, press the [Editor in game window: hidden] button at the top or **F9** (anywhere in the app, and also in the game window while the editor is open). Press again to hide it. The app remembers this for the next time it attaches to the game. While it's visible in the game window, the editing section moves to the game window. Change shortcuts in Settings → Shortcuts.
  - **Text fields**: long text fields (splash text, UI text, etc.) appear three lines tall across the panel. Change each with [Wide]/[Narrow] beside it; the app remembers. Enter finishes, Esc cancels, line break is `\n`.
  - **Confirm dialogs, UI text**: change the quit confirmation ("Are you sure you want to quit?"), [Yes] [No], and the text of quick menu and menu buttons. See the dialog right away with [View this dialog]; button text changes after saving, once the game reloads. (pygaki plugin ui_kit 3.23 or later)
  - **Image and video placement**: open Explorer with [Open images folder] or the open-folder button in the image picker to add files.
- **The game doesn't advance while editing**: choosing a section opens the in-game editor, and meanwhile clicks and keys on the game screen go to the editor (for dragging). "Editing | Esc to close" above the game screen means you're in that state. To continue the game, press Esc in the game window or [Close editor] in the app. Going to the [Script] screen closes it automatically. The cursor/dialogue sound section doesn't open the editor.
- Connects only to games with pygaki plugin (ui_kit) 3.14 or later.

## 10. Focus mode and preferences

### Focus mode
Press **Ctrl+\\** (**Ctrl+₩** on a Korean keyboard, or **[Focus]** in the toolbar) to hide the toolbar, left and right panels and minimap, leaving only the canvas. Press again to bring them back.

- While writing in a double-clicked box, an **underline cursor** blinks. Even with an empty screen, you can tell that you're writing and where.
- In focus mode, while writing inside a box, **only the line with the cursor is sharp**; other lines in the same box are faint and other boxes and lines fainter still. Hover a faint box to make it sharp for a moment. Choose how faint in [Settings].
- Shortcuts (save, new line, etc.) still work in focus mode.

### Language
**한국어 / 日本語 / English** in the top row changes the language of the script editor's screen text. The choice is remembered on this computer. This help (F1) switches to that language too (the same text as the Japanese and English pygaki guide). The script (dialogue, box titles) and the exported script don't change. Text without a translation yet shows in Korean.

Languages elsewhere:
- **In-game editor** (Shift+M): each click on the panel's **[Language]** button goes 한국어 → 日本語 → English. The choice is remembered per game and starts out following the game's language. Only the editor's text changes; the game screen (dialogue, menus, the text you're editing) stays as it is
- **The pygaki buttons in the Ren'Py launcher** ([Edit with pygaki], [pygaki guide], [Update plugins]) and their messages follow the launcher's language setting (Preferences → Language): Korean for Korean, Japanese for Japanese, English otherwise. [pygaki guide] opens the guide in that language too

### Preferences
Change them in **[Settings]** at the right of the toolbar. These settings are saved only in that browser and don't go into the script file.

- **Text color** (top of settings): choose the text color. In any theme, all text, including text on boxes and labels, becomes that color. **[Auto (theme color)]** goes back to the color the theme picks for the background brightness.
- **Screen theme**: choose from **Apple style** (default), **Dark** and **Custom**.
  - **Apple style**: a theme inspired by Apple's design. White tones with blue and gray accents. No borders: rounded white cards (boxes) are told apart only by the background color, and label backgrounds are painted in the colors from the label list on the left.
  - **Dark**: choose just a **background color** and an **end color**, and it blends between them, painting background → label background (30%) → boxes (55%) automatically. In this theme boxes can't be painted individually; they all follow the gradient (box colors you painted show in other themes). The default is black → purple. [Start colors] resets it.
  - **Custom**: choose the background, surface and box colors one by one. (Text color is set in Text color at the top)
- **Label border** (0–6px, default 3px): thickness of the line grouping boxes of the same label. At 0 the line is hidden.
- **Box color (saved in this script)**: paints the selected box. Click a color swatch or type a hex code (#RRGGBB or #RGB). Clear it with [Back to label color]. The color is saved in the script file and can be undone with Ctrl+Z. This is the only screen setting that goes into the script file.
- **Font**: just Pretendard 500. It's included in the app, so it shows without the internet.
- **Run in Ren'Py** (app): with "Ignore if the game is already running" on, pressing [▶ Run in Ren'Py] while the game is running only exports the script and leaves the game as is. Off, each press starts another game. Whether it's running is known from the connection to a game with the pygaki plugins and from games started by this app.
- **Focus mode dimming**: off, light, normal, strong
- **Shortcuts**: click the key field of the action to change and press the new key. Esc cancels. Esc (finish editing), Delete (delete) and F1 (help) can't be changed.
  - To avoid clashing with typing, Ctrl or Alt must be held too. F2–F12 can be used alone (F1 is help).
  - Choosing a key used by another action clears that action's shortcut.
  - **[Reset to default]** returns to the original keys.
- **[Reset all settings]** (bottom of the settings window): resets the screen theme, font, focus mode dimming and shortcuts to defaults. The script and box colors stay.

## 11. Shortcuts (defaults)

| Key | Action |
|---|---|
| Double-click a box | edit inside the box |
| Double-click an empty spot | new box |
| Ctrl+\\ | focus mode on/off |
| Ctrl+Enter | (while editing) new line with the same speaker |
| Ctrl+Shift+Enter | (while editing) continue in the next box (new box if none) |
| Alt+Enter | (while editing) open/close the next flow window from the keyboard (arrows to choose, Enter to confirm, Esc to close) |
| Ctrl+B / Ctrl+I / Ctrl+U | (in a dialogue text field) bold / italic / underline tag on selected text |
| Esc | finish editing the box |
| Delete | delete selected boxes/lines |
| Shift+drag | select several boxes |
| Ctrl+S / Ctrl+Shift+S | save / save as |
| Ctrl+E | export `.rpy` again to the same place |
| Ctrl+Z / Ctrl+Y | undo / redo (inside text fields too; in the settings window and flag name fields, only that field's text) |
| Alt+N | new box |
| Ctrl+C / Ctrl+V | (outside text fields) copy selected boxes / paste at the mouse position |
| Ctrl+D | duplicate selected boxes |
| Ctrl+F | find and replace (if open, to the search field) |
| F1 | help |

Everything except Esc, Delete and double-click can be changed in [Settings].

## 12. FAQ

- **I can't edit in a box** → try reloading with Ctrl+F5. An old version may be cached.
- **Ren'Py shows an error** → first check the ⛔ items in the **Check** tab. Non-English characters or spaces in label names or character ids cause errors.
- **Can I share it with others?** → to exchange scripts, send the `.flow.json` file. The recipient brings it in with the app's [Open].
- **I can't see explanations** → hover the ⓘ next to a section name, or open [Help] (F1) and type a word in the search field.
