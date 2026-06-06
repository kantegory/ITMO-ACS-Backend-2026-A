"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeParam = routeParam;
function routeParam(value) {
    return Array.isArray(value) ? value[0] : value;
}
