# grunt-video-slicer

> Grunt task for cutting video into sections by specified time ranges

## Getting Started
This plugin requires Grunt `~0.4.1`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-video-slicer --save-dev
```

Additionally, this plugin requries `ffmpeg` with `libx264` and `libvpx` to encode `.mp4` and `.webm`, which are common HTML5 codecs.
```shell
brew install ffmpeg --with-libvorbis --with-nonfree --with-gpl --with-libvpx --with-pthreads --with-libx264 --with-libfaac --with-theora --with-libogg
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-video-slicer');
```

## The "video_slicer" task

### Overview

The `video_slicer` task will take the source video file and cut it in any number of clips you defined in the options. Clips will be encoded in `*.mp4` and `*.webm` and optimized to be fully supported with web browser.

In your project's Gruntfile, add a section named `video_slicer` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  video_slicer: {
    options: {
      // Task-specific options go here.
    },
    my_target: {
      src: 'src/video.mp4',
      dest: 'dest_folder/'
    }
  }
})
```

### Options

#### options.sections
Type: `Array`

Default value:

```js
[{
  name: 'section' + i,
  time: [],
  filters: [],
  codecs: ['mp4', 'webm'],
  skip: false
}]
```

An array of objects containing the time range we want to cut our video into.

If a `name` is specified, then output video clip will be named with this name. e.g. `super-movie.mp4`

If a `name` is not specified, then output video clip will be named with default pattern `section<index>`. e.g. `section0.mp4`, `section1.mp4`, etc.

If a `time` is specified, then the video clip will be cut from time specified in the first value and will end in the time specified at second value.

If a `time` is not specified, then task will encode full length source file into specified codecs with specified name.

If `time` is specified as `time: [1, 10]`, then the video clip will start at 1sec and will end at 10sec.

If `time` is specified as `time: [10]` or `time: 10`, then the video clip will start at 10sec and will end at the end of the source video file.

If `codecs` are specified, then the video clip will be encoded to specified formats.

If `codecs` are not specified, then the video clip will be encoded to default formats `['mp4', 'webm']`.

If `codecs` is specified as `codecs: 'json'`, then the video clip will be encoded to only `json` format.

If `skip` is specified, then the section will be excluded from the converting batch.

If `filters` are specified, then the video clip will be encoded with applied image filters. Available filters:

1. `grayscale` – will turn video black and white.

Example:

```js
[{
  time: [0, 1.5]
}, {
  time: [1.5, 2.2],
  codecs: ['json', 'webm']
}, {
  time: [1.5, 3]
}, {
  name: 'last_part',
  time: 3,
  codecs: 'mp4'
}, {
  name: 'skipped_section',
  time: 4,
  skip: true
}]
```

#### options.emptyDestBeforeStart
Type: `Boolean`

Default value: `false`

If the value is specified, then task will empty the destination folder before starting encoding.

The value that specifies should task empty destination folder before start encoding.

### Usage Examples

#### Default Options
The default options will generate `.mp4` and `.webm` versions of source files. They will be named `section0.mp4` and `section0.webm`.

```js
grunt.initConfig({
  video_slicer: {
    options: {},
    my_target: {
      src: 'src/video.mp4',
      dest: 'dest_folder/'
    }
  }
})
```

#### Custom Options
In this example, we specify sections and a source path. We'll generate 5 video files. First, third and forth files will be encoded to `mp4` and `webm` formats only. The second file will be encoded into json array with base64 encoded frames. The last file with `full_video` name will be full length source files encoded into `mp4`, `webm` and `json` formats.

```js
grunt.initConfig({
  video_slicer: {
    options: {
      sections: [{
        time: [0, 1.5]
      }, {
        time: [1.5, 2.2],
        codecs: 'json'
      }, {
        time: [1.5, 3]
      }, {
        time: 3
      }, {
        name: 'full_video',
        codecs: ['mp4', 'webm', 'json'],
      }],
      emptyDestBeforeStart: true
    },
    video: {
      src: 'videos/video.mp4',
      dest: 'sections/'
  }
}
})
```

## Release History

*0.3.3*

* Increased `json` encode default quality

*0.3.2*

* Added `filters` options

*0.2.1*

* Console loging improvements

*0.2.0*

* Section's `encodeToJSON` parameter changed to `json` codec format.
* Section's `name` is not required parameter anymore.
* Made refactoring to simplify code and bug fixes.

*0.1.1*

* Section's `sequence` time array changed to section's `encodeToJSON` parameter.

*0.1.0*

* Initial Release.