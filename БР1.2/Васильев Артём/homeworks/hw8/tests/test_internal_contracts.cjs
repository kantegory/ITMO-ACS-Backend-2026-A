// Run in an existing HW6 image, no install/build/network:
// CONTRACT_DEPS_ROOT=/app CONTRACT_SERVICES_ROOT=/tmp/services node --test /tmp/test_internal_contracts.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const services = process.env.CONTRACT_SERVICES_ROOT || path.resolve(__dirname, '../../hw6/services');
const deps = createRequire(path.resolve(process.env.CONTRACT_DEPS_ROOT || path.join(services, 'company-service'), 'package.json'));
const ts = deps('typescript');
deps('reflect-metadata');
const { instanceToPlain } = deps('class-transformer');
const repositories = new Map();
const cache = new Map();
const settings = { SERVICE_TOKEN: 'test-only', COMPANY_SERVICE_URL: 'company', VACANCY_SERVICE_URL: 'vacancy', RESUME_SERVICE_URL: 'resume' };
let responses = {};

// Only I/O boundaries are replaced; entities, decorators, serializer and guards are real.
function load(service, relative) {
    const filename = path.resolve(services, service, 'src', relative + '.ts');
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const requireSource = (name) => {
        if (name.endsWith('/config/settings')) return { default: settings, __esModule: true };
        if (name.endsWith('/config/data-source')) return { default: { getRepository: (entity) => repositories.get(entity.name) }, __esModule: true };
        if (name.endsWith('/common/rabbitmq')) return { rabbitMqPublisher: {} };
        if (name.endsWith('/common/service-client')) return {
            serviceBatchGet: async (_base, route) => {
                assert.ok(responses[route], `Unexpected service call: ${route}`);
                return responses[route];
            },
        };
        if (!name.startsWith('.')) return deps(name);
        const target = path.resolve(path.dirname(filename), name);
        return load(service, path.relative(path.resolve(services, service, 'src'), target));
    };
    const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS,
            experimentalDecorators: true, emitDecoratorMetadata: true, esModuleInterop: true },
    }).outputText;
    vm.runInThisContext(`(function(require,module,exports){${output}\n})`, { filename })(requireSource, module, module.exports);
    return module.exports;
}
const wire = (value) => JSON.parse(JSON.stringify(instanceToPlain(value)));
const forbidden = { httpCode: 403 };
const { UserRole } = load('vacancy-service', 'models/enums/user-role.enum');
const request = (id = 'owner', role = UserRole.EMPLOYER) => ({ user: { id, role } });

async function batch(service, model, entityName, method, fields) {
    const Entity = load(service, 'models/' + model + '.entity')[entityName];
    const entity = Object.assign(new Entity(), { id: model, ...fields });
    repositories.set(entityName, { findBy: async () => [entity] });
    const Controller = load(service, 'controllers/internal.controller').default;
    const controller = new Controller();
    const result = wire(await controller[method]({ ids: [entity.id, entity.id, 'missing'] }));
    assert.deepEqual(result.missingIds, ['missing']);
    assert.equal(result.items.length, 1);
    assert.deepEqual(wire(await controller[method]({ ids: [] })), { items: [], missingIds: [] });
    assert.deepEqual(wire(await controller[method]({})), { items: [], missingIds: [] });
    return { entity, result };
}

