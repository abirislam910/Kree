import { collectionAdd, collectionGet, collectionDelete } from '../../src/features/collection/service.js';
import { UnauthorizedError, ExternalAPIError, NotFoundError } from '../../src/core/errorTypes.js';
import { createFakeSupabase } from '../helpers/fakeSupabase.js';
import { isRecord } from '../../src/lib/guards.js';

const USER = { id: 'user-1', name: 'Abir' };
const UUID_PATTERN = '[0-9a-f-]{36}';

function upload (location: string | null = 'Tokyo cafe') {
    return { imageData: Buffer.from('png'), audioData: Buffer.from('mp3'), location };
}

describe('collection service', () => {
    describe('collectionAdd', () => {
        it('uploads media under the user folder and records a row with matching paths', async () => {
            const fake = await createFakeSupabase(USER);

            await collectionAdd(fake.client, upload());

            const [imageUpload] = fake.requestsTo('/storage/v1/object/generated_images/', 'POST');
            const [audioUpload] = fake.requestsTo('/storage/v1/object/generated_audio/', 'POST');
            expect(imageUpload?.path).toMatch(new RegExp(`^/storage/v1/object/generated_images/user-1/image_${UUID_PATTERN}\\.png$`));
            expect(audioUpload?.path).toMatch(new RegExp(`^/storage/v1/object/generated_audio/user-1/audio_${UUID_PATTERN}\\.mp3$`));
            expect(imageUpload?.body).toEqual(Buffer.from('png'));
            expect(audioUpload?.body).toEqual(Buffer.from('mp3'));

            const [insert] = fake.requestsTo('/rest/v1/User_Content', 'POST');
            const row = insert?.body;
            expect(row).toMatchObject({ user_id: 'user-1', location: 'Tokyo cafe' });
            if (!isRecord(row)) {
                throw new Error('expected a JSON row in the insert request');
            }
            expect(`/storage/v1/object/generated_images/${String(row['image_path'])}`).toBe(imageUpload?.path);
            expect(`/storage/v1/object/generated_audio/${String(row['audio_path'])}`).toBe(audioUpload?.path);
            expect(String(row['image_path'])).toContain(String(row['id']));
        });

        it('rejects unauthenticated users before touching storage', async () => {
            const fake = await createFakeSupabase(null);

            await expect(collectionAdd(fake.client, upload())).rejects.toBeInstanceOf(UnauthorizedError);
            expect(fake.requestsTo('/storage/')).toHaveLength(0);
        });

        it('stops and throws ExternalAPIError if the image upload fails', async () => {
            const fake = await createFakeSupabase(USER);
            fake.respond('POST', '/storage/v1/object/generated_images/', 400, { statusCode: '400', error: 'Bad Request', message: 'boom' });

            await expect(collectionAdd(fake.client, upload())).rejects.toBeInstanceOf(ExternalAPIError);
            expect(fake.requestsTo('/storage/')).toHaveLength(1);
            expect(fake.requestsTo('/rest/v1/')).toHaveLength(0);
        });

        it('throws ExternalAPIError if the database insert fails', async () => {
            const fake = await createFakeSupabase(USER);
            fake.respond('POST', '/rest/v1/User_Content', 400, { code: '23502', message: 'insert failed' });

            await expect(collectionAdd(fake.client, upload())).rejects.toBeInstanceOf(ExternalAPIError);
        });
    });

    describe('collectionGet', () => {
        const OLD_ENV = process.env.SUPABASE_URL;
        beforeEach(() => { process.env.SUPABASE_URL = 'https://proj.supabase.co'; });
        afterAll(() => { process.env.SUPABASE_URL = OLD_ENV; });

        it("returns the user's items with public storage URLs, newest first", async () => {
            const fake = await createFakeSupabase(USER);
            fake.respond('GET', '/rest/v1/User_Content', 200, [
                { id: 'c1', location: 'Paris', image_path: 'user-1/image_c1.png', audio_path: 'user-1/audio_c1.mp3' },
            ]);

            const collection = await collectionGet(fake.client);

            expect(collection).toEqual([{
                uuid: 'c1',
                location: 'Paris',
                imageURL: 'https://proj.supabase.co/storage/v1/object/public/generated_images/user-1/image_c1.png',
                audioUrl: 'https://proj.supabase.co/storage/v1/object/public/generated_audio/user-1/audio_c1.mp3',
            }]);

            const [query] = fake.requestsTo('/rest/v1/User_Content', 'GET');
            expect(query?.query.get('user_id')).toBe('eq.user-1');
            expect(query?.query.get('order')).toBe('created_at.desc');
        });

        it('rejects unauthenticated users', async () => {
            const fake = await createFakeSupabase(null);
            await expect(collectionGet(fake.client)).rejects.toBeInstanceOf(UnauthorizedError);
        });

        it('throws ExternalAPIError when the query fails', async () => {
            const fake = await createFakeSupabase(USER);
            fake.respond('GET', '/rest/v1/User_Content', 400, { code: '42P01', message: 'relation does not exist' });

            await expect(collectionGet(fake.client)).rejects.toBeInstanceOf(ExternalAPIError);
        });
    });

    describe('collectionDelete', () => {
        it('removes both files and the row, scoped to the owner', async () => {
            const fake = await createFakeSupabase(USER);
            fake.respond('GET', '/rest/v1/User_Content', 200, [{ image_path: 'user-1/i.png', audio_path: 'user-1/a.mp3' }]);

            await collectionDelete(fake.client, 'c1');

            expect(fake.requestsTo('/storage/v1/object/generated_images', 'DELETE')[0]?.body).toEqual({ prefixes: ['user-1/i.png'] });
            expect(fake.requestsTo('/storage/v1/object/generated_audio', 'DELETE')[0]?.body).toEqual({ prefixes: ['user-1/a.mp3'] });

            const tableRequests = fake.requestsTo('/rest/v1/User_Content');
            expect(tableRequests.map((r) => r.method)).toEqual(['GET', 'DELETE']);
            for (const r of tableRequests) {
                expect(r.query.get('id')).toBe('eq.c1');
                expect(r.query.get('user_id')).toBe('eq.user-1');
            }
        });

        it('rejects unauthenticated users', async () => {
            const fake = await createFakeSupabase(null);
            await expect(collectionDelete(fake.client, 'c1')).rejects.toBeInstanceOf(UnauthorizedError);
        });

        it('throws NotFoundError without touching storage when no owned row matches', async () => {
            const fake = await createFakeSupabase(USER);
            fake.respond('GET', '/rest/v1/User_Content', 200, []);

            await expect(collectionDelete(fake.client, 'someone-elses-id')).rejects.toBeInstanceOf(NotFoundError);
            expect(fake.requestsTo('/storage/')).toHaveLength(0);
            expect(fake.requestsTo('/rest/v1/User_Content', 'DELETE')).toHaveLength(0);
        });

        it('throws ExternalAPIError when the lookup query fails', async () => {
            const fake = await createFakeSupabase(USER);
            fake.respond('GET', '/rest/v1/User_Content', 400, { code: '22P02', message: 'invalid input syntax' });

            await expect(collectionDelete(fake.client, 'c1')).rejects.toBeInstanceOf(ExternalAPIError);
            expect(fake.requestsTo('/storage/')).toHaveLength(0);
        });

        it('does not delete the row if removing a file fails', async () => {
            const fake = await createFakeSupabase(USER);
            fake.respond('GET', '/rest/v1/User_Content', 200, [{ image_path: 'i.png', audio_path: 'a.mp3' }]);
            fake.respond('DELETE', '/storage/v1/object/generated_images', 400, { statusCode: '400', error: 'Bad Request', message: 'boom' });

            await expect(collectionDelete(fake.client, 'c1')).rejects.toBeInstanceOf(ExternalAPIError);
            expect(fake.requestsTo('/rest/v1/User_Content', 'DELETE')).toHaveLength(0);
        });
    });
});
