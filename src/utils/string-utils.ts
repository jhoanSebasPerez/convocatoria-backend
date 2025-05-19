export function capitalizeSentence(text: string): string {
    if (!text) return "";

    // Usar una expresión regular Unicode que maneje correctamente caracteres acentuados
    // La expresión /(^|\s)(\p{L})/gu:
    //   - (^|\s): busca el inicio de la cadena o un espacio
    //   - (\p{L}): captura cualquier carácter de letra (incluidos acentos)
    //   - g: búsqueda global en toda la cadena
    //   - u: habilita el modo Unicode para manejar caracteres especiales
    return text
        .toLowerCase()
        .replace(/(^|\s)(\p{L})/gu, (match) => match.toUpperCase());
}