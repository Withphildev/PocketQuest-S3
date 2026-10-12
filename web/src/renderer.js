import {project} from './world.js';
import {depthOrder, screenPosition} from './scene.js';
export class Renderer {
  constructor(canvas) { this.canvas = canvas; this.ctx = canvas.getContext('2d'); }
  draw(blocks, player, options, time) {
    const {canvas, ctx} = this, ratio = Math.min(devicePixelRatio || 1, 2);
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#14261e'; ctx.fillRect(0, 0, width, height);
    const camera = project(player.u, player.v), zoom = options.zoom;
    // One rounded camera translation for all ground/object geometry avoids independent tile-rounding gaps.
    const offsetX = Math.round(width / 2 - camera.x * zoom), offsetY = Math.round(height / 2 - camera.y * zoom);
    ctx.save(); ctx.translate(offsetX, offsetY); ctx.scale(zoom, zoom);
    for (const b of blocks) {
      ctx.drawImage(b.asset.groundInfo.image, b.x * 512, b.y * 288);
      if (options.grid) {
        const cells = b.asset.navigation.cells;
        for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
          ctx.fillStyle = cells[y][x] === 1 ? 'rgba(207,225,146,.06)' : 'rgba(237,85,80,.48)';
          ctx.fillRect(b.x * 512 + x * 16, b.y * 288 + y * 9, 16, 9);
          ctx.strokeStyle = 'rgba(231,244,215,.13)'; ctx.lineWidth = .5;
          ctx.strokeRect(b.x * 512 + x * 16, b.y * 288 + y * 9, 16, 9);
        }
      }
      if (options.seams) {
        ctx.strokeStyle = '#edcb85'; ctx.lineWidth = 1 / zoom;
        ctx.strokeRect(b.x * 512, b.y * 288, 512, 288);
        ctx.fillStyle = 'rgba(237,203,133,.10)';
        for (const rect of [[0, 0, 32, 288], [480, 0, 32, 288], [0, 0, 512, 18], [0, 270, 512, 18]]) ctx.fillRect(b.x * 512 + rect[0], b.y * 288 + rect[1], rect[2], rect[3]);
        ctx.fillStyle = '#f4e6bc'; ctx.font = '11px monospace'; ctx.fillText(`${b.x},${b.y} ${b.asset.manifest.id} [${b.roadMask}]`, b.x * 512 + 40, b.y * 288 + 32);
      }
    }
    for (const entry of depthOrder(blocks, player)) {
      const p = project(entry.u, entry.v);
      if (entry.type === 'object') {
        const o = entry.object, info = blocks.find(b => b.asset.objectImages.has(o.asset)).asset.objectImages.get(o.asset);
        ctx.drawImage(info.image, p.x - o.pivot[0], p.y - o.pivot[1]);
        if (options.grid) {
          ctx.beginPath(); for (const [i, point] of o.collision.entries()) {
            const x = entry.u - o.anchor[0] + point[0], y = (entry.v - o.anchor[1] + point[1]) * 9 / 16;
            if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
          }
          ctx.closePath(); ctx.strokeStyle = '#ffbd91'; ctx.lineWidth = 1; ctx.stroke();
          ctx.fillStyle = '#ffbd91'; ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        }
      } else this.nova(p.x, p.y, player, time);
    }
    ctx.restore();
    const screen = screenPosition(player.u, player.v, camera, width, height, zoom);
    this.lastPlayerScreen = screen;
  }
  nova(x, y, player, time) {
    const c = this.ctx, step = player.walking ? Math.floor(time / 140) % 2 : 0;
    c.fillStyle = '#20302866'; c.beginPath(); c.ellipse(x, y, 10, 4, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#503579'; c.fillRect(x - 8, y - 36 - step, 16, player.protagonist === 'female' ? 27 : 12);
    c.fillStyle = '#e1b889'; c.fillRect(x - 5, y - 31 - step, 10, 10);
    c.fillStyle = '#295b52'; c.fillRect(x - 8, y - 21, 16, 15);
    c.fillStyle = '#49352e'; c.fillRect(x - 7, y - 6, 5, 6 - step); c.fillRect(x + 2, y - 6, 5, 5 + step);
    c.fillStyle = '#c9a658'; c.fillRect(x - 9, y - 12, 18, 3);
    if (player.direction !== 'north') {
      c.fillStyle = '#1c2723'; const shift = player.direction === 'east' ? 3 : player.direction === 'west' ? -3 : 0;
      c.fillRect(x - 3 + shift, y - 28 - step, 2, 2); if (!shift) c.fillRect(x + 2, y - 28 - step, 2, 2);
    } else { c.fillStyle = '#503579'; c.fillRect(x - 7, y - 32 - step, 14, 12); }
    c.fillStyle = '#d7dad0'; c.fillRect(x + (player.direction === 'west' ? -12 : 10), y - 23, 2, 20);
  }
}
