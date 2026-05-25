import { AggregateRoot } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
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
    // Thay vì gán trực tiếp, ta dùng apply() để NestJS ghi nhận Event
    account.apply(new AccountOpenedEvent(id, name, currency, initialBalance));
    return account;
  }

  // Nghiệp vụ Nạp tiền
  public deposit(amount: number, referenceId: string): void {
    if (amount <= 0) throw new BadRequestException('Số tiền nạp phải lớn hơn 0');
    this.apply(new MoneyDepositedEvent(this.id, amount, referenceId));
  }

  // Nghiệp vụ Rút tiền (Chỗ này thể hiện tư duy Senior: Chặn không cho rút quá số dư)
  public withdraw(amount: number, referenceId: string): void {
    if (amount <= 0) throw new BadRequestException('Số tiền rút phải lớn hơn 0');
    if (this.balance < amount) {
      throw new BadRequestException(`Tài khoản không đủ số dư. Hiện tại: ${this.balance}`);
    }
    this.apply(new MoneyWithdrawnEvent(this.id, amount, referenceId));
  }

  // =========================================================================
  // CÁC HÀM REHYDRATE (MUTATOR) - Chỉ dùng để cập nhật trạng thái, KHÔNG chứa logic validate
  // =========================================================================

  // Tự động kích hoạt khi Event AccountOpenedEvent được áp dụng
  onAccountOpenedEvent(event: AccountOpenedEvent) {
    this.id = event.accountId;
    this.balance = event.initialBalance;
    this.isLive = true;
  }

  // Tự động kích hoạt khi có tiền nạp vào
  onMoneyDepositedEvent(event: MoneyDepositedEvent) {
    this.balance += event.amount;
  }

  // Tự động kích hoạt khi có tiền rút ra
  onMoneyWithdrawnEvent(event: MoneyWithdrawnEvent) {
    this.balance -= event.amount;
  }

  // Getter để lấy thông tin ra ngoài nhưng không cho sửa trực tiếp
  public getId(): string {
    return this.id;
  }
  public getBalance(): number {
    return this.balance;
  }
}
