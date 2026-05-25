// Sự kiện 1: Khởi tạo tài khoản (ví) thành công
export class AccountOpenedEvent {
  constructor(
    public readonly accountId: string,
    public readonly accountName: string,
    public readonly currency: string,
    public readonly initialBalance: number,
  ) { }
}

// Sự kiện 2: Nạp tiền vào tài khoản (Hoặc nhận lương, thu nhập)
export class MoneyDepositedEvent {
  constructor(
    public readonly accountId: string,
    public readonly amount: number,
    public readonly referenceId: string, // Mã giao dịch hoặc ID từ Transaction Context
  ) { }
}

// Sự kiện 3: Rút tiền / Chi tiêu từ tài khoản
export class MoneyWithdrawnEvent {
  constructor(
    public readonly accountId: string,
    public readonly amount: number,
    public readonly referenceId: string,
  ) { }
}
