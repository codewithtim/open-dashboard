import { getToolIcon } from '../tool-icons';

describe('getToolIcon', () => {
    it('returns an icon component for a known key', () => {
        const Icon = getToolIcon('SiVercel');
        expect(Icon).not.toBeNull();
        expect(typeof Icon).toBe('function');
    });

    it('returns null for an unknown key', () => {
        const Icon = getToolIcon('SiUnknownTool');
        expect(Icon).toBeNull();
    });

    it('returns null for an empty string', () => {
        const Icon = getToolIcon('');
        expect(Icon).toBeNull();
    });
});
