import settings from '../settings.js';

// Lazy-load prismarine-viewer (which pulls in `gl`, no Apple Silicon prebuild)
// only when render_bot_view is actually enabled.
export async function addBrowserViewer(bot, count_id) {
    if (!settings.render_bot_view) return;
    const prismarineViewer = (await import('prismarine-viewer')).default;
    const mineflayerViewer = prismarineViewer.mineflayer;
    mineflayerViewer(bot, { port: 3000+count_id, firstPerson: true, });
}