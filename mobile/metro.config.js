const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable web platform
config.resolver.platforms = ['ios', 'android', 'native'];

module.exports = config;