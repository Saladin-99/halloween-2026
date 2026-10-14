/** A fresh in-memory shuffle bag per page load; no play order is stored between visits. */
export class ShufflePlaylist {
  readonly tracks: readonly string[];
  private bag: string[] = [];
  private index = 0;
  current: string | null = null;

  constructor(tracks: readonly string[], private random = Math.random) {
    this.tracks = [...new Set(tracks.filter(Boolean))];
  }

  next(): string | null {
    if (!this.tracks.length) return null;
    if (this.index === this.bag.length) {
      this.bag = [...this.tracks];
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
      // Avoid an immediate repeat at the cycle boundary when there is a choice.
      if (this.bag.length > 1 && this.bag[0] === this.current) {
        const j = 1 + Math.floor(this.random() * (this.bag.length - 1));
        [this.bag[0], this.bag[j]] = [this.bag[j], this.bag[0]];
      }
      this.index = 0;
    }
    this.current = this.bag[this.index++];
    return this.current;
  }
}
