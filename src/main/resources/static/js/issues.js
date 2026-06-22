$(async function(){
  if (!api.token()) window.location.href = '/';
  $('#logoutBtn').on('click', ()=>{ localStorage.removeItem('lms_token'); window.location.href='/';});

  const table = $('#issuesTable').DataTable({
    serverSide: true,
    processing: true,
    ajax: function(data, callback) {
      const params = new URLSearchParams();
      params.append('draw', data.draw);
      params.append('start', data.start);
      params.append('length', data.length);
      if (data.search && data.search.value) params.append('search[value]', data.search.value);
      params.append('status', 'ISSUED'); // list active/issued by default
      fetch('/api/issues/datatables?' + params.toString(), { headers: { 'Authorization': 'Bearer ' + api.token() } })
        .then(res => res.json()).then(json => callback(json)).catch(err => alert('Error loading issues'));
    },
    columns: [
      { data: 'id' },
      { data: row => row.book ? row.book.title : '' },
      { data: row => row.copy ? row.copy.barcode : '' },
      { data: row => row.member ? (row.member.firstName || '') + (row.member.lastName ? ' ' + row.member.lastName : '') : '' },
      { data: 'issueDate' },
      { data: 'dueDate' },
      { data: 'status' },
      { data: null, orderable: false, render: d => `<button class="btn btn-sm btn-success return" data-id="${d.id}">Return</button>` }
    ]
  });

  // populate member/book selects for issuing
  const members = await api.fetchJson('/api/members');
  members.forEach(m => $('#memberSelect').append(`<option value="${m.id}">${m.memberNo} - ${m.firstName} ${m.lastName || ''}</option>`));
  const books = await api.fetchJson('/api/books');
  books.forEach(b => $('#bookSelect').append(`<option value="${b.id}">${b.title}</option>`));

  $('#bookSelect').on('change', async function() {
    const bookId = $(this).val();
    $('#copySelect').empty();
    if (!bookId) return;
    const copies = await api.fetchJson(`/api/bookCopies/available?bookId=${bookId}`);
    copies.forEach(c => $('#copySelect').append(`<option value="${c.id}">${c.barcode || 'Copy-'+c.copyNumber}</option>`));
  });

  $('#issueForm').on('submit', async function(e) {
    e.preventDefault();
    const copyId = parseInt($('#copySelect').val());
    const memberId = parseInt($('#memberSelect').val());
    if (!copyId || !memberId) return alert('select member and copy');
    try {
      await api.fetchJson('/api/issues/issue', { method: 'POST', body: JSON.stringify({ copyId, memberId }) });
      new bootstrap.Modal(document.getElementById('issueModal')).hide();
      table.ajax.reload();
    } catch (err) { $('#formError').show().text(err.message || 'Issue failed'); }
  });

  $('#issuesTable tbody').on('click', '.return', async function() {
    const id = $(this).data('id');
    if (!confirm('Process return?')) return;
    try {
      const res = await api.fetchJson('/api/issues/return/' + id, { method: 'POST' });
      alert('Returned. Fine: ' + (res.fineAmount || 0));
      table.ajax.reload();
    } catch (err) { alert('Return failed: ' + err.message); }
  });
});
