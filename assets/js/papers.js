/* Board Papers page: lists every file in the repository's papers/ folder — and, so that nothing gets lost,
   any document (PDF, Word, PowerPoint, Excel, zip) uploaded anywhere else in the repository.
   Order of attempts: papers/index.json (optional manual list) → GitHub API → jsDelivr listing. Cached for 20 minutes. */
(function () {
  'use strict';
  var cfg = window.MBX_CONFIG || {};
  var dir = (cfg.papersDir || 'papers').replace(/^\/+|\/+$/g, '');
  var listEl = document.getElementById('papers-list'), statusEl = document.getElementById('papers-status');
  var folderLink = document.getElementById('papers-folder'), uploadLink = document.getElementById('papers-upload');
  var refreshBtn = document.getElementById('papers-refresh');
  if (!listEl) return;

  var user = cfg.githubUser || '', repo = cfg.githubRepo || '';
  if (!user && /\.github\.io$/i.test(location.hostname)) {
    user = location.hostname.split('.')[0];
    var seg = location.pathname.split('/').filter(Boolean);
    repo = (seg.length && !/\.html?$/i.test(seg[0])) ? seg[0] : user + '.github.io';
  }
  var CACHE = 'mbx:v1:papers:' + user + '/' + repo;
  var SKIP = /(^|\/)(readme\.md|index\.json|\.gitkeep|\.ds_store|thumbs\.db)$/i;
  var DOCS = /\.(pdf|docx?|pptx?|xlsx?|odt|odp|ods|rtf|zip)$/i;
  var hasDir = true;
  function wanted(path) {
    if (/^assets\//i.test(path)) return false;               // the site's own files
    if (path.indexOf(dir + '/') === 0) return true;           // anything inside papers/
    return DOCS.test(path);                                   // documents uploaded anywhere else
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pretty(name) { return name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/^./, function (c) { return c.toUpperCase(); }); }
  function size(b) { if (!b && b !== 0) return ''; return b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
  function kind(ext) { ext = ext.toLowerCase(); return ext === 'pdf' ? '' : /^(docx?|pptx?|xlsx?|txt|csv)$/.test(ext) ? ' doc' : /^(png|jpe?g|gif|webp|svg)$/.test(ext) ? ' img' : ' oth'; }
  function status(t) { if (statusEl) statusEl.textContent = t; }

  function render(files, source) {
    files = files.filter(function (f) { return !SKIP.test(f.path); }).sort(function (a, b) { return a.path.localeCompare(b.path, undefined, { numeric: true }) * -1; });
    if (!files.length) {
      listEl.innerHTML = '<div class="dropzone"><p><b>No documents have been uploaded yet.</b></p><p>Dr. PK: see “How to upload documents” below — PDFs added to the <code>' + esc(dir) + '</code> folder (or anywhere else in the repository) appear here automatically.</p></div>';
      status('0 documents'); return;
    }
    var groups = {}, order = [];
    files.forEach(function (f) {
      var rel = f.path.indexOf(dir + '/') === 0 ? f.path.slice(dir.length + 1) : f.path, parts = rel.split('/'), g = parts.length > 1 ? parts.slice(0, -1).join(' / ') : '';
      if (!groups[g]) { groups[g] = []; order.push(g); }
      groups[g].push({ name: parts[parts.length - 1], path: f.path, size: f.size, title: f.title });
    });
    order.sort(function (a, b) { return a === '' ? 1 : b === '' ? -1 : b.localeCompare(a, undefined, { numeric: true }); });
    var html = '';
    order.forEach(function (g) {
      html += '<h3 class="folder-h">' + esc(g ? pretty(g) : (order.length > 1 ? 'Other documents' : 'All documents')) + '</h3><ul class="file-list">';
      groups[g].forEach(function (f) {
        var ext = (f.name.match(/\.([a-z0-9]+)$/i) || [0, 'file'])[1], href = f.path.split('/').map(encodeURIComponent).join('/');
        html += '<li><span class="ext' + kind(ext) + '">' + esc(ext.toUpperCase().slice(0, 4)) + '</span><span class="nm">' + esc(f.title || pretty(f.name)) +
          '<small>' + esc(f.name) + (f.size ? ' · ' + size(f.size) : '') + '</small></span><span class="acts"><a class="btn small" href="' + href + '" target="_blank" rel="noopener">Open</a><a class="btn small" href="' + href + '" download>Download</a></span></li>';
      });
      html += '</ul>';
    });
    listEl.innerHTML = html;
    status(files.length + ' document' + (files.length === 1 ? '' : 's') + (source ? ' · ' + source : ''));
  }

  function getJSON(url) { return fetch(url, { headers: { 'Accept': 'application/json' } }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }

  function fromManifest() {
    return getJSON(dir + '/index.json').then(function (d) {
      var arr = Array.isArray(d) ? d : (d.files || []);
      if (!arr.length) throw new Error('empty');
      return arr.map(function (f) { return typeof f === 'string' ? { path: dir + '/' + f } : { path: dir + '/' + (f.file || f.path || f.name), size: f.size, title: f.title }; });
    });
  }
  function fromGitHub() {
    if (!user || !repo) return Promise.reject(new Error('no-repo'));
    var api = 'https://api.github.com/repos/' + user + '/' + repo;
    var tree = function (br) { return getJSON(api + '/git/trees/' + encodeURIComponent(br) + '?recursive=1'); };
    var p = cfg.branch ? tree(cfg.branch) : tree('main').catch(function () { return getJSON(api).then(function (r) { return tree(r.default_branch); }); });
    return p.then(function (t) {
      var all = t.tree || [];
      hasDir = all.some(function (n) { return n.path === dir || n.path.indexOf(dir + '/') === 0; });
      links();
      return all.filter(function (n) { return n.type === 'blob' && wanted(n.path); }).map(function (n) { return { path: n.path, size: n.size }; });
    });
  }
  function fromJsDelivr() {
    if (!user || !repo) return Promise.reject(new Error('no-repo'));
    return getJSON('https://data.jsdelivr.com/v1/packages/gh/' + user + '/' + repo + '@' + (cfg.branch || 'main') + '?structure=flat').then(function (d) {
      return (d.files || []).filter(function (f) { return wanted(f.name.slice(1)); }).map(function (f) { return { path: f.name.slice(1), size: f.size }; });
    });
  }

  /* "Open folder" / "Upload" buttons: point at papers/ when it exists, otherwise at the top of the repository */
  function links() {
    if (!user || !repo) return;
    var base = 'https://github.com/' + user + '/' + repo, br = cfg.branch || 'main', tail = hasDir ? '/' + dir : '';
    if (folderLink) { folderLink.href = base + '/tree/' + br + tail; folderLink.hidden = false; }
    if (uploadLink) { uploadLink.href = base + '/upload/' + br + tail; uploadLink.hidden = false; }
  }
  function load(force) {
    status('Loading the list of documents…');
    links();
    if (!force) {
      try { var c = JSON.parse(localStorage.getItem(CACHE) || 'null'); if (c && Date.now() - c.t < 20 * 60 * 1000) { if (c.hasDir === false) { hasDir = false; links(); } render(c.files, 'saved list — press Refresh for the latest'); return; } } catch (e) { }
    }
    (location.protocol === 'file:' ? Promise.reject(new Error('local')) : fromManifest()).then(function (f) { render(f, ''); }).catch(function () {
      return fromGitHub().then(function (f) { try { localStorage.setItem(CACHE, JSON.stringify({ t: Date.now(), files: f, hasDir: hasDir })); } catch (e) { } render(f, ''); });
    }).catch(function () {
      return fromJsDelivr().then(function (f) { render(f, 'list may be a few hours old'); });
    }).catch(function () {
      if (!user || !repo) {
        listEl.innerHTML = '<div class="dropzone"><p><b>The document list appears once the site is live on GitHub Pages.</b></p><p>You are viewing the site from a computer or a custom domain. Files placed in the <code>' + esc(dir) + '</code> folder will be listed here automatically after publishing (for a custom domain, fill in <code>assets/js/site-config.js</code>).</p></div>';
        status('Not connected to a GitHub repository');
      } else {
        listEl.innerHTML = '<div class="dropzone"><p><b>Could not load the list just now.</b></p><p>GitHub limits how often the list can be requested from one network. Try again in a few minutes, or use “Open folder on GitHub”.</p></div>';
        status('List unavailable for the moment');
      }
    });
  }
  if (refreshBtn) refreshBtn.addEventListener('click', function () { load(true); });
  load(false);
})();
