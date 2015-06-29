module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        uglify: {
            options: {
                banner: "/*! <%= pkg.name %> <%= grunt.template.today(\"yyyy-mm-dd\") %> */\n"
            },
            build: {
                src: "dist/sideburns.js",
                dest: "dist/sideburns.min.js"
            }
        },
        concat: {
            options: {
                seperator: "",
                banner: "(function () {\n",
                footer: "}());"
            },
            dist: {
                src: ["src/sideburns.src.js"],
                dest: "dist/sideburns.js"
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-concat");

    grunt.registerTask("default", ["concat", "uglify"]);
}
