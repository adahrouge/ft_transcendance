// src/ai/nn.ts
// Tiny library-free neural net: 5 -> 4 -> 2 with step activation.

export type Vec = number[];

export class TinyNN {
  // Shapes:
  // in(5) -> hid(4): W1[4][5], b1[4]
  // hid(4) -> out(2): W2[2][4], b2[2]
  W1: number[][];
  b1: number[];
  W2: number[][];
  b2: number[];

  constructor(
    W1?: number[][],
    b1?: number[],
    W2?: number[][],
    b2?: number[],
  ) {
    this.W1 = W1 ?? TinyNN.randMatrix(4, 5);
    this.b1 = b1 ?? TinyNN.randVector(4);
    this.W2 = W2 ?? TinyNN.randMatrix(2, 4);
    this.b2 = b2 ?? TinyNN.randVector(2);
  }

  static randVector(n: number, s = 0.3) {
    const v = new Array(n);
    for (let i = 0; i < n; i++) v[i] = (Math.random() * 2 - 1) * s;
    return v as number[];
  }
  static randMatrix(r: number, c: number, s = 0.3) {
    const m: number[][] = [];
    for (let i = 0; i < r; i++) m.push(TinyNN.randVector(c, s));
    return m;
  }

  static dot(a: number[], b: number[]) {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += a[i] * b[i];
    return s;
  }

  // Step activation (binary)
  static step(x: number) { return x > 0 ? 1 : 0; }

  // Forward pass
  forward(inp5: Vec): Vec {
    if (inp5.length !== 5) throw new Error('TinyNN expects 5 inputs');
    // hidden = step(W1 * inp + b1)
    const hid: number[] = new Array(4);
    for (let i = 0; i < 4; i++) {
      const sum = TinyNN.dot(this.W1[i], inp5) + this.b1[i];
      hid[i] = TinyNN.step(sum);
    }
    // out = step(W2 * hid + b2)
    const out: number[] = new Array(2);
    for (let j = 0; j < 2; j++) {
      const sum = TinyNN.dot(this.W2[j], hid) + this.b2[j];
      out[j] = TinyNN.step(sum);
    }
    return out; // [goUp, goDown] ∈ {0,1}
  }

  // Small Gaussian mutation for GA experiments
  mutate(sigma = 0.1, prob = 0.2) {
    const nudge = (x: number) => x + (randomNormal() * sigma);
    for (let i = 0; i < this.W1.length; i++)
      for (let j = 0; j < this.W1[i].length; j++)
        if (Math.random() < prob) this.W1[i][j] = nudge(this.W1[i][j]);
    for (let i = 0; i < this.b1.length; i++)
      if (Math.random() < prob) this.b1[i] = nudge(this.b1[i]);
    for (let i = 0; i < this.W2.length; i++)
      for (let j = 0; j < this.W2[i].length; j++)
        if (Math.random() < prob) this.W2[i][j] = nudge(this.W2[i][j]);
    for (let i = 0; i < this.b2.length; i++)
      if (Math.random() < prob) this.b2[i] = nudge(this.b2[i]);
  }

  clone() {
    const cp = (m: number[][]) => m.map(r => r.slice());
    return new TinyNN(cp(this.W1), this.b1.slice(), cp(this.W2), this.b2.slice());
  }
}

// Box–Muller normal
function randomNormal() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

