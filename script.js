/* =========================================
    ESTADO Y NAVEGACIÓN
   ========================================= */
let canvas, ctx;
let nodos = [];
let aristas = [];
let nodoSeleccionado = null;

function mostrarSeccion(id) {
  const secciones = document.querySelectorAll(".seccion-academia");
  secciones.forEach((s) => {
    s.style.opacity = "0";
    setTimeout(() => (s.style.display = "none"), 500);
  });

  setTimeout(() => {
    const destino = document.getElementById(id);
    if (destino) {
      destino.style.display = "block";
      setTimeout(() => {
        destino.style.opacity = "1";
        if (id === "grafos") inicializarCanvas();
        if (id === "matriz") generarMatrizDinamica();
      }, 50);
    }
  }, 550);
}
/* =========================================
    SISTEMA DE GRAFOS (INTERACCIÓN MEJORADA)
   ========================================= */
function inicializarCanvas() {
  canvas = document.getElementById("canvasGrafos");
  if (!canvas) return;

  const contenedor = canvas.parentElement;
  canvas.width = contenedor.clientWidth;
  canvas.height = contenedor.clientHeight;

  const nuevoCanvas = canvas.cloneNode(true);
  canvas.replaceWith(nuevoCanvas);
  canvas = nuevoCanvas;
  ctx = canvas.getContext("2d");

  // DESACTIVAR MENÚ DEL NAVEGADOR (Para usar click derecho)
  canvas.oncontextmenu = (e) => e.preventDefault();

  // DOBLE CLIC IZQUIERDO: Crear Nodo
  canvas.addEventListener("dblclick", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const nombre = prompt(
      "Nombre del nodo:",
      String.fromCharCode(65 + nodos.length),
    );
    if (nombre) {
      nodos.push({ x, y, label: nombre.toUpperCase(), id: Date.now() });
      dibujar();
    }
  });

  // CLIC IZQUIERDO: Seleccionar y Conectar
  canvas.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return; // Solo clic izquierdo
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const nodoBajoMouse = nodos.find((n) => Math.hypot(n.x - x, n.y - y) < 25);

    if (nodoBajoMouse) {
      if (!nodoSeleccionado) {
        nodoSeleccionado = nodoBajoMouse;
      } else {
        const peso = prompt("Peso:", "1");
        if (peso !== null) {
          aristas.push({
            desde: nodoSeleccionado,
            hacia: nodoBajoMouse,
            peso: parseInt(peso) || 0,
          });
        }
        nodoSeleccionado = null;
      }
    } else {
      nodoSeleccionado = null;
    }
    dibujar();
  });

  // CLIC DERECHO: Editar (Normal) o Borrar (Con Ctrl)
  canvas.addEventListener("mousedown", (e) => {
    if (e.button !== 2) return; // Solo clic derecho
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 1. BUSCAR NODO
    const nodoIndex = nodos.findIndex((n) => Math.hypot(n.x - x, n.y - y) < 25);

    if (nodoIndex !== -1) {
      if (e.ctrlKey) {
        // BORRAR SI PRESIONA CTRL
        const nodoABorrar = nodos[nodoIndex];
        nodos.splice(nodoIndex, 1);
        aristas = aristas.filter(
          (a) => a.desde !== nodoABorrar && a.hacia !== nodoABorrar,
        );
      } else {
        // EDITAR SI ES CLIC DERECHO SOLO
        const nuevoNombre = prompt(
          "Nuevo nombre para el nodo:",
          nodos[nodoIndex].label,
        );
        if (nuevoNombre) nodos[nodoIndex].label = nuevoNombre.toUpperCase();
      }
      dibujar();
      generarMatrizDinamica(); // Actualiza la tabla automáticamente
      return;
    }

    // 2. BUSCAR ARISTA (Cerca del peso/centro)
    const aristaIndex = aristas.findIndex((a) => {
      let midX, midY;
      if (a.desde === a.hacia) {
        midX = a.desde.x;
        midY = a.desde.y - 45;
      } else {
        midX = (a.desde.x + a.hacia.x) / 2;
        midY = (a.desde.y + a.hacia.y) / 2;
        const hayInversa = aristas.some(
          (r) => r.desde === a.hacia && r.hacia === a.desde && r !== a,
        );
        if (hayInversa) {
          const angle = Math.atan2(
            a.hacia.y - a.desde.y,
            a.hacia.x - a.desde.x,
          );
          midX += Math.cos(angle + Math.PI / 2) * 25;
          midY += Math.sin(angle + Math.PI / 2) * 25;
        }
      }
      return Math.hypot(x - midX, y - midY) < 20;
    });

    if (aristaIndex !== -1) {
      if (e.ctrlKey) {
        // BORRAR SI PRESIONA CTRL
        aristas.splice(aristaIndex, 1);
      } else {
        // EDITAR SI ES CLIC DERECHO SOLO
        const nuevoPeso = prompt(
          "Nuevo peso para la arista:",
          aristas[aristaIndex].peso,
        );
        if (nuevoPeso !== null)
          aristas[aristaIndex].peso = parseInt(nuevoPeso) || 0;
      }
      dibujar();
      generarMatrizDinamica(); // Actualiza la tabla automáticamente
    }
  });
}

