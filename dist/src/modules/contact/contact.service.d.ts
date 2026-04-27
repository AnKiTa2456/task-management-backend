import { CreateContactDto } from './dto/create-contact.dto';
export declare class ContactService {
    private readonly logger;
    sendOtp(phone: string): Promise<{
        message: string;
    }>;
    verifyOtp(phone: string, otp: string): Promise<{
        valid: boolean;
    }>;
    private sendSms;
    handleSubmission(dto: CreateContactDto): Promise<void>;
    private sendEmail;
}
