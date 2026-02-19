/**
 * Cambia la visibilidad de las secciones con un efecto suave de desvanecimiento.
 * @param {string} id - El ID de la sección que queremos mostrar (ej. 'teoria' o 'grafos').
 */
let canvas, ctx;
let nodos = [];
let aristas = [];
let nodoSeleccionado = null;

function mostrarSeccion(id) {
  const secciones = document.querySelectorAll(".seccion-academia");
  secciones.forEach((s) => {
    s.style.opacity = "0";
    setTimeout(() => {
      s.style.display = "none";
    }, 500);
  });

  setTimeout(() => {
    const destino = document.getElementById(id);
    if (destino) {
      destino.style.display = "block";
      setTimeout(() => {
        destino.style.opacity = "1";
        if (id === "grafos") inicializarCanvas();
      }, 50);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, 550);
}

function inicializarCanvas() {
  canvas = document.getElementById("canvasGrafos");
  if (!canvas) return;
  ctx = canvas.getContext("2d");
  const contenedor = canvas.parentElement;
  canvas.width = contenedor.clientWidth;
  canvas.height = contenedor.clientHeight;

  canvas.replaceWith(canvas.cloneNode(true));
  canvas = document.getElementById("canvasGrafos");
  ctx = canvas.getContext("2d");

  canvas.addEventListener("dblclick", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const nombre = prompt("Nombre del nodo:", "Nodo " + (nodos.length + 1));
    if (nombre) {
      nodos.push({ x, y, label: nombre });
      dibujar();
    }
  });

  canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const nodo = nodos.find((n) => Math.hypot(n.x - x, n.y - y) < 25);

    if (nodo) {
      if (e.shiftKey) {
        nodos = nodos.filter((n) => n !== nodo);
        aristas = aristas.filter((a) => a.desde !== nodo && a.hacia !== nodo);
        nodoSeleccionado = null;
      } else {
        if (!nodoSeleccionado) {
          nodoSeleccionado = nodo;
        } else {
          const peso = prompt("Peso de la conexión:", "1");
          if (peso !== null) {
            aristas.push({ desde: nodoSeleccionado, hacia: nodo, peso: peso });
          }
          nodoSeleccionado = null;
        }
      }
      dibujar();
    } else {
      nodoSeleccionado = null;
      dibujar();
    }
  });
  dibujar();
}

function dibujarFlechaCurva(a) {
  const { desde, hacia, peso } = a;
  const radio = 20;

  ctx.strokeStyle = "#9a7e6f";
  ctx.fillStyle = "#9a7e6f";
  ctx.lineWidth = 2;

  if (desde === hacia) {
    ctx.beginPath();
    ctx.arc(desde.x, desde.y - 30, 20, 0, Math.PI * 2);
    ctx.stroke();
    dibujarPunta(desde.x + 15, desde.y - 15, Math.PI / 2);
    ctx.fillText(peso, desde.x, desde.y - 55);
    return;
  }

  const inversa = aristas.find(
    (ari) => ari.desde === hacia && ari.hacia === desde,
  );
  const dist = Math.hypot(hacia.x - desde.x, hacia.y - desde.y);
  const angle = Math.atan2(hacia.y - desde.y, hacia.x - desde.x);

  ctx.beginPath();
  let cpX, cpY, targetX, targetY;

  if (inversa) {
    const curve = 30;
    cpX = (desde.x + hacia.x) / 2 + curve * Math.cos(angle - Math.PI / 2);
    cpY = (desde.y + hacia.y) / 2 + curve * Math.sin(angle - Math.PI / 2);

    ctx.moveTo(desde.x, desde.y);
    ctx.quadraticCurveTo(cpX, cpY, hacia.x, hacia.y);
    ctx.stroke();

    const t = 0.8;
    targetX =
      Math.pow(1 - t, 2) * desde.x +
      2 * (1 - t) * t * cpX +
      Math.pow(t, 2) * hacia.x;
    targetY =
      Math.pow(1 - t, 2) * desde.y +
      2 * (1 - t) * t * cpY +
      Math.pow(t, 2) * hacia.y;

    ctx.fillText(peso, cpX, cpY);
  } else {
    const tx = hacia.x - radio * Math.cos(angle);
    const ty = hacia.y - radio * Math.sin(angle);
    ctx.moveTo(desde.x, desde.y);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    targetX = tx;
    targetY = ty;
    ctx.fillText(peso, (desde.x + hacia.x) / 2, (desde.y + hacia.y) / 2 - 10);
  }

  dibujarPunta(targetX, targetY, angle);
}

function dibujarPunta(x, y, angulo) {
  const tamaño = 10;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(
    x - tamaño * Math.cos(angulo - Math.PI / 6),
    y - tamaño * Math.sin(angulo - Math.PI / 6),
  );
  ctx.lineTo(
    x - tamaño * Math.cos(angulo + Math.PI / 6),
    y - tamaño * Math.sin(angulo + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
}

function dibujar() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "bold 14px Spectral";
  ctx.textAlign = "center";

  aristas.forEach((a) => dibujarFlechaCurva(a));

  nodos.forEach((n) => {
    ctx.beginPath();
    ctx.arc(n.x, n.y, 20, 0, Math.PI * 2);
    ctx.fillStyle = n === nodoSeleccionado ? "#839b8d" : "#f4f0e6";
    ctx.fill();
    ctx.strokeStyle = "#2d2926";
    ctx.stroke();
    ctx.fillStyle = "#2d2926";
    ctx.fillText(n.label, n.x, n.y + 5);
  });
}

function limpiarLienzo() {
  nodos = [];
  aristas = [];
  dibujar();
}
