"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrencyType = exports.PropertyStatus = exports.PropertyType = void 0;
var PropertyType;
(function (PropertyType) {
    PropertyType["APARTMENT"] = "apartment";
    PropertyType["HOUSE"] = "house";
    PropertyType["ROOM"] = "room";
    PropertyType["STUDIO"] = "studio";
})(PropertyType || (exports.PropertyType = PropertyType = {}));
var PropertyStatus;
(function (PropertyStatus) {
    PropertyStatus["ACTIVE"] = "active";
    PropertyStatus["RENTED"] = "rented";
    PropertyStatus["ARCHIVED"] = "archived";
})(PropertyStatus || (exports.PropertyStatus = PropertyStatus = {}));
var CurrencyType;
(function (CurrencyType) {
    CurrencyType["RUB"] = "RUB";
    CurrencyType["USD"] = "USD";
    CurrencyType["EUR"] = "EUR";
})(CurrencyType || (exports.CurrencyType = CurrencyType = {}));
