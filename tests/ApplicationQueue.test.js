/**
 * Unit Tests for ApplicationQueue
 * 
 * @author Manus AI
 * @date 2026-02-07
 */

const ApplicationQueue = require('../src/utils/ApplicationQueue');
const fs = require('fs').promises;
const path = require('path');

describe('ApplicationQueue', () => {
    let queue;
    const testQueuePath = '/tmp/test_queue.json';

    beforeEach(async () => {
        // Clean up test file
        try {
            await fs.unlink(testQueuePath);
        } catch (error) {
            // File doesn't exist, that's fine
        }

        queue = new ApplicationQueue(testQueuePath);
        await queue.initialize();
    });

    afterEach(async () => {
        // Clean up
        try {
            await fs.unlink(testQueuePath);
        } catch (error) {
            // Ignore
        }
    });

    test('should initialize with empty queue', () => {
        expect(queue.queue).toEqual([]);
    });

    test('should add application with correct structure', async () => {
        const id = await queue.add({
            company: 'TechCorp',
            position: 'Backend Developer',
            url: 'https://example.com/job/123',
            source: 'email'
        });

        expect(id).toBe(1);
        expect(queue.queue.length).toBe(1);
        
        const app = queue.get(1);
        expect(app.status).toBe('PENDING_REVIEW');
        expect(app.company).toBe('TechCorp');
        expect(app.createdAt).toBeDefined();
    });

    test('should get application by ID', async () => {
        await queue.add({ company: 'CompanyA', position: 'Dev A', url: 'url1', source: 'email' });
        await queue.add({ company: 'CompanyB', position: 'Dev B', url: 'url2', source: 'linkedin' });

        const app = queue.get(2);
        expect(app.company).toBe('CompanyB');
    });

    test('should filter by status', async () => {
        await queue.add({ company: 'A', position: 'Dev', url: 'url1', source: 'email' });
        await queue.add({ company: 'B', position: 'Dev', url: 'url2', source: 'email' });
        await queue.approve(1);

        const pending = queue.getByStatus('PENDING_REVIEW');
        const approved = queue.getByStatus('APPROVED');

        expect(pending.length).toBe(1);
        expect(approved.length).toBe(1);
        expect(approved[0].company).toBe('A');
    });

    test('should approve application', async () => {
        const id = await queue.add({ company: 'Test', position: 'Dev', url: 'url', source: 'email' });
        await queue.approve(id);

        const app = queue.get(id);
        expect(app.status).toBe('APPROVED');
    });

    test('should approve all pending applications', async () => {
        await queue.add({ company: 'A', position: 'Dev', url: 'url1', source: 'email' });
        await queue.add({ company: 'B', position: 'Dev', url: 'url2', source: 'email' });
        await queue.add({ company: 'C', position: 'Dev', url: 'url3', source: 'email' });

        const count = await queue.approveAll();
        expect(count).toBe(3);

        const approved = queue.getByStatus('APPROVED');
        expect(approved.length).toBe(3);
    });

    test('should mark as sent with timestamp', async () => {
        const id = await queue.add({ company: 'Test', position: 'Dev', url: 'url', source: 'email' });
        await queue.markAsSent(id, { method: 'email', recipient: 'jobs@test.com' });

        const app = queue.get(id);
        expect(app.status).toBe('SENT');
        expect(app.sentAt).toBeDefined();
        expect(app.sendResult.method).toBe('email');
    });

    test('should mark as failed with error', async () => {
        const id = await queue.add({ company: 'Test', position: 'Dev', url: 'url', source: 'email' });
        await queue.markAsFailed(id, 'CAPTCHA encountered');

        const app = queue.get(id);
        expect(app.status).toBe('FAILED');
        expect(app.error).toBe('CAPTCHA encountered');
    });

    test('should get correct statistics', async () => {
        await queue.add({ company: 'A', position: 'Dev', url: 'url1', source: 'email' });
        await queue.add({ company: 'B', position: 'Dev', url: 'url2', source: 'email' });
        await queue.add({ company: 'C', position: 'Dev', url: 'url3', source: 'email' });

        await queue.approve(1);
        await queue.markAsSent(1);
        await queue.reject(3);

        const stats = queue.getStats();
        expect(stats.total).toBe(3);
        expect(stats.pending).toBe(1);
        expect(stats.sent).toBe(1);
        expect(stats.rejected).toBe(1);
    });

    test('should persist to file', async () => {
        await queue.add({ company: 'Test', position: 'Dev', url: 'url', source: 'email' });

        // Create new instance and load
        const queue2 = new ApplicationQueue(testQueuePath);
        await queue2.initialize();

        expect(queue2.queue.length).toBe(1);
        expect(queue2.get(1).company).toBe('Test');
    });
});
