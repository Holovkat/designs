const TYPE_COLORS = {
  Architecture: '#58a6ff', Component: '#f778ba', Domain: '#7ee787',
  Decision: '#d29922', Process: '#bc8cff', Deprecation: '#f85149',
  State: '#79c0ff', Inbox: '#ffa657', unknown: '#8b949e'
};
const DIR_ORDER = ['architecture','components','domain','decisions','process','deprecation','state','inbox'];
const RELATIONSHIP_DEFINITIONS = Object.freeze({
  depends_on: { inverse: 'required_by', color: '#58a6ff', lineStyle: 'solid', cycle: 'invalid' },
  implements: { inverse: 'implemented_by', color: '#3fb950', lineStyle: 'solid', cycle: 'invalid' },
  supersedes: { inverse: 'superseded_by', color: '#f778ba', lineStyle: 'solid', cycle: 'invalid' },
  derived_from: { inverse: 'source_for', color: '#bc8cff', lineStyle: 'dashed', cycle: 'invalid' },
  contradicts: { inverse: 'contradicts', color: '#f85149', lineStyle: 'dashed', symmetric: true },
  blocked_by: { inverse: 'blocks', color: '#d29922', lineStyle: 'dotted', cycle: 'warning' }
});
const RELATIONSHIP_PREDICATES = Object.keys(RELATIONSHIP_DEFINITIONS);
const STABLE_ID_PATTERN = /^okf-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const PERMANENT_TYPES = new Set(['Architecture', 'Component', 'Domain', 'Decision', 'Process', 'Deprecation', 'State']);

if (typeof mermaid !== 'undefined') {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'strict',
    secure: ['secure', 'securityLevel', 'startOnLoad', 'maxTextSize', 'suppressErrorRendering', 'maxEdges'],
    maxTextSize: 50000,
    maxEdges: 500,
    suppressErrorRendering: true,
    deterministicIds: true,
    deterministicIDSeed: 'okf-viewer',
    markdownAutoWrap: false,
    flowchart: { useMaxWidth: true, htmlLabels: false },
    er: { useMaxWidth: true },
  });
}

let allConcepts = [];
let allLinks = [];
let allWarnings = [];
let cy = null;
let activeFilters = new Set();
let datasetReport = Object.freeze({ schema: 'okf-viewer-data/1', inbox: 'excluded', includedPaths: [] });
let currentView = 'browse';

