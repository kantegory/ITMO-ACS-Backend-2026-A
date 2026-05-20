"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeParam = routeParam;
// Переводим параметр в строку(если он массив, то берем первый элемент)
function routeParam(value) {
    return Array.isArray(value) ? value[0] : value;
}