test('serialized internal DTOs satisfy unchanged ownership/publication consumers; public entities keep aliases', async () => {
    // Company is also required by its internal controller's repository decorator.
    repositories.set('Company', {});
    const profile = await batch('company-service', 'employer-profile', 'EmployerProfile', 'getEmployerProfilesBatch', { userId: 'owner', companyId: 'company' });
    const VacancyController = load('vacancy-service', 'controllers/vacancy.controller').default;
    const vacancyController = new VacancyController();
    const profileRoute = '/internal/v1/employer-profiles/batch';
    responses[profileRoute] = wire({ items: [profile.entity] });
    assert.equal(responses[profileRoute].items[0].user_id, 'owner');
    assert.equal(responses[profileRoute].items[0].userId, undefined);
    await assert.rejects(vacancyController.assertEmployerOwnership(request(), 'company', 'employer-profile'), forbidden);
    responses[profileRoute] = profile.result;
    await vacancyController.assertEmployerOwnership(request(), 'company', 'employer-profile');
    await assert.rejects(vacancyController.assertEmployerOwnership(request('stranger'), 'company', 'employer-profile'), forbidden);
    await assert.rejects(vacancyController.assertEmployerOwnership(request(), 'other-company', 'employer-profile'), forbidden);
    await assert.rejects(vacancyController.assertEmployerOwnership(request('owner', UserRole.APPLICANT), 'company', 'employer-profile'), forbidden);

    const vacancy = await batch('vacancy-service', 'vacancy', 'Vacancy', 'getVacanciesBatch', { companyId: 'company', employerProfileId: 'employer-profile', isPublished: true });
    const resume = await batch('resume-service', 'resume', 'Resume', 'getResumesBatch', { userId: 'applicant' });
    const application = new (load('application-service', 'controllers/application.controller').default)();
    responses['/internal/v1/vacancies/batch'] = wire({ items: [vacancy.entity] });
    responses['/internal/v1/resumes/batch'] = wire({ items: [resume.entity] });
    await assert.rejects(application.assertVacancyPublished('vacancy'), forbidden);
    await assert.rejects(application.assertResumeOwnership('resume', 'applicant'), forbidden);
    responses['/internal/v1/vacancies/batch'] = vacancy.result;
    responses['/internal/v1/resumes/batch'] = resume.result;
    await application.assertVacancyPublished('vacancy');
    await application.assertResumeOwnership('resume', 'applicant');
    await assert.rejects(application.assertResumeOwnership('resume', 'stranger'), forbidden);
    await application.assertVacancyOwnership('vacancy', 'owner');
    await assert.rejects(application.assertVacancyOwnership('vacancy', 'stranger'), forbidden);
    for (const controller of [application,
        new (load('interaction-service', 'controllers/favorite.controller').default)(),
        new (load('interaction-service', 'controllers/vacancy-view.controller').default)()]) {
        await controller.assertVacancyPublished('vacancy');
        responses['/internal/v1/vacancies/batch'].items[0].isPublished = false;
        await assert.rejects(controller.assertVacancyPublished('vacancy'), forbidden);
        responses['/internal/v1/vacancies/batch'].items[0].isPublished = true;
    }
    for (const [entity, aliases] of [[profile.entity, { user_id: 'owner', company_id: 'company' }],
        [vacancy.entity, { company_id: 'company', employer_profile_id: 'employer-profile', is_published: true }],
        [resume.entity, { user_id: 'applicant' }]]) {
        const publicDto = wire(entity);
        for (const [key, value] of Object.entries(aliases)) assert.equal(publicDto[key], value);
        for (const key of ['userId', 'companyId', 'employerProfileId', 'isPublished']) assert.equal(publicDto[key], undefined);
    }
});

test('auth-user internal serialization retains password exclusion; service-token boundary rejects missing/wrong tokens', async () => {
    const user = await batch('auth-user-service', 'user', 'User', 'getUsersBatch', { firstName: 'Test', password: 'sentinel-secret' });
    assert.equal(user.result.items[0].first_name, 'Test');
    assert.equal(user.result.items[0].password, undefined);
    assert.equal(JSON.stringify(user.result).includes('sentinel-secret'), false);
    for (const service of ['company-service', 'vacancy-service', 'resume-service']) {
        const middleware = load(service, 'middlewares/internal-auth.middleware').default;
        for (const token of [undefined, 'wrong', settings.SERVICE_TOKEN]) {
            let calls = 0;
            middleware({ header: () => token }, {}, (error) => {
                calls++;
                if (token === settings.SERVICE_TOKEN) assert.equal(error, undefined);
                else assert.equal(error.httpCode, 401);
            });
            assert.equal(calls, 1);
        }
    }
});
