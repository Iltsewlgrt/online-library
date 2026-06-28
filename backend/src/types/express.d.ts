import type { JwtPayload } from '../auth/jwt-payload.interface';

declare global {
    namespace Express {
        interface User extends JwtPayload {}
        interface Request {
            user?: JwtPayload;
        }
    }
}
