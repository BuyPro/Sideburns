(function () {
    'use strict';
    var globalOptions = {
            ignoreUndefined: false,
            escape: "general",
            escapeSets: {
                xml: {
                    "<": "&lt;",
                    ">": "&gt;",
                    "&": "&amp;",
                    "\"": "&quot;"
                },
                general: {
                    "\"": "\\\"",
                    "\'": "\\\'"
                }
            }
        },
        deepMergeJson = function(obja, objb) {
            var prop;
            for(prop in objb) {
                if(objb.hasOwnProperty(prop)) {
                    if(typeof(obja[prop]) === 'object' && typeof(objb[prop]) === 'object') {
                        obja[prop] = deepMergeJson(obja[prop], objb[prop]);
                    } else {
                        obja[prop] = objb[prop];
                    }
                }
            }
            return obja;
        },
        setDeepProperty = function(ident, value, obj) {
            var recurse = function(propList, value, obj) {
                    if(propList.length > 1) {
                        recurse(propList, value, obj[list.shift()]);
                    } else {
                        obj[propList[0]] = value;
                    }
                },
                list;

            if(!ident.push && !ident.map) {
                list = ident.split(".").map(function(e){return e.trim()});
            } else {
                list = ident;
            }

            recurse(list, value, obj);
            return obj;
        },
        getDeepProperty = function(ident, obj) {
            var ret = null,
                recurse = function(propList, obj) {
                    if(propList.length > 1) {
                        recurse(propList, obj[list.shift()]);
                    } else {
                        ret = obj[propList[0]];
                    }
                },
                list;

            if(!ident.push && !ident.map) {
                list = ident.split(".").map(function(e){return e.trim()});
            } else {
                list = ident;
            }

            recurse(list, obj);
            return ret;
        },
        resolveNamespace = function(ident, blockStack) {
            var l = blockStack.length, i = 0, ret = "";
            for(;i < l; i += 1) {
                ret += blockStack[i] + ".";
            }
            return ret + ident;
        },
        safeDeepMergeJson = function(obja, objb) {
            if(typeof(obja) !== 'object'){
                throw new TypeError("Cannot deep merge with an " + typeof(obja) + ": [Param 1]");
                return null;
            }
            if(typeof(objb) !== 'object'){
                throw new TypeError("Cannot deep merge with an " + typeof(objb) + ": [Param 2]");
                return null;
            }

            return deepMergeJson(deepMergeJson({}, obja), objb);
        },
        /**
         * Using this Regex
         * This regular expression will match and split all valid tags for Sideburns, and provides
         * all data needed to appropriately lex each tag
         *
         * Result indexes (from re.exec()):
         * [0] The whole tag that has been matched
         * [1, 9] These are the opening and closing double square brackets, respectively. Always present
         * [2] The Tag modifier. This will either be '/' for a closing tag, '#' for a pre-process directive
         *     or undefined for all other tags. Processing should branch here depending on whether or not this
         *     token is a hash ('#'). Indexes for one branch will be undefined in case of the other branch.
         *
         * == In case of Directive ==
         * [3] The identifier of the directive to set. Always present
         * [4] The value to set the directive. Always present
         *
         * == In case of other tag ==
         * [5] The Block modifier. Will be '*' for arrays, '&' for context and undefined for simple tags
         * [6] The Data modifier. Will be '!' for an escape with the global set, '!([7])' for an escape with a
         *     specified set or undefined for unescaped data
         * [7] If a set has been specified, this will be the name of the set on its own, seperate from the data
         *     modifier. It will otherwise be undefined
         * [8] The identifier for the data or block that the tag represents. Always present
         **/
        captureTags = /(\[\[)(\#|\/)?\s*(?:([a-zA-Z]+[a-zA-Z0-9]*)\s*\:\s*([a-zA-Z]+[a-zA-Z0-9]*)|([\*\&]?)\s*((?:\!(?:\(([a-zA-Z]+[a-zA-Z0-9]*)\))?)?)\s*([a-zA-Z](?:[a-zA-Z0-9]*(?:\.(?=[a-zA-Z]))?)+))\s*(\]\])/,
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
        TokenStateMachine = function(stateSet, initial) {
            var that = this;

            this.stateSet = stateSet || {"start": {}};
            this.state = initial || "start";
            this.count = 0;

            this.addState = function(name, transitions) {
                that.stateSet[name] = transitions;
            }
            this.addStateTransition = function(from, to, tokenName, onMove) {
                that.stateSet[from][tokenName] = {to: to, onMove: onMove};
            }
            this.processToken = function(token, context) {
                console.log(token);
                var state = that.stateSet[that.state];
                console.log(token.ident);
                if(state.hasOwnProperty(token.ident)){
                    if(state[token.ident].onMove(token, context)){
                        that.state = state[token.ident].to;
                    } else {
                        throw new Error("State machine left in bad state after eating token " + token.ident + ", #" + that.count);
                    }
                } else {
                    throw new Error("Bad token " + token.ident + ", #" + that.count + "; No transition defined for " + that.state);
                }
                that.count += 1;
            }
        },
        Token = function(ident, val, info) {
            this.ident = ident || "T_NULL";
            this.val = val || null;
            this.info = info || {};
            return this;
        },
        tokenise = function(src){
            var tokens = [],
                last = 0,
                i = 0,
                match = null,
                matcher,
                chunk;

            matcher = function() {
                return ((match = captureTags.exec(chunk)) !== null);
            }
            while (i < src.length) {
                chunk = src.substr(i);
                if(matcher()){
                    if(match.index > 0) {
                        tokens.push(new Token("STRING", match.input.substr(0, match.index)));
                    }
                    tokens.push(new Token("TAG_OPEN", match[1]));
                    if(match[2] === '#'){
                        tokens.push(new Token("TAG_MODIFIER_DIRECTIVE", match[2]));
                        tokens.push(new Token("IDENT", match[3]));
                        tokens.push(new Token("VALUE", match[4]));
                    } else {
                        if(match[2] === '/') {
                            tokens.push(new Token("TAG_MODIFIER_CLOSE", match[2]));
                        }

                        if(match[5] === "*") {
                            tokens.push(new Token("BLOCK_MODIFIER_ITERATE", match[5]));
                        } else if(match[5] === "&") {
                            tokens.push(new Token("BLOCK_MODIFIER_CONTEXT", match[5]));
                        }

                        if(typeof(match[6]) !== 'undefined' && match[6].charAt(0) === "!") {
                            if(typeof(match[7]) !== 'undefined') {
                                tokens.push(new Token("DATA_MODIFIER_ESCAPE", match[6], {escape: match[7]}));
                            } else {
                                tokens.push(new Token("DATA_MODIFIER_ESCAPE", match[6]));
                            }
                        }
                        tokens.push(new Token("IDENT", match[8]));
                    }
                    tokens.push(new Token("TAG_CLOSE", match[9]));
                    i += match.index + match[0].length;
                } else {
                    tokens.push(new Token("STRING", chunk));
                    i += chunk.length;
                }
            }
            tokens.push(new Token("EOD"));
            return tokens;
        },
        parse = function(tokens, data, options) {
            options = safeDeepMergeJson(globalOptions, options);
            var context = {
                input: tokens,
                output: "",
                data: data,
                options: options,
                status: {
                    tagModifiers: {
                        name: null,
                        value: null,
                        close: false,
                        block: false,
                        loop: false,
                        escape: false,
                        escapeVal: null
                    },
                    tagBuffer: new Stack(),
                    blocks: new Stack(),
                    unspin: null
                }
            },
                parserdef = {
                    "global": {
                        "EOD": {
                            to: "end",
                            onMove: function(token, context) {
                                if(context.status.tagBuffer.length > 0
                                   || context.status.blocks.length > 0) {
                                    return false;
                                } else {
                                    return true;
                                }
                            }
                        },
                        "STRING": {
                            to: "global",
                            onMove: function(token, context) {
                                context.output += token.val;

                                return true;
                            }
                        },
                        "TAG_OPEN": {
                            to: "buildTag",
                            onMove: function(token, context){
                                return true;
                            }
                        }
                    },
                    "buildTag": {
                        "TAG_MODIFIER_DIRECTIVE": {
                            to: "buildDirective",
                            onMove: function(token, context){
                                return true;
                            }
                        },
                        "TAG_MODIFIER_CLOSE": {
                            to: "buildTag",
                            onMove: function(token, context) {
                                context.status.tagModifiers.close = true;
                                return true;
                            }
                        },
                        "BLOCK_MODIFIER_ITERATE": {
                            to: "buildTag",
                            onMove: function(token, context) {
                                if(context.status.tagModifiers.block){
                                    return false;
                                } else {
                                    context.status.tagModifiers.loop = true;
                                    return true;
                                }
                            }
                        },
                        "BLOCK_MODIFIER_CONTEXT": {
                            to: "buildTag",
                            onMove: function(token, context) {
                                if(context.status.tagModifiers.loop){
                                    return false;
                                } else {
                                    context.status.tagModifiers.block = true;
                                    return true;
                                }
                            }
                        },
                        "DATA_MODIFIER_ESCAPE": {
                            to: "buildTag",
                            onMove: function(token, context) {
                                context.status.tagModifiers.escape = true;
                                context.status.tagModifiers.escapeVal = token.info.escape || context.options.escape;

                                return true;
                            }
                        },
                        "IDENT": {
                            to: "buildTag",
                            onMove: function(token, context) {
                                context.status.tagModifiers.name = token.val;
                                return true;
                            }
                        },
                        "TAG_CLOSE": {
                            to: "global",
                            onMove: function(token, context){
                                if(context.status.tagModifiers.loop){
                                    console.log("In a loop");
                                    if(context.status.tagModifiers.close){
                                        console.log("Closing");
                                    }
                                } else if(context.status.tagModifiers.block){
                                    if(context.status.tagModifiers.close){
                                        context.status.blocks.pop();
                                    } else {
                                        context.status.blocks.push(context.status.tagModifiers.name);
                                    }
                                }else {
                                    var tag = resolveNamespace(context.status.tagModifiers.name, context.status.blocks);
                                    context.output += getDeepProperty(tag, data);
                                }
                                context.status.tagModifiers = {
                                    name: null,
                                    value: null,
                                    close: false,
                                    block: false,
                                    loop: false,
                                    escape: false,
                                    escapeVal: null,
                                };
                                return true;
                            }
                        }
                    },
                    "buildDirective": {
                        "IDENT": {
                            to: "buildDirective",
                            onMove: function(token, context) {
                                context.status.tagModifiers.name = token.val;
                                return true;
                            }
                        },
                        "VALUE": {
                            to: "buildDirective",
                            onMove: function(token, context) {
                                context.status.tagModifiers.val = token.val;
                                return true;
                            }
                        },
                        "TAG_CLOSE": {
                            to: "global",
                            onMove: function(token, context){
                                setDeepProperty(context.status.tagModifiers.name, context.status.tagModifiers.val, context.options);
                                context.status.tagModifiers = {
                                    name: null,
                                    value: null,
                                    close: false,
                                    block: false,
                                    loop: false,
                                    escape: false,
                                    escapeVal: null,
                                    loopLookahead: null
                                };

                                return true;
                            }
                        }
                    },
                    "end": {}
                },
                    machine = new TokenStateMachine(parserdef, "global");

            while(tokens.length > 0){
                machine.processToken(tokens.shift(), context);
            }

            return context.output;
        },
        render = function(src, data, options) {
            return parse(tokenise(src), data, options);
        };

    render.partial = function(src) {
        return (function(tokens, data, options){return parse(tokens, data, options);}).bind(null, tokenise(src));
    };

    if (typeof module !== "undefined" && module.exports) {
        module.exports = render;
    } else {
        window.sideburns = render;
    }
}());
