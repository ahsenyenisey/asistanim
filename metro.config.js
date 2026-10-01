// Web'de expo-sqlite (WebAssembly) desteği için .wasm dosyaları asset olarak işlenir.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('wasm');

module.exports = config;
