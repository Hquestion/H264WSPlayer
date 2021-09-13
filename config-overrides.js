const {
    override,
    disableEsLint,
    overrideDevServer,
    watchAll,
    addWebpackModuleRule,
    addWebpackAlias
} = require("customize-cra");
const path = require('path');

const rewiredMap = () => config => {
    config.devtool = config.mode === 'development' ? 'cheap-module-source-map' : false;
    return config;
};

module.exports = {
    webpack: override(
        rewiredMap(),
        // usual webpack plugin
        disableEsLint(),
        addWebpackAlias({
            '@': path.resolve(__dirname, './src')
        }),
        addWebpackModuleRule({
            test: /\.worker\.js$/,
            use: { loader: 'worker-loader' }
        }),
        addWebpackModuleRule({
            test: /\.(asset)$/i,
            use: [
                {
                    loader: 'file-loader',
                },
            ],
        })
    ),
    devServer: overrideDevServer(
        (config) => {
            config.proxy = {
                '/ws': {
                    target: 'http://10.10.107.253:8080',
                    changeOrigin: true,
                    ws: true,
                }
            };
            config.host = '0.0.0.0';
            config.port = 3003;
            return config;
        }
    )
};
