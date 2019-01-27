const gulp = require( 'gulp' ),
    jsbeautify = require( "gulp-jsbeautifier" ),
    fs = require( "fs" ),
    eslint = require( "gulp-eslint" );

const baseDir = process.cwd(),
    jsConfig = JSON.parse( fs.readFileSync( './config/js-beautify.json' ) ),
    eslintConfig = fs.readFileSync( `${baseDir}/config/eslint.json` ).toString();

const eslintCfg = JSON.parse( eslintConfig ),
    esJSONWP = Object.keys( eslintCfg.globals );

eslintCfg.globals = esJSONWP;

gulp.task( 'default', () => {
    gulp.src( "gulpfile.js" )
        .pipe( jsbeautify( jsConfig ) )
        .pipe( gulp.dest( '.' ) );

    gulp.src( "config/**" )
        .pipe( jsbeautify( jsConfig ) )
        .pipe( gulp.dest( 'config' ) );

    gulp.src( "util/**/**.js" )
        .pipe( jsbeautify( jsConfig ) )
        .pipe( eslint( eslintCfg ) )
        .pipe( gulp.dest( 'util' ) );

    gulp.src( "ftp/**/**.js" )
        .pipe( jsbeautify( jsConfig ) )
        .pipe( eslint( eslintCfg ) )
        .pipe( gulp.dest( 'ftp' ) );

    return gulp.src( "net/**/**.js" )
        .pipe( jsbeautify( jsConfig ) )
        .pipe( eslint( eslintCfg ) )
        .pipe( gulp.dest( 'net' ) );
} );
