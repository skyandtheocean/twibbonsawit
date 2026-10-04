(() => {
  // Ganti path ini sesuai lokasi file twibbon kamu di folder repository GitHub nanti
  const FIXED_FRAME_SRC = "frames/twibbon-utama.png"; 

  const MIN_ZOOM = 0.1;
  const MAX_ZOOM = 5;

  const $ = (id) => document.getElementById(id);
  const canvas = $("canvas");
  const ctx = canvas.getContext("2d");
  const stage = $("stage");
  const zoomEl = $("zoom");
  const rotateEl = $("rotate");
  const controls = ["zoom", "rotate", "zoomInBtn", "zoomOutBtn", "resetBtn", "download"].map($);

  const state = { photo: null, frame: null, x: 0, y: 0, zoom: 1, rot: 0 };

  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const coverScale = () =>
    Math.max(canvas.width / state.photo.naturalWidth, canvas.height / state.photo.naturalHeight);

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (state.photo) {
      const s = coverScale() * state.zoom;
      ctx.save();
      ctx.translate(state.x, state.y);
      ctx.rotate((state.rot * Math.PI) / 180);
      ctx.scale(s, s);
      ctx.drawImage(state.photo, -state.photo.naturalWidth / 2, -state.photo.naturalHeight / 2);
      ctx.restore();
    }
    if (state.frame) ctx.drawImage(state.frame, 0, 0, canvas.width, canvas.height);
  }

  function syncControls() {
    zoomEl.value = state.zoom;
    rotateEl.value = state.rot;
    $("zoomOut").textContent = Math.round(state.zoom * 100) + "%";
    $("rotateOut").textContent = Math.round(state.rot) + "°";
  }

  function resetPosition() {
    state.x = canvas.width / 2;
    state.y = canvas.height / 2;
    state.zoom = 1;
    state.rot = 0;
    syncControls();
    draw();
  }

  function zoomTo(next, px = canvas.width / 2, py = canvas.height / 2) {
    next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
    const k = next / state.zoom;
    state.x = px + (state.x - px) * k;
    state.y = py + (state.y - py) * k;
    state.zoom = next;
    syncControls();
    draw();
  }

  async function setPhoto(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      if (state.photo) URL.revokeObjectURL(state.photo.src);
      state.photo = img;
    } catch {
      URL.revokeObjectURL(url);
      alert("Gambar tidak bisa dibuka. Coba file lain (JPG atau PNG).");
      return;
    }
    $("empty").hidden = true;
    $("hint").hidden = false;
    stage.classList.add("ready");
    controls.forEach((el) => (el.disabled = false));
    resetPosition();
  }

  async function initFixedFrame() {
    let img;
    try {
      img = await loadImage(FIXED_FRAME_SRC);
    } catch {
      alert("Gagal memuat file twibbon utama di folder frames.");
      return;
    }
    state.frame = img;
    const w = img.naturalWidth || 1080;
    const h = img.naturalHeight || 1080;
    const fit = Math.min(1, 2400 / Math.max(w, h));
    canvas.width = Math.round(w * fit);
    canvas.height = Math.round(h * fit);
    stage.style.aspectRatio = `${canvas.width} / ${canvas.height}`;
    draw();
  }

  // ---- Pointer & Event Listeners Lainnya Tetap Sama ----
  // (Bagian gesture pointer, drag drop, dan tombol zoom/download dibiarkan seperti sebelumnya)
  
  // Load twibbon utama secara otomatis saat halaman dibuka
  initFixedFrame();
})();
