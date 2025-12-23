import { VALVES_UPDATED } from "../utils/messages";
export type iRCI = typeof rciController;
export const rciController = {
  DEFAULT_ID: "RCICanvas",
  _padding: 3, // 3 rectangles in each bit of padding
  _buckets: 10, // 0.2000 is scaled in to 10 buckets
  _rectSize: 4, // Each rect is 5px
  _scale: 0,
  _initialisedBounds: true,
  _intialised: false,
  _canvas: null,
  create(parentNode, eventSource, id?: string) {
    if (!id) {
      id = this.DEFAULT_ID;
    }
    if (typeof parentNode === "string") {
      const orig = parentNode;
      parentNode = document.getElementById(parentNode);
      if (parentNode === null) {
        throw new Error("Node " + orig + " not found");
      }
    }

    this._scale = Math.floor(2000 / this._buckets);

    this._canvas = document.createElement("canvas");
    this._canvas.id = id;
    // Remove any existing element with the same id
    const elems = document.querySelectorAll(`#${id}`);
    const current = elems.length > 0 ? elems[0] : null;
    if (current !== null) {
      if (current.parentNode === parentNode) parentNode.replaceChild(this._canvas, current);
      else throw new Error("ID " + id + " already exists in document!");
    } else parentNode.appendChild(this._canvas);

    // We might be created before our container has appeared on screen
    this._initialisedBounds = false;

    eventSource.addEventListener(VALVES_UPDATED, this.update.bind(this));
    return this;
  },
  _clear(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
  },
  _drawRect(ctx: CanvasRenderingContext2D) {
    // The rect is inset by one unit of padding
    const boxLeft = this._padding * this._rectSize;
    // and is the length of a bar plus a unit of padding down
    const boxTop = (this._buckets + this._padding) * this._rectSize;
    // It must accomodate 3 bars, 2 bits of internal padding
    // with padding either side
    const boxWidth = 7 * this._padding * this._rectSize;
    const boxHeight = this._padding * this._rectSize;

    ctx.fillStyle = "rgb(192, 192, 192)";
    ctx.fillRect(boxLeft, boxTop, boxWidth, boxHeight);
  },
  _drawValue(ctx: CanvasRenderingContext2D, index: number, value: number) {
    // Need to scale com and ind
    if (index > 1) value = Math.floor((2000 / 1500) * value);

    const colours = ["rgb(0,255,0)", "rgb(0, 0, 139)", "rgb(255, 255, 0)"];
    const barHeightRect = Math.floor(Math.abs(value) / this._scale);
    const barStartY = value >= 0 ? this._buckets + this._padding - barHeightRect : this._buckets + 2 * this._padding;
    const barStartX = 2 * this._padding + index * 2 * this._padding;

    ctx.fillStyle = colours[index];
    ctx.fillRect(barStartX * this._rectSize, barStartY * this._rectSize, this._padding * this._rectSize, barHeightRect * this._rectSize);
  },
  _drawLabel(ctx: CanvasRenderingContext2D, index: number) {
    const labels = ["R", "C", "I"];
    const textLeft = 2 * this._padding + index * 2 * this._padding + Math.floor(this._padding / 2);

    ctx.font = "normal xx-small sans-serif";
    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.textBaseline = "bottom";
    ctx.fillText(labels[index], textLeft * this._rectSize, (this._buckets + 2 * this._padding) * this._rectSize);
  },
  update(data) {
    if (!this._intialised) {
      // The canvas is assumed to fill its container on-screen
      const rect: any = this._canvas.parentNode.getBoundingClientRect();
      this._canvas.width = rect.width;
      this._canvas.height = rect.height;
      this._canvas.style.margin = "0";
      this._canvas.style.padding = "0";
      this._intialised = true;
    }

    const ctx = this._canvas.getContext("2d");
    this._clear(ctx);
    this._drawRect(ctx);

    const values = [data.residential, data.commercial, data.industrial];
    for (let i = 0; i < 3; i++) {
      this._drawValue(ctx, i, values[i]);
      this._drawLabel(ctx, i);
    }
  },
};