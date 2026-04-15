import { HttpError } from 'routing-controllers';

class ConflictError extends HttpError {
    constructor(message = 'Conflict') {
        super(409, message);
    }
}

export default ConflictError;
