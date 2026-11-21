const bucket = 'product-images';
const galleryPrefix = '/object/public/product-images/gallery/';
const imageTypes = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
const maxPhotos = 5;

function photoURL(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : '';
  } catch {
    return '';
  }
}

export function productPhotos(product) {
  const photos = [];
  const seen = new Set();
  for (const row of [...(product.product_images || [])].sort(
    (a, b) => a.sort_order - b.sort_order || String(a.id).localeCompare(String(b.id))
  )) {
    const url = photoURL(row.image_url);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    photos.push({ url, alt: row.alt_text || '', primary: url === photoURL(product.image_url) });
  }
  const cover = photoURL(product.image_url);
  if (cover && !seen.has(cover)) photos.unshift({ url: cover, alt: '', primary: true });
  if (photos.length && !photos.some(photo => photo.primary)) photos[0].primary = true;
  return photos;
}

function setPhoto(frame, photo, name) {
  frame.replaceChildren();
  const empty = document.createElement('span');
  empty.textContent = 'Foto indisponível';
  if (!photo) {
    frame.append(empty);
    return;
  }
  const image = document.createElement('img');
  image.alt = photo.alt || name;
  image.addEventListener('error', () => {
    if (frame.firstChild === image) frame.replaceChildren(empty);
  });
  image.src = photo.url;
  frame.append(image);
}

export function mountGallery(root, product) {
  const photos = productPhotos(product);
  const frame = root.querySelector('.gallery-frame');
  const thumbs = root.querySelector('.gallery-thumbs');
  const status = root.querySelector('.gallery-status');
  const buttons = [];
  let selected = 0;

  function select(index) {
    selected = index;
    setPhoto(frame, photos[index], product.name);
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    if (photos.length > 1) status.textContent = 'Foto ' + (index + 1) + ' de ' + photos.length;
  }

  if (photos.length > 1) {
    photos.forEach((photo, i) => {
      const button = document.createElement('button');
      const image = document.createElement('img');
      button.type = 'button';
      button.setAttribute('aria-label', 'Foto ' + (i + 1) + (photo.primary ? ' (principal)' : ''));
      image.alt = '';
      image.loading = 'lazy';
      image.src = photo.url;
      button.append(image);
      button.onclick = () => select(i);
      thumbs.append(button);
      buttons.push(button);
    });
    thumbs.addEventListener('keydown', event => {
      const delta = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
      if (!delta) return;
      event.preventDefault();
      select((selected + delta + buttons.length) % buttons.length);
      buttons[selected].focus();
    });
  }

  select(Math.max(0, photos.findIndex(photo => photo.primary)));
}

