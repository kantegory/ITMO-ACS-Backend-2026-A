import { Request, Response, NextFunction} from "express";

import SETTINGS from "../config/settings";

const serviceTokenMiddleware = (
    request: Request,
    response: Response,
    next: NextFunction,
) => {
    const serviceToken = request.headers['x-service-token'];

    if (!serviceToken){
        return response.status(401).send({
            message: 'Service token is required'
        });
    }

    if (serviceToken !== SETTINGS.INTERNAL_SERVICE_TOKEN){
        return response.status(403).send({
            message: 'Invalid service token'
        });
    }

    next();
}
export default serviceTokenMiddleware;