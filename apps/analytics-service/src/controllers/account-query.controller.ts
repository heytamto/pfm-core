import { Controller, Get, Param, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccountView, AccountViewDocument } from '../schemas/account-view.schema';

@Controller('accounts')
export class AccountQueryController {
    private readonly logger = new Logger('AccountQuery_API');

    constructor(
        @InjectModel(AccountView.name) private readonly accountViewModel: Model<AccountViewDocument>,
    ) { }

    @Get(':accountId/balance')
    async getAccountBalance(@Param('accountId') accountId: string) {
        this.logger.log(`🔍 API: Truy vấn số dư cho tài khoản [${accountId}]`);

        // Tìm kiếm trực tiếp trong MongoDB Read Model (Tốc độ đọc O(1) siêu nhanh)
        const accountView = await this.accountViewModel.findOne({ accountId }).exec();

        if (!accountView) {
            throw new NotFoundException(`Không tìm thấy dữ liệu số dư cho tài khoản: ${accountId}`);
        }

        // Trả về kết quả gọn đẹp cho Frontend / Postman
        return {
            accountId: accountView.accountId,
            accountName: accountView.accountName,
            currency: accountView.currency,
            balance: accountView.balance,
            lastUpdatedAt: accountView.updatedAt,
        };
    }
}