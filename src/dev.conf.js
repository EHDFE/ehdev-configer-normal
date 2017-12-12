/**
 * development config
 */
const path = require('path');
const SHELL_NODE_MODULES_PATH = process.env.SHELL_NODE_MODULES_PATH;
const webpack = require(path.join(SHELL_NODE_MODULES_PATH, 'webpack'));
const HtmlWebpackPlugin = require(path.join(SHELL_NODE_MODULES_PATH, 'html-webpack-plugin'));
const { camelCase } = require('lodash');
const autoprefixer = require('autoprefixer');

const {
  PROJECT_ROOT,
  SOURCE_DIR,
  PAGES_DIR,
  readdir,
  findFile,
  getFilesByExtName,
} = require('./lib');
const PUBLIC_PATH = '/';

module.exports = async (PROJECT_CONFIG, options) => {
  const BUILD_PATH = path.join(PROJECT_ROOT, PROJECT_CONFIG.buildPath);
  
  const configResult = {};

  // entry config
  const entry = {};
  const devServerEntry = [
    `${require.resolve(`${path.join(SHELL_NODE_MODULES_PATH, 'webpack-dev-server')}/client`)}?http://localhost:${options.port}`,
    require.resolve(`${path.join(SHELL_NODE_MODULES_PATH, 'webpack')}/hot/dev-server`),
  ];
  if (PROJECT_CONFIG.framework === 'react') {
    devServerEntry.unshift(require.resolve('react-hot-loader/patch'));
  }
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
      htmls: htmls.map(d => camelCase(d.replace(/\.html?$/, ''))),
    };
    htmlsList.push(o);
    for (const html of o.htmls) {
      const entryFile = await findFile(
        PageRoot,
        `${html}.js`
      );
      const scripts = [entryFile];
      if (PROJECT_CONFIG.enableHotModuleReplacement) {
        scripts.unshift(...devServerEntry);
      }
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
    // Add /* filename */ comments to generated require()s in the output.
    pathinfo: true,
    publicPath: PUBLIC_PATH,
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
              browsers: PROJECT_CONFIG.browserSupports.DEVELOPMENT,
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
      // This is a feature of `babel-loader` for webpack (not Babel itself).
      // It enables caching results in ./node_modules/.cache/babel-loader/
      // directory for faster rebuilds.
      cacheDirectory: true,
    },
  }

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
            use: [
              require.resolve('style-loader'),
              {
                loader: require.resolve('css-loader'),
                options: {
                  importLoaders: 1,
                  minimize: false,
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
                      browsers: PROJECT_CONFIG.browserSupports.DEVELOPMENT,
                    }),
                  ],
                },
              },
              {
                loader: require.resolve('less-loader'),
              }
            ],
          },
          {
            test: /\.html?$/,
            use: [
              {
                loader: require.resolve('html-loader'),
                options: {
                  interpolate: true,
                  root: './',
                },
              },
            ],
          },
          // "file" loader makes sure those assets get served by WebpackDevServer.
          // When you `import` an asset, you get its (virtual) filename.
          // In production, they would get copied to the `build` folder.
          // This loader doesn't use a "test" so it will catch all modules
          // that fall through the other loaders.
          {
            // Exclude `js` files to keep "css" loader working as it injects
            // it's runtime that would otherwise processed through "file" loader.
            // Also exclude `html` and `json` extensions so they get processed
            // by webpacks internal loaders.
            exclude: [/\.jsx?$/, /\.json$/],
            loader: require.resolve('file-loader'),
            options: {
              name: '[name].[hash:8].[ext]',
            },
          },
        ],
      }
    ]
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
    // Add module names to factory functions so they appear in browser profiler.
    new webpack.NamedModulesPlugin(),
  );
  if (PROJECT_CONFIG.enableHotModuleReplacement) {
    plugins.push(
      // This is necessary to emit hot updates (currently CSS only):
      new webpack.HotModuleReplacementPlugin(),
    );
  }
  
  Object.assign(configResult, {
    entry,
    output,
    module,
    plugins,
    devtool: 'cheap-module-source-map',
    // Turn off performance hints during development because we don't do any
    // splitting or minification in interest of speed. These warnings become
    // cumbersome.
    performance: {
      hints: false,
    },
  });

  return configResult;
};