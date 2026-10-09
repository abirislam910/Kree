const { collectionAdd, collectionGet, collectionDelete } = require('../../features/collection/service.js');
const { UnauthorizedError, ExternalAPIError, NotFoundError } = require('../../core/errorTypes.js');
const { createFakeSupabase } = require('../helpers/fakeSupabase.js');

const USER = { id: 'user-1', user_metadata: { name: 'Abir' } };
const UUID_PATTERN = /^[0-9a-f-]{36}$/;

describe('collection service', () => {
    describe('collectionAdd', () => {
        it('uploads media under the user folder and records a row with matching paths', async () => {
            const supabase = createFakeSupabase({ user: USER });
            const image = Buffer.from('png');
            const audio = Buffer.from('mp3');

            await collectionAdd(supabase, image, audio, 'Tokyo cafe');

            expect(supabase.storage.from).toHaveBeenCalledWith('generated_images');
            expect(supabase.storage.from).toHaveBeenCalledWith('generated_audio');

            const [imagePath, imageBody, imageOpts] = supabase.storageBucket.upload.mock.calls[0];
            const [audioPath, audioBody, audioOpts] = supabase.storageBucket.upload.mock.calls[1];
            expect(imagePath).toMatch(/^user-1\/image_.+\.png$/);
            expect(audioPath).toMatch(/^user-1\/audio_.+\.mp3$/);
            expect(imageBody).toBe(image);
            expect(audioBody).toBe(audio);
            expect(imageOpts.contentType).toBe('image/png');
            expect(audioOpts.contentType).toBe('audio/mpeg');

            const insert = supabase.queries[0].calls.find((c) => c.method === 'insert').args[0];
            expect(supabase.queries[0].table).toBe('User_Content');
            expect(insert.id).toMatch(UUID_PATTERN);
            expect(insert).toMatchObject({
                user_id: 'user-1',
                location: 'Tokyo cafe',
                image_path: imagePath,
                audio_path: audioPath,
            });
        });

        it('rejects unauthenticated users before touching storage', async () => {
            const supabase = createFakeSupabase({ user: null });

            await expect(collectionAdd(supabase, Buffer.from(''), Buffer.from(''), 'x'))
                .rejects.toBeInstanceOf(UnauthorizedError);
            expect(supabase.storageBucket.upload).not.toHaveBeenCalled();
        });

        it('stops and throws ExternalAPIError if the image upload fails', async () => {
            const supabase = createFakeSupabase({ user: USER });
            supabase.storageBucket.upload.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });

            await expect(collectionAdd(supabase, Buffer.from(''), Buffer.from(''), 'x'))
                .rejects.toBeInstanceOf(ExternalAPIError);
            expect(supabase.storageBucket.upload).toHaveBeenCalledTimes(1);
            expect(supabase.from).not.toHaveBeenCalled();
        });

        it('throws ExternalAPIError if the database insert fails', async () => {
            const supabase = createFakeSupabase({ user: USER })
                .queueQuery({ data: null, error: { message: 'insert failed' } });

            await expect(collectionAdd(supabase, Buffer.from(''), Buffer.from(''), 'x'))
                .rejects.toBeInstanceOf(ExternalAPIError);
        });
    });

    describe('collectionGet', () => {
        const OLD_ENV = process.env.SUPABASE_URL;
        beforeEach(() => { process.env.SUPABASE_URL = 'https://proj.supabase.co'; });
        afterAll(() => { process.env.SUPABASE_URL = OLD_ENV; });

        it("returns the user's items with public storage URLs, newest first", async () => {
            const supabase = createFakeSupabase({ user: USER }).queueQuery({
                data: [{ id: 'c1', location: 'Paris', image_path: 'user-1/image_c1.png', audio_path: 'user-1/audio_c1.mp3' }],
                error: null,
            });

            const collection = await collectionGet(supabase);

            expect(collection).toEqual([{
                uuid: 'c1',
                location: 'Paris',
                imageURL: 'https://proj.supabase.co/storage/v1/object/public/generated_images/user-1/image_c1.png',
                audioUrl: 'https://proj.supabase.co/storage/v1/object/public/generated_audio/user-1/audio_c1.mp3',
            }]);

            const { calls } = supabase.queries[0];
            expect(calls).toContainEqual({ method: 'eq', args: ['user_id', 'user-1'] });
            expect(calls).toContainEqual({ method: 'order', args: ['created_at', { ascending: false }] });
        });

        it('rejects unauthenticated users', async () => {
            const supabase = createFakeSupabase({ user: null });
            await expect(collectionGet(supabase)).rejects.toBeInstanceOf(UnauthorizedError);
        });

        it('throws ExternalAPIError when the query fails', async () => {
            const supabase = createFakeSupabase({ user: USER }).queueQuery({ data: null, error: { message: 'x' } });
            await expect(collectionGet(supabase)).rejects.toBeInstanceOf(ExternalAPIError);
        });
    });

    describe('collectionDelete', () => {
        it('removes both files and the row, scoped to the owner', async () => {
            const supabase = createFakeSupabase({ user: USER })
                .queueQuery({ data: { image_path: 'user-1/i.png', audio_path: 'user-1/a.mp3' }, error: null })
                .queueQuery({ data: null, error: null });

            await collectionDelete(supabase, 'c1');

            expect(supabase.storageBucket.remove).toHaveBeenCalledWith(['user-1/i.png']);
            expect(supabase.storageBucket.remove).toHaveBeenCalledWith(['user-1/a.mp3']);

            for (const { calls } of supabase.queries) {
                expect(calls).toContainEqual({ method: 'eq', args: ['id', 'c1'] });
                expect(calls).toContainEqual({ method: 'eq', args: ['user_id', 'user-1'] });
            }
            expect(supabase.queries[1].calls.some((c) => c.method === 'delete')).toBe(true);
        });

        it('rejects unauthenticated users', async () => {
            const supabase = createFakeSupabase({ user: null });
            await expect(collectionDelete(supabase, 'c1')).rejects.toBeInstanceOf(UnauthorizedError);
        });

        it('throws NotFoundError without touching storage when no owned row matches', async () => {
            const supabase = createFakeSupabase({ user: USER }).queueQuery({ data: null, error: null });

            await expect(collectionDelete(supabase, 'someone-elses-id')).rejects.toBeInstanceOf(NotFoundError);
            expect(supabase.queries[0].calls.some((c) => c.method === 'maybeSingle')).toBe(true);
            expect(supabase.storageBucket.remove).not.toHaveBeenCalled();
            expect(supabase.queries).toHaveLength(1);
        });

        it('throws ExternalAPIError when the lookup query fails', async () => {
            const supabase = createFakeSupabase({ user: USER }).queueQuery({ data: null, error: { message: 'x' } });

            await expect(collectionDelete(supabase, 'c1')).rejects.toBeInstanceOf(ExternalAPIError);
            expect(supabase.storageBucket.remove).not.toHaveBeenCalled();
        });

        it('does not delete the row if removing a file fails', async () => {
            const supabase = createFakeSupabase({ user: USER })
                .queueQuery({ data: { image_path: 'i.png', audio_path: 'a.mp3' }, error: null });
            supabase.storageBucket.remove.mockResolvedValueOnce({ data: null, error: { message: 'x' } });

            await expect(collectionDelete(supabase, 'c1')).rejects.toBeInstanceOf(ExternalAPIError);
            expect(supabase.queries).toHaveLength(1);
        });
    });
});
