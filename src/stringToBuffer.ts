export default function(str: string): Buffer {
    const bytes: number[] = [];
    
    for (let i = 0; i < str.length; i = i + 2) {
        bytes.push(parseInt(str.slice(i, i + 2), 16));
    }

    return Buffer.from(bytes);
}