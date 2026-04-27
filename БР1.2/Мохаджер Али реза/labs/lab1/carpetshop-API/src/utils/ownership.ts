export function assertAdminOrOwner(opts: {
    requesterUserId: number;
    requesterRole?: 'ADMIN' | 'SELLER' | 'CUSTOMER';
    ownerUserId: number;
}) {
    const { requesterUserId, requesterRole, ownerUserId } = opts;

    if (requesterRole === 'ADMIN') return;
    if (requesterUserId === ownerUserId) return;

    const err: any = new Error('Forbidden');
    err.httpCode = 403;
    throw err;
}

