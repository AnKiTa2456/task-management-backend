import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
export declare class ContactController {
    private readonly contactService;
    constructor(contactService: ContactService);
    submit(dto: CreateContactDto): Promise<{
        message: string;
    }>;
    sendOtp(body: {
        phone: string;
    }): Promise<{
        message: string;
    }>;
    verifyOtp(body: {
        phone: string;
        otp: string;
    }): Promise<{
        valid: boolean;
    }>;
}
