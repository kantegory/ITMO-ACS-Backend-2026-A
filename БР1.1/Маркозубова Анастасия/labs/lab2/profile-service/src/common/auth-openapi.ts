import { OpenAPI } from 'routing-controllers-openapi';

function buildOperationConfig(summary?: string, tags?: string[]) {
    return {
        ...(summary ? { summary } : {}),
        ...(tags ? { tags } : {}),
    };
}

function AuthOpenAPI(summary?: string, tags?: string[]) {
    return OpenAPI({
        ...buildOperationConfig(summary, tags),
        security: [{ bearerAuth: [] }],
    });
}

function PublicOpenAPI(summary?: string, tags?: string[]) {
    return OpenAPI(buildOperationConfig(summary, tags));
}

export { PublicOpenAPI };
export default AuthOpenAPI;
