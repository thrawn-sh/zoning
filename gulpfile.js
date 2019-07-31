var gulp        = require('gulp');

var cachebust   = require('gulp-cachebust');
var chmod       = require('gulp-chmod');
var cleanCss    = require('gulp-clean-css');
var concat      = require('gulp-concat');
var connect     = require('gulp-connect');
var del         = require('del');
var flatten     = require('gulp-flatten');
var gulpif      = require('gulp-if');
var gzip        = require('gulp-gzip');
var htmlmin     = require('gulp-htmlmin');
var imagemin    = require('gulp-imagemin');
var jsonminify  = require('gulp-jsonminify');
var sass        = require('gulp-sass');
var sourcemaps  = require('gulp-sourcemaps');
var streamqueue = require('streamqueue');
var typescript  = require('gulp-typescript');
var uglify      = require('gulp-uglify');
 
var argv    = require('yargs').argv;
var cache   = new cachebust({ checksumLength: 32 });
var history = require('connect-history-api-fallback');

function assets_api() { // {{{1
    return gulp.src('api')
        .pipe(gulp.symlink('dist/'));
} // }}}1
function assets_favicons() { // {{{1
    return gulp.src('favicon/**/*')
        .pipe(imagemin({
            interlaced: true,
            multipass: true,
            progressive: true,
        }))
        .pipe(flatten())
        .pipe(chmod(0644))
        .pipe(gulp.dest('dist/'));
} // }}}1
function assets_fonts() { // {{{1
    return gulp.src([
        'node_modules/roboto-fontface/fonts/**/*',
    ])
        .pipe(flatten())
        .pipe(gulpif(argv.production, cache.resources()))
        .pipe(chmod(0644))
        .pipe(gulp.dest('dist/fonts/'));
} // }}}1
function assets_images() { // {{{1
    return gulp.src('src/images/**/*.{jpg,png}')
        .pipe(imagemin({
            interlaced: true,
            multipass: true,
            progressive: true,
        }))
        .pipe(gulpif(argv.production, cache.resources()))
        .pipe(chmod(0644))
        .pipe(gulp.dest('dist/images/'));
} // }}}1

function clean() { // {{{1 
    return del(['.gen', 'dist']);
} // }}}1

function compress() { // {{{1
    // images are already minimized
    // woff/woff2 is gzip-ed format
    return gulp.src(['dist/**/*', '!dist/**/*.{jpg,png}', '!dist/**/*.{woff,woff2}', '!dist/**/*.gz'])
        .pipe(gulpif(argv.production, gzip({ gzipOptions: { level: 9 } })))
        .pipe(chmod(0644))
        .pipe(gulp.dest('dist/'));
} // }}}1

function css() { // {{{1
    var leaflet = gulp.src('node_modules/leaflet/dist/leaflet.css');

    var scss     = gulp.src('src/**/*.scss')
        .pipe(sass({
            precision: 10,
            onError: console.error.bind(console, 'Sass error:'), 
        }));

    return streamqueue({ objectMode: true }, leaflet, scss)
        .pipe(gulpif(!argv.production, sourcemaps.init()))
        .pipe(concat('stylesheet.min.css'))
        .pipe(gulpif(argv.production, cache.references()))
        .pipe(cleanCss({ optimization: 2 }))
        .pipe(gulpif(!argv.production, sourcemaps.write()))
        .pipe(gulpif(argv.production, cache.resources()))
        .pipe(chmod(0644))
        .pipe(gulp.dest('dist/'))
} // }}}1

function html() { // {{{1
    return gulp.src('src/**/*.html')
        .pipe(htmlmin({collapseWhitespace: true, removeComments: true, }))
        .pipe(gulpif(argv.production, cache.references()))
        .pipe(chmod(0644))
        .pipe(gulp.dest('dist/'));
} // }}}1

function js() { // {{{1
 	var libraries     = gulp.src([
 		'node_modules/leaflet/dist/leaflet-src.js',
        'node_modules/geojson/geojson.js',
 	]);
 
    // order is important
 	var application   = gulp.src([
 		'built/zone.js',
 		'built/zoneSelections.js',
 		'built/zoneInfo.js',
 		'built/zoneMap.js',
 		'built/zoneApplication.js',
 	]);
 
 	return streamqueue({ objectMode: true }, libraries, application)
 		.pipe(gulpif(!argv.production, sourcemaps.init()))
 		.pipe(concat('script.min.js'))
 		.pipe(uglify())
 		.pipe(gulpif(!argv.production, sourcemaps.write()))
 		.pipe(gulpif(argv.production, cache.resources()))
 		.pipe(chmod(0644))
 		.pipe(gulp.dest('dist/'))
} // }}}1

function ts() { // {{{1
    var project = typescript.createProject('tsconfig.json');

    return project.src()
        .pipe(project())
        .js
 		.pipe(chmod(0644))
        .pipe(gulp.dest('built'));
} // }}}1

function serve() {
    connect.server({
        host: '0.0.0.0',
        root: 'dist/',
        middleware: function(connect, option) {
            return [
                history({
                    //verbose: console.log.bind(console),
                    verbose: true,
                }),
            ];
        }
    });

    gulp.watch(['built/**/*.js'], js);
    gulp.watch(['src/**/*.html'], html);
    gulp.watch(['src/**/*.scss'], css);
    gulp.watch(['src/**/*.ts'],   ts);
}

const build = gulp.series(clean, gulp.parallel(assets_api, assets_favicons, assets_fonts, assets_images), css, ts, js, html, compress);
exports.build = build;
exports.serve = gulp.series(build, serve);
exports.default = build;
