export function capitalizeSentence(text: string): string {
    return text
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase()); // Convierte la primera letra de cada palabra a mayúscula
}