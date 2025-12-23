export function tileHistoryController(this: any) {
  this.clear();
}
tileHistoryController.prototype.clear = function () {
  this.data = {};
};
tileHistoryController.prototype.setTile = function (x: number, y: number, value: number) {
  const key = toKey(x, y);
  this.data[key] = value;
};
tileHistoryController.prototype.getTile = function (x: number, y: number) {
  const key = toKey(x, y);
  return this.data[key];
};
const toKey = (x: number, y: number) => {
  return [x, y].join(",");
};