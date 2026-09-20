# Maths Brahmastra — Class X Maths (CBSE)

A complete, free study site for CBSE Class X Mathematics, by **Dr. PK**.

* One page per chapter, named after the chapter (`real-numbers.html`, `polynomials.html`, … `probability.html`).
* Each chapter has five tabs: **Learn** (concepts, theorems, formulas, every NCERT example) → **Watch** (free video lessons) →
  **Solve NCERT** (every exercise question solved) → **Board practice** (56+ board-pattern questions with solutions) → **Revise** (mind map, formulas, mistakes, checklist).
* Extra pages: Formula Sheet, two full Mock Tests, Exam Strategy, and **Board Papers & Documents** (lists whatever you upload to the `papers/` folder).
* Plain static files — no build step, no database, no server code. Works on phones, prints well, has a dark “blackboard” theme.

---

## Put it online with GitHub Pages (about 10 minutes, no software needed)

1. **Create the repository.** Sign in at <https://github.com>, click **+ → New repository**. Name it, for example, `class10-maths`. Choose **Public**. Click **Create repository**.
2. **Upload the site.** Unzip the site on your computer first (right-click → *Extract All*), and open the extracted folder. On the new repository page click
   **uploading an existing file**. Now select **everything inside the folder** — `index.html`, all the chapter `.html` files, the **`assets` folder**, the **`papers` folder**,
   `README.md`, `.nojekyll` — and **drag it from the File Explorer window into the browser window**. Wait for the upload to finish, then click **Commit changes**.
   * **Drag, don't pick.** The *choose your files* button cannot take folders, so it silently leaves `assets` and `papers` behind — and without `assets` the site shows up
     as plain black-and-white text with no design, no maths and no buttons. Dragging keeps the folders.
   * **Check before you leave:** the repository's file list must show an `assets` folder and a `papers` folder above the `.html` files. Missing? Click
     **Add file → Upload files** and drag just those two folders in.
   * *Can't see `.nojekyll`?* It is a hidden file, and your computer may not show it. Don't worry — the site works without it.
3. **Turn on Pages.** Go to **Settings → Pages**. Under *Build and deployment* choose **Source: Deploy from a branch**, **Branch: `main`**, folder **`/ (root)`**, and press **Save**.
4. **Open your site.** After a minute or two the same page shows the address: `https://YOUR-USERNAME.github.io/class10-maths/`. Share that link with students.

> Want the short address `https://YOUR-USERNAME.github.io/`? Name the repository exactly `YOUR-USERNAME.github.io` in step 1.

### If you prefer Git on the command line
```bash
cd path/to/unzipped/site
git init && git add -A && git commit -m "Maths Brahmastra: first publish"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/class10-maths.git
git push -u origin main
```
Then do step 3 above.

---

## Uploading board papers and other documents

The **Board Papers & Documents** page shows every file in the repository's `papers/` folder — automatically.

1. Open the repository on GitHub and click the `papers` folder.
2. **Add file → Upload files**, drag your PDFs in, **Commit changes**.
3. After about a minute press **Refresh** on the Board Papers page.

No `papers` folder in your repository? Upload the PDFs anywhere — the page also picks up any PDF, Word, PowerPoint, Excel or zip file it finds in the repository.

Group files with sub-folders (`papers/2025/`, `papers/2024/`, `papers/sample-papers/` …) — each becomes a heading. Name files so they read well:
`2025-maths-standard-set-1.pdf` is shown as “2025 maths standard set 1”. Keep each file under 25 MB.
On a custom domain, fill in your GitHub user name and repository once in `assets/js/site-config.js`.

Official sources for the last five years of papers: <https://www.cbse.gov.in/cbsenew/question-paper.html> (question papers) and <https://cbseacademic.nic.in/> (sample papers and marking schemes).

---

## If something looks wrong

* **The site is plain text on a white page, with a huge black shape at the top.** The `assets` folder did not reach GitHub. Open the repository, click
  **Add file → Upload files**, drag the `assets` folder in (the folder itself, from File Explorer), commit, wait a minute, then press **Ctrl + F5** on the site.
* **Maths shows as `\( x^2 \)` with backslashes.** Same cause — `assets/vendor/katex` is missing. Upload the `assets` folder again.
* **I changed something and the site still shows the old version.** GitHub Pages takes a minute or two; then press **Ctrl + F5** to bypass the browser's saved copy.
* **404 — "There isn't a GitHub Pages site here".** Check **Settings → Pages**: source *Deploy from a branch*, branch `main`, folder `/ (root)`. The repository must be public.

## Changing things later

* **Fix a typo or a number:** open the chapter's `.html` file on GitHub, click the pencil icon, edit, **Commit changes**. Maths is written in LaTeX between `\( … \)` and `$$ … $$`.
* **Author name / site name:** search and replace “Dr. PK” or “Maths Brahmastra” across the `.html` files.
* **Videos:** each chapter's *Watch* tab is plain HTML inside the chapter file (look for `class="video-grid"`). A video is identified by its YouTube id in `data-yt="…"`.
* **Colours and fonts:** all in `assets/css/style.css` (the colour tokens are at the top of the file).

## What is inside

```
index.html                     home page
<chapter-name>.html  × 14      the chapters
formula-sheet.html  mock-tests.html  mock-test-1.html  mock-test-2.html  exam-strategy.html  board-papers.html
assets/css/style.css           design
assets/js/app.js               tabs, progress ticks, MCQ checking, lazy maths rendering
assets/js/papers.js            lists the files in papers/
assets/js/site-config.js       optional settings (custom domain)
assets/vendor/katex/           KaTeX (maths typesetting), bundled — the site makes no external requests except YouTube when a student presses play
assets/fonts/                  Besley, IBM Plex Sans, Patrick Hand (SIL Open Font License)
papers/                        your uploads
.nojekyll                      tells GitHub Pages to serve the files as they are
```

## Credits and fair use

Follows the NCERT Class X Mathematics textbook (reprint 2026-27) chapter by chapter; question numbers match the book so that students can use the two side by side.
NCERT questions are restated for reference. Every explanation, solution, figure and practice question is original work. This is an independent study resource and is not
affiliated with NCERT or CBSE. Videos belong to their creators and play through YouTube's own player. Maths typeset with [KaTeX](https://katex.org) (MIT licence).

© Dr. PK. Free for students and teachers to use.
