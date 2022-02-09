/*
 * @Description: 
 * @Version: 1.0.0
 * @Author: zengxirou297
 * @Date: 2021-03-16 15:27:31
 * @LastEditors: zengxirou297
 * @LastEditTime: 2021-03-16 18:47:38
 */
var gulp = require('gulp')
var gulpLoadPlugins = require('gulp-load-plugins')
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var plugins = gulpLoadPlugins()
var del = require('del')

var DEST = 'build/'

gulp.task('clean:build', done => {
    del(['build/**/*'])
    done();
});

gulp.task('js', () => {
    return gulp.src([
        'core/*.js',
        "lib/jsbn.js",
        "lib/jsbn2.js",
        "lib/prng4.js",
        "lib/rng.js",
        "lib/rsa.js",
        "lib/rsa2.js",
        "lib/base64.js",
        "lib/asn1hex-1.1.js",
        "lib/rsapem-1.1.js",
        "lib/rsasign-1.2.js",
        "lib/x509-1.1.js",
        "lib/pkcs5pkey-1.0.js",
        "lib/asn1-1.0.js",
        "lib/asn1x509-1.0.js",
        "lib/ec.js",
        "lib/ec-patch.js",
        "lib/ecdsa-modified-1.0.js",
        "sm/index.js",
        "sm/crypto-1.1.js",
        "sm/sm3.js",
        "sm/sm3-sm2-1.0.js",
        "sm/ecparam-1.0.js",

    ], { allowEmpty: true })
        .pipe(plugins.concat('index.js'))
        // 这会输出一个未压缩过的版本
        .pipe(gulp.dest(DEST))
        // 这会输出一个压缩过的并且重命名未 foo.min.js 的文件
        .pipe(uglify())
        .pipe(rename({ extname: '.min.js' }))
        .pipe(gulp.dest(DEST));
});

gulp.task('default', gulp.series('clean:build', 'js'));