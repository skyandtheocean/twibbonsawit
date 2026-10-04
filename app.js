(function () {
  const $ = (id) => document.getElementById(id);

  const canvas = $("canvas");
  const ctx = canvas.getContext("2d");

  const photoInput = $("photoInput");
  const pickPhotoBtn = $("pickPhoto");

  const zoomInput = $("zoom");
  const rotateInput = $("rotate");

  const zoomOutOutput = $("zoomOut");
  const rotateOutOutput = $("rotateOut");

  const zoomInBtn = $("zoomInBtn");
  const zoomOutBtn = $("zoomOutBtn");
  const resetBtn = $("resetBtn");
  const downloadBtn = $("download");

  const hint = $("hint");

  let frameImg = new Image();
  let photoImg = null;

  // Frame URL & Canvas Size
  const FRAME_SRC = "Frames/twb18.png";
  const CANVAS_SIZE = 1080;

  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;

  // State Transform
  let scale = 1;
  let rotation = 0; // Derajat
  let posX = 0;
  let posY = 0;

  // Dragging State
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  // Touch State
  let initialPinchDistance = null;
  let initialScale = 1;

  function initFixedFrame() {
    frameImg.src = FRAME_SRC;
    frameImg.onload = () => {
      render();
    };
  }

  function setControlsEnabled(enabled) {
    zoomInput.disabled = !enabled;
    rotateInput.disabled = !enabled;
    zoomInBtn.disabled = !enabled;
    zoomOutBtn.disabled = !enabled;
    resetBtn.disabled = !enabled;
    downloadBtn.disabled = !enabled;
    if (enabled) {
      hint.hidden = false;
    }
  }

  function render() {
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    if (photoImg) {
      ctx.save();
      ctx.translate(CANVAS_SIZE / 2 + posX, CANVAS_SIZE / 2 + posY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);

      ctx.drawImage(
        photoImg,
        -photoImg.width / 2,
        -photoImg.height / 2,
        photoImg.width,
        photoImg.height
      );
      ctx.restore();
    }

    if (frameImg.complete && frameImg.naturalWidth !== 0) {
      ctx.drawImage(frameImg, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }
  }

  function updateControlsUI() {
    zoomInput.value = scale;
    zoomOutOutput.textContent = Math.round(scale * 100) + "%";

    rotateInput.value = rotation;
    rotateOutOutput.textContent = rotation + "°";
  }

  function resetTransform() {
    if (!photoImg) return;
    const baseScale = Math.max(
      CANVAS_SIZE / photoImg.width,
      CANVAS_SIZE / photoImg.height
    );
    scale = baseScale;
    rotation = 0;
    posX = 0;
    posY = 0;

    zoomInput.min = baseScale * 0.2;
    zoomInput.max = baseScale * 5;

    updateControlsUI();
    render();
  }

  // Handle Photo Upload
  pickPhotoBtn.addEventListener("click", () => photoInput.click());

  photoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        photoImg = img;
        resetTransform();
        setControlsEnabled(true);
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  });

  // Controls Event
  zoomInput.addEventListener("input", (e) => {
    scale = parseFloat(e.target.value);
    updateControlsUI();
    render();
  });

  rotateInput.addEventListener("input", (e) => {
    rotation = parseInt(e.target.value, 10);
    updateControlsUI();
    render();
  });

  zoomInBtn.addEventListener("click", () => {
    scale = Math.min(parseFloat(zoomInput.max), scale * 1.1);
    updateControlsUI();
    render();
  });

  zoomOutBtn.addEventListener("click", () => {
    scale = Math.max(parseFloat(zoomInput.min), scale / 1.1);
    updateControlsUI();
    render();
  });

  resetBtn.addEventListener("click", resetTransform);

  // Mouse Dragging
  canvas.addEventListener("mousedown", (e) => {
    if (!photoImg) return;
    isDragging = true;
    startX = e.clientX - posX;
    startY = e.clientY - posY;
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    posX = e.clientX - startX;
    posY = e.clientY - startY;
    render();
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
  });

  // Mouse Wheel Zoom
  canvas.addEventListener("wheel", (e) => {
    if (!photoImg) return;
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
    scale = Math.min(
      parseFloat(zoomInput.max),
      Math.max(parseFloat(zoomInput.min), scale * zoomFactor)
    );
    updateControlsUI();
    render();
  }, { passive: false });

  // Download
  downloadBtn.addEventListener("click", () => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "TWIBBON-BILLKIN.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  });

  const bgm = $("bgm");
  const musicToggle = $("musicToggle");

  if (bgm && musicToggle) {
    musicToggle.addEventListener("click", () => {
      if (bgm.paused) {
        bgm.play();
        musicToggle.textContent = "🔊 Pause Music";
      } else {
        bgm.pause();
        musicToggle.textContent = "🎵 Play Music";
      }
    });
  }

  initFixedFrame();
})();
