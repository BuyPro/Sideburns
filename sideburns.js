(function () {
    'use strict';
    var options = {
            ignoreUndefined: false,
            defaultRegex: true,
            tags: {
                capture: ["[[", "]]"],
                context: "&",
                loop: "*",
                escape: "!",
                close: "/"
            },
            precomp: {
                capture: /\[\[\s*(\S+.*\S+)\s*\]\]/,
                context: /\&\s*/,
                loop: /\*\s*/,
                escape: /\!\s*/,
                close: /\/\s*/
            }
        },
        escapeRegex = function (str) {
            return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        },
        getRegex = function(type) {
            if(options.defaultRegex){
                return options.precomp[type];
            } else {
                if (type === "capture") {
                    var parts = options.tags.capture;
                    return new RegExp(escapeRegex(parts[0] + "\\s*(\\S+.*\\S+)\\s*" + parts[1]));
                } else {
                    return new RegExp(escapeRegex(options.tags[type]) + "\\s*");
                }
            }
        },
        Stack = function () {
            var self = this;
            this.length = 0;
            this.push = function (val) {
                self[self.length] = val;
                self.length += 1;
            };
            this.pop = function (val) {
                var ret = null;
                if (self.length > 0) {
                    ret = self[self.length - 1];
                    self[self.length - 1] = null;
                    self.length -= 1;
                }
                return ret;
            };

            this.peek = function () {
                return this.length > 0 ? self[self.length - 1] : null;
            };
            this.contains = function (value, compare) {
                compare = compare || function (a, b) {
                    return a === b;
                };
                var i = this.length;
                while (i--) {
                    if (compare(this[i], value)) {
                        return true;
                    }
                }
                return false;
            };
            return this;
        },

        render = function (src, data) {
            var index = 0,
                loopStack = new Stack(),
                contextStack = new Stack(),
                match = null,
                submatch = null,
                tag = "",
                str = "",
                context = data,
                loop = null,
                reCapture = getRegex("capture"),
                reContext = getRegex("context"),
                reLoop = getRegex("loop"),
                reEscape = getRegex("escape"),
                reClose = getRegex("close");

            while ((match = reCapture.exec(src)) !== null) {
                index = match.index;
                str += src.slice(0, index);
                src = src.slice(index + match[0].length);
                tag = match[1];
                str += data[tag];
            }
            str += src;
            return str;
        };


    window.tinymvc.sideburns = render;
}());
