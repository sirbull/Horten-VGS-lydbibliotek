let currentAudio = null;
let currentPlayBtn = null;
let totalFiles = 0;
let allFileDivs = [];
let selectedIndex = 0;

const supportedAudioExtensions = ['.mp3', '.wav', '.aac', '.flac', '.aiff', '.alac', '.ogg'];

const backgrounds = [
  "backgrounds/bg1.png",
  "backgrounds/bg2.png",
  "backgrounds/bg3.png",
  "backgrounds/bg4.png",
  "backgrounds/bg5.png",
  "backgrounds/bg6.png",
  "backgrounds/bg7.png",
  "backgrounds/bg8.png",
  "backgrounds/bg9.png"
];

const chosen = backgrounds[Math.floor(Math.random() * backgrounds.length)];
const bgImg = new Image();
bgImg.src = chosen;
bgImg.onload = () => {
  document.body.style.backgroundImage = `url('${chosen}')`;
};
bgImg.onerror = () => {
  document.body.style.background = "radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%)";
};

document.getElementById("choose-folder").addEventListener("click", async () => {
  const dirHandle = await window.showDirectoryPicker();

  const intro = document.getElementById("intro");
  const logo = document.getElementById("logo");

  if (logo && intro) {
    document.body.insertBefore(logo, intro);
    logo.classList.add("fixed");
  }
  if (intro) intro.remove();

  const existing = document.getElementById("file-list");
  if (existing) existing.remove();

  const fileList = document.createElement("div");
  fileList.id = "file-list";
  fileList.classList.add("glass");
  document.body.appendChild(fileList);

  allFileDivs = [];
  totalFiles = 0;
  await readFolder(dirHandle, fileList);

  const countInfo = document.createElement("div");
  countInfo.id = "file-count";
  countInfo.textContent = `Fant ${totalFiles} lydfiler`;
  fileList.prepend(countInfo);

  // Legg til søkefelt dynamisk etter mappevalg
  const searchWrapper = document.createElement("div");
  searchWrapper.id = "search-container";
  searchWrapper.innerHTML = `
    <div class="search-box">
      <input type="text" id="search" placeholder="Søk i filene..." />
      <span class="material-icons search-icon">search</span>
    </div>
  `;
  fileList.before(searchWrapper);

  // Marker første fil
  if (allFileDivs.length > 0) {
    selectedIndex = 0;
    allFileDivs[0].classList.add("selected");
  }
});

