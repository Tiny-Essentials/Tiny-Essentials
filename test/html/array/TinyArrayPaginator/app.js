import { TinyArrayPaginator } from '/src/v1/libs/array/TinyArrayPaginator.mjs';

// Example dataset
const dataset = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  group: i % 2 === 0 ? 'A' : 'B',
}));

const paginator = new TinyArrayPaginator(dataset);
window.paginator = paginator;

function render() {
  const page = parseInt(document.getElementById('page').value, 10);
  const perPage = parseInt(document.getElementById('perPage').value, 10);
  const filterKey = document.getElementById('filterKey').value.trim();
  const filterValue = document.getElementById('filterValue').value.trim();

  let filter = null;
  if (filterKey && filterValue) {
    filter = { [filterKey]: filterValue };
  }

  const {
    items,
    page: currentPage,
    totalPages,
    totalItems,
    hasPrev,
    hasNext,
  } = paginator.get({ page, perPage, filter });

  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';

  if (items.length === 0) {
    resultsDiv.innerHTML = `<p>No results found.</p>`;
    return;
  }

  items.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'result-item';
    div.textContent = JSON.stringify(item);
    resultsDiv.appendChild(div);
  });

  const info = document.createElement('div');
  info.className = 'pagination-info';
  info.textContent = `Page ${currentPage} of ${totalPages} | Total items: ${totalItems} | Prev: ${hasPrev} | Next: ${hasNext}`;
  resultsDiv.appendChild(info);
}

document.getElementById('applyBtn').addEventListener('click', render);

// Initial render
render();
