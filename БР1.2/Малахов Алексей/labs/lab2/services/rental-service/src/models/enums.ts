export enum RentalStatus { PENDING = 'pending', ACTIVE = 'active', COMPLETED = 'completed', CANCELLED = 'cancelled' }
export enum TransactionStatus { PENDING = 'pending', COMPLETED = 'completed', FAILED = 'failed' }
export enum PaymentMethod { CARD = 'card', CASH = 'cash', TRANSFER = 'transfer' }
export enum CurrencyType { RUB = 'RUB', USD = 'USD', EUR = 'EUR' }
export enum DepositStatus { HELD = 'held', RETURNED = 'returned', PARTIALLY_RETURNED = 'partially_returned', WITHHELD = 'withheld' }
export enum TransactionType { RENT = 'rent', DEPOSIT = 'deposit', DEPOSIT_RETURN = 'deposit_return' }
