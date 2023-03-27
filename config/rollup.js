var pkg = require('../package.json')
var babel = require('rollup-plugin-babel')

var banner = `/*!
* ${pkg.name} ${pkg.version}
* Licensed under MIT
*/
`

exports.banner = banner

function getCompiler(opt) {
  return babel({
    babelrc: false,
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            browsers: 'last 2 versions, > 1%, ie >= 8, Chrome >= 45, safari >= 10',
            node: '0.12',
          },
          modules: false,
          loose: true,
        },
      ],
    ],
    plugins: [
      [
        '@babel/plugin-transform-runtime',
        {
          corejs: 2,
        },
      ],
    ],
    runtimeHelpers: true,
    exclude: 'node_modules/**',
  });
}

exports.getCompiler = getCompiler;