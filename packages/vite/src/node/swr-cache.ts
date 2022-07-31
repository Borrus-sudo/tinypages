import { existsSync, writeFileSync } from "fs";
import { readFile } from "fs/promises";

export class Cache<K, V> {
  private prevUsed: Map<K, V>;
  private currCache = new Map<K, V>();
  constructor(private url: string) {}
  set(key: K, value: V) {
    this.currCache.set(key, value);
  }
  get(key: K): V {
    if (this.currCache.has(key)) {
      return this.currCache.get(key);
    } else if (this.prevUsed.has(key)) {
      const addThisValue = this.prevUsed.get(key);
      this.currCache.set(key, addThisValue);
      return addThisValue;
    } else {
      return undefined;
    }
  }
  has(key: K): boolean {
    return this.currCache.has(key) || this.prevUsed.has(key);
  }
  delete(key: K) {
    this.currCache.delete(key);
    this.prevUsed.delete(key);
  }
  async hydrate() {
    if (!existsSync(this.url)) {
      this.prevUsed = new Map();
    } else {
      this.prevUsed = new Map(
        JSON.parse(await readFile(this.url, { encoding: "utf-8" }))
      );
    }
  }
  return() {
    return new Map(
      Array.from(this.currCache).concat(Array.from(this.prevUsed))
    );
  }
  setCache(newValue) {
    this.currCache = newValue;
  }
  save(isBuild: boolean) {
    if (isBuild) {
      writeFileSync(this.url, JSON.stringify(Array.from(this.currCache)));
    } else {
      writeFileSync(
        this.url,
        JSON.stringify(
          Array.from(this.currCache).concat(Array.from(this.prevUsed))
        )
      );
    }
  }
}