export function editGallery(root, product, notify) {
  const initial = product ? productPhotos(product) : [];
  const photos = initial.map(photo => ({ ...photo }));
  const list = root.querySelector('[data-photo-list]');
  const count = root.querySelector('[data-photo-count]');
  const input = root.querySelector('[data-photo-files]');
  const link = root.querySelector('[data-photo-url]');
  const addLink = root.querySelector('[data-photo-add]');

  function render() {
    list.replaceChildren();
    count.textContent = photos.length + ' de 5 fotos. ' + (photos.length < 3 ? 'Adicione pelo menos 3 para salvar a galeria.' : '');
    input.disabled = link.disabled = addLink.disabled = photos.length >= maxPhotos;

    function action(row, label, description, disabled, run) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'outline';
      button.textContent = label;
      button.setAttribute('aria-label', description);
      button.disabled = disabled;
      button.onclick = () => { run(); render(); };
      row.append(button);
    }

    photos.forEach((photo, index) => {
      const row = document.createElement('li');
      const preview = document.createElement('div');
      const controls = document.createElement('div');
      controls.className = 'photo-actions';
      const position = 'Foto ' + (index + 1);
      setPhoto(preview, photo, position);
      row.append(preview, controls);
      function move(offset) {
        const other = index + offset;
        [photos[index], photos[other]] = [photos[other], photos[index]];
      }
      action(controls, photo.primary ? 'Principal' : 'Tornar principal',
        position + (photo.primary ? ' é a principal' : ' como principal'), photo.primary,
        () => photos.forEach(entry => { entry.primary = entry === photo; }));
      action(controls, '↑', 'Subir ' + position, index === 0, () => move(-1));
      action(controls, '↓', 'Descer ' + position, index === photos.length - 1, () => move(1));
      action(controls, 'Excluir', 'Excluir ' + position, false, () => {
        photos.splice(index, 1);
        if (photo.file) URL.revokeObjectURL(photo.url);
        if (photo.primary && photos.length) photos[0].primary = true;
      });
      list.append(row);
    });
  }

  input.onchange = () => {
    const files = Array.from(input.files);
    input.value = '';
    if (photos.length + files.length > maxPhotos) {
      notify('Selecione até ' + (maxPhotos - photos.length) + ' fotos.');
      return;
    }
    if (files.some(file => !Object.hasOwn(imageTypes, file.type) || !file.size || file.size > 10 * 1024 * 1024)) {
      notify('Use fotos JPG, PNG, WEBP ou GIF de até 10 MB.');
      return;
    }
    for (const file of files) photos.push({ file, url: URL.createObjectURL(file), primary: !photos.length });
    render();
  };

  addLink.onclick = () => {
    const url = photoURL(link.value.trim());
    if (!url || new URL(url).pathname.includes(galleryPrefix)) {
      notify('Informe uma URL externa de imagem válida.');
      return;
    }
    if (photos.some(photo => photo.url === url)) {
      notify('Essa foto já está na galeria.');
      return;
    }
    if (photos.length >= maxPhotos) return;
    photos.push({ url, primary: !photos.length });
    link.value = '';
    render();
  };

  link.onkeydown = event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addLink.click();
    }
  };

  render();
  return {
    initial,
    photos,
    changed: () => photos.length !== initial.length || photos.some((photo, i) =>
      photo.url !== initial[i]?.url || photo.primary !== initial[i]?.primary
    ),
    dispose: () => photos.filter(photo => photo.file).forEach(photo => URL.revokeObjectURL(photo.url))
  };
}

export async function saveProductGallery(db, product, payload, editor) {
  const changed = !product || editor.changed();
  if (changed && (editor.photos.length < 3 || editor.photos.length > maxPhotos)) {
    throw new Error('Adicione de 3 a 5 fotos para salvar a galeria.');
  }
  const storage = db.storage.from(bucket);
  const uploaded = [];
  const photos = [];
  // Only delete paths created by this editor. Legacy and external files may be shared.
  const publicBase = storage.getPublicUrl('gallery/').data.publicUrl;
  const managedPath = url => {
    if (!url.startsWith(publicBase)) return '';
    const suffix = url.slice(publicBase.length);
    return /^[a-f0-9-]{36}\.(jpg|png|webp|gif)$/.test(suffix) ? 'gallery/' + suffix : '';
  };
  async function remove(paths) {
    if (!paths.length) return true;
    try {
      const { data, error } = await storage.remove(paths);
      return !error && data?.length === paths.length;
    } catch {
      return false;
    }
  }

  try {
    if (changed) {
      for (const photo of editor.photos) {
        let url = photo.url;
        if (photo.file) {
          const path = 'gallery/' + crypto.randomUUID() + '.' + imageTypes[photo.file.type];
          uploaded.push(path);
          const { error } = await storage.upload(path, photo.file, { upsert: false, contentType: photo.file.type });
          if (error) throw error;
          url = storage.getPublicUrl(path).data.publicUrl;
        }
        photos.push({ url, alt: photo.alt || payload.name, primary: photo.primary });
      }
    }

    const result = await db.rpc('save_product_gallery', {
      product_id: product?.id || null,
      expected_updated_at: product?.updated_at || null,
      product_data: payload,
      photos: changed ? photos : null
    });
    if (result.error) throw result.error;
  } catch (error) {
    // The deletion policy also protects uploads if the RPC committed but its reply was lost.
    await remove(uploaded);
    throw error;
  }

  if (!changed) return true;
  const retained = new Set(photos.map(photo => photo.url));
  const obsolete = editor.initial.filter(photo => !retained.has(photo.url)).map(photo => managedPath(photo.url)).filter(Boolean);
  return remove(obsolete);
}
