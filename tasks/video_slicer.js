/**
 * Task to slice and conver video file into scenes required for correct custom video player 
 * operation.
 *
 * This task require ffmpeg to be installed
 * Install ffmpeg with brew:
 * brew install ffmpeg --with-libvorbis --with-nonfree --with-gpl --with-libvpx --with-pthreads --with-libx264 --with-libfaac --with-theora --with-libogg
 *
 * Examples:
 * 	video_slicer: {
 * 		options: {
 * 			sections: [
 * 				{
 * 					name: 'section0-sequence',
 * 					time: [1, 2],
 * 					json: true
 * 				}, {
 * 					name: 'section0',
 * 					time: [1, 17],
 * 					codecs: ['mp4', 'webm']
 * 				}, {
 * 					name: 'section1',
 * 					time: [19, 30],
 * 					filters: 'grayscale',
 * 					codecs: 'mp4'
 * 				}, {
 * 					name: 'section2',
 * 					time: 56
 * 				}
 * 			]
 * 		},
 * 		video: {
 * 			src: 'videos/video.mp4',
 * 			dest: 'sections/'
 * 		}
 * }
 */

var fs = require('fs'),
	util = require('util'),
	mime = require('mime'),
	async = require('async'),
	_ = require('underscore'),
	ffmpeg = require('ffmpeg-node');

module.exports = function(grunt) {
	var defaults = {
			sections: [{}],
			emptyDestBeforeStart: false,
			encodes: {
				webm: {
					'-c:v': 'libvpx',
					'-qmin': '0',
					'-qmax': '50',
					'-crf': '10',
					'-b:v': '2M',
					'-c:a': 'libvorbis',
					'-q:a': '4',
					'-threads': '0'
				},
				mp4: {
					'-strict': 'experimental',
					'-f': 'mp4',
					'-movflags': 'faststart',
					'-vcodec': 'libx264',
					'-acodec': 'aac',
					'-ab': '160000',
					'-ac': '2',
					'-preset': 'slow',
					'-profile': 'main',
					'-crf': '22',
					'-threads': '0'
				},
				json: {
					'-an': '',
					'-f': 'image2',
					'-q:v': '1'
				}
			}
		};

	grunt.registerMultiTask('video_slicer', 'Slice videos as you want', function() {
		var options = this.options(defaults),
			files = this.files,
			done = this.async(),
			deletedDest = {},
			queue = [],
			processingCount = 0;

		function addToQueue(encodeFlags, params) {
			var ffmpegParams = ['-i', params.srcPath];

			_.each(encodeFlags, function(value, key, list) {
				ffmpegParams.push(key);

				switch(typeof value) {
					case 'string':
						if (value) {
							ffmpegParams.push(value);
						}
						break;
					default:
						ffmpegParams.push(value);
				}
			});
			ffmpegParams.push(params.outhPath);

			if (!grunt.file.isDir(params.dstPath)) {
				grunt.file.mkdir(params.dstPath);
			}

			queue.push(function(callback) {
				var timer = setInterval(function() {
						grunt.log.write('.');
					}, 1000);

				grunt.verbose.writeln('ffmpeg ' + ffmpegParams.join(' '));
				grunt.log.write('Converting: ' + (params.log || params.outhPath).cyan);

				ffmpeg.exec(ffmpegParams, function() {
					if (typeof params.preprocess === 'function') {
						params.preprocess(params);
					}
					timer && clearInterval(timer);
					grunt.log.write('.' + 'OK'.yellow + ' (' + (++processingCount) + '/' + queue.length + ')');
					grunt.log.writeln('');
					return callback();
				});
			});
		}

		function executeQueue() {
			grunt.log.writeln('Starting ' + queue.length.toString().cyan + ' encoding jobs.');
			async.series(queue, done);
		}

		if (!_.isArray(options.sections) || !options.sections.length) {
			return grunt.fail.warn('No sections have been defined.');
		}

		this.files.forEach(function(f) {
			options.sections.forEach(function(section, i) {
				var section = _.defaults(section, {
						name: 'section' + i,
						time: [],
						filters: [],
						codecs: ['mp4', 'webm'],
						skip: false
					}),
					srcPath = f.src[0],
					dstPath = f.dest,
					hasTimeRange;

				if (section.skip) {
					return grunt.log.writeln('Skipping: ' + section.name);
				}

				if (_.isArray(section.time)) {
					switch(section.time.length) {
						case 2:
						case 1:
							hasTimeRange = true;
							break;
						case 0:
							hasTimeRange = false;
							break;
						default:
							section.time.length = 2;
							hasTimeRange = true;
					}
				} else {
					section.time = [section.time];
					hasTimeRange = true;
				}

				if (!grunt.file.exists(srcPath)) {
					return grunt.fail.warn('Source file "' + srcPath + '" not found.');
				}

				if (options.emptyDestBeforeStart && grunt.file.isDir(dstPath) && !deletedDest[dstPath]) {
					deletedDest[dstPath] = true;
					grunt.file.delete(dstPath);
				}

				if (_.isString(section.filters)) {
					section.filters = [section.filters];
				}

				if (_.isString(section.codecs)) {
					section.codecs = [section.codecs];
				}

				if (_.isArray(section.codecs)) {
					section.codecs.forEach(function(codecName) {
						var defaultEncodeFlags = defaults.encodes[codecName],
							encodeFlags = _.extend({}, defaultEncodeFlags),
							encodeParams = {
								name: section.name,
								srcPath: srcPath,
								dstPath: dstPath,
								outhPath: null,
								log: null
							},
							outPath;

						section.filters.forEach(function(filter) {
							switch(filter) {
								case 'grayscale':
									encodeFlags['-vf'] = 'yadif=0:0:0, hue=s=0';
									break;
							}
						});

						if (defaultEncodeFlags) {
							switch(codecName) {
								case 'json':
									outPath = dstPath + section.name;

									_.extend(encodeParams, {
										dstPath: outPath,
										sequencePath: dstPath,
										outhPath: outPath + '/%d.jpg',
										log: srcPath + '#t=' + section.time.join(',') + ' -> ' + outPath + '.json',
										preprocess: function(params) {
											var result = {
													frames: []
												};

											grunt.file.recurse(params.sequencePath, function(abspath, rootdir, subdir, filename) {
												result.frames[filename.split('.')[0] - 1] = util.format('data:%s;base64,%s', mime.lookup(abspath), fs.readFileSync(abspath).toString('base64'));
											});
											grunt.file.write(params.sequencePath + params.name + '.json', JSON.stringify(result));
										}
									});

									if (grunt.file.isDir(outPath)) {
										grunt.file.delete(outPath);
									}
									break;
								default:
									outPath = dstPath + section.name + '.' + codecName;

									_.extend(encodeParams, {
										outhPath: outPath,
										log: srcPath + (hasTimeRange ? '#t=' + section.time.join(',') : '') + ' -> ' + outPath
									});

									if (grunt.file.exists(outPath)) {
										grunt.file.delete(outPath);
									}
							}

							// Задаем время секции для нарезки.
							if (hasTimeRange) {
								encodeFlags['-ss'] = section.time[0];

								if (section.time[1] != null) {
									encodeFlags['-t'] = section.time[1] - section.time[0];
								}
							}

							// Добавляем задачу в очередь.
							addToQueue(encodeFlags, encodeParams);
						}
					});
				} else {
					return grunt.fail.warn('No codecs defined for section "' + section.name + '"');
				}
			});
		});
		executeQueue();
	});
};