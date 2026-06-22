$(async function(){
  if (!api.token()) window.location.href = '/';
  $('#logoutBtn').on('click', ()=>{ localStorage.removeItem('lms_token'); window.location.href='/';});

  const table = $('#publishersTable').DataTable({
    serverSide: true,
    processing: true,
    ajax: function(data, callback) {
      const params = new URLSearchParams();
      params.append('draw', data.draw);
      params.append('start', data.start);
      params.append('length', data.length);
      if (data.search && data.search.value) params.append('search[value]', data.search.value);
      fetch('/api/publishers/datatables?' + params.toString(), { headers: { 'Authorization': 'Bearer ' + api.token() } })
        .then(res => res.json()).then(json => callback(json)).catch(err => alert('Error loading publishers'));
    },
    columns: [
      { data: 'id' }, { data: 'name' }, { data: 'address' }, { data: 'phone' }, { data: 'email' },
      { data: null, orderable: false, render: d => {
          const id = d.id;
          const editBtn = `<button class="btn btn-sm btn-primary edit" data-id="${id}">Edit</button>`;
          const delBtn = api.isAdmin() ? `<button class="btn btn-sm btn-danger ms-1 delete" data-id="${id}">Delete</button>` : '';
          return editBtn + delBtn;
        }
      }
    ]
  });

  $('#addBtn').on('click', ()=> {
    $('#pubId').val(''); $('#pubName').val(''); $('#pubAddress').val(''); $('#pubPhone').val(''); $('#pubEmail').val(''); $('#pubWebsite').val('');
    $('#formError').hide(); new bootstrap.Modal(document.getElementById('publisherModal')).show();
  });

  $('#publishersTable tbody').on('click', '.edit', async function() {
    const id = $(this).data('id');
    const p = await api.fetchJson('/api/publishers/' + id);
    $('#pubId').val(p.id); $('#pubName').val(p.name); $('#pubAddress').val(p.address || ''); $('#pubPhone').val(p.phone || ''); $('#pubEmail').val(p.email || ''); $('#pubWebsite').val(p.website || '');
    $('#formError').hide(); new bootstrap.Modal(document.getElementById('publisherModal')).show();
  });

  $('#publishersTable tbody').on('click', '.delete', async function() {
    if (!confirm('Delete publisher?')) return;
    const id = $(this).data('id');
    try { await api.fetchJson('/api/publishers/' + id, { method: 'DELETE' }); table.ajax.reload(); } catch(e){ alert('Delete failed: ' + e.message); }
  });

  $('#publisherForm').on('submit', async function(e){
    e.preventDefault();
    const id = $('#pubId').val();
    const payload = { name: $('#pubName').val(), address: $('#pubAddress').val(), phone: $('#pubPhone').val(), email: $('#pubEmail').val(), website: $('#pubWebsite').val() };
    try {
      if (id) await api.fetchJson('/api/publishers/' + id, { method: 'PUT', body: JSON.stringify(payload) });
      else await api.fetchJson('/api/publishers', { method: 'POST', body: JSON.stringify(payload) });
      new bootstrap.Modal(document.getElementById('publisherModal')).hide();
      table.ajax.reload();
    } catch (err) { $('#formError').show().text(err.message || 'Save failed'); }
  });
});
