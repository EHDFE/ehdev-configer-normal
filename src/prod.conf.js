/**
 * production config
 */
const path = require('path');
const SHELL_NODE_MODULES_PATH = process.env.SHELL_NODE_MODULES_PATH;
const webpack = require(path.join(SHELL_NODE_MODULES_PATH, 'webpack'));
const HtmlWebpackPlugin = require(path.join(SHELL_NODE_MODULES_PATH, 'html-webpack-plugin'));
const ExtractTextPlugin = require(path.join(SHELL_NODE_MODULES_PATH, 'extract-text-webpack-plugin'));
const CleanWebpackPlugin = require(path.join(SHELL_NODE_MODULES_PATH, 'clean-webpack-plugin'));
// const { camelCase } = require('lodash');
const autoprefixer = require('autoprefixer');
const WebpackChunkHash = require('webpack-chunk-hash');

const {
  PROJECT_ROOT,
  SOURCE_DIR,
  PAGES_DIR,
  readdir,
  findFile,
  getFilesByExtName,
  getHtmlLoaderConfig,
  getLoaderOptionPlugin,
} = require('./lib');
const PUBLIC_PATH = '/';

module.exports = async (PROJECT_CONFIG, options) => {
  const BUILD_PATH = path.join(PROJECT_ROOT, PROJECT_CONFIG.buildPath);
  
  const configResult = {};

  // entry config
  const entry = {};
  const pages = await readdir(PAGES_DIR);
  const htmlsList = [];
  for (const page of pages) {
    const PageRoot = path.join(PAGES_DIR, page);
    const htmls = await getFilesByExtName(
      PageRoot,
      ['html', 'htm']
    );
    const o = {
      module: page,
      // htmls: htmls.map(d => camelCase(d.replace(/\.html?$/, ''))),
      htmls: htmls.map(d => d.replace(/\.html?$/, '')),
    };
    htmlsList.push(o);
    for (const html of o.htmls) {
      const entryFile = await findFile(
        PageRoot,
        `${html}.js`
      );
      const scripts = [...PROJECT_CONFIG.commonVendors, entryFile];
      if (entryFile) {
        Object.assign(entry, {
          [`${page}/bundle.${html}`]: scripts, 
        });
      }
    }
  }

  // output config
  const output = {
    path: BUILD_PATH,
    filename: '[name].[chunkhash:8].js',
    publicPath: PROJECT_CONFIG.publicPath || PUBLIC_PATH,
  };

  const babelLoaderConfig = {
    loader: require.resolve('babel-loader'),
    options: {
      // @remove-on-eject-begin
      babelrc: false,
      presets: [
        [
          require.resolve('babel-preset-env'),
          {
            targets: {
              browsers: PROJECT_CONFIG.browserSupports.PRODUCTION,
            }, 
            module: false,
            useBuiltIns: PROJECT_CONFIG.babelUseBuiltIns,
          }
        ]
      ].concat(
        PROJECT_CONFIG.framework === 'react' ? [
          require.resolve('babel-preset-react'),
          require.resolve('babel-preset-stage-1'),
        ] : [
          require.resolve('babel-preset-stage-1'),
        ]
      ),
      // @remove-on-eject-end
      compact: true,
    },
  };

  // module config
  const module = {
    rules: [
      {
        // "oneOf" will traverse all following loaders until one will
        // match the requirements. When no loader matches it will fall
        // back to the "file" loader at the end of the loader list.
        oneOf: [
          // "url" loader works like "file" loader except that it embeds assets
          // smaller than specified limit in bytes as data URLs to avoid requests.
          // A missing `test` is equivalent to a match.
          {
            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
            loader: require.resolve('url-loader'),
            options: {
              limit: 10000,
              name: '[name].[hash:8].[ext]',
            },
          },
          {
            test: /\.svg$/,
            include: SOURCE_DIR,
            resourceQuery: /reactComponent/,
            use: [
              babelLoaderConfig,
              {
                loader: require.resolve('react-svg-loader'),
                options: {
                  svgo: {
                    floatPrecision: 2,
                    plugins: [{
                      cleanupIDs: false,
                    }],
                  },
                },
              },
            ],
          },
          // Process JS with Babel.
          Object.assign({
            test: /\.jsx?$/,
            include: SOURCE_DIR,
          }, babelLoaderConfig),
          {
            test: /\.(le|c)ss$/,
            loader: ExtractTextPlugin.extract({
              fallback: {
                loader: require.resolve('style-loader'),
                options: {
                  hmr: false,
                },
              },
              use: [
                {
                  loader: require.resolve('css-loader'),
                  options: {
                    importLoaders: 1,
                    minimize: true,
                  },
                },
                {
                  loader: require.resolve('postcss-loader'),
                  options: {
                    // Necessary for external CSS imports to work
                    // https://github.com/facebookincubator/create-react-app/issues/2677
                    ident: 'postcss',
                    plugins: () => [
                      autoprefixer({
                        browsers: PROJECT_CONFIG.browserSupports.PRODUCTION,
                      }),
                    ],
                  },
                },
                {
                  loader: require.resolve('less-loader'),
                }
              ],
            }),
          },
          getHtmlLoaderConfig(PROJECT_CONFIG),
          // "file" loader makes sure assets end up in the `build` folder.
          // When you `import` an asset, you get its filename.
          // This loader doesn't use a "test" so it will catch all modules
          // that fall through the other loaders.
          {
            exclude: [/\.jsx?$/, /\.json$/],
            loader: require.resolve('file-loader'),
            options: {
              name: '[name].[hash:8].[ext]',
            },
          },
        ],
      }
    ],
  };

  // plugins config
  const plugins = [];
  htmlsList.forEach(d => {
    d.htmls.forEach(html => {
      plugins.push(
        new HtmlWebpackPlugin(Object.assign({
          filename: PROJECT_CONFIG.useFolderAsHtmlName ?
            `${d.module}.html` : `${d.module}/${html}.html`,
          template: path.join(PAGES_DIR, `${d.module}/${html}.html`),
          chunks: [
            `${d.module}/bundle.${html}`,
          ],
          minify: {
            removeComments: true,
            collapseWhitespace: true,
            removeRedundantAttributes: true,
            useShortDoctype: true,
            removeEmptyAttributes: false,
            removeStyleLinkTypeAttributes: true,
            keepClosingSlash: true,
            minifyJS: true,
            minifyCSS: true,
            minifyURLs: true,
          },
        }, PROJECT_CONFIG.htmlWebpackPlugin))
      );
    })
  });
  plugins.push(
    new CleanWebpackPlugin([
      PROJECT_CONFIG.buildPath,
    ], {
      root: PROJECT_ROOT,
      verbose: true,
      dry: false,
    }),
    new webpack.HashedModuleIdsPlugin(),
    new WebpackChunkHash(),
    new ExtractTextPlugin({
      filename: '[name].[contenthash:8].css',
    }),
    getLoaderOptionPlugin(PROJECT_CONFIG),
  );
  
  Object.assign(configResult, {
    // Don't attempt to continue if there are any errors.
    bail: true,
    entry,
    output,
    module,
    plugins,
    devtool: 'source-map',
  });

  return configResult;
};