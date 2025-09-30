// Client-side search script
// Inspired by: https://github.com/zwbetz-gh/hugo-client-side-search-template
// const origin = window.location.origin;
// const pathname = window.location.pathname;
// const parts = pathname.split('/').filter(p => p !== '');
// let base = '';
// const BASE_PATH = '{{ .Site.Params.basePath }}';
// if (parts.length > 0 && parts[0] === BASE_PATH) {
//   base = BASE_PATH;
// }
// const JSON_INDEX_URL = `${origin}/${base}${base ? '/' : ''}index.json`;

const BASE_URL = '{{ .Site.BaseURL }}';
const JSON_INDEX_URL = `${BASE_URL}index.json`;

console.log('Trying to fetch JSON from:', JSON_INDEX_URL);

const QUERY_URL_PARAM = 'query';
const MAX_HITS_SHOWN = 10;
const FUSE_OPTIONS = {
  keys: [
    { name: 'title', weight: 0.8 },
    { name: 'description', weight: 0.5 },
    { name: 'content', weight: 0.3 }
  ],
  ignoreLocation: true,
  includeMatches: true,
  includeScore: true,
  minMatchCharLength: 2,
  threshold: 0.2
};
let fuse;
const getInputEl = () => document.querySelector('#s');
const initFuse = (pages) => {
  fuse = new Fuse(pages, FUSE_OPTIONS);
}
const getQuery = () =>  {
  return getInputEl().value.trim();
}
const setUrlParam = (query) => {
  const url = new URL(location.origin + location.pathname);
  url.search = `${QUERY_URL_PARAM}=${encodeURIComponent(query)}`;
  window.history.replaceState({}, '', url);
}
const doSearchIfUrlParamExists = ()=> {
  const params = new URLSearchParams(window.location.search);
  if (params.has(QUERY_URL_PARAM)) {
    const q = decodeURIComponent(params.get(QUERY_URL_PARAM));
    getInputEl().value = q;
    handleSearchEvent();
  }
}
const highlightMatches = (text, matches) => {
  if (!matches || matches.length === 0) return text;
  let result = text;
  const allIndices = [];
  
  matches.forEach(m => {
      m.indices.forEach(([start, end]) => {
        allIndices.push([start, end]);
      });
    });
    
  allIndices.sort((a, b) => b[0] - a[0]);
  allIndices.forEach(([start, end]) => {
    result = result.substring(0, start)
      + `<mark style="background:#fff3cd;">` + result.substring(start, end + 1) + `</mark>`
      + result.substring(end + 1);
  });
  return result;
}
const createHitHtml = (hit) => {
  const item = hit.item;
  const url = item.url;
  const title = highlightMatches(item.title, hit.matches.filter(m => m.key === 'title'));
  const desc = item.description ? highlightMatches(item.description, hit.matches.filter(m => m.key === 'description')) : '';
  const date = item.date ? (new Date(item.date)).toLocaleDateString() : '';
  const categories = item.categories || [];
   return `
    <article style="border-bottom:1px solid #eee;">
      <h1><a href="${url}" style="text-decoration:none; color:#222;">${title}</a></h1>
       ${date ? `<p style="color: #666;font-size: 10px;letter-spacing: 0.1em;">Posted on ${date}</p>` : ''}
      <p style="padding: 1em 0;>${desc ? `${desc}` : ''} ${item.readmore ? `... <a href="${url}">Continue reading →</a>` : ''}</p>
      ${categories.length > 0 ? `<p style="color: #666;font-size: 10px;letter-spacing: 0.1em;">
         Posted in 
          ${categories.map(cat => `<a href="${cat.url}" >${cat.name}</a>`).join(', ')}
       </p>` : ''}
      </article>
  `;
}
const getMainContent = () => document.querySelector('main .content') || document.querySelector('main');
const renderHits = (hits) => {
  const mainContent = getMainContent();
  if (!mainContent) return;
  const query = getQuery();
  const html = hits.slice(0, MAX_HITS_SHOWN).map(createHitHtml).join('\n');
  mainContent.innerHTML = `<p style="
    color: #666;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.1em;
    line-height: 2.6em;
    text-transform: uppercase;
">Search Results for: ${query} </p> ${html}` || '<p>Aucun résultat</p>';
};
const handleSearchEvent = () => {
  const query = getQuery();
  if (!query || query.length < 1) {
    document.querySelector('#search_results_container').innerHTML = '';
    return;
  }
  const hits = fuse.search(query); 
  setUrlParam(query);
  renderHits(hits);
};
const fetchJsonIndex = () => {
  fetch(JSON_INDEX_URL)
    .then(res => res.json())
    .then(data => {
      initFuse(data);
      const input = document.querySelector('#s');
      const form = document.querySelector('#searchform');
      
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();  
          handleSearchEvent();  
        });
      }
      // input.addEventListener('input', handleSearchEvent);
      input.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          input.value = '';
          document.querySelector('#search_results_container').innerHTML = '';
        }
      });
      doSearchIfUrlParamExists();
    }).catch(error => {
      console.error(`Failed to fetch JSON index: ${error.message}`);
    });;
}
document.addEventListener('DOMContentLoaded', fetchJsonIndex);


