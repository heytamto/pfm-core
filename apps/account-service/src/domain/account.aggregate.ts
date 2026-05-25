import { AggregateRoot } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
// Giữ nguyên dòng import các Event chính chủ từ file dùng chung này
import { AccountOpenedEvent, MoneyDepositedEvent, MoneyWithdrawnEvent } from '../events/account.events';

export class AccountAggregate extends AggregateRoot {
  private id!: string;
  private balance!: number;
  private isLive: boolean = false;

  constructor() {
    super();
  }

  // Phương thức tĩnh để khởi tạo một Aggregate mới (Mở ví mới)
  static open(id: string, name: string, currency: string, initialBalance: number): AccountAggregate {
    const account = new AccountAggregate();
    // Khởi tạo Event mở tài khoản từ file import
    account.apply(new AccountOpenedEvent(id, name, currency, initialBalance));
    return account;
  }

  // Nghiệp vụ Nạp tiền - Nhận thêm accountId từ ngoài
  public deposit(accountId: string, amount: number, referenceId: string): void {
    if (amount <= 0) throw new BadRequestException('Số tiền nạp phải lớn hơn 0');
    this.apply(new MoneyDepositedEvent(accountId, amount, referenceId));
  }

  // Nghiệp vụ Rút tiền - Nhận thêm accountId từ ngoài
  public withdraw(accountId: string, amount: number, referenceId: string): void {
    if (amount <= 0) throw new BadRequestException('Số tiền rút phải lớn hơn 0');
    if (this.balance < amount) {
      throw new BadRequestException(`Tài khoản không đủ số dư. Hiện tại: ${this.balance}`);
    }
    this.apply(new MoneyWithdrawnEvent(accountId, amount, referenceId));
  }

  // =========================================================================
  // CÁC HÀM REHYDRATE (MUTATOR) - Chỉ dùng để cập nhật trạng thái
  // =========================================================================

  onAccountOpened(event: AccountOpenedEvent) {
    this.id = event.accountId;
    this.balance = event.initialBalance || 0;
    this.isLive = true;
  }

  onMoneyDeposited(event: MoneyDepositedEvent) {
    this.balance += event.amount;
  }

  onMoneyWithdrawn(event: MoneyWithdrawnEvent) {
    this.balance -= event.amount;
  }

  public getId(): string {
    return this.id;
  }
  public getBalance(): number {
    return this.balance;
  }
}