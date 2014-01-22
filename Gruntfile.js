var fs = require('fs'),
	gruntConfig = {
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
	};

module.exports = function(grunt) {
	// Инициализируем конфиг
	grunt.initConfig(gruntConfig);

	// Загружаем кастомные таски
	grunt.loadTasks('tasks');

	// Регистрируем таски
	grunt.registerTask('default', 'video_slicer');
};