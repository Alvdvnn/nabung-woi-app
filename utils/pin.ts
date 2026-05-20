import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  pinHash: 'nw.pin.hash',
  pinSalt: 'nw.pin.salt',
  questionPrompt: 'nw.pin.q',
  questionHash: 'nw.pin.qHash',
  questionSalt: 'nw.pin.qSalt',
};

export const PIN_MIN = 4;
export const PIN_MAX = 8;

function sha256(message: string): string {
  // Pure-JS SHA-256. Operates on UTF-8 bytes of `message`.
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  const H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  // UTF-8 encode
  const bytes: number[] = [];
  for (let i = 0; i < message.length; i++) {
    let c = message.charCodeAt(i);
    if (c < 0x80) bytes.push(c);
    else if (c < 0x800) {
      bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    } else if (c < 0xd800 || c >= 0xe000) {
      bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    } else {
      i++;
      c = 0x10000 + (((c & 0x3ff) << 10) | (message.charCodeAt(i) & 0x3ff));
      bytes.push(
        0xf0 | (c >> 18),
        0x80 | ((c >> 12) & 0x3f),
        0x80 | ((c >> 6) & 0x3f),
        0x80 | (c & 0x3f),
      );
    }
  }

  // Pad
  const bitLen = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  for (let i = 7; i >= 0; i--) bytes.push((bitLen >>> (i * 8)) & 0xff);

  const w = new Array<number>(64);
  for (let chunk = 0; chunk < bytes.length; chunk += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] =
        (bytes[chunk + i * 4] << 24) |
        (bytes[chunk + i * 4 + 1] << 16) |
        (bytes[chunk + i * 4 + 2] << 8) |
        bytes[chunk + i * 4 + 3];
      w[i] >>>= 0;
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const mj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + mj) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0;
    H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0;
    H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0;
    H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0;
    H[7] = (H[7] + h) >>> 0;
  }

  return H.map((x) => x.toString(16).padStart(8, '0')).join('');
}

function rotr(x: number, n: number): number {
  return ((x >>> n) | (x << (32 - n))) >>> 0;
}

function randomSalt(): string {
  let s = '';
  for (let i = 0; i < 16; i++) {
    s += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  }
  return s;
}

function stretch(input: string, salt: string, rounds = 5000): string {
  let h = sha256(salt + input);
  for (let i = 0; i < rounds; i++) h = sha256(h + salt);
  return h;
}

export interface PinSetupInput {
  pin: string;
  question: string;
  answer: string;
}

export async function hasPin(): Promise<boolean> {
  const h = await AsyncStorage.getItem(KEYS.pinHash);
  return !!h;
}

export async function getRecoveryQuestion(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.questionPrompt);
}

export async function setPin(input: PinSetupInput): Promise<void> {
  const salt = randomSalt();
  const qSalt = randomSalt();
  const pinHash = stretch(input.pin, salt);
  const qHash = stretch(input.answer.trim().toLowerCase(), qSalt);
  await AsyncStorage.multiSet([
    [KEYS.pinSalt, salt],
    [KEYS.pinHash, pinHash],
    [KEYS.questionPrompt, input.question.trim()],
    [KEYS.questionSalt, qSalt],
    [KEYS.questionHash, qHash],
  ]);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const [salt, hash] = await Promise.all([
    AsyncStorage.getItem(KEYS.pinSalt),
    AsyncStorage.getItem(KEYS.pinHash),
  ]);
  if (!salt || !hash) return false;
  return stretch(pin, salt) === hash;
}

export async function verifyAnswer(answer: string): Promise<boolean> {
  const [salt, hash] = await Promise.all([
    AsyncStorage.getItem(KEYS.questionSalt),
    AsyncStorage.getItem(KEYS.questionHash),
  ]);
  if (!salt || !hash) return false;
  return stretch(answer.trim().toLowerCase(), salt) === hash;
}

export async function clearPin(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}

export function validatePinFormat(pin: string): string | null {
  if (!/^\d+$/.test(pin)) return 'PIN must be digits only';
  if (pin.length < PIN_MIN || pin.length > PIN_MAX) return `PIN must be ${PIN_MIN}-${PIN_MAX} digits`;
  return null;
}
