// import { SplashScreen } from "./splashScreen";
import { splashScreenController } from "./splashScreen-ts";
import { tileSetController } from "./tiles/tileSet-ts";
import { TileSetSnowURI } from "./tiles/tileSetSnowURI";
import { TileSetURI } from "./tiles/tileSetURI";

let tileSet: typeof tileSetController = null;

export const webCityController = {
  fallbackImage: new Image(),
  snowTileSet: null as typeof tileSetController,
  completeSprites: false,
  tiles: document.querySelector("#tiles"),
  onAllTilesLoaded() {
    const sprites: HTMLImageElement = document.querySelector("#sprites");
    if (sprites.complete) {
      const loading = document.querySelector("#loadingBanner");
      if (loading) {
        loading.setAttribute("style", "display:none;");
        //new SplashScreen(tileSet, this.snowTileSet, sprites);
        splashScreenController.create(tileSet, this.snowTileSet, sprites);
      }
    } else {
      window.setTimeout(this.onAllTilesLoaded, 0);
    }
  },
  onTilesLoaded() {
    // const snowtiles = document.querySelector("#snowtiles")
    this.snowTileSet = tileSetController.create(
      this.tiles,
      this.onAllTilesLoaded,
      this.onFallbackTilesLoaded,
    );
  },
  onFallbackError() {
    if (!this.fallbackImage) {
      this.fallbackImage = new Image();
    }
    this.fallbackImage.onload = this.fallbackImage.onerror = null;
    alert("Failed to load tileset!");
  },
  onFallbackSnowLoad() {
    this.fallbackImage.onload = null;
    this.fallbackImage.onerror = null;
    this.snowTileSet = tileSetController.create(
      this.fallbackImage,
      this.onAllTilesLoaded,
      this.onFallbackError,
    );
  },
  onFallbackTilesLoaded() {
    this.fallbackImage = new Image();
    this.fallbackImage.onload = this.onFallbackSnowLoad;
    this.fallbackImage.onerror = this.onFallbackError;
    this.fallbackImage.src = TileSetSnowURI;
  },
  onFallbackLoad() {
    this.fallbackImage.onload = this.fallbackImage.onerror = null;
    tileSet = tileSetController.create(
      this.fallbackImage,
      this.onFallbackTilesLoaded,
      this.onFallbackError,
    );
  },
  tileSetError() {
    this.fallbackImage = new Image();
    this.fallbackImage.onload = this.onFallbackLoad;
    this.fallbackImage.onerror = this.onFallbackError;
    this.fallbackImage.src = TileSetURI;
  },
  init() {
    this.onTilesLoaded = this.onTilesLoaded.bind(this);
    this.tileSetError = this.tileSetError.bind(this);

    tileSet = tileSetController.create(
      this.tiles,
      this.onTilesLoaded,
      this.tileSetError,
    );
  },
};