/* =========================================
    MOTOR DE DIBUJO (GEOMETRÍA CORREGIDA)
   ========================================= */
function dibujar() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  aristas.forEach((a) => {
    const { desde, hacia, peso } = a;
    const esSelf = desde === hacia;
    const hayInversa = aristas.some(
      (r) => r.desde === hacia && r.hacia === desde && r !== a,
    );
    const radioNodo = 20;

    ctx.strokeStyle = "#9a7e6f";
    ctx.fillStyle = "#9a7e6f";
    ctx.lineWidth = 2;

    if (esSelf) {
      // AUTO-BUCLE: Arco en la parte superior
      const loopX = desde.x;
      const loopY = desde.y - 25;
      const loopR = 15;
      ctx.beginPath();
      ctx.arc(loopX, loopY, loopR, Math.PI * 0.2, Math.PI * 0.8, true);
      ctx.stroke();

      // Punta de flecha del auto-bucle
      const endX = loopX + loopR * Math.cos(Math.PI * 0.8);
      const endY = loopY + loopR * Math.sin(Math.PI * 0.8);
      dibujarPunta(endX, endY, Math.PI * 1.4);

      ctx.fillStyle = "#2d2926";
      ctx.fillText(peso, loopX, loopY - 20);
    } else {
      const angle = Math.atan2(hacia.y - desde.y, hacia.x - desde.x);
      if (hayInversa) {
        // ARISTAS CURVAS (BIDIRECCIONAL)
        const cpX =
          (desde.x + hacia.x) / 2 + Math.cos(angle + Math.PI / 2) * 35;
        const cpY =
          (desde.y + hacia.y) / 2 + Math.sin(angle + Math.PI / 2) * 35;

        ctx.beginPath();
        ctx.moveTo(desde.x, desde.y);
        ctx.quadraticCurveTo(
          cpX,
          cpY,
          hacia.x - radioNodo * Math.cos(angle),
          hacia.y - radioNodo * Math.sin(angle),
        );
        ctx.stroke();

        dibujarPunta(
          hacia.x - radioNodo * Math.cos(angle),
          hacia.y - radioNodo * Math.sin(angle),
          angle,
        );
        ctx.fillStyle = "#2d2926";
        ctx.fillText(peso, cpX, cpY);
      } else {
        // ARISTAS RECTAS
        const tx = hacia.x - radioNodo * Math.cos(angle);
        const ty = hacia.y - radioNodo * Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(desde.x, desde.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        dibujarPunta(tx, ty, angle);
        ctx.fillStyle = "#2d2926";
        ctx.fillText(
          peso,
          (desde.x + hacia.x) / 2,
          (desde.y + hacia.y) / 2 - 10,
        );
      }
    }
  });

  // Dibujar Nodos
  nodos.forEach((n) => {
    ctx.beginPath();
    ctx.arc(n.x, n.y, 20, 0, Math.PI * 2);
    ctx.fillStyle = n === nodoSeleccionado ? "#839b8d" : "#f4f0e6";
    ctx.fill();
    ctx.strokeStyle = "#2d2926";
    ctx.stroke();
    ctx.fillStyle = "#2d2926";
    ctx.textAlign = "center";
    ctx.font = "bold 12px Spectral";
    ctx.fillText(n.label, n.x, n.y + 5);
  });
}

