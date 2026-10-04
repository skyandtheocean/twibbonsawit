(() => {
  const FIXED_FRAME_SRC = "Frames/twb18.png"; 

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
    
    // INI YANG MEMBUAT KOTAK UPLOAD LANGSUNG HILANG
    $("empty").style.display = "none";
    
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
      alert("Gagal memuat file twibbon frames/twb18.png. Pastikan file gambar sudah di-upload ke folder frames.");
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

  // ---- Pointer gestures (Drag & Pinch-Zoom) ----
  const pointers = new Map();
  let pinch = null;

  const toCanvas = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * canvas.width, y: ((e.clientY - r.top) / r.height) * canvas.height };
  };

  const pinchInfo = () => {
    const [a, b] = [...pointers.values()];
    return { dist: Math.hypot(a.x - b.x, a.y - b.y), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
  };

  stage.addEventListener("pointerdown", (e) => {
    if (!state.photo) return;
    stage.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, toCanvas(e));
    stage.classList.add("dragging");
    if (pointers.size === 2) pinch = { ...pinchInfo(), zoom: state.zoom };
  });

  stage.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    const prev = pointers.get(e.pointerId);
    const cur = toCanvas(e);
    pointers.set(e.pointerId, cur);
    if (pointers.size === 1) {
      state.x += cur.x - prev.x;
      state.y += cur.y - prev.y;
      draw();
    } else if (pointers.size === 2 && pinch) {
      const now = pinchInfo();
      state.x += now.mid.x - pinch.mid.x;
      state.y += now.mid.y - pinch.mid.y;
      zoomTo(pinch.zoom * (now.dist / pinch.dist), now.mid.x, now.mid.y);
      pinch.mid = now.mid;
    }
  });

  const endPointer = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (pointers.size === 0) stage.classList.remove("dragging");
  };
  stage.addEventListener("pointerup", endPointer);
  stage.addEventListener("pointercancel", endPointer);

  stage.addEventListener(
    "wheel",
    (e) => {
      if (!state.photo) return;
      e.preventDefault();
      const p = toCanvas(e);
      zoomTo(state.zoom * Math.exp(-e.deltaY * 0.0015), p.x, p.y);
    },
    { passive: false }
  );

  // ---- Drag & drop a photo onto the stage ----
  stage.addEventListener("dragover", (e) => {
    e.preventDefault();
    stage.classList.add("over");
  });
  stage.addEventListener("dragleave", () => stage.classList.remove("over"));
  stage.addEventListener("drop", (e) => {
    e.preventDefault();
    stage.classList.remove("over");
    setPhoto(e.dataTransfer.files[0]);
  });

  // ---- Controls ----
  $("pickPhoto").addEventListener("click", () => $("photoInput").click());
  $("photoInput").addEventListener("change", (e) => {
    setPhoto(e.target.files[0]);
    e.target.value = "";
  });

  zoomEl.addEventListener("input", () => zoomTo(parseFloat(zoomEl.value)));
  rotateEl.addEventListener("input", () => {
    state.rot = parseFloat(rotateEl.value);
    syncControls();
    draw();
  });
  $("zoomInBtn").addEventListener("click", () => zoomTo(state.zoom * 1.1));
  $("zoomOutBtn").addEventListener("click", () => zoomTo(state.zoom / 1.1));
  $("resetBtn").addEventListener("click", resetPosition);

  $("download").addEventListener("click", () => {
    canvas.toBlob((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `twibbon-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }, "image/png");
  });

  initFixedFrame();
})();