async function readFolder(folderHandle, container, depth = 0) {
  for await (const [name, handle] of folderHandle.entries()) {
    if (handle.kind === "directory") {
      const folderWrapper = document.createElement("div");
      folderWrapper.className = "folder-wrapper";
      folderWrapper.style.marginLeft = `${depth * 20}px`;

      const folderHeader = document.createElement("div");
      folderHeader.className = "folder";

      const toggleIcon = document.createElement("span");
      toggleIcon.className = "material-icons toggle-icon";
      toggleIcon.textContent = "expand_more";

      folderHeader.appendChild(toggleIcon);
      folderHeader.appendChild(document.createTextNode(name));
      folderWrapper.appendChild(folderHeader);

      const folderContent = document.createElement("div");
      folderContent.className = "folder-content";
      folderWrapper.appendChild(folderContent);

      toggleIcon.addEventListener("click", () => {
        folderContent.classList.toggle("collapsed");
        toggleIcon.textContent = folderContent.classList.contains("collapsed") ? "chevron_right" : "expand_more";
      });

      container.appendChild(folderWrapper);
      await readFolder(handle, folderContent, depth + 1);
    } else if (handle.kind === "file" && isAudioFile(name)) {
      const file = await handle.getFile();
      const url = URL.createObjectURL(file);
      const arrayBuffer = await file.arrayBuffer();

      const audio = new Audio(url);
      audio.preload = "auto";

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const decoded = await audioCtx.decodeAudioData(arrayBuffer);
      const duration = decoded.duration;

      const fileDiv = document.createElement("div");
      fileDiv.className = "file";
      allFileDivs.push(fileDiv); // 👈 Legg til for tastaturnavigasjon

      const playBtn = document.createElement("button");
      playBtn.className = "play-button material-icons";
      playBtn.textContent = "play_arrow";

      const nameSpan = document.createElement("span");
      nameSpan.textContent = name;

      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 40;
      canvas.className = "waveform";

      const ctx = canvas.getContext("2d");
      const data = decoded.getChannelData(0);
      const samples = canvas.width;
      const step = Math.max(1, Math.floor(data.length / samples));
      const amp = canvas.height / 2;

      ctx.fillStyle = "#ccc";
      for (let i = 0; i < canvas.width; i++) {
        let min = 1.0, max = -1.0;
        for (let j = 0; j < step; j++) {
          const datum = data[(i * step) + j];
          if (datum < min) min = datum;
          if (datum > max) max = datum;
        }
        ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
      }

      const rightContainer = document.createElement("div");
      rightContainer.className = "right-side";

      const durationSpan = document.createElement("span");
      durationSpan.className = "duration";
      durationSpan.textContent = formatDuration(duration);

      const saveBtn = document.createElement("button");
      saveBtn.className = "download-button material-icons";
      saveBtn.textContent = "download";
      saveBtn.title = "Lagre fil";
      saveBtn.addEventListener("click", async () => {
        const newHandle = await window.showSaveFilePicker({ suggestedName: name });
        const writable = await newHandle.createWritable();
        await writable.write(arrayBuffer);
        await writable.close();
      });

      canvas.addEventListener("click", (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = x / canvas.width;
        audio.currentTime = percent * audio.duration;

        if (audio.paused) {
          if (currentAudio && currentAudio !== audio) {
            currentAudio.pause();
            if (currentPlayBtn) currentPlayBtn.textContent = "play_arrow";
          }

          audio.play();
          playBtn.textContent = "pause";
          currentAudio = audio;
          currentPlayBtn = playBtn;

          requestAnimationFrame(drawPlayhead);
        }
      });

      function drawPlayhead() {
        const x = (audio.currentTime / audio.duration) * canvas.width;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ccc";
        for (let i = 0; i < canvas.width; i++) {
          let min = 1.0, max = -1.0;
          for (let j = 0; j < step; j++) {
            const datum = data[(i * step) + j];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
          }
          ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
        }

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.strokeStyle = "#FF4081";
        ctx.lineWidth = 2;
        ctx.stroke();

        if (!audio.paused) {
          requestAnimationFrame(drawPlayhead);
        }
      }

      playBtn.addEventListener("click", () => {
        if (currentAudio && currentAudio !== audio) {
          currentAudio.pause();
          if (currentPlayBtn) currentPlayBtn.textContent = "play_arrow";
        }

        if (currentAudio === audio && !audio.paused) {
          audio.pause();
          playBtn.textContent = "play_arrow";
        } else {
          audio.play();
          playBtn.textContent = "pause";
          currentAudio = audio;
          currentPlayBtn = playBtn;

          requestAnimationFrame(drawPlayhead);
        }
      });

      rightContainer.appendChild(durationSpan);
      rightContainer.appendChild(saveBtn);

      fileDiv.appendChild(playBtn);
      fileDiv.appendChild(nameSpan);
      fileDiv.appendChild(canvas);
      fileDiv.appendChild(rightContainer);
      container.appendChild(fileDiv);
      totalFiles++;
    }
  }
}

function isAudioFile(filename) {
  const lower = filename.toLowerCase();
  return supportedAudioExtensions.some(ext => lower.endsWith(ext));
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

// 🔽 Tastaturnavigasjon
function updateSelected(indexChange) {
  if (allFileDivs.length === 0) return;

  allFileDivs[selectedIndex]?.classList.remove("selected");
  selectedIndex += indexChange;
  if (selectedIndex < 0) selectedIndex = allFileDivs.length - 1;
  if (selectedIndex >= allFileDivs.length) selectedIndex = 0;
  const selected = allFileDivs[selectedIndex];
  selected.classList.add("selected");
  selected.scrollIntoView({ behavior: "smooth", block: "center" });
}

function playSelected() {
  const selected = allFileDivs[selectedIndex];
  if (!selected) return;
  const playBtn = selected.querySelector(".play-button");
  if (playBtn) playBtn.click();
}

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") {
    e.preventDefault();
    updateSelected(1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    updateSelected(-1);
  } else if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    playSelected();
  } else if (e.key === "Escape") {
    if (currentAudio) {
      currentAudio.pause();
      if (currentPlayBtn) currentPlayBtn.textContent = "play_arrow";
    }
  }
});

document.addEventListener("input", (e) => {
  if (e.target.id === "search") {
    const term = e.target.value.trim().toLowerCase();

    allFileDivs.forEach(fileDiv => {
      const text = fileDiv.querySelector("span")?.textContent.toLowerCase() || "";
      if (text.includes(term)) {
        fileDiv.style.display = "";
      } else {
        fileDiv.style.display = "none";
      }
    });

    // Skjul mapper uten synlige barn
    document.querySelectorAll(".folder-wrapper").forEach(wrapper => {
      const files = wrapper.querySelectorAll(".file");
      const anyVisible = [...files].some(f => f.style.display !== "none");
      wrapper.style.display = anyVisible ? "" : "none";
    });
  }
});
