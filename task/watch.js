'use strict';
module.exports = function() { // eslint-disable-line func-names
  // Global variables
  const gulp    = this.gulp,
        plugins = this.opts.plugins,
        config  = this.opts.configs,
        themes  = plugins.getThemes();


  themes.forEach(name => {
    const theme = config.themes[name],
          srcBase = config.projectPath + 'var/view_preprocessed/frontools' + theme.dest.replace('pub/static', '');

    // For theme without per locale overwrites  - most of cases
    if (!theme.localeOverwrites) {
      plugins.util.log(
        plugins.util.colors.green('Watching theme:') + ' '
        + plugins.util.colors.blue(name) + ' '
        + plugins.util.colors.green('Locale:') + ' '
        + plugins.util.colors.blue(theme.locale.join(' ')) + ' '
        + plugins.util.colors.green('and dependencies...')
      );

      const files = plugins.globby.sync([
              srcBase + '/**/*.' + theme.lang,
              '!/**/_*.' + theme.lang,
              '!**/node_modules/**'
            ]),
            dependencyTreeBuilder = require('../helper/dependency-tree-builder');

      files.forEach(file => {
        const compiler = require('../helper/' + theme.lang)(gulp, plugins, config, name, file);
        gulp.watch(
          Array.from(new Set(dependencyTreeBuilder(theme, file, plugins))),
          event => {
            plugins.util.log(
              plugins.util.colors.green('File') + ' '
              + plugins.util.colors.blue(event.path.replace(config.projectPath + 'var/view_preprocessed/frontools', '')) + ' '
              + plugins.util.colors.green('changed.')
            );
            compiler();
          }
        );
      });
    }
    // For themes with per locale overwrites
    else {
      theme.locale.forEach(locale => {
        plugins.util.log(
          plugins.util.colors.green('Watching theme:') + ' '
          + plugins.util.colors.blue(name) + ' '
          + plugins.util.colors.green('Locale:') + ' '
          + plugins.util.colors.blue(locale) + ' '
          + plugins.util.colors.green('and dependencies...')
        );

        const files = plugins.globby.sync([
                srcBase + '/' + locale + '/**/*.' + theme.lang,
                '!/**/_*.' + theme.lang,
                '!**/node_modules/**'
              ]),
              dependencyTreeBuilder = require('../helper/dependency-tree-builder');

        files.forEach(file => {
          const compiler = require('../helper/' + theme.lang)(gulp, plugins, config, name, file, locale);
          gulp.watch(
            Array.from(new Set(dependencyTreeBuilder(theme, file, plugins))),
            event => {
              plugins.util.log(
                plugins.util.colors.green('File') + ' '
                + plugins.util.colors.blue(event.path.replace(config.projectPath + 'var/view_preprocessed/frontools', '')) + ' '
                + plugins.util.colors.green('changed.')
              );
              compiler();
            }
          );
        });
      });
    }

    if (!plugins.util.env.disableLinting) {
      // SASS Lint
      if (theme.lang === 'scss') {
        gulp.watch(srcBase + '/**/*.scss', event => {
          require('../helper/sass-lint')(gulp, plugins, config, name, event.path)();
        });
      }
      // CSS Lint
      gulp.watch(config.projectPath + theme.dest + '/**/*.css', event => {
        require('../helper/css-lint')(gulp, plugins, config, name, event.path)();
      });
    }

    // Watching files that require reload after save
    gulp.watch(
      // I'm usng globby manually, b/c it's a loooot faster
      plugins.globby.sync([
        config.projectPath + theme.src + '/**/*.{html,phtml,xml,csv,js}',
        '!/**/node_modules/**'
      ]),
      event => {
        plugins.util.log(
          plugins.util.colors.green('File') + ' '
          + plugins.util.colors.blue(event.path.replace(config.projectPath, '')) + ' '
          + plugins.util.colors.green('changed.')
        );
        plugins.browserSync.reload();
      }
    );
  });
};
