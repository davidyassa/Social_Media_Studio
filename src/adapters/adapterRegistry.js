const MockXPublisher = require("./MockXPublisher");
const MockInstagramPublisher = require("./MockInstagramPublisher");

const ADAPTERS = {
    mock_x: new MockXPublisher(),
    mock_instagram: new MockInstagramPublisher(),
};

function getAdapterForPlatform(platform) {
    const adapterMap = JSON.parse(process.env.PLATFORM_ADAPTER_MAP || "{}");
    const adapterKey = adapterMap[platform];
    if (!adapterKey) {
        throw new Error(`No adapter configured for platform: ${platform}`);
    }

    const adapter = ADAPTERS[adapterKey];
    if (!adapter) {
        throw new Error(`Adapter not registered: ${adapterKey}`);
    }
    return adapter;
}

module.exports = { getAdapterForPlatform, ADAPTERS };