"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionType = exports.DepositStatus = exports.CurrencyType = exports.PaymentMethod = exports.TransactionStatus = exports.RentalStatus = void 0;
var RentalStatus;
(function (RentalStatus) {
    RentalStatus["PENDING"] = "pending";
    RentalStatus["ACTIVE"] = "active";
    RentalStatus["COMPLETED"] = "completed";
    RentalStatus["CANCELLED"] = "cancelled";
})(RentalStatus || (exports.RentalStatus = RentalStatus = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "pending";
    TransactionStatus["COMPLETED"] = "completed";
    TransactionStatus["FAILED"] = "failed";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CARD"] = "card";
    PaymentMethod["CASH"] = "cash";
    PaymentMethod["TRANSFER"] = "transfer";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var CurrencyType;
(function (CurrencyType) {
    CurrencyType["RUB"] = "RUB";
    CurrencyType["USD"] = "USD";
    CurrencyType["EUR"] = "EUR";
})(CurrencyType || (exports.CurrencyType = CurrencyType = {}));
var DepositStatus;
(function (DepositStatus) {
    DepositStatus["HELD"] = "held";
    DepositStatus["RETURNED"] = "returned";
    DepositStatus["PARTIALLY_RETURNED"] = "partially_returned";
    DepositStatus["WITHHELD"] = "withheld";
})(DepositStatus || (exports.DepositStatus = DepositStatus = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["RENT"] = "rent";
    TransactionType["DEPOSIT"] = "deposit";
    TransactionType["DEPOSIT_RETURN"] = "deposit_return";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