function legacyParseFrontmatter(content) {
  const text = content.startsWith('\uFEFF') ? content.slice(1) : content;
  const match = text.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content, diagnostics: [], parser: 'legacy' };
  const yaml = match[1], body = match[2], fm = {};
  for (const line of yaml.split(/\r?\n/)) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1]; let value = m[2].trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1).trim();
      fm[key] = inner ? inner.split(',').map(s => s.trim().replace(/^["']|["']$/g, '')) : [];
    } else { fm[key] = value.replace(/^["']|["']$/g, ''); }
  }
  return { frontmatter: fm, body, diagnostics: [], parser: 'legacy' };
}

function parsedEnvelope(item) {
  const parsed = item.parsed;
  if (parsed && parsed.parser === 'okf-c7' && parsed.frontmatter && !Array.isArray(parsed.frontmatter) &&
      typeof parsed.frontmatter === 'object' && typeof parsed.body === 'string' && Array.isArray(parsed.diagnostics)) {
    return { frontmatter: parsed.frontmatter, body: parsed.body, diagnostics: parsed.diagnostics, parser: 'okf-c7' };
  }
  return legacyParseFrontmatter(item.content);
}

function normalizeFilepath(filepath) {
  return String(filepath || '').replace(/\\/g, '/').replace(/^\.\//, '');
}

function pathToId(filepath) { return normalizeFilepath(filepath).replace(/\.md$/, ''); }

function resolveMarkdownPath(href, sourceFilepath) {
  if (!href || /^(?:[a-z]+:|#|\/)/i.test(href)) return null;
  const cleanHref = href.split('#')[0].split('?')[0];
  if (!cleanHref.endsWith('.md')) return null;
  const source = normalizeFilepath(sourceFilepath);
  const base = source.includes('/') ? source.split('/').slice(0, -1) : [];
  const resolved = [...base];
  for (const part of cleanHref.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (resolved.length === 0) return null;
      resolved.pop();
    } else {
      resolved.push(part);
    }
  }
  return pathToId(resolved.join('/'));
}

function extractLinks(body, basePath) {
  const links = [];
  const regex = /\[([^\]]+)\]\(([^)]+\.md(?:#[^)\s]+)?)\)/g;
  let match;
  while ((match = regex.exec(body)) !== null) {
    const targetPathId = resolveMarkdownPath(match[2], basePath);
    if (targetPathId) links.push({ label: match[1], href: match[2], targetPathId });
  }
  return links;
}

function getConceptType(fp, fm) {
  if (typeof fm.type === 'string' && fm.type) return fm.type;
  const directory = normalizeFilepath(fp).split('/')[0];
  if (DIR_ORDER.includes(directory)) return directory.charAt(0).toUpperCase() + directory.slice(1);
  return 'unknown';
}

function buildConcept(item) {
  const filepath = normalizeFilepath(item.filepath);
  const { frontmatter, body, diagnostics, parser } = parsedEnvelope(item);
  const type = getConceptType(filepath, frontmatter);
  const pathId = pathToId(filepath);
  const rawStableId = frontmatter.id;
  const stableId = typeof rawStableId === 'string' ? rawStableId : '';
  const hasStableIdField = Object.prototype.hasOwnProperty.call(frontmatter, 'id');
  const links = extractLinks(body, filepath);
  return {
    id: pathId, pathId, filepath, filename: filepath.split('/').pop(), graphId: '',
    stableId, rawStableId, hasStableIdField, identityState: stableId ? 'unchecked' : 'legacy',
    frontmatter, body, type, links, backlinks: [], typedOutbound: [], typedInbound: [],
    title: typeof frontmatter.title === 'string' && frontmatter.title ? frontmatter.title : pathId.replace(/-/g, ' '),
    description: typeof frontmatter.description === 'string' ? frontmatter.description : '',
    tags: Array.isArray(frontmatter.tags) ? frontmatter.tags.filter(tag => typeof tag === 'string') : [],
    status: typeof frontmatter.status === 'string' && frontmatter.status ? frontmatter.status : 'active',
    resource: typeof frontmatter.resource === 'string' ? frontmatter.resource : '',
    issueRefs: Array.isArray(frontmatter.issue_refs) ? frontmatter.issue_refs : [],
    parser, parserDiagnostics: diagnostics,
    parserFailure: item.parserFailure || null,
  };
}

function literalValue(value) {
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value); } catch { return String(value); }
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/;
const URI_SCHEME = /^([a-z][a-z0-9+.-]*):/i;
const ENCODED_TRAVERSAL = /%(?:00|2e|2f|5c)/i;
const SAFE_HTTPS_URL = /^https:\/\/[^/?#\s]+(?:[/?#]|$)/i;
const MARKDOWN_ALLOWED_TAGS = Object.freeze([
  'a', 'blockquote', 'br', 'code', 'del', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'hr', 'li', 'ol', 'p', 'pre', 'strong', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 'ul',
]);
const MARKDOWN_ALLOWED_ATTRIBUTES = Object.freeze(['align', 'class', 'colspan', 'href', 'rowspan', 'title']);

function safeNavigationHref(value, options = {}) {
  const allowRelative = options.allowRelative !== false;
  const allowFragment = options.allowFragment !== false;
  const href = String(value == null ? '' : value).trim();
  if (!href || CONTROL_CHARACTER.test(href) || href.includes('\\')) return '';
  if (href.startsWith('#')) return allowFragment ? href : '';
  if (href.startsWith('/') || href.startsWith('\\')) return '';
  const scheme = href.match(URI_SCHEME);
  if (scheme) return scheme[1].toLowerCase() === 'https' && SAFE_HTTPS_URL.test(href) ? href : '';
  if (ENCODED_TRAVERSAL.test(href)) return '';
  return allowRelative ? href : '';
}

function markdownNavigationHref(value, sourceFilepath) {
  const safe = safeNavigationHref(value);
  if (!safe || safe.startsWith('#') || SAFE_HTTPS_URL.test(safe)) return safe;
  const suffixAt = [...['?', '#'].map(character => safe.indexOf(character)).filter(index => index >= 0)].sort((a, b) => a - b)[0];
  const localPath = suffixAt == null ? safe : safe.slice(0, suffixAt);
  const suffix = suffixAt == null ? '' : safe.slice(suffixAt);
  const sourceParts = normalizeFilepath(sourceFilepath).split('/').filter(Boolean);
  const resolved = ['knowledge', ...sourceParts.slice(0, -1)];
  for (const part of localPath.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (resolved.length === 0) return '';
      resolved.pop();
    } else {
      resolved.push(part);
    }
  }
  return resolved.length > 0 ? `../${resolved.join('/')}${suffix}` : '';
}

function sanitizeRenderedMarkdown(markdown) {
  if (typeof marked === 'undefined' || typeof DOMPurify === 'undefined') return `<pre>${escapeHtml(markdown)}</pre>`;
  try {
    const rendered = marked.parse(String(markdown == null ? '' : markdown), { async: false });
    return DOMPurify.sanitize(rendered, {
      ALLOWED_TAGS: [...MARKDOWN_ALLOWED_TAGS],
      ALLOWED_ATTR: [...MARKDOWN_ALLOWED_ATTRIBUTES],
      ALLOW_ARIA_ATTR: false,
      ALLOW_DATA_ATTR: false,
      ALLOWED_URI_REGEXP: /^(?:(?:https):|#|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      FORBID_TAGS: ['embed', 'form', 'iframe', 'img', 'math', 'object', 'script', 'style', 'svg', 'template'],
      KEEP_CONTENT: true,
      RETURN_TRUSTED_TYPE: false,
    });
  } catch {
    return `<pre>${escapeHtml(markdown)}</pre>`;
  }
}

function sanitizeMermaidOutput(nodes) {
  for (const node of nodes) {
    node.querySelectorAll('script, iframe, object, embed, foreignObject').forEach(element => element.remove());
    node.querySelectorAll('*').forEach(element => {
      for (const attribute of [...element.attributes]) {
        if (/^on/i.test(attribute.name)) element.removeAttribute(attribute.name);
      }
      for (const attributeName of ['href', 'xlink:href']) {
        if (!element.hasAttribute(attributeName)) continue;
        const href = safeNavigationHref(element.getAttribute(attributeName), { allowRelative: false });
        if (!href) element.removeAttribute(attributeName);
        else element.setAttribute(attributeName, href);
      }
    });
  }
}

function conceptMatchesSearch(concept, search) {
  if (!search) return true;
  const relationshipText = concept.typedOutbound.map(relation => `${relation.predicate} ${relation.targetLiteral}`).join(' ');
  return concept.title.toLowerCase().includes(search) || concept.pathId.toLowerCase().includes(search) ||
    concept.stableId.toLowerCase().includes(search) || concept.tags.some(tag => tag.toLowerCase().includes(search)) ||
    concept.description.toLowerCase().includes(search) || relationshipText.toLowerCase().includes(search);
}

function relationshipWarning(code, source, predicate, target, message, severity = 'warning') {
  return {
    code, severity, sourcePath: source.filepath, sourceId: source.stableId || '(missing)',
    predicate: predicate || '', target: target == null ? '' : literalValue(target), message
  };
}

function cycleComponents(relations) {
  const adjacency = new Map();
  const nodes = new Set();
  for (const relation of relations) {
    nodes.add(relation.sourceStableId); nodes.add(relation.targetStableId);
    if (!adjacency.has(relation.sourceStableId)) adjacency.set(relation.sourceStableId, []);
    adjacency.get(relation.sourceStableId).push(relation.targetStableId);
  }
  for (const targets of adjacency.values()) targets.sort();

  let index = 0;
  const stack = [], onStack = new Set(), indices = new Map(), low = new Map(), components = [];
  function visit(node) {
    indices.set(node, index); low.set(node, index); index += 1;
    stack.push(node); onStack.add(node);
    for (const target of adjacency.get(node) || []) {
      if (!indices.has(target)) { visit(target); low.set(node, Math.min(low.get(node), low.get(target))); }
      else if (onStack.has(target)) low.set(node, Math.min(low.get(node), indices.get(target)));
    }
    if (low.get(node) === indices.get(node)) {
      const component = [];
      let member;
      do { member = stack.pop(); onStack.delete(member); component.push(member); } while (member !== node);
      if (component.length > 1) components.push(component.sort());
    }
  }
  for (const node of [...nodes].sort()) if (!indices.has(node)) visit(node);
  return components.sort((left, right) => left[0].localeCompare(right[0]));
}

function analyseConceptItems(items) {
  const concepts = items.map(buildConcept).sort((left, right) => left.filepath.localeCompare(right.filepath));
  const warnings = [];
  const typedRelationships = [];
  const graphTypedRelationships = [];
  const pathMap = new Map(concepts.map(concept => [concept.pathId, concept]));
  const stableIdMap = new Map();
  for (const concept of concepts) {
    if (concept.stableId && STABLE_ID_PATTERN.test(concept.stableId)) {
      if (!stableIdMap.has(concept.stableId)) stableIdMap.set(concept.stableId, []);
      stableIdMap.get(concept.stableId).push(concept);
    }
  }

  for (const concept of concepts) {
    if (!concept.hasStableIdField) {
      concept.identityState = 'legacy';
      if (PERMANENT_TYPES.has(concept.type)) {
        warnings.push(relationshipWarning('missing-stable-id', concept, 'id', '', 'Legacy concepts remain readable by filepath but cannot be typed relationship targets.', 'compatibility'));
      }
    }
    else if (typeof concept.rawStableId !== 'string' || !STABLE_ID_PATTERN.test(concept.stableId)) {
      concept.identityState = 'invalid';
      warnings.push(relationshipWarning('invalid-stable-id', concept, 'id', concept.rawStableId, 'Stable IDs must match the okf-<lowercase-uuidv4> profile shape.', 'error'));
    } else if ((stableIdMap.get(concept.stableId) || []).length > 1) {
      concept.identityState = 'duplicate';
      warnings.push(relationshipWarning('duplicate-stable-id', concept, 'id', concept.stableId, 'This stable ID occurs in more than one concept; references to it are ambiguous.', 'error'));
    } else concept.identityState = 'valid';
    concept.graphId = concept.identityState === 'valid' ? concept.stableId : `path:${concept.pathId}`;

    for (const diagnostic of concept.parserDiagnostics) {
      warnings.push(relationshipWarning(diagnostic.code || 'frontmatter-parse-error', concept, '', '', diagnostic.message || 'Frontmatter could not be parsed by the C7 parser.', 'error'));
    }
    if (concept.parserFailure) {
      warnings.push(relationshipWarning(concept.parserFailure.code || 'c7-parser-failure', concept, '', '', concept.parserFailure.message || 'The C7 parser failed; legacy read-only parsing was retained.', 'error'));
    }
  }

  for (const source of concepts) {
    for (const predicate of RELATIONSHIP_PREDICATES) {
      if (!Object.prototype.hasOwnProperty.call(source.frontmatter, predicate)) continue;
      const value = source.frontmatter[predicate];
      if (!Array.isArray(value)) {
        const relation = { predicate, inverse: RELATIONSHIP_DEFINITIONS[predicate].inverse, source, sourcePath: source.filepath, sourceStableId: source.stableId, targetLiteral: literalValue(value), targetStableId: '', target: null, state: 'invalid', resolution: 'relationship-not-array' };
        source.typedOutbound.push(relation); typedRelationships.push(relation);
        warnings.push(relationshipWarning('relationship-not-array', source, predicate, value, 'Typed relationship fields must be YAML arrays.', 'error'));
        continue;
      }

      const seenTargets = new Set();
      for (const targetValue of value) {
        const targetLiteral = literalValue(targetValue);
        const relation = { predicate, inverse: RELATIONSHIP_DEFINITIONS[predicate].inverse, source, sourcePath: source.filepath, sourceStableId: source.stableId, targetLiteral, targetStableId: typeof targetValue === 'string' ? targetValue : '', target: null, state: 'unresolved', resolution: '' };
        source.typedOutbound.push(relation); typedRelationships.push(relation);

        let code = '', message = '';
        if (typeof targetValue !== 'string' || !STABLE_ID_PATTERN.test(targetValue)) {
          code = predicate === 'supersedes' && typeof targetValue === 'string' && /[/.]/.test(targetValue) ? 'legacy-supersedes-ambiguous' : 'invalid-relationship-target';
          message = code === 'legacy-supersedes-ambiguous' ? 'Path-valued legacy supersedes data is retained but cannot be resolved as a typed edge.' : 'Relationship targets must be project-local OKF stable IDs.';
        } else if (seenTargets.has(targetValue)) {
          code = 'duplicate-relationship-target'; message = 'The same target is declared more than once for this predicate.';
        } else if (!PERMANENT_TYPES.has(source.type) || source.identityState !== 'valid') {
          code = 'invalid-relationship-source'; message = 'A typed edge requires one unique, valid stable ID on its source concept.';
        } else if (targetValue === source.stableId) {
          code = 'self-relationship'; message = 'Self-edges are invalid for OKF typed relationships.';
        } else {
          const matches = stableIdMap.get(targetValue) || [];
          if (matches.length === 0) { code = 'unresolved-relationship-target'; message = 'No concept in this bundle declares this target ID.'; }
          else if (matches.length > 1) { code = 'ambiguous-relationship-target'; message = 'More than one concept declares this target ID.'; }
          else if (!PERMANENT_TYPES.has(matches[0].type)) { code = 'invalid-relationship-target-type'; message = 'Inbox records are not permanent concept relationship targets.'; }
          else {
            relation.target = matches[0]; relation.state = 'resolved'; relation.resolution = 'resolved';
          }
        }
        seenTargets.add(typeof targetValue === 'string' ? targetValue : targetLiteral);
        if (code) {
          const legacyWarning = code === 'legacy-supersedes-ambiguous';
          relation.state = legacyWarning ? 'warning' : 'invalid'; relation.resolution = code;
          warnings.push(relationshipWarning(code, source, predicate, targetValue, message, legacyWarning ? 'warning' : 'error'));
        }
      }
    }
  }

  const contradictionPairs = new Map();
  for (const relation of typedRelationships.filter(item => item.state === 'resolved')) {
    if (relation.predicate === 'contradicts') {
      const pair = [relation.sourceStableId, relation.targetStableId].sort().join('|');
      if (contradictionPairs.has(pair)) {
        relation.state = 'warning'; relation.resolution = 'redundant-symmetric-relationship';
        warnings.push(relationshipWarning('redundant-symmetric-relationship', relation.source, relation.predicate, relation.targetStableId, 'contradicts is symmetric; the reverse declaration is redundant.', 'warning'));
        continue;
      }
      contradictionPairs.set(pair, relation);
    }
    graphTypedRelationships.push(relation);
  }

  for (const predicate of RELATIONSHIP_PREDICATES.filter(name => RELATIONSHIP_DEFINITIONS[name].cycle)) {
    const relations = graphTypedRelationships.filter(relation => relation.predicate === predicate);
    for (const component of cycleComponents(relations)) {
      const members = new Set(component);
      for (const relation of relations.filter(item => members.has(item.sourceStableId) && members.has(item.targetStableId))) {
        const isInvalid = RELATIONSHIP_DEFINITIONS[predicate].cycle === 'invalid';
        relation.state = isInvalid ? 'invalid' : 'warning';
        relation.resolution = isInvalid ? 'invalid-cycle' : 'blocked-by-cycle';
        warnings.push(relationshipWarning(relation.resolution, relation.source, predicate, relation.targetStableId, `Cycle includes ${component.join(' -> ')}.`, isInvalid ? 'error' : 'warning'));
      }
    }
  }

  for (const relation of graphTypedRelationships) relation.target.typedInbound.push(relation);

  const markdownLinks = [];
  const backlinks = new Map();
  for (const concept of concepts) {
    for (const link of concept.links) {
      const target = pathMap.get(link.targetPathId);
      if (target) {
        markdownLinks.push({ kind: 'citation', source: concept.graphId, target: target.graphId, sourceConcept: concept, targetConcept: target });
        if (!backlinks.has(target.pathId)) backlinks.set(target.pathId, []);
        backlinks.get(target.pathId).push(concept.pathId);
      }
    }
  }
  for (const concept of concepts) concept.backlinks = [...new Set(backlinks.get(concept.pathId) || [])].sort();

  const predicateOrder = new Map(RELATIONSHIP_PREDICATES.map((predicate, index) => [predicate, index]));
  warnings.sort((left, right) => left.sourcePath.localeCompare(right.sourcePath) ||
    (predicateOrder.get(left.predicate) ?? 99) - (predicateOrder.get(right.predicate) ?? 99) ||
    left.target.localeCompare(right.target) || left.code.localeCompare(right.code));
  const typedLinks = graphTypedRelationships.map(relation => ({ kind: 'typed', source: relation.source.graphId, target: relation.target.graphId, relation }));
  return { concepts, links: [...markdownLinks, ...typedLinks], warnings, typedRelationships };
}

function processConcepts(items) {
  const analysis = analyseConceptItems(items);
  allConcepts = analysis.concepts;
  allLinks = analysis.links;
  allWarnings = analysis.warnings;
  return analysis;
}

async function readDirectory(dirHandle, prefix = '') {
  const results = [];
  for await (const [name, handle] of dirHandle.entries()) {
    if ((!prefix && name === 'inbox') || name === 'index.md' || name === 'log.md' || name.startsWith('.') || name.endsWith('.html') || name.endsWith('.js')) continue;
    const p = prefix ? prefix + '/' + name : name;
    if (handle.kind === 'directory') { results.push(...await readDirectory(handle, p)); }
    else if (name.endsWith('.md')) { results.push({ filepath: p, content: await (await handle.getFile()).text() }); }
  }
  return results;
}

async function loadFolder(dirHandle) {
  document.getElementById('loading').style.display = 'block';
  document.getElementById('folder-btn').disabled = true;
  try {
    const items = await readDirectory(dirHandle);
    datasetReport = Object.freeze({ schema: 'okf-viewer-data/1', inbox: 'excluded', includedPaths: items.map(item => item.filepath).sort() });
    processConcepts(items);
    onDataLoaded();
  } catch (err) { alert('Error: ' + err.message); }
  finally { document.getElementById('loading').style.display = 'none'; }
}

function onDataLoaded() {
  renderTree();
  renderGraph();
  renderFilters();
  renderWarnings();
  renderGraphLegend();
  const citationCount = allLinks.filter(link => link.kind === 'citation').length;
  const typedCount = allLinks.filter(link => link.kind === 'typed').length;
  const inboxSummary = datasetReport.inbox === 'included-explicitly' ? 'inbox included explicitly' : 'inbox excluded';
  document.getElementById('stats').textContent = `${allConcepts.length} concepts | ${citationCount} citations | ${typedCount} typed edges | ${inboxSummary}${allWarnings.length ? ` | ${allWarnings.length} warnings` : ''}`;
  document.getElementById('folder-btn').textContent = allConcepts.length + ' loaded';
  document.getElementById('folder-btn').disabled = true;
}

function renderWarnings() {
  const panel = document.getElementById('warnings-panel');
  const list = document.getElementById('warnings-list');
  const summary = document.getElementById('warnings-summary');
  panel.classList.toggle('visible', allWarnings.length > 0);
  if (allWarnings.length === 0) { list.innerHTML = ''; return; }
  const errors = allWarnings.filter(warning => warning.severity === 'error').length;
  panel.open = errors > 0;
  summary.textContent = `Relationship and parser diagnostics (${allWarnings.length}; ${errors} invalid)`;
  list.innerHTML = allWarnings.map((warning, index) => `<button class="warning-row" data-warning-index="${index}">
    <span>${escapeHtml(warning.sourcePath)}<span class="warning-source-id">${escapeHtml(warning.sourceId)}</span></span>
    <span class="warning-code">${escapeHtml(warning.predicate || warning.code)}</span>
    <span class="warning-target">${escapeHtml(warning.target || '(no target)')}</span>
    <span><span class="warning-code">${escapeHtml(warning.code)}</span> — ${escapeHtml(warning.message)}</span>
  </button>`).join('');
  list.querySelectorAll('.warning-row').forEach(button => {
    button.onclick = () => {
      const warning = allWarnings[Number(button.dataset.warningIndex)];
      const concept = allConcepts.find(candidate => candidate.filepath === warning.sourcePath);
      if (!concept) return;
      const panelId = currentView === 'graph' ? 'graph-detail' : 'detail';
      showDetail(concept, panelId);
      if (cy) cy.getElementById(concept.graphId).select();
    };
  });
}

function renderGraphLegend() {
  const legend = document.getElementById('graph-legend');
  legend.innerHTML = [
    `<span class="legend-item"><span class="legend-line" style="--edge-color:#484f58"></span>citation</span>`,
    ...RELATIONSHIP_PREDICATES.map(predicate => {
      const definition = RELATIONSHIP_DEFINITIONS[predicate];
      return `<span class="legend-item"><span class="legend-line ${definition.lineStyle}" style="--edge-color:${definition.color}"></span>${predicate}</span>`;
    })
  ].join('');
}

/* ---- Folder Tree ---- */
function renderTree() {
  const tree = document.getElementById('tree');
  tree.innerHTML = '';
  const grouped = {};
  for (const c of allConcepts) {
    const dir = c.filepath.includes('/') ? c.filepath.split('/')[0] : 'root';
    if (!grouped[dir]) grouped[dir] = [];
    grouped[dir].push(c);
  }
  const search = document.getElementById('search').value.toLowerCase();
  for (const dir of DIR_ORDER) {
    const concepts = (grouped[dir] || []).filter(concept => conceptMatchesSearch(concept, search));
    if (concepts.length === 0) continue;
    const typeLabel = dir.charAt(0).toUpperCase() + dir.slice(1);
    const color = TYPE_COLORS[typeLabel] || '#8b949e';

    const dirEl = document.createElement('div');
    dirEl.className = 'tree-dir';
    dirEl.innerHTML = `<span class="arrow">▼</span><span class="dir-dot" style="background:${color}"></span>${typeLabel}<span class="dir-count">${concepts.length}</span>`;
    dirEl.onclick = () => {
      dirEl.classList.toggle('collapsed');
      filesEl.classList.toggle('collapsed');
    };

    const filesEl = document.createElement('div');
    filesEl.className = 'tree-files';
    for (const c of concepts.sort((a, b) => a.title.localeCompare(b.title))) {
      const fEl = document.createElement('div');
      fEl.className = 'tree-file';
      fEl.dataset.id = c.graphId;
      fEl.textContent = c.title;
      if (c.status === 'deprecated') {
        const marker = document.createElement('span');
        marker.className = 'file-status'; marker.textContent = '○'; fEl.appendChild(marker);
      }
      fEl.onclick = () => {
        document.querySelectorAll('.tree-file').forEach(e => e.classList.remove('active'));
        fEl.classList.add('active');
        showDetail(c, 'detail');
      };
      filesEl.appendChild(fEl);
    }
    tree.appendChild(dirEl);
    tree.appendChild(filesEl);
  }
}

/* ---- Detail Panel ---- */
function resourceLink(resource) {
  const safe = safeNavigationHref(resource, { allowFragment: false });
  if (!safe) return { href: '', conceptPathId: '' };
  if (SAFE_HTTPS_URL.test(safe)) return { href: safe, conceptPathId: '' };
  const rootRelative = safe.replace(/^\.\//, '');
  const segments = rootRelative.split('/');
  if (!rootRelative || segments.some(segment => !segment || segment === '.' || segment === '..')) return { href: '', conceptPathId: '' };
  const conceptPathId = rootRelative.startsWith('knowledge/') && rootRelative.endsWith('.md')
    ? pathToId(rootRelative.slice('knowledge/'.length)) : '';
  return { href: `../${rootRelative}`, conceptPathId };
}

function relationshipEntry(relation, inverse = false) {
  const label = inverse ? relation.inverse : relation.predicate;
  const related = inverse ? relation.source : relation.target;
  const stateClass = relation.state === 'resolved' ? '' : relation.state;
  const relatedHtml = related
    ? `<a data-path-id="${escapeHtml(related.pathId)}">${escapeHtml(related.title)}</a> <code>${escapeHtml(related.stableId || related.pathId)}</code>`
    : `<code>${escapeHtml(relation.targetLiteral || '(missing)')}</code>`;
  const diagnostic = relation.state === 'resolved' ? '' : ` <span>(${escapeHtml(relation.resolution)})</span>`;
  return `<div class="relationship-entry ${stateClass}"><span class="predicate">${escapeHtml(label)}</span><span>${relatedHtml}${diagnostic}</span></div>`;
}

function typedRelationshipHtml(concept) {
  const outbound = concept.typedOutbound.length
    ? `<div class="relationships"><h3>Typed relationships (${concept.typedOutbound.length})</h3>${concept.typedOutbound.map(relation => relationshipEntry(relation)).join('')}</div>` : '';
  const inbound = concept.typedInbound.length
    ? `<div class="relationships"><h3>Typed backlinks (${concept.typedInbound.length})</h3>${concept.typedInbound.map(relation => relationshipEntry(relation, true)).join('')}</div>` : '';
  return outbound + inbound;
}

function showDetail(concept, targetId) {
  const el = document.getElementById(targetId);
  const fm = concept.frontmatter;
  const fmLines = [];
  if (concept.stableId) fmLines.push(`<div>id: ${escapeHtml(concept.stableId)}</div>`);
  else fmLines.push('<div class="identity-note">id: legacy filepath identity (typed targets cannot resolve to this alias)</div>');
  if (fm.resource) {
    const resolvedResource = resourceLink(concept.resource);
    const resourceValue = escapeHtml(concept.resource);
    const resourceHtml = resolvedResource.href
      ? `<a href="${escapeHtml(resolvedResource.href)}"${resolvedResource.conceptPathId ? ` data-concept-path="${escapeHtml(resolvedResource.conceptPathId)}"` : ' target="_blank" rel="noopener noreferrer"'}>${resourceValue}</a>`
      : `<span class="identity-note" title="Blocked by the viewer URL policy">${resourceValue}</span>`;
    fmLines.push(`<div>resource: ${resourceHtml}</div>`);
  }
  if (fm.timestamp) fmLines.push(`<div>timestamp: ${escapeHtml(literalValue(fm.timestamp))}</div>`);
  if (concept.issueRefs.length) fmLines.push(`<div>issue_refs: [${concept.issueRefs.map(escapeHtml).join(', ')}]</div>`);

  const badges = [`<span class="badge type" data-type="${escapeHtml(concept.type)}">${escapeHtml(concept.type)}</span>`];
  if (concept.status && concept.status !== 'active')
    badges.push(`<span class="badge status ${concept.status === 'deprecated' ? 'deprecated' : ''}">${escapeHtml(concept.status)}</span>`);
  if (concept.identityState !== 'valid') badges.push(`<span class="badge status ${concept.identityState === 'invalid' || concept.identityState === 'duplicate' ? 'deprecated' : ''}">${escapeHtml(concept.identityState)} identity</span>`);
  if (concept.parser === 'legacy') badges.push('<span class="badge status">legacy parser fallback</span>');
  if (concept.tags.length) badges.push(...concept.tags.map(tag => `<span class="badge">${escapeHtml(tag)}</span>`));

  const backlinkHtml = concept.backlinks.length ? `
    <div class="backlinks"><h3>Cited by (${concept.backlinks.length})</h3>
    ${concept.backlinks.map(pathId => { const citedBy = allConcepts.find(candidate => candidate.pathId === pathId); return citedBy ? `<a data-path-id="${escapeHtml(pathId)}">${escapeHtml(citedBy.title)}</a>` : ''; }).join('')}
    </div>` : '';

  const conceptWarnings = allWarnings.filter(warning => warning.sourcePath === concept.filepath);
  const diagnosticHtml = conceptWarnings.length ? `<div class="relationships"><h3>Diagnostics (${conceptWarnings.length})</h3>${conceptWarnings.map(warning =>
    `<div class="relationship-entry ${warning.severity === 'error' ? 'invalid' : 'warning'}"><span class="predicate">${escapeHtml(warning.code)}</span><span>${escapeHtml(warning.message)}${warning.target ? ` <code>${escapeHtml(warning.target)}</code>` : ''}</span></div>`).join('')}</div>` : '';

  const renderedBody = sanitizeRenderedMarkdown(concept.body);

  el.innerHTML = `<div class="content">
    <h2>${escapeHtml(concept.title)}</h2>
    <div class="meta">${badges.join('')}</div>
    ${fmLines.length ? `<div class="frontmatter">${fmLines.join('')}</div>` : ''}
    <div class="body">${renderedBody}</div>
    ${typedRelationshipHtml(concept)}
    ${backlinkHtml}
    ${diagnosticHtml}
  </div>`;

  // Attach relationship/backlink click handlers first (before mermaid, which can throw).
  el.querySelectorAll('[data-path-id], [data-concept-path]').forEach(a => {
    a.onclick = (e) => {
      e.preventDefault();
      const pathId = a.dataset.pathId || a.dataset.conceptPath;
      const related = allConcepts.find(candidate => candidate.pathId === pathId);
      if (related) { showDetail(related, targetId); if (cy) cy.getElementById(related.graphId).select(); }
    };
  });

  // Markdown remains filepath-relative navigation and is independent of stable IDs.
  el.querySelectorAll('.body a[href]').forEach(a => {
    const originalHref = a.getAttribute('href');
    const safeHref = markdownNavigationHref(originalHref, concept.filepath);
    if (!safeHref) {
      a.removeAttribute('href');
      a.removeAttribute('target');
      a.removeAttribute('rel');
      return;
    }
    a.setAttribute('href', safeHref);
    if (SAFE_HTTPS_URL.test(safeHref)) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    } else {
      a.removeAttribute('target');
      a.removeAttribute('rel');
    }
    const resolvedPathId = resolveMarkdownPath(originalHref, concept.filepath);
    const related = allConcepts.find(candidate => candidate.pathId === resolvedPathId);
    if (!related) return;
    a.onclick = (e) => {
      e.preventDefault();
      showDetail(related, targetId);
      if (cy) cy.getElementById(related.graphId).select();
    };
  });

  // Mermaid receives text only, uses strict security, and is scrubbed again after rendering.
  try {
    el.querySelectorAll('pre code').forEach((codeEl, i) => {
      const text = codeEl.textContent.trim();
      const mermaidLanguage = codeEl.classList.contains('language-mermaid');
      if (mermaidLanguage || text.startsWith('erDiagram') || text.startsWith('flowchart') || text.startsWith('graph') || text.startsWith('sequenceDiagram')) {
        const pre = codeEl.parentElement;
        const div = document.createElement('div');
        div.className = 'mermaid';
        div.id = `mermaid-${targetId}-${concept.pathId.replace(/[^a-z0-9_-]/gi, '-')}-${i}`;
        div.textContent = text;
        pre.replaceWith(div);
      }
    });
    const mermaidNodes = el.querySelectorAll('.mermaid');
    if (mermaidNodes.length > 0 && typeof mermaid !== 'undefined') {
      mermaid.run({ nodes: mermaidNodes }).then(() => sanitizeMermaidOutput(mermaidNodes)).catch(() => {});
    }
  } catch (e) { /* mermaid not loaded or render error - keep the rest of the concept readable */ }

  el.scrollTop = 0;
}

/* ---- Graph ---- */
function renderGraph() {
  if (typeof cytoscape === 'undefined') {
    document.getElementById('cy').innerHTML = '<div class="empty">Graph runtime unavailable. Browse, Markdown backlinks, typed relationships, and diagnostics remain readable.</div>';
    cy = null;
    return;
  }
  const nodes = allConcepts.map(concept => ({ data: {
    id: concept.graphId, label: concept.title.length > 28 ? concept.title.slice(0, 26) + '..' : concept.title,
    type: concept.type, color: TYPE_COLORS[concept.type] || '#8b949e', concept
  } }));
  const edges = allLinks.map((link, index) => {
    const relation = link.relation;
    const definition = relation ? RELATIONSHIP_DEFINITIONS[relation.predicate] : null;
    return { data: {
      id: `edge:${index}`, source: link.source, target: link.target, kind: link.kind,
      predicate: relation ? relation.predicate : 'citation', state: relation ? relation.state : 'resolved',
      color: definition ? definition.color : '#484f58', lineStyle: definition ? definition.lineStyle : 'solid'
    } };
  });
  if (cy) cy.destroy();
  cy = cytoscape({
    container: document.getElementById('cy'),
    elements: [...nodes, ...edges],
    style: [
      { selector: 'node', style: { 'background-color': 'data(color)', 'label': 'data(label)', 'color': '#c9d1d9', 'font-size': '10px', 'text-valign': 'bottom', 'text-halign': 'center', 'text-margin-y': 4, 'width': 22, 'height': 22, 'border-width': 2, 'border-color': '#21262d', 'text-wrap': 'ellipsis', 'text-max-width': '120px' }},
      { selector: 'node:selected', style: { 'border-width': 3, 'border-color': '#f0f6fc', 'width': 28, 'height': 28 }},
      { selector: 'edge', style: { 'width': 1, 'line-color': 'data(color)', 'target-arrow-color': 'data(color)', 'target-arrow-shape': 'triangle', 'curve-style': 'bezier', 'arrow-scale': 0.6, 'line-style': 'data(lineStyle)' }},
      { selector: 'edge[kind = "typed"]', style: { 'width': 2, 'label': 'data(predicate)', 'font-size': '8px', 'color': '#8b949e', 'text-background-color': '#0d1117', 'text-background-opacity': 0.85, 'text-background-padding': 2, 'text-rotation': 'autorotate' }},
      { selector: 'edge[predicate = "contradicts"]', style: { 'target-arrow-shape': 'none' }},
      { selector: 'edge[state = "invalid"]', style: { 'line-color': '#f85149', 'target-arrow-color': '#f85149', 'line-style': 'dashed', 'width': 3 }},
      { selector: 'edge[state = "warning"]', style: { 'line-color': '#d29922', 'target-arrow-color': '#d29922', 'width': 3 }},
      { selector: '.deprecated', style: { 'border-style': 'dashed', 'opacity': 0.5 }}
    ],
    layout: { name: 'cose', animate: true, padding: 40, idealEdgeLength: 80, nodeRepulsion: 8000 }
  });
  cy.nodes().forEach(n => { if (n.data('concept').status === 'deprecated') n.addClass('deprecated'); });
  cy.on('tap', 'node', evt => showDetail(evt.target.data('concept'), 'graph-detail'));
}

function renderFilters() {
  const tb = document.getElementById('toolbar');
  document.querySelectorAll('.filter-btn').forEach(e => e.remove());
  for (const type of [...new Set(allConcepts.map(c => c.type))].sort()) {
    const btn = document.createElement('button');
    btn.className = 'filter-btn active'; btn.dataset.type = type; btn.textContent = type;
    btn.onclick = () => {
      if (activeFilters.has(type)) { activeFilters.delete(type); btn.classList.remove('active'); }
      else { activeFilters.add(type); btn.classList.add('active'); }
      applyFilters();
    };
    tb.insertBefore(btn, document.getElementById('search'));
  }
}

function applyFilters() {
  if (currentView !== 'graph' || !cy) return;
  const s = document.getElementById('search').value.toLowerCase();
  cy.nodes().forEach(n => {
    const c = n.data('concept');
    const tm = activeFilters.size === 0 || activeFilters.has(c.type);
    const sm = conceptMatchesSearch(c, s);
    n.style('display', (tm && sm) ? 'element' : 'none');
  });
  cy.edges().forEach(e => {
    e.style('display', (cy.getElementById(e.data('source')).style('display') !== 'none' && cy.getElementById(e.data('target')).style('display') !== 'none') ? 'element' : 'none');
  });
}

/* ---- Navigation ---- */
function switchView(view) {
  currentView = view;
  document.getElementById('nav-browse').classList.toggle('active', view === 'browse');
  document.getElementById('nav-graph').classList.toggle('active', view === 'graph');
  document.getElementById('browse-view').classList.toggle('active', view === 'browse');
  document.getElementById('graph-view').classList.toggle('active', view === 'graph');
  if (view === 'graph' && cy) cy.resize();
  if (view === 'browse') renderTree();
}

/* ---- Auto-load embedded data ---- */
function loadEmbeddedData() {
  const dataElement = document.getElementById('okf-data');
  if (!dataElement) return;
  try {
    const envelope = JSON.parse(dataElement.textContent);
    const items = Array.isArray(envelope) ? envelope : envelope?.items;
    if (!Array.isArray(items)) return;
    const includedPaths = Array.isArray(envelope.included_paths) ? envelope.included_paths.filter(path => typeof path === 'string') : items.map(item => item.filepath).sort();
    datasetReport = Object.freeze({
      schema: typeof envelope.schema === 'string' ? envelope.schema : 'okf-viewer-data/legacy',
      inbox: envelope?.policy?.inbox === 'included-explicitly' ? 'included-explicitly' : 'excluded',
      includedPaths,
    });
    processConcepts(items);
    onDataLoaded();
  } catch (error) {
    console.error(`Embedded OKF dataset is invalid: ${error.message}`);
  }
}

function initializeViewer() {
  document.getElementById('nav-browse').onclick = () => switchView('browse');
  document.getElementById('nav-graph').onclick = () => switchView('graph');
  document.getElementById('search').oninput = () => {
    if (currentView === 'browse') renderTree();
    else applyFilters();
  };
  document.getElementById('folder-btn').onclick = async () => {
    try { await loadFolder(await window.showDirectoryPicker()); }
    catch (err) { if (err.name !== 'AbortError') alert('Error: ' + err.message); }
  };

  let dragCounter = 0;
  window.addEventListener('dragenter', (event) => { event.preventDefault(); dragCounter++; document.getElementById('drop-zone').style.display = 'flex'; });
  window.addEventListener('dragleave', (event) => { event.preventDefault(); dragCounter--; if (dragCounter === 0) document.getElementById('drop-zone').style.display = 'none'; });
  window.addEventListener('dragover', (event) => event.preventDefault());
  window.addEventListener('drop', async (event) => {
    event.preventDefault(); dragCounter = 0;
    document.getElementById('drop-zone').style.display = 'none';
    const items = event.dataTransfer.items;
    if (items && items.length > 0 && items[0].webkitGetAsEntry) {
      const entry = items[0].webkitGetAsEntry();
      if (entry.isDirectory) {
        try { const handle = await entry.getFilesystemHandle?.(); if (handle) await loadFolder(handle); } catch {}
      }
    }
  });
  loadEmbeddedData();
}

// Deterministic, DOM-free seam used by the fixture test. It is not a mutating API.
globalThis.__OKF_VIEWER_TEST__ = Object.freeze({
  analyseConceptItems, legacyParseFrontmatter, markdownNavigationHref, resolveMarkdownPath,
  resourceLink, safeNavigationHref, sanitizeRenderedMarkdown,
  relationshipPredicates: [...RELATIONSHIP_PREDICATES]
});

if (typeof document !== 'undefined' && typeof window !== 'undefined') initializeViewer();
