/// <reference types="vite/client" />

declare module "*.jpg" {
  const src: string;
  export default src;
}

declare module "*.jpeg" {
  const src: string;
  export default src;
}

declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.gif" {
  const src: string;
  export default src;
}

declare module "*.svg" {
  const src: string;
  export default src;
}

declare module "*.webp" {
  const src: string;
  export default src;
}

declare module "navigo" {
  class Navigo {
    constructor(root?: string, useHash?: boolean, hash?: string);
    on(path: string | Record<string, Function>, handler?: Function): Navigo;
    resolve(path?: string): boolean;
    navigate(path: string, absolute?: boolean): void;
    notFound(handler: Function): Navigo;
    destroy(): void;
    link(path: string): string;
    lastRouteResolved(): { url: string; query: string; hooks: object; params: object };
    hooks(hooks: object): void;
  }
  export default Navigo;
}
