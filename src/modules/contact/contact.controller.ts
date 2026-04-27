import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit a contact form — sends email notification to admin' })
  async submit(@Body() dto: CreateContactDto) {
    await this.contactService.handleSubmission(dto);
    return { message: 'Contact form submitted successfully' };
  }

  @Public()
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to phone number via SMS' })
  async sendOtp(@Body() body: { phone: string }) {
    const result = await this.contactService.sendOtp(body.phone);
    return result;
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP entered by user' })
  async verifyOtp(@Body() body: { phone: string; otp: string }) {
    const result = await this.contactService.verifyOtp(body.phone, body.otp);
    return result;
  }
}
