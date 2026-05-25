import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { DepositMoneyCommand } from '../commands/deposit-money.handler';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { OpenAccountCommand } from '../commands/open-account.handler';
import { WithdrawMoneyCommand } from '../commands/withdraw-money.handler';

// 1. Định nghĩa Data Transfer Object (DTO) đầu vào để ValidationPipe tự động check lỗi dữ liệu
class DepositMoneyDto {
    @IsString()
    @IsNotEmpty()
    accountId!: string;

    @IsNumber()
    @Min(1000) // Nạp tối thiểu 1,000 VND
    amount!: number;

    @IsString()
    @IsNotEmpty()
    referenceId!: string;
}

class OpenAccountDto {
    @IsString() @IsNotEmpty() accountId!: string;
    @IsString() @IsNotEmpty() accountName!: string;
    @IsString() @IsNotEmpty() currency!: string;
}

// 1. Định nghĩa DTO Validate dữ liệu rút tiền đầu vào
class WithdrawMoneyDto {
    @IsString() @IsNotEmpty() accountId!: string;
    @IsNumber() @Min(1000) amount!: number; // Rút tối thiểu 1k
    @IsString() @IsNotEmpty() referenceId!: string;
}

@Controller('accounts')
export class AccountController {
    constructor(private readonly commandBus: CommandBus) { }

    // API Endpoint: POST http://localhost:3000/api/v1/accounts/deposit
    @Post('deposit')
    @HttpCode(HttpStatus.OK)
    async depositMoney(@Body() dto: DepositMoneyDto) {
        // Đóng gói dữ liệu từ DTO vào Command và quăng thẳng lên CommandBus điều phối
        await this.commandBus.execute(
            new DepositMoneyCommand(dto.accountId, dto.amount, dto.referenceId)
        );

        return {
            success: true,
            message: 'Lệnh nạp tiền đã được tiếp nhận và xử lý thành công!',
        };
    }

    // Thêm vào bên trong class AccountController:
    @Post('open')
    async openAccount(@Body() dto: OpenAccountDto) {
        await this.commandBus.execute(
            new OpenAccountCommand(dto.accountId, dto.accountName, dto.currency)
        );
        return { success: true, message: 'Mở tài khoản tài chính thành công!' };
    }

    // 2. Thêm vào bên trong class AccountController:
    @Post('withdraw')
    @HttpCode(HttpStatus.OK)
    async withdrawMoney(@Body() dto: WithdrawMoneyDto) {
        await this.commandBus.execute(
            new WithdrawMoneyCommand(dto.accountId, dto.amount, dto.referenceId)
        );

        return {
            success: true,
            message: 'Lệnh rút tiền đã được tiếp nhận và xử lý thành công!',
        };
    }
}