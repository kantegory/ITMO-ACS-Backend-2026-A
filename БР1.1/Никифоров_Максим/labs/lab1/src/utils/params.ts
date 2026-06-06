// Переводим параметр в строку(если он массив, то берем первый элемент)
export function routeParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}