function dibujarPunta(x, y, angulo) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angulo);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-10, -5);
  ctx.lineTo(-10, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/* =========================================
    MATRIZ Y JSON (RESTAURADOS)
   ========================================= */
function limpiarLienzo() {
  if (confirm("¿Borrar todo el trabajo?")) {
    nodos = [];
    aristas = [];
    dibujar();

    const contenedor = document.getElementById("renderMatriz");
    if (contenedor) contenedor.innerHTML = "";
  }
}

function exportarJSON() {
  const data = JSON.stringify({ nodos, aristas });
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "grafo.json";
  a.click();
}

/* =========================================
    MODAL Y JSON (FUNCIONES COMPLETAS)
   ========================================= */

function abrirModalJSON() {
  // Generar el texto JSON de los nodos y aristas actuales
  const data = JSON.stringify({ nodos, aristas }, null, 4);
  const textarea = document.getElementById("codigoJSON");
  const modal = document.getElementById("modalJSON");

  if (textarea && modal) {
    textarea.value = data;
    modal.style.display = "flex"; // Usamos flex para centrarlo
  }
}

function cerrarModalJSON() {
  document.getElementById("modalJSON").style.display = "none";
}

function descargarJSON() {
  const data = document.getElementById("codigoJSON").value;

  let nombre = prompt("Nombre del archivo:", "grafo");
  if (!nombre) nombre = "grafo";

  if (!nombre.endsWith(".json")) {
    nombre += ".json";
  }

  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();

  URL.revokeObjectURL(url);
}

function importarJSON() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";

  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (ev) => {
      try {
        const aux = JSON.parse(ev.target.result);

        if (!aux.nodos || !aux.aristas) {
          throw new Error("Formato inválido");
        }

        nodos = aux.nodos;

        aristas = aux.aristas.map((a) => ({
          desde: nodos.find((n) => n.id === a.desde.id),
          hacia: nodos.find((n) => n.id === a.hacia.id),
          peso: a.peso,
        }));

        dibujar();

        generarMatrizDinamica();

        alert("¡Grafo importado correctamente!");
      } catch (err) {
        alert("Error al importar el archivo JSON.");
        console.error(err);
      }
    };

    reader.readAsText(file);
  };

  input.click();
}

function generarMatrizDinamica() {
  const contenedor = document.getElementById("renderMatriz");
  const n = nodos.length;
  if (n === 0) return;

  let matriz = Array(n)
    .fill(0)
    .map(() => Array(n).fill(0));
  aristas.forEach((a) => {
    const i = nodos.indexOf(a.desde);
    const j = nodos.indexOf(a.hacia);
    matriz[i][j] = a.peso;
  });

  let sumaF = [],
    countF = [],
    sumaC = new Array(n).fill(0),
    countC = new Array(n).fill(0);
  let html = `<table class="tabla-matriz"><thead><tr><th>Nodos</th>`;
  nodos.forEach((nod) => (html += `<th>${nod.label}</th>`));
  html += `<th>Σ Filas</th><th>Count</th></tr></thead><tbody>`;

  for (let i = 0; i < n; i++) {
    let sf = 0,
      cf = 0;
    html += `<tr><th>${nodos[i].label}</th>`;
    for (let j = 0; j < n; j++) {
      let v = matriz[i][j];
      html += `<td>${v || ""}</td>`;
      sf += v;
      sumaC[j] += v;
      if (v !== 0) {
        cf++;
        countC[j]++;
      }
    }
    sumaF.push(sf);
    countF.push(cf);
    html += `<td class="texto-rojo">${sf}</td><td class="texto-naranja">${cf}</td></tr>`;
  }

  // Filas de totales de columnas
  html += `<tr><th class="texto-rojo">Σ Col</th>`;
  sumaC.forEach((s) => (html += `<td class="texto-rojo">${s}</td>`));
  html += `<td>-</td><td>-</td></tr>`;

  html += `<tr><th class="texto-naranja">Count Col</th>`;
  countC.forEach((c) => (html += `<td class="texto-naranja">${c}</td>`));
  html += `<td>-</td><td>-</td></tr></tbody></table>`;

  // Estadísticas
  html += `
    <div class="stats-grid">
        <div class="caja-info">
            <p class="texto-rojo">Máx Suma Filas: ${Math.max(...sumaF)}</p>
            <p class="texto-rojo">Máx Suma Col: ${Math.max(...sumaC)}</p>
        </div>
        <div class="caja-info">
            <p class="texto-naranja">Máx Conteo Filas: ${Math.max(...countF)}</p>
            <p class="texto-naranja">Máx Conteo Col: ${Math.max(...countC)}</p>
        </div>
    </div>`;
  contenedor.innerHTML = html;
}
