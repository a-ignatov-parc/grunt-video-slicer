var fs = require('fs'),
	gruntConfig = {
		video_slicer: {
			options: {
				sections: [{
					name: 'section0',
					time: [0, 1.5]
				}, {
					name: 'section1',
					time: [1.5, 2.2],
					encodeToJSON: true
				}, {
					name: 'section2',
					time: [1.5, 3]
				}, {
					name: 'section3',
					time: 3
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