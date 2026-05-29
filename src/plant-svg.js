// Процедурная отрисовка растения в SVG по проценту роста.
// (seedSVG удалён — семечки в карточках теперь PNG из icons/seeds/.)

function leafPath(x, y, dir, len, droop = 0) {
  const tipX = x + dir * len;
  const tipY = y - len * 0.1 + droop;
  const cUpX = x + dir * len * 0.5;
  const cUpY = y - len * 0.45 + droop * 0.5;
  const cDnX = x + dir * len * 0.5;
  const cDnY = y + len * 0.18 + droop;
  return `M ${x} ${y} Q ${cUpX} ${cUpY} ${tipX} ${tipY} Q ${cDnX} ${cDnY} ${x} ${y} Z`;
}

export function plantSVG({
  growth = 0,
  driedLeaves = 0,
  seed,
  pot,
  finished = false,
  withered = false,
}) {
  const leafColor = withered ? '#8d6e3a' : seed?.leafColor || '#4caf50';
  const flowerColor = seed?.flowerColor || '#f4b400';
  const potColor = pot?.color || '#9c7a52';
  const rimColor = pot?.rim || '#82643f';

  const soilY = 192;
  // У PNG-горшка устье выше, чем у процедурной трапеции — поднимаем почву и
  // всё растение на lift пикселей, чтобы цветок рос из земли в устье.
  const lift = pot?.icon ? 10 : 0;
  const baseY = soilY - lift;
  const cx = 100;

  // Горшок + почва. Если у горшка есть PNG-иконка — рисуем её слоем (растение
  // потом поверх, как будто растёт из него); иначе — процедурная трапеция.
  const parts = [];
  if (pot?.icon) {
    // Мягкая тень под горшком (отдельный PNG), затем сам горшок поверх неё.
    parts.push(`<image href="icons/ui/pot-shadow.png" x="44" y="240" width="112" height="26" preserveAspectRatio="none"/>`);
    parts.push(`<image href="${pot.icon}" x="48" y="162" width="104" height="92" preserveAspectRatio="xMidYMax meet" style="image-rendering:pixelated"/>`);
    parts.push(`<ellipse cx="${cx}" cy="${baseY - 3}" rx="42" ry="8" fill="#5b3f2a"/>`);
  } else {
    parts.push(`<path d="M 56 ${soilY} L 144 ${soilY} L 132 250 L 68 250 Z" fill="${potColor}"/>`);
    parts.push(`<rect x="50" y="${soilY - 10}" width="100" height="14" rx="4" fill="${rimColor}"/>`);
    parts.push(`<ellipse cx="${cx}" cy="${soilY - 3}" rx="48" ry="9" fill="#5b3f2a"/>`);
  }

  if (growth < 4 && !finished) {
    // Семечко в земле / едва проклюнулось.
    parts.push(`<ellipse cx="${cx}" cy="${baseY - 6}" rx="6" ry="4" fill="#6b4a2f"/>`);
    if (growth > 1) {
      parts.push(`<path d="M ${cx} ${baseY - 6} q 0 -10 6 -14" stroke="${leafColor}" stroke-width="3" fill="none" stroke-linecap="round"/>`);
    }
    return wrap(parts.join(''));
  }

  // Стебель.
  const stemH = Math.min(150, 6 + growth * 1.45);
  const stemTopY = baseY - 6 - stemH;
  const bend = Math.sin(growth * 0.3) * 4;
  const stemW = withered ? 3 : 3 + growth * 0.04;
  const stemColor = withered ? '#7a5a33' : '#5d9c4a';
  parts.push(
    `<path d="M ${cx} ${baseY - 4} C ${cx + bend} ${baseY - stemH * 0.4} ${cx - bend} ${stemTopY + stemH * 0.3} ${cx + bend * 0.5} ${stemTopY}" stroke="${stemColor}" stroke-width="${stemW}" fill="none" stroke-linecap="round"/>`
  );

  // Листья вдоль стебля, попарно по сторонам.
  const leafCount = Math.min(7, Math.floor(growth / 13));
  const droop = withered ? 18 : 0;
  for (let i = 0; i < leafCount; i++) {
    const t = (i + 1) / (leafCount + 1);
    const ly = baseY - 6 - stemH * t;
    const lx = cx + Math.sin(t * 6) * bend * 0.5;
    const dir = i % 2 === 0 ? 1 : -1;
    const len = (18 + growth * 0.22) * (0.7 + t * 0.4);
    parts.push(`<path d="${leafPath(lx, ly, dir, len, droop)}" fill="${leafColor}"/>`);
  }

  // Бутон / цветок на макушке.
  if (finished || growth > 86) {
    const fy = stemTopY - 2;
    if (finished) {
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        parts.push(`<ellipse cx="${cx + Math.cos(a) * 11}" cy="${fy + Math.sin(a) * 11}" rx="8" ry="5" fill="${flowerColor}" transform="rotate(${(a * 180) / Math.PI} ${cx + Math.cos(a) * 11} ${fy + Math.sin(a) * 11})"/>`);
      }
      parts.push(`<circle cx="${cx}" cy="${fy}" r="7" fill="#8d5524"/>`);
    } else {
      parts.push(`<circle cx="${cx}" cy="${fy}" r="6" fill="${flowerColor}" opacity="0.85"/>`);
    }
  }

  // Сухие опавшие листья у основания.
  const driedShown = Math.min(5, driedLeaves);
  for (let i = 0; i < driedShown; i++) {
    const dx = cx - 30 + i * 15 + (i % 2) * 4;
    const dy = baseY - 2 + (i % 2) * 4;
    const dir = i % 2 === 0 ? 1 : -1;
    parts.push(`<path d="${leafPath(dx, dy, dir, 12, 6)}" fill="#a9772f" opacity="0.9"/>`);
  }

  return wrap(parts.join(''));
}

function wrap(inner) {
  return `<svg viewBox="0 0 200 260" class="plant-svg" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}
