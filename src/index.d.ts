interface hmacOptions {
    algorithm: string;
    identifier: string;
    header: string;
    maxInterval: number;
    minInterval: number;
}
export default function hmac(secret: string): function;