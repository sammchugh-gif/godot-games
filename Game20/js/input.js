// Keyboard, mouse and touch, boiled down to: a move stick, a camera drag,
// and JUMP / ACTION buttons. Touch gets a floating stick on the left half.
export class Input {
  constructor(el) {
    this.el = el;
    this.keys = new Set();
    this.mx = 0; this.my = 0;           // move stick, -1..1 (my up = forward)
    this.lookX = 0; this.lookY = 0;     // camera drag since last read, pixels
    this.jumpHeld = false; this.jumpPressed = false; this.actionPressed = false; this.boostHeld = false;
    this.enabled = true;
    this.stick = null;                  // {id, x0, y0, x, y}
    this.look = null;                   // {id, x, y}
    this.touchUI = matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
    addEventListener("keydown", e => {
      if (e.repeat) { if (this.keys.has(e.code)) return; }
      this.keys.add(e.code);
      if (e.code === "Space") { this.jumpPressed = true; this.jumpHeld = true; e.preventDefault(); }
      if (e.code === "KeyE" || e.code === "Enter") this.actionPressed = true;
    });
    addEventListener("keyup", e => { this.keys.delete(e.code); if (e.code === "Space") this.jumpHeld = false; });
    addEventListener("blur", () => { this.keys.clear(); this.jumpHeld = false; this.stick = null; this.look = null; });
    el.addEventListener("pointerdown", e => this.down(e));
    addEventListener("pointermove", e => this.moveP(e));
    addEventListener("pointerup", e => this.up(e));
    addEventListener("pointercancel", e => this.up(e));
    el.addEventListener("contextmenu", e => e.preventDefault());
  }
  down(e) {
    if (!this.enabled) return;
    if (e.pointerType === "touch" && e.clientX < innerWidth * 0.45 && !this.stick) {
      this.stick = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY };
    } else if (!this.look) {
      this.look = { id: e.pointerId, x: e.clientX, y: e.clientY };
    }
  }
  moveP(e) {
    if (this.stick && e.pointerId === this.stick.id) { this.stick.x = e.clientX; this.stick.y = e.clientY; }
    else if (this.look && e.pointerId === this.look.id) {
      this.lookX += e.clientX - this.look.x; this.lookY += e.clientY - this.look.y;
      this.look.x = e.clientX; this.look.y = e.clientY;
    }
  }
  up(e) {
    if (this.stick && e.pointerId === this.stick.id) this.stick = null;
    if (this.look && e.pointerId === this.look.id) this.look = null;
  }
  // sample once per frame
  poll() {
    let x = 0, y = 0;
    const k = this.keys;
    if (k.has("KeyA") || k.has("ArrowLeft")) x -= 1;
    if (k.has("KeyD") || k.has("ArrowRight")) x += 1;
    if (k.has("KeyW") || k.has("ArrowUp")) y += 1;
    if (k.has("KeyS") || k.has("ArrowDown")) y -= 1;
    if (this.stick) {
      const R = 60;
      let dx = (this.stick.x - this.stick.x0) / R, dy = -(this.stick.y - this.stick.y0) / R;
      const l = Math.hypot(dx, dy);
      if (l > 1) { dx /= l; dy /= l; }
      // let the stick's base follow the thumb when dragged far
      if (l > 1.4) { this.stick.x0 = this.stick.x - dx * R; this.stick.y0 = this.stick.y + dy * R; }
      x += dx; y += dy;
    }
    const l = Math.hypot(x, y);
    if (l > 1) { x /= l; y /= l; }
    this.mx = x; this.my = y;
    this.boostHeld = k.has("ShiftLeft") || k.has("ShiftRight") || this.boostTouch;
    if (this.forced) { this.mx = this.forced.mx; this.my = this.forced.my; }
  }
  takeLook() { const r = [this.lookX, this.lookY]; this.lookX = 0; this.lookY = 0; return r; }
  takeJump() { const j = this.jumpPressed; this.jumpPressed = false; return j; }
  takeAction() { const a = this.actionPressed; this.actionPressed = false; return a; }
  clear() { this.jumpPressed = false; this.actionPressed = false; this.lookX = this.lookY = 0; }
}
