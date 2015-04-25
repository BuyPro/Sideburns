var reCapture = /\|\\\s*(\S+.*\S+)\s*\/\|/,
    reContext = /\&\s*/,
    reLoop = /\*\s*/,
    reEscape = /\!\s*/,

    Stack = function() {
        this.length = 0;
        this.push = function(val) {
            this[length] = val;
            length += 1;
        }
        this.pop = function(val) {
            var ret = null;
            if(length > 0) {
                ret = this[length-1];
                this[length-1] = null;
                length -= 1;
            }
            return ret;
        }

        this.peek = function() {
            return this.length > 0 ? this[this.length-1] : null;
        };
        this.contains = function(value, compare) {
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

    render = function(src, data) {
        var index = 0,
            loopStack = new Stack(),
            contextStack = new Stack(),
            match = null,
            submatch = null,
            tag = "",
            str = "",
            context = data,
            loop = null;

        while((match = reCapture.exec(src)) !== null) {
            reCapture = /\|\\\s*(\S+.*\S+)\s*\/\|/;
            index = match.index;
            str += src.slice(0, index);
            src = src.slice(index + match[0].length);
            tag = match[1];
            str += data[tag];
        }
        str += src;
        return str;
    };


module.exports = {
    capture: reCapture,
    context: reContext,
    loop: reLoop,
    escape: reEscape,
    render: render
}
