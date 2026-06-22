$(async function(){
  if (!api.token()) window.location.href = '/';
  $('#logoutBtn').on('click', ()=>{ localStorage.removeItem('lms_token'); window.location.href='/';});

  const table = $('#booksTable').DataTable({
    serverSide: true,
    processing: true,
    ajax: function(data, callback) {
      const params = new URLSearchParams();
      params.append('draw', data.draw);
      params.append('start', data.start);
      params.append('length', data.length);
      if (data.search && data.search.value) params.append('search[value]', data.search.value);
      if (data.order && data.order.length) { params.append('order[0][column]', data.order[0].column); params.append('order[0][dir]', data.order[0].dir); }

      fetch('/api/books/datatables?' + params.toString(), { headers: { 'Authorization': 'Bearer ' + api.token() } })
        .then(res => res.json())
        .then(json => callback(json))
        .catch(err => { alert('Error loading books'); });
    },
    columns: [
      { data: 'id' },
      { data: 'title' },
      { data: 'isbn' },
      { data: row => row.category ? row.category.name : '' },
      { data: row => row.publisher ? row.publisher.name : '' },
      { data: row => `${row.totalCopies || 0} / ${row.availableCopies || 0}` },
      { data: null, orderable: false, render: d => {
          const id = d.id;
          const viewBtn = `<button class="btn btn-sm btn-primary view" data-id="${id}">View</button>`;
          const delBtn = api.isAdmin() ? `<button class="btn btn-sm btn-danger ms-1 delete" data-id="${id}">Delete</button>` : '';
          return viewBtn + delBtn;
        }
      }
    ]
  });

  async function loadSelectLists() {
    const categories = await api.fetchJson('/api/categories');
    const authors = await api.fetchJson('/api/authors');
    const publishers = await api.fetchJson('/api/publishers');
    const catSel = $('#categorySelect').empty().append('<option value="">--</option>');
    categories.forEach(c => catSel.append(`<option value="${c.id}">${c.name}</option>`));
    const authSel = $('#authorsSelect').empty();
    authors.forEach(a => authSel.append(`<option value="${a.id}">${(a.firstName||'') + ' ' + (a.lastName||'')}</option>`));
    const pubSel = $('#publisherSelect').empty().append('<option value="">--</option>');
    publishers.forEach(p => pubSel.append(`<option value="${p.id}">${p.name}</option>`));
  }

  await loadSelectLists();

  $('#addBtn').on('click', ()=> {
    $('#bookId').val(''); $('#isbn').val(''); $('#title').val(''); $('#description').val(''); $('#publishedYear').val(''); $('#totalCopies').val('1');
    $('#authorsSelect').val([]); $('#categorySelect').val(''); $('#publisherSelect').val('');
    $('#formError').hide(); new bootstrap.Modal(document.getElementById('bookModal')).show();
  });

  $('#bookForm').on('submit', async function(e) {
    e.preventDefault();
    const payload = {
      isbn: $('#isbn').val().trim(),
      title: $('#title').val().trim(),
      description: $('#description').val().trim(),
      categoryId: parseInt($('#categorySelect').val()) || null,
      publisherId: parseInt($('#publisherSelect').val()) || null,
      publishedYear: parseInt($('#publishedYear').val()) || null,
      totalCopies: parseInt($('#totalCopies').val()) || 1,
      authorIds: $('#authorsSelect').val() ? $('#authorsSelect').val().map(x => parseInt(x)) : []
    };
    try {
      await api.fetchJson('/api/books', { method: 'POST', body: JSON.stringify(payload) });
      new bootstrap.Modal(document.getElementById('bookModal')).hide();
      table.ajax.reload();
    } catch (err) { $('#formError').show().text(err.message || 'Save failed'); }
  });

  $('#booksTable tbody').on('click', '.delete', async function() {
    if (!confirm('Delete this book?')) return;
    const id = $(this).data('id');
    try { await api.fetchJson('/api/books/' + id, { method: 'DELETE' }); table.ajax.reload(); } catch(e){ alert('Delete failed: ' + e.message); }
  });
});
