/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
/**
 * CryptoJS core components.
 */
var CryptoJS = CryptoJS || (function (Math, undefined) {
    /**
     * CryptoJS namespace.
     */
    var C = {};

    /**
     * Library namespace.
     */
    var C_lib = C.lib = {};

    /**
     * Base object for prototypal inheritance.
     */
    var Base = C_lib.Base = (function () {
        function F() {}

        return {
            /**
             * Creates a new object that inherits from this object.
             *
             * @param {Object} overrides Properties to copy into the new object.
             *
             * @return {Object} The new object.
             *
             * @static
             *
             * @example
             *
             *     var MyType = CryptoJS.lib.Base.extend({
             *         field: 'value',
             *
             *         method: function () {
             *         }
             *     });
             */
            extend: function (overrides) {
                // Spawn
                F.prototype = this;
                var subtype = new F();

                // Augment
                if (overrides) {
                    subtype.mixIn(overrides);
                }

                // Create default initializer
                if (!subtype.hasOwnProperty('init')) {
                    subtype.init = function () {
                        subtype.$super.init.apply(this, arguments);
                    };
                }

                // Initializer's prototype is the subtype object
                subtype.init.prototype = subtype;

                // Reference supertype
                subtype.$super = this;

                return subtype;
            },

            /**
             * Extends this object and runs the init method.
             * Arguments to create() will be passed to init().
             *
             * @return {Object} The new object.
             *
             * @static
             *
             * @example
             *
             *     var instance = MyType.create();
             */
            create: function () {
                var instance = this.extend();
                instance.init.apply(instance, arguments);

                return instance;
            },

            /**
             * Initializes a newly created object.
             * Override this method to add some logic when your objects are created.
             *
             * @example
             *
             *     var MyType = CryptoJS.lib.Base.extend({
             *         init: function () {
             *             // ...
             *         }
             *     });
             */
            init: function () {
            },

            /**
             * Copies properties into this object.
             *
             * @param {Object} properties The properties to mix in.
             *
             * @example
             *
             *     MyType.mixIn({
             *         field: 'value'
             *     });
             */
            mixIn: function (properties) {
                for (var propertyName in properties) {
                    if (properties.hasOwnProperty(propertyName)) {
                        this[propertyName] = properties[propertyName];
                    }
                }

                // IE won't copy toString using the loop above
                if (properties.hasOwnProperty('toString')) {
                    this.toString = properties.toString;
                }
            },

            /**
             * Creates a copy of this object.
             *
             * @return {Object} The clone.
             *
             * @example
             *
             *     var clone = instance.clone();
             */
            clone: function () {
                return this.init.prototype.extend(this);
            }
        };
    }());

    /**
     * An array of 32-bit words.
     *
     * @property {Array} words The array of 32-bit words.
     * @property {number} sigBytes The number of significant bytes in this word array.
     */
    var WordArray = C_lib.WordArray = Base.extend({
        /**
         * Initializes a newly created word array.
         *
         * @param {Array} words (Optional) An array of 32-bit words.
         * @param {number} sigBytes (Optional) The number of significant bytes in the words.
         *
         * @example
         *
         *     var wordArray = CryptoJS.lib.WordArray.create();
         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607]);
         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607], 6);
         */
        init: function (words, sigBytes) {
            words = this.words = words || [];

            if (sigBytes != undefined) {
                this.sigBytes = sigBytes;
            } else {
                this.sigBytes = words.length * 4;
            }
        },

        /**
         * Converts this word array to a string.
         *
         * @param {Encoder} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
         *
         * @return {string} The stringified word array.
         *
         * @example
         *
         *     var string = wordArray + '';
         *     var string = wordArray.toString();
         *     var string = wordArray.toString(CryptoJS.enc.Utf8);
         */
        toString: function (encoder) {
            return (encoder || Hex).stringify(this);
        },

        /**
         * Concatenates a word array to this word array.
         *
         * @param {WordArray} wordArray The word array to append.
         *
         * @return {WordArray} This word array.
         *
         * @example
         *
         *     wordArray1.concat(wordArray2);
         */
        concat: function (wordArray) {
            // Shortcuts
            var thisWords = this.words;
            var thatWords = wordArray.words;
            var thisSigBytes = this.sigBytes;
            var thatSigBytes = wordArray.sigBytes;

            // Clamp excess bits
            this.clamp();

            // Concat
            if (thisSigBytes % 4) {
                // Copy one byte at a time
                for (var i = 0; i < thatSigBytes; i++) {
                    var thatByte = (thatWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                    thisWords[(thisSigBytes + i) >>> 2] |= thatByte << (24 - ((thisSigBytes + i) % 4) * 8);
                }
            } else if (thatWords.length > 0xffff) {
                // Copy one word at a time
                for (var i = 0; i < thatSigBytes; i += 4) {
                    thisWords[(thisSigBytes + i) >>> 2] = thatWords[i >>> 2];
                }
            } else {
                // Copy all words at once
                thisWords.push.apply(thisWords, thatWords);
            }
            this.sigBytes += thatSigBytes;

            // Chainable
            return this;
        },

        /**
         * Removes insignificant bits.
         *
         * @example
         *
         *     wordArray.clamp();
         */
        clamp: function () {
            // Shortcuts
            var words = this.words;
            var sigBytes = this.sigBytes;

            // Clamp
            words[sigBytes >>> 2] &= 0xffffffff << (32 - (sigBytes % 4) * 8);
            words.length = Math.ceil(sigBytes / 4);
        },

        /**
         * Creates a copy of this word array.
         *
         * @return {WordArray} The clone.
         *
         * @example
         *
         *     var clone = wordArray.clone();
         */
        clone: function () {
            var clone = Base.clone.call(this);
            clone.words = this.words.slice(0);

            return clone;
        },

        /**
         * Creates a word array filled with random bytes.
         *
         * @param {number} nBytes The number of random bytes to generate.
         *
         * @return {WordArray} The random word array.
         *
         * @static
         *
         * @example
         *
         *     var wordArray = CryptoJS.lib.WordArray.random(16);
         */
        random: function (nBytes) {
            var words = [];
            for (var i = 0; i < nBytes; i += 4) {
                words.push((Math.random() * 0x100000000) | 0);
            }

            return new WordArray.init(words, nBytes);
        }
    });

    /**
     * Encoder namespace.
     */
    var C_enc = C.enc = {};

    /**
     * Hex encoding strategy.
     */
    var Hex = C_enc.Hex = {
        /**
         * Converts a word array to a hex string.
         *
         * @param {WordArray} wordArray The word array.
         *
         * @return {string} The hex string.
         *
         * @static
         *
         * @example
         *
         *     var hexString = CryptoJS.enc.Hex.stringify(wordArray);
         */
        stringify: function (wordArray) {
            // Shortcuts
            var words = wordArray.words;
            var sigBytes = wordArray.sigBytes;

            // Convert
            var hexChars = [];
            for (var i = 0; i < sigBytes; i++) {
                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                hexChars.push((bite >>> 4).toString(16));
                hexChars.push((bite & 0x0f).toString(16));
            }

            return hexChars.join('');
        },

        /**
         * Converts a hex string to a word array.
         *
         * @param {string} hexStr The hex string.
         *
         * @return {WordArray} The word array.
         *
         * @static
         *
         * @example
         *
         *     var wordArray = CryptoJS.enc.Hex.parse(hexString);
         */
        parse: function (hexStr) {
            // Shortcut
            var hexStrLength = hexStr.length;

            // Convert
            var words = [];
            for (var i = 0; i < hexStrLength; i += 2) {
                words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << (24 - (i % 8) * 4);
            }

            return new WordArray.init(words, hexStrLength / 2);
        }
    };

    /**
     * Latin1 encoding strategy.
     */
    var Latin1 = C_enc.Latin1 = {
        /**
         * Converts a word array to a Latin1 string.
         *
         * @param {WordArray} wordArray The word array.
         *
         * @return {string} The Latin1 string.
         *
         * @static
         *
         * @example
         *
         *     var latin1String = CryptoJS.enc.Latin1.stringify(wordArray);
         */
        stringify: function (wordArray) {
            // Shortcuts
            var words = wordArray.words;
            var sigBytes = wordArray.sigBytes;

            // Convert
            var latin1Chars = [];
            for (var i = 0; i < sigBytes; i++) {
                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                latin1Chars.push(String.fromCharCode(bite));
            }

            return latin1Chars.join('');
        },

        /**
         * Converts a Latin1 string to a word array.
         *
         * @param {string} latin1Str The Latin1 string.
         *
         * @return {WordArray} The word array.
         *
         * @static
         *
         * @example
         *
         *     var wordArray = CryptoJS.enc.Latin1.parse(latin1String);
         */
        parse: function (latin1Str) {
            // Shortcut
            var latin1StrLength = latin1Str.length;

            // Convert
            var words = [];
            for (var i = 0; i < latin1StrLength; i++) {
                words[i >>> 2] |= (latin1Str.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
            }

            return new WordArray.init(words, latin1StrLength);
        }
    };

    /**
     * UTF-8 encoding strategy.
     */
    var Utf8 = C_enc.Utf8 = {
        /**
         * Converts a word array to a UTF-8 string.
         *
         * @param {WordArray} wordArray The word array.
         *
         * @return {string} The UTF-8 string.
         *
         * @static
         *
         * @example
         *
         *     var utf8String = CryptoJS.enc.Utf8.stringify(wordArray);
         */
        stringify: function (wordArray) {
            try {
                return decodeURIComponent(escape(Latin1.stringify(wordArray)));
            } catch (e) {
                throw new Error('Malformed UTF-8 data');
            }
        },

        /**
         * Converts a UTF-8 string to a word array.
         *
         * @param {string} utf8Str The UTF-8 string.
         *
         * @return {WordArray} The word array.
         *
         * @static
         *
         * @example
         *
         *     var wordArray = CryptoJS.enc.Utf8.parse(utf8String);
         */
        parse: function (utf8Str) {
            return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
        }
    };

    /**
     * Abstract buffered block algorithm template.
     *
     * The property blockSize must be implemented in a concrete subtype.
     *
     * @property {number} _minBufferSize The number of blocks that should be kept unprocessed in the buffer. Default: 0
     */
    var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
        /**
         * Resets this block algorithm's data buffer to its initial state.
         *
         * @example
         *
         *     bufferedBlockAlgorithm.reset();
         */
        reset: function () {
            // Initial values
            this._data = new WordArray.init();
            this._nDataBytes = 0;
        },

        /**
         * Adds new data to this block algorithm's buffer.
         *
         * @param {WordArray|string} data The data to append. Strings are converted to a WordArray using UTF-8.
         *
         * @example
         *
         *     bufferedBlockAlgorithm._append('data');
         *     bufferedBlockAlgorithm._append(wordArray);
         */
        _append: function (data) {
            // Convert string to WordArray, else assume WordArray already
            if (typeof data == 'string') {
                data = Utf8.parse(data);
            }

            // Append
            this._data.concat(data);
            this._nDataBytes += data.sigBytes;
        },

        /**
         * Processes available data blocks.
         *
         * This method invokes _doProcessBlock(offset), which must be implemented by a concrete subtype.
         *
         * @param {boolean} doFlush Whether all blocks and partial blocks should be processed.
         *
         * @return {WordArray} The processed data.
         *
         * @example
         *
         *     var processedData = bufferedBlockAlgorithm._process();
         *     var processedData = bufferedBlockAlgorithm._process(!!'flush');
         */
        _process: function (doFlush) {
            // Shortcuts
            var data = this._data;
            var dataWords = data.words;
            var dataSigBytes = data.sigBytes;
            var blockSize = this.blockSize;
            var blockSizeBytes = blockSize * 4;

            // Count blocks ready
            var nBlocksReady = dataSigBytes / blockSizeBytes;
            if (doFlush) {
                // Round up to include partial blocks
                nBlocksReady = Math.ceil(nBlocksReady);
            } else {
                // Round down to include only full blocks,
                // less the number of blocks that must remain in the buffer
                nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
            }

            // Count words ready
            var nWordsReady = nBlocksReady * blockSize;

            // Count bytes ready
            var nBytesReady = Math.min(nWordsReady * 4, dataSigBytes);

            // Process blocks
            if (nWordsReady) {
                for (var offset = 0; offset < nWordsReady; offset += blockSize) {
                    // Perform concrete-algorithm logic
                    this._doProcessBlock(dataWords, offset);
                }

                // Remove processed words
                var processedWords = dataWords.splice(0, nWordsReady);
                data.sigBytes -= nBytesReady;
            }

            // Return processed words
            return new WordArray.init(processedWords, nBytesReady);
        },

        /**
         * Creates a copy of this object.
         *
         * @return {Object} The clone.
         *
         * @example
         *
         *     var clone = bufferedBlockAlgorithm.clone();
         */
        clone: function () {
            var clone = Base.clone.call(this);
            clone._data = this._data.clone();

            return clone;
        },

        _minBufferSize: 0
    });

    /**
     * Abstract hasher template.
     *
     * @property {number} blockSize The number of 32-bit words this hasher operates on. Default: 16 (512 bits)
     */
    var Hasher = C_lib.Hasher = BufferedBlockAlgorithm.extend({
        /**
         * Configuration options.
         */
        cfg: Base.extend(),

        /**
         * Initializes a newly created hasher.
         *
         * @param {Object} cfg (Optional) The configuration options to use for this hash computation.
         *
         * @example
         *
         *     var hasher = CryptoJS.algo.SHA256.create();
         */
        init: function (cfg) {
            // Apply config defaults
            this.cfg = this.cfg.extend(cfg);

            // Set initial values
            this.reset();
        },

        /**
         * Resets this hasher to its initial state.
         *
         * @example
         *
         *     hasher.reset();
         */
        reset: function () {
            // Reset data buffer
            BufferedBlockAlgorithm.reset.call(this);

            // Perform concrete-hasher logic
            this._doReset();
        },

        /**
         * Updates this hasher with a message.
         *
         * @param {WordArray|string} messageUpdate The message to append.
         *
         * @return {Hasher} This hasher.
         *
         * @example
         *
         *     hasher.update('message');
         *     hasher.update(wordArray);
         */
        update: function (messageUpdate) {
            // Append
            this._append(messageUpdate);

            // Update the hash
            this._data = this._process(true);

            // Chainable
            return this;
        },

        /**
         * Finalizes the hash computation.
         * Note that the finalize operation is effectively a destructive, read-once operation.
         *
         * @param {WordArray|string} messageUpdate (Optional) A final message update.
         *
         * @return {WordArray} The hash.
         *
         * @example
         *
         *     var hash = hasher.finalize();
         *     var hash = hasher.finalize('message');
         *     var hash = hasher.finalize(wordArray);
         */
        finalize: function (messageUpdate) {
            // Final message update
            if (messageUpdate) {
                this._append(messageUpdate);
            }

            // Perform concrete-hasher logic
            var hash = this._doFinalize();

            return hash;
        },

        blockSize: 512/32,

        /**
         * Creates a shortcut function to a hasher's object interface.
         *
         * @param {Hasher} hasher The hasher to create a helper for.
         *
         * @return {Function} The shortcut function.
         *
         * @static
         *
         * @example
         *
         *     var SHA256 = CryptoJS.lib.Hasher._createHelper(CryptoJS.algo.SHA256);
         */
        _createHelper: function (hasher) {
            return function (message, cfg) {
                return new hasher.init(cfg).finalize(message);
            };
        },

        /**
         * Creates a shortcut function to the HMAC's object interface.
         *
         * @param {Hasher} hasher The hasher to use in this HMAC helper.
         *
         * @return {Function} The shortcut function.
         *
         * @static
         *
         * @example
         *
         *     var HmacSHA256 = CryptoJS.lib.Hasher._createHmacHelper(CryptoJS.algo.SHA256);
         */
        _createHmacHelper: function (hasher) {
            return function (message, key) {
                return new C_algo.HMAC.init(hasher, key).finalize(message);
            };
        }
    });

    /**
     * Algorithm namespace.
     */
    var C_algo = C.algo = {};

    return C;
}(Math));

/*
Copyright (c) 2011, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.com/yui/license.html
version: 2.9.0
*/
/**
 * The YAHOO object is the single global object used by YUI Library.  It
 * contains utility function for setting up namespaces, inheritance, and
 * logging.  YAHOO.util, YAHOO.widget, and YAHOO.example are namespaces
 * created automatically for and used by the library.
 * @module yahoo
 * @title  YAHOO Global
 */

/**
 * YAHOO_config is not included as part of the library.  Instead it is an
 * object that can be defined by the implementer immediately before
 * including the YUI library.  The properties included in this object
 * will be used to configure global properties needed as soon as the
 * library begins to load.
 * @class YAHOO_config
 * @static
 */

/**
 * A reference to a function that will be executed every time a YAHOO module
 * is loaded.  As parameter, this function will receive the version
 * information for the module. See <a href="YAHOO.env.html#getVersion">
 * YAHOO.env.getVersion</a> for the description of the version data structure.
 * @property listener
 * @type Function
 * @static
 * @default undefined
 */

/**
 * Set to true if the library will be dynamically loaded after window.onload.
 * Defaults to false
 * @property injecting
 * @type boolean
 * @static
 * @default undefined
 */

/**
 * Instructs the yuiloader component to dynamically load yui components and
 * their dependencies.  See the yuiloader documentation for more information
 * about dynamic loading
 * @property load
 * @static
 * @default undefined
 * @see yuiloader
 */

/**
 * Forces the use of the supplied locale where applicable in the library
 * @property locale
 * @type string
 * @static
 * @default undefined
 */

if (typeof YAHOO == "undefined" || !YAHOO) {
    /**
     * The YAHOO global namespace object.  If YAHOO is already defined, the
     * existing YAHOO object will not be overwritten so that defined
     * namespaces are preserved.
     * @class YAHOO
     * @static
     */
    var YAHOO = {};
}

/**
 * Returns the namespace specified and creates it if it doesn't exist
 * <pre>
 * YAHOO.namespace("property.package");
 * YAHOO.namespace("YAHOO.property.package");
 * </pre>
 * Either of the above would create YAHOO.property, then
 * YAHOO.property.package
 *
 * Be careful when naming packages. Reserved words may work in some browsers
 * and not others. For instance, the following will fail in Safari:
 * <pre>
 * YAHOO.namespace("really.long.nested.namespace");
 * </pre>
 * This fails because "long" is a future reserved word in ECMAScript
 *
 * For implementation code that uses YUI, do not create your components
 * in the namespaces defined by YUI (
 * <code>YAHOO.util</code>,
 * <code>YAHOO.widget</code>,
 * <code>YAHOO.lang</code>,
 * <code>YAHOO.tool</code>,
 * <code>YAHOO.example</code>,
 * <code>YAHOO.env</code>) -- create your own namespace (e.g., 'companyname').
 *
 * @method namespace
 * @static
 * @param  {String*} arguments 1-n namespaces to create
 * @return {Object}  A reference to the last namespace object created
 */
YAHOO.namespace = function() {
    var a=arguments, o=null, i, j, d;
    for (i=0; i<a.length; i=i+1) {
        d=(""+a[i]).split(".");
        o=YAHOO;

        // YAHOO is implied, so it is ignored if it is included
        for (j=(d[0] == "YAHOO") ? 1 : 0; j<d.length; j=j+1) {
            o[d[j]]=o[d[j]] || {};
            o=o[d[j]];
        }
    }

    return o;
};

/**
 * Uses YAHOO.widget.Logger to output a log message, if the widget is
 * available.
 * Note: LogReader adds the message, category, and source to the DOM as HTML.
 *
 * @method log
 * @static
 * @param  {HTML}  msg  The message to log.
 * @param  {HTML}  cat  The log category for the message.  Default
 *                        categories are "info", "warn", "error", time".
 *                        Custom categories can be used as well. (opt)
 * @param  {HTML}  src  The source of the the message (opt)
 * @return {Boolean}      True if the log operation was successful.
 */
YAHOO.log = function(msg, cat, src) {
    var l=YAHOO.widget.Logger;
    if(l && l.log) {
        return l.log(msg, cat, src);
    } else {
        return false;
    }
};

/**
 * Registers a module with the YAHOO object
 * @method register
 * @static
 * @param {String}   name    the name of the module (event, slider, etc)
 * @param {Function} mainClass a reference to class in the module.  This
 *                             class will be tagged with the version info
 *                             so that it will be possible to identify the
 *                             version that is in use when multiple versions
 *                             have loaded
 * @param {Object}   data      metadata object for the module.  Currently it
 *                             is expected to contain a "version" property
 *                             and a "build" property at minimum.
 */
YAHOO.register = function(name, mainClass, data) {
    var mods = YAHOO.env.modules, m, v, b, ls, i;

    if (!mods[name]) {
        mods[name] = {
            versions:[],
            builds:[]
        };
    }

    m  = mods[name];
    v  = data.version;
    b  = data.build;
    ls = YAHOO.env.listeners;

    m.name = name;
    m.version = v;
    m.build = b;
    m.versions.push(v);
    m.builds.push(b);
    m.mainClass = mainClass;

    // fire the module load listeners
    for (i=0;i<ls.length;i=i+1) {
        ls[i](m);
    }
    // label the main class
    if (mainClass) {
        mainClass.VERSION = v;
        mainClass.BUILD = b;
    } else {
        YAHOO.log("mainClass is undefined for module " + name, "warn");
    }
};

/**
 * YAHOO.env is used to keep track of what is known about the YUI library and
 * the browsing environment
 * @class YAHOO.env
 * @static
 */
YAHOO.env = YAHOO.env || {

    /**
     * Keeps the version info for all YUI modules that have reported themselves
     * @property modules
     * @type Object[]
     */
    modules: [],

    /**
     * List of functions that should be executed every time a YUI module
     * reports itself.
     * @property listeners
     * @type Function[]
     */
    listeners: []
};

/**
 * Returns the version data for the specified module:
 *      <dl>
 *      <dt>name:</dt>      <dd>The name of the module</dd>
 *      <dt>version:</dt>   <dd>The version in use</dd>
 *      <dt>build:</dt>     <dd>The build number in use</dd>
 *      <dt>versions:</dt>  <dd>All versions that were registered</dd>
 *      <dt>builds:</dt>    <dd>All builds that were registered.</dd>
 *      <dt>mainClass:</dt> <dd>An object that was was stamped with the
 *                 current version and build. If
 *                 mainClass.VERSION != version or mainClass.BUILD != build,
 *                 multiple versions of pieces of the library have been
 *                 loaded, potentially causing issues.</dd>
 *       </dl>
 *
 * @method getVersion
 * @static
 * @param {String}  name the name of the module (event, slider, etc)
 * @return {Object} The version info
 */
YAHOO.env.getVersion = function(name) {
    return YAHOO.env.modules[name] || null;
};

/**
 * Do not fork for a browser if it can be avoided.  Use feature detection when
 * you can.  Use the user agent as a last resort.  YAHOO.env.ua stores a version
 * number for the browser engine, 0 otherwise.  This value may or may not map
 * to the version number of the browser using the engine.  The value is
 * presented as a float so that it can easily be used for boolean evaluation
 * as well as for looking for a particular range of versions.  Because of this,
 * some of the granularity of the version info may be lost (e.g., Gecko 1.8.0.9
 * reports 1.8).
 * @class YAHOO.env.ua
 * @static
 */

/**
 * parses a user agent string (or looks for one in navigator to parse if
 * not supplied).
 * @method parseUA
 * @since 2.9.0
 * @static
 */
YAHOO.env.parseUA = function(agent) {

        var numberify = function(s) {
            var c = 0;
            return parseFloat(s.replace(/\./g, function() {
                return (c++ == 1) ? '' : '.';
            }));
        },

        nav = navigator,

        o = {

        /**
         * Internet Explorer version number or 0.  Example: 6
         * @property ie
         * @type float
         * @static
         */
        ie: 0,

        /**
         * Opera version number or 0.  Example: 9.2
         * @property opera
         * @type float
         * @static
         */
        opera: 0,

        /**
         * Gecko engine revision number.  Will evaluate to 1 if Gecko
         * is detected but the revision could not be found. Other browsers
         * will be 0.  Example: 1.8
         * <pre>
         * Firefox 1.0.0.4: 1.7.8   <-- Reports 1.7
         * Firefox 1.5.0.9: 1.8.0.9 <-- 1.8
         * Firefox 2.0.0.3: 1.8.1.3 <-- 1.81
         * Firefox 3.0   <-- 1.9
         * Firefox 3.5   <-- 1.91
         * </pre>
         * @property gecko
         * @type float
         * @static
         */
        gecko: 0,

        /**
         * AppleWebKit version.  KHTML browsers that are not WebKit browsers
         * will evaluate to 1, other browsers 0.  Example: 418.9
         * <pre>
         * Safari 1.3.2 (312.6): 312.8.1 <-- Reports 312.8 -- currently the
         *                                   latest available for Mac OSX 10.3.
         * Safari 2.0.2:         416     <-- hasOwnProperty introduced
         * Safari 2.0.4:         418     <-- preventDefault fixed
         * Safari 2.0.4 (419.3): 418.9.1 <-- One version of Safari may run
         *                                   different versions of webkit
         * Safari 2.0.4 (419.3): 419     <-- Tiger installations that have been
         *                                   updated, but not updated
         *                                   to the latest patch.
         * Webkit 212 nightly:   522+    <-- Safari 3.0 precursor (with native
         * SVG and many major issues fixed).
         * Safari 3.0.4 (523.12) 523.12  <-- First Tiger release - automatic
         * update from 2.x via the 10.4.11 OS patch.
         * Webkit nightly 1/2008:525+    <-- Supports DOMContentLoaded event.
         *                                   yahoo.com user agent hack removed.
         * </pre>
         * http://en.wikipedia.org/wiki/Safari_version_history
         * @property webkit
         * @type float
         * @static
         */
        webkit: 0,

        /**
         * Chrome will be detected as webkit, but this property will also
         * be populated with the Chrome version number
         * @property chrome
         * @type float
         * @static
         */
        chrome: 0,

        /**
         * The mobile property will be set to a string containing any relevant
         * user agent information when a modern mobile browser is detected.
         * Currently limited to Safari on the iPhone/iPod Touch, Nokia N-series
         * devices with the WebKit-based browser, and Opera Mini.
         * @property mobile
         * @type string
         * @static
         */
        mobile: null,

        /**
         * Adobe AIR version number or 0.  Only populated if webkit is detected.
         * Example: 1.0
         * @property air
         * @type float
         */
        air: 0,
        /**
         * Detects Apple iPad's OS version
         * @property ipad
         * @type float
         * @static
         */
        ipad: 0,
        /**
         * Detects Apple iPhone's OS version
         * @property iphone
         * @type float
         * @static
         */
        iphone: 0,
        /**
         * Detects Apples iPod's OS version
         * @property ipod
         * @type float
         * @static
         */
        ipod: 0,
        /**
         * General truthy check for iPad, iPhone or iPod
         * @property ios
         * @type float
         * @static
         */
        ios: null,
        /**
         * Detects Googles Android OS version
         * @property android
         * @type float
         * @static
         */
        android: 0,
        /**
         * Detects Palms WebOS version
         * @property webos
         * @type float
         * @static
         */
        webos: 0,

        /**
         * Google Caja version number or 0.
         * @property caja
         * @type float
         */
        caja: nav && nav.cajaVersion,

        /**
         * Set to true if the page appears to be in SSL
         * @property secure
         * @type boolean
         * @static
         */
        secure: false,

        /**
         * The operating system.  Currently only detecting windows or macintosh
         * @property os
         * @type string
         * @static
         */
        os: null

    },

    ua = agent || (navigator && navigator.userAgent),

    loc = window && window.location,

    href = loc && loc.href,

    m;

    o.secure = href && (href.toLowerCase().indexOf("https") === 0);

    if (ua) {

        if ((/windows|win32/i).test(ua)) {
            o.os = 'windows';
        } else if ((/macintosh/i).test(ua)) {
            o.os = 'macintosh';
        } else if ((/rhino/i).test(ua)) {
            o.os = 'rhino';
        }

        // Modern KHTML browsers should qualify as Safari X-Grade
        if ((/KHTML/).test(ua)) {
            o.webkit = 1;
        }
        // Modern WebKit browsers are at least X-Grade
        m = ua.match(/AppleWebKit\/([^\s]*)/);
        if (m && m[1]) {
            o.webkit = numberify(m[1]);

            // Mobile browser check
            if (/ Mobile\//.test(ua)) {
                o.mobile = 'Apple'; // iPhone or iPod Touch

                m = ua.match(/OS ([^\s]*)/);
                if (m && m[1]) {
                    m = numberify(m[1].replace('_', '.'));
                }
                o.ios = m;
                o.ipad = o.ipod = o.iphone = 0;

                m = ua.match(/iPad|iPod|iPhone/);
                if (m && m[0]) {
                    o[m[0].toLowerCase()] = o.ios;
                }
            } else {
                m = ua.match(/NokiaN[^\/]*|Android \d\.\d|webOS\/\d\.\d/);
                if (m) {
                    // Nokia N-series, Android, webOS, ex: NokiaN95
                    o.mobile = m[0];
                }
                if (/webOS/.test(ua)) {
                    o.mobile = 'WebOS';
                    m = ua.match(/webOS\/([^\s]*);/);
                    if (m && m[1]) {
                        o.webos = numberify(m[1]);
                    }
                }
                if (/ Android/.test(ua)) {
                    o.mobile = 'Android';
                    m = ua.match(/Android ([^\s]*);/);
                    if (m && m[1]) {
                        o.android = numberify(m[1]);
                    }

                }
            }

            m = ua.match(/Chrome\/([^\s]*)/);
            if (m && m[1]) {
                o.chrome = numberify(m[1]); // Chrome
            } else {
                m = ua.match(/AdobeAIR\/([^\s]*)/);
                if (m) {
                    o.air = m[0]; // Adobe AIR 1.0 or better
                }
            }
        }

        if (!o.webkit) { // not webkit
// @todo check Opera/8.01 (J2ME/MIDP; Opera Mini/2.0.4509/1316; fi; U; ssr)
            m = ua.match(/Opera[\s\/]([^\s]*)/);
            if (m && m[1]) {
                o.opera = numberify(m[1]);
                m = ua.match(/Version\/([^\s]*)/);
                if (m && m[1]) {
                    o.opera = numberify(m[1]); // opera 10+
                }
                m = ua.match(/Opera Mini[^;]*/);
                if (m) {
                    o.mobile = m[0]; // ex: Opera Mini/2.0.4509/1316
                }
            } else { // not opera or webkit
                m = ua.match(/MSIE\s([^;]*)/);
                if (m && m[1]) {
                    o.ie = numberify(m[1]);
                } else { // not opera, webkit, or ie
                    m = ua.match(/Gecko\/([^\s]*)/);
                    if (m) {
                        o.gecko = 1; // Gecko detected, look for revision
                        m = ua.match(/rv:([^\s\)]*)/);
                        if (m && m[1]) {
                            o.gecko = numberify(m[1]);
                        }
                    }
                }
            }
        }
    }

    return o;
};

YAHOO.env.ua = YAHOO.env.parseUA();

/*
 * Initializes the global by creating the default namespaces and applying
 * any new configuration information that is detected.  This is the setup
 * for env.
 * @method init
 * @static
 * @private
 */
(function() {
    YAHOO.namespace("util", "widget", "example");
    /*global YAHOO_config*/
    if ("undefined" !== typeof YAHOO_config) {
        var l=YAHOO_config.listener, ls=YAHOO.env.listeners,unique=true, i;
        if (l) {
            // if YAHOO is loaded multiple times we need to check to see if
            // this is a new config object.  If it is, add the new component
            // load listener to the stack
            for (i=0; i<ls.length; i++) {
                if (ls[i] == l) {
                    unique = false;
                    break;
                }
            }

            if (unique) {
                ls.push(l);
            }
        }
    }
})();
/**
 * Provides the language utilites and extensions used by the library
 * @class YAHOO.lang
 */
YAHOO.lang = YAHOO.lang || {};

(function() {


var L = YAHOO.lang,

    OP = Object.prototype,
    ARRAY_TOSTRING = '[object Array]',
    FUNCTION_TOSTRING = '[object Function]',
    OBJECT_TOSTRING = '[object Object]',
    NOTHING = [],

    HTML_CHARS = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
        '`': '&#x60;'
    },

    // ADD = ["toString", "valueOf", "hasOwnProperty"],
    ADD = ["toString", "valueOf"],

    OB = {

    /**
     * Determines wheather or not the provided object is an array.
     * @method isArray
     * @param {any} o The object being testing
     * @return {boolean} the result
     */
    isArray: function(o) {
        return OP.toString.apply(o) === ARRAY_TOSTRING;
    },

    /**
     * Determines whether or not the provided object is a boolean
     * @method isBoolean
     * @param {any} o The object being testing
     * @return {boolean} the result
     */
    isBoolean: function(o) {
        return typeof o === 'boolean';
    },

    /**
     * Determines whether or not the provided object is a function.
     * Note: Internet Explorer thinks certain functions are objects:
     *
     * var obj = document.createElement("object");
     * YAHOO.lang.isFunction(obj.getAttribute) // reports false in IE
     *
     * var input = document.createElement("input"); // append to body
     * YAHOO.lang.isFunction(input.focus) // reports false in IE
     *
     * You will have to implement additional tests if these functions
     * matter to you.
     *
     * @method isFunction
     * @param {any} o The object being testing
     * @return {boolean} the result
     */
    isFunction: function(o) {
        return (typeof o === 'function') || OP.toString.apply(o) === FUNCTION_TOSTRING;
    },

    /**
     * Determines whether or not the provided object is null
     * @method isNull
     * @param {any} o The object being testing
     * @return {boolean} the result
     */
    isNull: function(o) {
        return o === null;
    },

    /**
     * Determines whether or not the provided object is a legal number
     * @method isNumber
     * @param {any} o The object being testing
     * @return {boolean} the result
     */
    isNumber: function(o) {
        return typeof o === 'number' && isFinite(o);
    },

    /**
     * Determines whether or not the provided object is of type object
     * or function
     * @method isObject
     * @param {any} o The object being testing
     * @return {boolean} the result
     */
    isObject: function(o) {
return (o && (typeof o === 'object' || L.isFunction(o))) || false;
    },

    /**
     * Determines whether or not the provided object is a string
     * @method isString
     * @param {any} o The object being testing
     * @return {boolean} the result
     */
    isString: function(o) {
        return typeof o === 'string';
    },

    /**
     * Determines whether or not the provided object is undefined
     * @method isUndefined
     * @param {any} o The object being testing
     * @return {boolean} the result
     */
    isUndefined: function(o) {
        return typeof o === 'undefined';
    },


    /**
     * IE will not enumerate native functions in a derived object even if the
     * function was overridden.  This is a workaround for specific functions
     * we care about on the Object prototype.
     * @property _IEEnumFix
     * @param {Function} r  the object to receive the augmentation
     * @param {Function} s  the object that supplies the properties to augment
     * @static
     * @private
     */
    _IEEnumFix: (YAHOO.env.ua.ie) ? function(r, s) {
            var i, fname, f;
            for (i=0;i<ADD.length;i=i+1) {

                fname = ADD[i];
                f = s[fname];

                if (L.isFunction(f) && f!=OP[fname]) {
                    r[fname]=f;
                }
            }
    } : function(){},

    /**
     * <p>
     * Returns a copy of the specified string with special HTML characters
     * escaped. The following characters will be converted to their
     * corresponding character entities:
     * <code>&amp; &lt; &gt; &quot; &#x27; &#x2F; &#x60;</code>
     * </p>
     *
     * <p>
     * This implementation is based on the
     * <a href="http://www.owasp.org/index.php/XSS_(Cross_Site_Scripting)_Prevention_Cheat_Sheet">OWASP
     * HTML escaping recommendations</a>. In addition to the characters
     * in the OWASP recommendation, we also escape the <code>&#x60;</code>
     * character, since IE interprets it as an attribute delimiter when used in
     * innerHTML.
     * </p>
     *
     * @method escapeHTML
     * @param {String} html String to escape.
     * @return {String} Escaped string.
     * @static
     * @since 2.9.0
     */
    escapeHTML: function (html) {
        return html.replace(/[&<>"'\/`]/g, function (match) {
            return HTML_CHARS[match];
        });
    },

    /**
     * Utility to set up the prototype, constructor and superclass properties to
     * support an inheritance strategy that can chain constructors and methods.
     * Static members will not be inherited.
     *
     * @method extend
     * @static
     * @param {Function} subc   the object to modify
     * @param {Function} superc the object to inherit
     * @param {Object} overrides  additional properties/methods to add to the
     *                              subclass prototype.  These will override the
     *                              matching items obtained from the superclass
     *                              if present.
     */
    extend: function(subc, superc, overrides) {
        if (!superc||!subc) {
            throw new Error("extend failed, please check that " +
                            "all dependencies are included.");
        }
        var F = function() {}, i;
        F.prototype=superc.prototype;
        subc.prototype=new F();
        subc.prototype.constructor=subc;
        subc.superclass=superc.prototype;
        if (superc.prototype.constructor == OP.constructor) {
            superc.prototype.constructor=superc;
        }

        if (overrides) {
            for (i in overrides) {
                if (L.hasOwnProperty(overrides, i)) {
                    subc.prototype[i]=overrides[i];
                }
            }

            L._IEEnumFix(subc.prototype, overrides);
        }
    },

    /**
     * Applies all properties in the supplier to the receiver if the
     * receiver does not have these properties yet.  Optionally, one or
     * more methods/properties can be specified (as additional
     * parameters).  This option will overwrite the property if receiver
     * has it already.  If true is passed as the third parameter, all
     * properties will be applied and _will_ overwrite properties in
     * the receiver.
     *
     * @method augmentObject
     * @static
     * @since 2.3.0
     * @param {Function} r  the object to receive the augmentation
     * @param {Function} s  the object that supplies the properties to augment
     * @param {String*|boolean}  arguments zero or more properties methods
     *        to augment the receiver with.  If none specified, everything
     *        in the supplier will be used unless it would
     *        overwrite an existing property in the receiver. If true
     *        is specified as the third parameter, all properties will
     *        be applied and will overwrite an existing property in
     *        the receiver
     */
    augmentObject: function(r, s) {
        if (!s||!r) {
            throw new Error("Absorb failed, verify dependencies.");
        }
        var a=arguments, i, p, overrideList=a[2];
        if (overrideList && overrideList!==true) { // only absorb the specified properties
            for (i=2; i<a.length; i=i+1) {
                r[a[i]] = s[a[i]];
            }
        } else { // take everything, overwriting only if the third parameter is true
            for (p in s) {
                if (overrideList || !(p in r)) {
                    r[p] = s[p];
                }
            }

            L._IEEnumFix(r, s);
        }

        return r;
    },

    /**
     * Same as YAHOO.lang.augmentObject, except it only applies prototype properties
     * @see YAHOO.lang.augmentObject
     * @method augmentProto
     * @static
     * @param {Function} r  the object to receive the augmentation
     * @param {Function} s  the object that supplies the properties to augment
     * @param {String*|boolean}  arguments zero or more properties methods
     *        to augment the receiver with.  If none specified, everything
     *        in the supplier will be used unless it would overwrite an existing
     *        property in the receiver.  if true is specified as the third
     *        parameter, all properties will be applied and will overwrite an
     *        existing property in the receiver
     */
    augmentProto: function(r, s) {
        if (!s||!r) {
            throw new Error("Augment failed, verify dependencies.");
        }
        //var a=[].concat(arguments);
        var a=[r.prototype,s.prototype], i;
        for (i=2;i<arguments.length;i=i+1) {
            a.push(arguments[i]);
        }
        L.augmentObject.apply(this, a);

        return r;
    },


    /**
     * Returns a simple string representation of the object or array.
     * Other types of objects will be returned unprocessed.  Arrays
     * are expected to be indexed.  Use object notation for
     * associative arrays.
     * @method dump
     * @since 2.3.0
     * @param o {Object} The object to dump
     * @param d {int} How deep to recurse child objects, default 3
     * @return {String} the dump result
     */
    dump: function(o, d) {
        var i,len,s=[],OBJ="{...}",FUN="f(){...}",
            COMMA=', ', ARROW=' => ';

        // Cast non-objects to string
        // Skip dates because the std toString is what we want
        // Skip HTMLElement-like objects because trying to dump
        // an element will cause an unhandled exception in FF 2.x
        if (!L.isObject(o)) {
            return o + "";
        } else if (o instanceof Date || ("nodeType" in o && "tagName" in o)) {
            return o;
        } else if  (L.isFunction(o)) {
            return FUN;
        }

        // dig into child objects the depth specifed. Default 3
        d = (L.isNumber(d)) ? d : 3;

        // arrays [1, 2, 3]
        if (L.isArray(o)) {
            s.push("[");
            for (i=0,len=o.length;i<len;i=i+1) {
                if (L.isObject(o[i])) {
                    s.push((d > 0) ? L.dump(o[i], d-1) : OBJ);
                } else {
                    s.push(o[i]);
                }
                s.push(COMMA);
            }
            if (s.length > 1) {
                s.pop();
            }
            s.push("]");
        // objects {k1 => v1, k2 => v2}
        } else {
            s.push("{");
            for (i in o) {
                if (L.hasOwnProperty(o, i)) {
                    s.push(i + ARROW);
                    if (L.isObject(o[i])) {
                        s.push((d > 0) ? L.dump(o[i], d-1) : OBJ);
                    } else {
                        s.push(o[i]);
                    }
                    s.push(COMMA);
                }
            }
            if (s.length > 1) {
                s.pop();
            }
            s.push("}");
        }

        return s.join("");
    },

    /**
     * Does variable substitution on a string. It scans through the string
     * looking for expressions enclosed in { } braces. If an expression
     * is found, it is used a key on the object.  If there is a space in
     * the key, the first word is used for the key and the rest is provided
     * to an optional function to be used to programatically determine the
     * value (the extra information might be used for this decision). If
     * the value for the key in the object, or what is returned from the
     * function has a string value, number value, or object value, it is
     * substituted for the bracket expression and it repeats.  If this
     * value is an object, it uses the Object's toString() if this has
     * been overridden, otherwise it does a shallow dump of the key/value
     * pairs.
     *
     * By specifying the recurse option, the string is rescanned after
     * every replacement, allowing for nested template substitutions.
     * The side effect of this option is that curly braces in the
     * replacement content must be encoded.
     *
     * @method substitute
     * @since 2.3.0
     * @param s {String} The string that will be modified.
     * @param o {Object} An object containing the replacement values
     * @param f {Function} An optional function that can be used to
     *                     process each match.  It receives the key,
     *                     value, and any extra metadata included with
     *                     the key inside of the braces.
     * @param recurse {boolean} default true - if not false, the replaced
     * string will be rescanned so that nested substitutions are possible.
     * @return {String} the substituted string
     */
    substitute: function (s, o, f, recurse) {
        var i, j, k, key, v, meta, saved=[], token, lidx=s.length,
            DUMP='dump', SPACE=' ', LBRACE='{', RBRACE='}',
            dump, objstr;

        for (;;) {
            i = s.lastIndexOf(LBRACE, lidx);
            if (i < 0) {
                break;
            }
            j = s.indexOf(RBRACE, i);
            if (i + 1 > j) {
                break;
            }

            //Extract key and meta info
            token = s.substring(i + 1, j);
            key = token;
            meta = null;
            k = key.indexOf(SPACE);
            if (k > -1) {
                meta = key.substring(k + 1);
                key = key.substring(0, k);
            }

            // lookup the value
            v = o[key];

            // if a substitution function was provided, execute it
            if (f) {
                v = f(key, v, meta);
            }

            if (L.isObject(v)) {
                if (L.isArray(v)) {
                    v = L.dump(v, parseInt(meta, 10));
                } else {
                    meta = meta || "";

                    // look for the keyword 'dump', if found force obj dump
                    dump = meta.indexOf(DUMP);
                    if (dump > -1) {
                        meta = meta.substring(4);
                    }

                    objstr = v.toString();

                    // use the toString if it is not the Object toString
                    // and the 'dump' meta info was not found
                    if (objstr === OBJECT_TOSTRING || dump > -1) {
                        v = L.dump(v, parseInt(meta, 10));
                    } else {
                        v = objstr;
                    }
                }
            } else if (!L.isString(v) && !L.isNumber(v)) {
                // This {block} has no replace string. Save it for later.
                v = "~-" + saved.length + "-~";
                saved[saved.length] = token;

                // break;
            }

            s = s.substring(0, i) + v + s.substring(j + 1);

            if (recurse === false) {
                lidx = i-1;
            }

        }

        // restore saved {block}s
        for (i=saved.length-1; i>=0; i=i-1) {
            s = s.replace(new RegExp("~-" + i + "-~"), "{"  + saved[i] + "}", "g");
        }

        return s;
    },


    /**
     * Returns a string without any leading or trailing whitespace.  If
     * the input is not a string, the input will be returned untouched.
     * @method trim
     * @since 2.3.0
     * @param s {string} the string to trim
     * @return {string} the trimmed string
     */
    trim: function(s){
        try {
            return s.replace(/^\s+|\s+$/g, "");
        } catch(e) {
            return s;
        }
    },

    /**
     * Returns a new object containing all of the properties of
     * all the supplied objects.  The properties from later objects
     * will overwrite those in earlier objects.
     * @method merge
     * @since 2.3.0
     * @param arguments {Object*} the objects to merge
     * @return the new merged object
     */
    merge: function() {
        var o={}, a=arguments, l=a.length, i;
        for (i=0; i<l; i=i+1) {
            L.augmentObject(o, a[i], true);
        }
        return o;
    },

    /**
     * Executes the supplied function in the context of the supplied
     * object 'when' milliseconds later.  Executes the function a
     * single time unless periodic is set to true.
     * @method later
     * @since 2.4.0
     * @param when {int} the number of milliseconds to wait until the fn
     * is executed
     * @param o the context object
     * @param fn {Function|String} the function to execute or the name of
     * the method in the 'o' object to execute
     * @param data [Array] data that is provided to the function.  This accepts
     * either a single item or an array.  If an array is provided, the
     * function is executed with one parameter for each array item.  If
     * you need to pass a single array parameter, it needs to be wrapped in
     * an array [myarray]
     * @param periodic {boolean} if true, executes continuously at supplied
     * interval until canceled
     * @return a timer object. Call the cancel() method on this object to
     * stop the timer.
     */
    later: function(when, o, fn, data, periodic) {
        when = when || 0;
        o = o || {};
        var m=fn, d=data, f, r;

        if (L.isString(fn)) {
            m = o[fn];
        }

        if (!m) {
            throw new TypeError("method undefined");
        }

        if (!L.isUndefined(data) && !L.isArray(d)) {
            d = [data];
        }

        f = function() {
            m.apply(o, d || NOTHING);
        };

        r = (periodic) ? setInterval(f, when) : setTimeout(f, when);

        return {
            interval: periodic,
            cancel: function() {
                if (this.interval) {
                    clearInterval(r);
                } else {
                    clearTimeout(r);
                }
            }
        };
    },

    /**
     * A convenience method for detecting a legitimate non-null value.
     * Returns false for null/undefined/NaN, true for other values,
     * including 0/false/''
     * @method isValue
     * @since 2.3.0
     * @param o {any} the item to test
     * @return {boolean} true if it is not null/undefined/NaN || false
     */
    isValue: function(o) {
        // return (o || o === false || o === 0 || o === ''); // Infinity fails
return (L.isObject(o) || L.isString(o) || L.isNumber(o) || L.isBoolean(o));
    }

};

/**
 * Determines whether or not the property was added
 * to the object instance.  Returns false if the property is not present
 * in the object, or was inherited from the prototype.
 * This abstraction is provided to enable hasOwnProperty for Safari 1.3.x.
 * There is a discrepancy between YAHOO.lang.hasOwnProperty and
 * Object.prototype.hasOwnProperty when the property is a primitive added to
 * both the instance AND prototype with the same value:
 * <pre>
 * var A = function() {};
 * A.prototype.foo = 'foo';
 * var a = new A();
 * a.foo = 'foo';
 * alert(a.hasOwnProperty('foo')); // true
 * alert(YAHOO.lang.hasOwnProperty(a, 'foo')); // false when using fallback
 * </pre>
 * @method hasOwnProperty
 * @param {any} o The object being testing
 * @param prop {string} the name of the property to test
 * @return {boolean} the result
 */
L.hasOwnProperty = (OP.hasOwnProperty) ?
    function(o, prop) {
        return o && o.hasOwnProperty && o.hasOwnProperty(prop);
    } : function(o, prop) {
        return !L.isUndefined(o[prop]) &&
                o.constructor.prototype[prop] !== o[prop];
    };

// new lang wins
OB.augmentObject(L, OB, true);

/*
 * An alias for <a href="YAHOO.lang.html">YAHOO.lang</a>
 * @class YAHOO.util.Lang
 */
YAHOO.util.Lang = L;

/**
 * Same as YAHOO.lang.augmentObject, except it only applies prototype
 * properties.  This is an alias for augmentProto.
 * @see YAHOO.lang.augmentObject
 * @method augment
 * @static
 * @param {Function} r  the object to receive the augmentation
 * @param {Function} s  the object that supplies the properties to augment
 * @param {String*|boolean}  arguments zero or more properties methods to
 *        augment the receiver with.  If none specified, everything
 *        in the supplier will be used unless it would
 *        overwrite an existing property in the receiver.  if true
 *        is specified as the third parameter, all properties will
 *        be applied and will overwrite an existing property in
 *        the receiver
 */
L.augment = L.augmentProto;

/**
 * An alias for <a href="YAHOO.lang.html#augment">YAHOO.lang.augment</a>
 * @for YAHOO
 * @method augment
 * @static
 * @param {Function} r  the object to receive the augmentation
 * @param {Function} s  the object that supplies the properties to augment
 * @param {String*}  arguments zero or more properties methods to
 *        augment the receiver with.  If none specified, everything
 *        in the supplier will be used unless it would
 *        overwrite an existing property in the receiver
 */
YAHOO.augment = L.augmentProto;

/**
 * An alias for <a href="YAHOO.lang.html#extend">YAHOO.lang.extend</a>
 * @method extend
 * @static
 * @param {Function} subc   the object to modify
 * @param {Function} superc the object to inherit
 * @param {Object} overrides  additional properties/methods to add to the
 *        subclass prototype.  These will override the
 *        matching items obtained from the superclass if present.
 */
YAHOO.extend = L.extend;

})();
YAHOO.register("yahoo", YAHOO, {version: "2.9.0", build: "2800"});

/*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
 */
// Copyright (c) 2005  Tom Wu
// All Rights Reserved.
// See "LICENSE" for details.

// Basic JavaScript BN library - subset useful for RSA encryption.

// Bits per digit
var dbits;

// JavaScript engine analysis
var canary = 0xdeadbeefcafe;
var j_lm = ((canary&0xffffff)==0xefcafe);

// (public) Constructor
function BigInteger(a,b,c) {
  if(a != null)
    if("number" == typeof a) this.fromNumber(a,b,c);
    else if(b == null && "string" != typeof a) this.fromString(a,256);
    else this.fromString(a,b);
}

// return new, unset BigInteger
function nbi() { return new BigInteger(null); }

// am: Compute w_j += (x*this_i), propagate carries,
// c is initial carry, returns final carry.
// c < 3*dvalue, x < 2*dvalue, this_i < dvalue
// We need to select the fastest one that works in this environment.

// am1: use a single mult and divide to get the high bits,
// max digit bits should be 26 because
// max internal value = 2*dvalue^2-2*dvalue (< 2^53)
function am1(i,x,w,j,c,n) {
  while(--n >= 0) {
    var v = x*this[i++]+w[j]+c;
    c = Math.floor(v/0x4000000);
    w[j++] = v&0x3ffffff;
  }
  return c;
}
// am2 avoids a big mult-and-extract completely.
// Max digit bits should be <= 30 because we do bitwise ops
// on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
function am2(i,x,w,j,c,n) {
  var xl = x&0x7fff, xh = x>>15;
  while(--n >= 0) {
    var l = this[i]&0x7fff;
    var h = this[i++]>>15;
    var m = xh*l+h*xl;
    l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
    c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
    w[j++] = l&0x3fffffff;
  }
  return c;
}
// Alternately, set max digit bits to 28 since some
// browsers slow down when dealing with 32-bit numbers.
function am3(i,x,w,j,c,n) {
  var xl = x&0x3fff, xh = x>>14;
  while(--n >= 0) {
    var l = this[i]&0x3fff;
    var h = this[i++]>>14;
    var m = xh*l+h*xl;
    l = xl*l+((m&0x3fff)<<14)+w[j]+c;
    c = (l>>28)+(m>>14)+xh*h;
    w[j++] = l&0xfffffff;
  }
  return c;
}
if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
  BigInteger.prototype.am = am2;
  dbits = 30;
}
else if(j_lm && (navigator.appName != "Netscape")) {
  BigInteger.prototype.am = am1;
  dbits = 26;
}
else { // Mozilla/Netscape seems to prefer am3
  BigInteger.prototype.am = am3;
  dbits = 28;
}

BigInteger.prototype.DB = dbits;
BigInteger.prototype.DM = ((1<<dbits)-1);
BigInteger.prototype.DV = (1<<dbits);

var BI_FP = 52;
BigInteger.prototype.FV = Math.pow(2,BI_FP);
BigInteger.prototype.F1 = BI_FP-dbits;
BigInteger.prototype.F2 = 2*dbits-BI_FP;

// Digit conversions
var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
var BI_RC = new Array();
var rr,vv;
rr = "0".charCodeAt(0);
for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
rr = "a".charCodeAt(0);
for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
rr = "A".charCodeAt(0);
for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

function int2char(n) { return BI_RM.charAt(n); }
function intAt(s,i) {
  var c = BI_RC[s.charCodeAt(i)];
  return (c==null)?-1:c;
}

// (protected) copy this to r
function bnpCopyTo(r) {
  for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
  r.t = this.t;
  r.s = this.s;
}

// (protected) set from integer value x, -DV <= x < DV
function bnpFromInt(x) {
  this.t = 1;
  this.s = (x<0)?-1:0;
  if(x > 0) this[0] = x;
  else if(x < -1) this[0] = x+this.DV;
  else this.t = 0;
}

// return bigint initialized to value
function nbv(i) { var r = nbi(); r.fromInt(i); return r; }

// (protected) set from string and radix
function bnpFromString(s,b) {
  var k;
  if(b == 16) k = 4;
  else if(b == 8) k = 3;
  else if(b == 256) k = 8; // byte array
  else if(b == 2) k = 1;
  else if(b == 32) k = 5;
  else if(b == 4) k = 2;
  else { this.fromRadix(s,b); return; }
  this.t = 0;
  this.s = 0;
  var i = s.length, mi = false, sh = 0;
  while(--i >= 0) {
    var x = (k==8)?s[i]&0xff:intAt(s,i);
    if(x < 0) {
      if(s.charAt(i) == "-") mi = true;
      continue;
    }
    mi = false;
    if(sh == 0)
      this[this.t++] = x;
    else if(sh+k > this.DB) {
      this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
      this[this.t++] = (x>>(this.DB-sh));
    }
    else
      this[this.t-1] |= x<<sh;
    sh += k;
    if(sh >= this.DB) sh -= this.DB;
  }
  if(k == 8 && (s[0]&0x80) != 0) {
    this.s = -1;
    if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
  }
  this.clamp();
  if(mi) BigInteger.ZERO.subTo(this,this);
}

// (protected) clamp off excess high words
function bnpClamp() {
  var c = this.s&this.DM;
  while(this.t > 0 && this[this.t-1] == c) --this.t;
}

// (public) return string representation in given radix
function bnToString(b) {
  if(this.s < 0) return "-"+this.negate().toString(b);
  var k;
  if(b == 16) k = 4;
  else if(b == 8) k = 3;
  else if(b == 2) k = 1;
  else if(b == 32) k = 5;
  else if(b == 4) k = 2;
  else return this.toRadix(b);
  var km = (1<<k)-1, d, m = false, r = "", i = this.t;
  var p = this.DB-(i*this.DB)%k;
  if(i-- > 0) {
    if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
    while(i >= 0) {
      if(p < k) {
        d = (this[i]&((1<<p)-1))<<(k-p);
        d |= this[--i]>>(p+=this.DB-k);
      }
      else {
        d = (this[i]>>(p-=k))&km;
        if(p <= 0) { p += this.DB; --i; }
      }
      if(d > 0) m = true;
      if(m) r += int2char(d);
    }
  }
  return m?r:"0";
}

// (public) -this
function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }

// (public) |this|
function bnAbs() { return (this.s<0)?this.negate():this; }

// (public) return + if this > a, - if this < a, 0 if equal
function bnCompareTo(a) {
  var r = this.s-a.s;
  if(r != 0) return r;
  var i = this.t;
  r = i-a.t;
  if(r != 0) return (this.s<0)?-r:r;
  while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
  return 0;
}

// returns bit length of the integer x
function nbits(x) {
  var r = 1, t;
  if((t=x>>>16) != 0) { x = t; r += 16; }
  if((t=x>>8) != 0) { x = t; r += 8; }
  if((t=x>>4) != 0) { x = t; r += 4; }
  if((t=x>>2) != 0) { x = t; r += 2; }
  if((t=x>>1) != 0) { x = t; r += 1; }
  return r;
}

// (public) return the number of bits in "this"
function bnBitLength() {
  if(this.t <= 0) return 0;
  return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
}

// (protected) r = this << n*DB
function bnpDLShiftTo(n,r) {
  var i;
  for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
  for(i = n-1; i >= 0; --i) r[i] = 0;
  r.t = this.t+n;
  r.s = this.s;
}

// (protected) r = this >> n*DB
function bnpDRShiftTo(n,r) {
  for(var i = n; i < this.t; ++i) r[i-n] = this[i];
  r.t = Math.max(this.t-n,0);
  r.s = this.s;
}

// (protected) r = this << n
function bnpLShiftTo(n,r) {
  var bs = n%this.DB;
  var cbs = this.DB-bs;
  var bm = (1<<cbs)-1;
  var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
  for(i = this.t-1; i >= 0; --i) {
    r[i+ds+1] = (this[i]>>cbs)|c;
    c = (this[i]&bm)<<bs;
  }
  for(i = ds-1; i >= 0; --i) r[i] = 0;
  r[ds] = c;
  r.t = this.t+ds+1;
  r.s = this.s;
  r.clamp();
}

// (protected) r = this >> n
function bnpRShiftTo(n,r) {
  r.s = this.s;
  var ds = Math.floor(n/this.DB);
  if(ds >= this.t) { r.t = 0; return; }
  var bs = n%this.DB;
  var cbs = this.DB-bs;
  var bm = (1<<bs)-1;
  r[0] = this[ds]>>bs;
  for(var i = ds+1; i < this.t; ++i) {
    r[i-ds-1] |= (this[i]&bm)<<cbs;
    r[i-ds] = this[i]>>bs;
  }
  if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
  r.t = this.t-ds;
  r.clamp();
}

// (protected) r = this - a
function bnpSubTo(a,r) {
  var i = 0, c = 0, m = Math.min(a.t,this.t);
  while(i < m) {
    c += this[i]-a[i];
    r[i++] = c&this.DM;
    c >>= this.DB;
  }
  if(a.t < this.t) {
    c -= a.s;
    while(i < this.t) {
      c += this[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    c += this.s;
  }
  else {
    c += this.s;
    while(i < a.t) {
      c -= a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    c -= a.s;
  }
  r.s = (c<0)?-1:0;
  if(c < -1) r[i++] = this.DV+c;
  else if(c > 0) r[i++] = c;
  r.t = i;
  r.clamp();
}

// (protected) r = this * a, r != this,a (HAC 14.12)
// "this" should be the larger one if appropriate.
function bnpMultiplyTo(a,r) {
  var x = this.abs(), y = a.abs();
  var i = x.t;
  r.t = i+y.t;
  while(--i >= 0) r[i] = 0;
  for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
  r.s = 0;
  r.clamp();
  if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
}

// (protected) r = this^2, r != this (HAC 14.16)
function bnpSquareTo(r) {
  var x = this.abs();
  var i = r.t = 2*x.t;
  while(--i >= 0) r[i] = 0;
  for(i = 0; i < x.t-1; ++i) {
    var c = x.am(i,x[i],r,2*i,0,1);
    if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
      r[i+x.t] -= x.DV;
      r[i+x.t+1] = 1;
    }
  }
  if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
  r.s = 0;
  r.clamp();
}

// (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
// r != q, this != m.  q or r may be null.
function bnpDivRemTo(m,q,r) {
  var pm = m.abs();
  if(pm.t <= 0) return;
  var pt = this.abs();
  if(pt.t < pm.t) {
    if(q != null) q.fromInt(0);
    if(r != null) this.copyTo(r);
    return;
  }
  if(r == null) r = nbi();
  var y = nbi(), ts = this.s, ms = m.s;
  var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
  if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
  else { pm.copyTo(y); pt.copyTo(r); }
  var ys = y.t;
  var y0 = y[ys-1];
  if(y0 == 0) return;
  var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
  var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
  var i = r.t, j = i-ys, t = (q==null)?nbi():q;
  y.dlShiftTo(j,t);
  if(r.compareTo(t) >= 0) {
    r[r.t++] = 1;
    r.subTo(t,r);
  }
  BigInteger.ONE.dlShiftTo(ys,t);
  t.subTo(y,y);	// "negative" y so we can replace sub with am later
  while(y.t < ys) y[y.t++] = 0;
  while(--j >= 0) {
    // Estimate quotient digit
    var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
    if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
      y.dlShiftTo(j,t);
      r.subTo(t,r);
      while(r[i] < --qd) r.subTo(t,r);
    }
  }
  if(q != null) {
    r.drShiftTo(ys,q);
    if(ts != ms) BigInteger.ZERO.subTo(q,q);
  }
  r.t = ys;
  r.clamp();
  if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
  if(ts < 0) BigInteger.ZERO.subTo(r,r);
}

// (public) this mod a
function bnMod(a) {
  var r = nbi();
  this.abs().divRemTo(a,null,r);
  if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
  return r;
}

// Modular reduction using "classic" algorithm
function Classic(m) { this.m = m; }
function cConvert(x) {
  if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
  else return x;
}
function cRevert(x) { return x; }
function cReduce(x) { x.divRemTo(this.m,null,x); }
function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

Classic.prototype.convert = cConvert;
Classic.prototype.revert = cRevert;
Classic.prototype.reduce = cReduce;
Classic.prototype.mulTo = cMulTo;
Classic.prototype.sqrTo = cSqrTo;

// (protected) return "-1/this % 2^DB"; useful for Mont. reduction
// justification:
//         xy == 1 (mod m)
//         xy =  1+km
//   xy(2-xy) = (1+km)(1-km)
// x[y(2-xy)] = 1-k^2m^2
// x[y(2-xy)] == 1 (mod m^2)
// if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
// should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
// JS multiply "overflows" differently from C/C++, so care is needed here.
function bnpInvDigit() {
  if(this.t < 1) return 0;
  var x = this[0];
  if((x&1) == 0) return 0;
  var y = x&3;		// y == 1/x mod 2^2
  y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
  y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
  y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
  // last step - calculate inverse mod DV directly;
  // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
  y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
  // we really want the negative inverse, and -DV < y < DV
  return (y>0)?this.DV-y:-y;
}

// Montgomery reduction
function Montgomery(m) {
  this.m = m;
  this.mp = m.invDigit();
  this.mpl = this.mp&0x7fff;
  this.mph = this.mp>>15;
  this.um = (1<<(m.DB-15))-1;
  this.mt2 = 2*m.t;
}

// xR mod m
function montConvert(x) {
  var r = nbi();
  x.abs().dlShiftTo(this.m.t,r);
  r.divRemTo(this.m,null,r);
  if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
  return r;
}

// x/R mod m
function montRevert(x) {
  var r = nbi();
  x.copyTo(r);
  this.reduce(r);
  return r;
}

// x = x/R mod m (HAC 14.32)
function montReduce(x) {
  while(x.t <= this.mt2)	// pad x so am has enough room later
    x[x.t++] = 0;
  for(var i = 0; i < this.m.t; ++i) {
    // faster way of calculating u0 = x[i]*mp mod DV
    var j = x[i]&0x7fff;
    var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
    // use am to combine the multiply-shift-add into one call
    j = i+this.m.t;
    x[j] += this.m.am(0,u0,x,i,0,this.m.t);
    // propagate carry
    while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
  }
  x.clamp();
  x.drShiftTo(this.m.t,x);
  if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
}

// r = "x^2/R mod m"; x != r
function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

// r = "xy/R mod m"; x,y != r
function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

Montgomery.prototype.convert = montConvert;
Montgomery.prototype.revert = montRevert;
Montgomery.prototype.reduce = montReduce;
Montgomery.prototype.mulTo = montMulTo;
Montgomery.prototype.sqrTo = montSqrTo;

// (protected) true iff this is even
function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }

// (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
function bnpExp(e,z) {
  if(e > 0xffffffff || e < 1) return BigInteger.ONE;
  var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
  g.copyTo(r);
  while(--i >= 0) {
    z.sqrTo(r,r2);
    if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
    else { var t = r; r = r2; r2 = t; }
  }
  return z.revert(r);
}

// (public) this^e % m, 0 <= e < 2^32
function bnModPowInt(e,m) {
  var z;
  if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
  return this.exp(e,z);
}

// protected
BigInteger.prototype.copyTo = bnpCopyTo;
BigInteger.prototype.fromInt = bnpFromInt;
BigInteger.prototype.fromString = bnpFromString;
BigInteger.prototype.clamp = bnpClamp;
BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
BigInteger.prototype.drShiftTo = bnpDRShiftTo;
BigInteger.prototype.lShiftTo = bnpLShiftTo;
BigInteger.prototype.rShiftTo = bnpRShiftTo;
BigInteger.prototype.subTo = bnpSubTo;
BigInteger.prototype.multiplyTo = bnpMultiplyTo;
BigInteger.prototype.squareTo = bnpSquareTo;
BigInteger.prototype.divRemTo = bnpDivRemTo;
BigInteger.prototype.invDigit = bnpInvDigit;
BigInteger.prototype.isEven = bnpIsEven;
BigInteger.prototype.exp = bnpExp;

// public
BigInteger.prototype.toString = bnToString;
BigInteger.prototype.negate = bnNegate;
BigInteger.prototype.abs = bnAbs;
BigInteger.prototype.compareTo = bnCompareTo;
BigInteger.prototype.bitLength = bnBitLength;
BigInteger.prototype.mod = bnMod;
BigInteger.prototype.modPowInt = bnModPowInt;

// "constants"
BigInteger.ZERO = nbv(0);
BigInteger.ONE = nbv(1);

/*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
 */
// Copyright (c) 2005-2009  Tom Wu
// All Rights Reserved.
// See "LICENSE" for details.

// Extended JavaScript BN functions, required for RSA private ops.

// Version 1.1: new BigInteger("0", 10) returns "proper" zero
// Version 1.2: square() API, isProbablePrime fix

// (public)
function bnClone() { var r = nbi(); this.copyTo(r); return r; }

// (public) return value as integer
function bnIntValue() {
  if(this.s < 0) {
    if(this.t == 1) return this[0]-this.DV;
    else if(this.t == 0) return -1;
  }
  else if(this.t == 1) return this[0];
  else if(this.t == 0) return 0;
  // assumes 16 < DB < 32
  return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
}

// (public) return value as byte
function bnByteValue() { return (this.t==0)?this.s:(this[0]<<24)>>24; }

// (public) return value as short (assumes DB>=16)
function bnShortValue() { return (this.t==0)?this.s:(this[0]<<16)>>16; }

// (protected) return x s.t. r^x < DV
function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }

// (public) 0 if this == 0, 1 if this > 0
function bnSigNum() {
  if(this.s < 0) return -1;
  else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
  else return 1;
}

// (protected) convert to radix string
function bnpToRadix(b) {
  if(b == null) b = 10;
  if(this.signum() == 0 || b < 2 || b > 36) return "0";
  var cs = this.chunkSize(b);
  var a = Math.pow(b,cs);
  var d = nbv(a), y = nbi(), z = nbi(), r = "";
  this.divRemTo(d,y,z);
  while(y.signum() > 0) {
    r = (a+z.intValue()).toString(b).substr(1) + r;
    y.divRemTo(d,y,z);
  }
  return z.intValue().toString(b) + r;
}

// (protected) convert from radix string
function bnpFromRadix(s,b) {
  this.fromInt(0);
  if(b == null) b = 10;
  var cs = this.chunkSize(b);
  var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
  for(var i = 0; i < s.length; ++i) {
    var x = intAt(s,i);
    if(x < 0) {
      if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
      continue;
    }
    w = b*w+x;
    if(++j >= cs) {
      this.dMultiply(d);
      this.dAddOffset(w,0);
      j = 0;
      w = 0;
    }
  }
  if(j > 0) {
    this.dMultiply(Math.pow(b,j));
    this.dAddOffset(w,0);
  }
  if(mi) BigInteger.ZERO.subTo(this,this);
}

// (protected) alternate constructor
function bnpFromNumber(a,b,c) {
  if("number" == typeof b) {
    // new BigInteger(int,int,RNG)
    if(a < 2) this.fromInt(1);
    else {
      this.fromNumber(a,c);
      if(!this.testBit(a-1))	// force MSB set
        this.bitwiseTo(BigInteger.ONE.shiftLeft(a-1),op_or,this);
      if(this.isEven()) this.dAddOffset(1,0); // force odd
      while(!this.isProbablePrime(b)) {
        this.dAddOffset(2,0);
        if(this.bitLength() > a) this.subTo(BigInteger.ONE.shiftLeft(a-1),this);
      }
    }
  }
  else {
    // new BigInteger(int,RNG)
    var x = new Array(), t = a&7;
    x.length = (a>>3)+1;
    b.nextBytes(x);
    if(t > 0) x[0] &= ((1<<t)-1); else x[0] = 0;
    this.fromString(x,256);
  }
}

// (public) convert to bigendian byte array
function bnToByteArray() {
  var i = this.t, r = new Array();
  r[0] = this.s;
  var p = this.DB-(i*this.DB)%8, d, k = 0;
  if(i-- > 0) {
    if(p < this.DB && (d = this[i]>>p) != (this.s&this.DM)>>p)
      r[k++] = d|(this.s<<(this.DB-p));
    while(i >= 0) {
      if(p < 8) {
        d = (this[i]&((1<<p)-1))<<(8-p);
        d |= this[--i]>>(p+=this.DB-8);
      }
      else {
        d = (this[i]>>(p-=8))&0xff;
        if(p <= 0) { p += this.DB; --i; }
      }
      if((d&0x80) != 0) d |= -256;
      if(k == 0 && (this.s&0x80) != (d&0x80)) ++k;
      if(k > 0 || d != this.s) r[k++] = d;
    }
  }
  return r;
}

function bnEquals(a) { return(this.compareTo(a)==0); }
function bnMin(a) { return(this.compareTo(a)<0)?this:a; }
function bnMax(a) { return(this.compareTo(a)>0)?this:a; }

// (protected) r = this op a (bitwise)
function bnpBitwiseTo(a,op,r) {
  var i, f, m = Math.min(a.t,this.t);
  for(i = 0; i < m; ++i) r[i] = op(this[i],a[i]);
  if(a.t < this.t) {
    f = a.s&this.DM;
    for(i = m; i < this.t; ++i) r[i] = op(this[i],f);
    r.t = this.t;
  }
  else {
    f = this.s&this.DM;
    for(i = m; i < a.t; ++i) r[i] = op(f,a[i]);
    r.t = a.t;
  }
  r.s = op(this.s,a.s);
  r.clamp();
}

// (public) this & a
function op_and(x,y) { return x&y; }
function bnAnd(a) { var r = nbi(); this.bitwiseTo(a,op_and,r); return r; }

// (public) this | a
function op_or(x,y) { return x|y; }
function bnOr(a) { var r = nbi(); this.bitwiseTo(a,op_or,r); return r; }

// (public) this ^ a
function op_xor(x,y) { return x^y; }
function bnXor(a) { var r = nbi(); this.bitwiseTo(a,op_xor,r); return r; }

// (public) this & ~a
function op_andnot(x,y) { return x&~y; }
function bnAndNot(a) { var r = nbi(); this.bitwiseTo(a,op_andnot,r); return r; }

// (public) ~this
function bnNot() {
  var r = nbi();
  for(var i = 0; i < this.t; ++i) r[i] = this.DM&~this[i];
  r.t = this.t;
  r.s = ~this.s;
  return r;
}

// (public) this << n
function bnShiftLeft(n) {
  var r = nbi();
  if(n < 0) this.rShiftTo(-n,r); else this.lShiftTo(n,r);
  return r;
}

// (public) this >> n
function bnShiftRight(n) {
  var r = nbi();
  if(n < 0) this.lShiftTo(-n,r); else this.rShiftTo(n,r);
  return r;
}

// return index of lowest 1-bit in x, x < 2^31
function lbit(x) {
  if(x == 0) return -1;
  var r = 0;
  if((x&0xffff) == 0) { x >>= 16; r += 16; }
  if((x&0xff) == 0) { x >>= 8; r += 8; }
  if((x&0xf) == 0) { x >>= 4; r += 4; }
  if((x&3) == 0) { x >>= 2; r += 2; }
  if((x&1) == 0) ++r;
  return r;
}

// (public) returns index of lowest 1-bit (or -1 if none)
function bnGetLowestSetBit() {
  for(var i = 0; i < this.t; ++i)
    if(this[i] != 0) return i*this.DB+lbit(this[i]);
  if(this.s < 0) return this.t*this.DB;
  return -1;
}

// return number of 1 bits in x
function cbit(x) {
  var r = 0;
  while(x != 0) { x &= x-1; ++r; }
  return r;
}

// (public) return number of set bits
function bnBitCount() {
  var r = 0, x = this.s&this.DM;
  for(var i = 0; i < this.t; ++i) r += cbit(this[i]^x);
  return r;
}

// (public) true iff nth bit is set
function bnTestBit(n) {
  var j = Math.floor(n/this.DB);
  if(j >= this.t) return(this.s!=0);
  return((this[j]&(1<<(n%this.DB)))!=0);
}

// (protected) this op (1<<n)
function bnpChangeBit(n,op) {
  var r = BigInteger.ONE.shiftLeft(n);
  this.bitwiseTo(r,op,r);
  return r;
}

// (public) this | (1<<n)
function bnSetBit(n) { return this.changeBit(n,op_or); }

// (public) this & ~(1<<n)
function bnClearBit(n) { return this.changeBit(n,op_andnot); }

// (public) this ^ (1<<n)
function bnFlipBit(n) { return this.changeBit(n,op_xor); }

// (protected) r = this + a
function bnpAddTo(a,r) {
  var i = 0, c = 0, m = Math.min(a.t,this.t);
  while(i < m) {
    c += this[i]+a[i];
    r[i++] = c&this.DM;
    c >>= this.DB;
  }
  if(a.t < this.t) {
    c += a.s;
    while(i < this.t) {
      c += this[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    c += this.s;
  }
  else {
    c += this.s;
    while(i < a.t) {
      c += a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    c += a.s;
  }
  r.s = (c<0)?-1:0;
  if(c > 0) r[i++] = c;
  else if(c < -1) r[i++] = this.DV+c;
  r.t = i;
  r.clamp();
}

// (public) this + a
function bnAdd(a) { var r = nbi(); this.addTo(a,r); return r; }

// (public) this - a
function bnSubtract(a) { var r = nbi(); this.subTo(a,r); return r; }

// (public) this * a
function bnMultiply(a) { var r = nbi(); this.multiplyTo(a,r); return r; }

// (public) this^2
function bnSquare() { var r = nbi(); this.squareTo(r); return r; }

// (public) this / a
function bnDivide(a) { var r = nbi(); this.divRemTo(a,r,null); return r; }

// (public) this % a
function bnRemainder(a) { var r = nbi(); this.divRemTo(a,null,r); return r; }

// (public) [this/a,this%a]
function bnDivideAndRemainder(a) {
  var q = nbi(), r = nbi();
  this.divRemTo(a,q,r);
  return new Array(q,r);
}

// (protected) this *= n, this >= 0, 1 < n < DV
function bnpDMultiply(n) {
  this[this.t] = this.am(0,n-1,this,0,0,this.t);
  ++this.t;
  this.clamp();
}

// (protected) this += n << w words, this >= 0
function bnpDAddOffset(n,w) {
  if(n == 0) return;
  while(this.t <= w) this[this.t++] = 0;
  this[w] += n;
  while(this[w] >= this.DV) {
    this[w] -= this.DV;
    if(++w >= this.t) this[this.t++] = 0;
    ++this[w];
  }
}

// A "null" reducer
function NullExp() {}
function nNop(x) { return x; }
function nMulTo(x,y,r) { x.multiplyTo(y,r); }
function nSqrTo(x,r) { x.squareTo(r); }

NullExp.prototype.convert = nNop;
NullExp.prototype.revert = nNop;
NullExp.prototype.mulTo = nMulTo;
NullExp.prototype.sqrTo = nSqrTo;

// (public) this^e
function bnPow(e) { return this.exp(e,new NullExp()); }

// (protected) r = lower n words of "this * a", a.t <= n
// "this" should be the larger one if appropriate.
function bnpMultiplyLowerTo(a,n,r) {
  var i = Math.min(this.t+a.t,n);
  r.s = 0; // assumes a,this >= 0
  r.t = i;
  while(i > 0) r[--i] = 0;
  var j;
  for(j = r.t-this.t; i < j; ++i) r[i+this.t] = this.am(0,a[i],r,i,0,this.t);
  for(j = Math.min(a.t,n); i < j; ++i) this.am(0,a[i],r,i,0,n-i);
  r.clamp();
}

// (protected) r = "this * a" without lower n words, n > 0
// "this" should be the larger one if appropriate.
function bnpMultiplyUpperTo(a,n,r) {
  --n;
  var i = r.t = this.t+a.t-n;
  r.s = 0; // assumes a,this >= 0
  while(--i >= 0) r[i] = 0;
  for(i = Math.max(n-this.t,0); i < a.t; ++i)
    r[this.t+i-n] = this.am(n-i,a[i],r,0,0,this.t+i-n);
  r.clamp();
  r.drShiftTo(1,r);
}

// Barrett modular reduction
function Barrett(m) {
  // setup Barrett
  this.r2 = nbi();
  this.q3 = nbi();
  BigInteger.ONE.dlShiftTo(2*m.t,this.r2);
  this.mu = this.r2.divide(m);
  this.m = m;
}

function barrettConvert(x) {
  if(x.s < 0 || x.t > 2*this.m.t) return x.mod(this.m);
  else if(x.compareTo(this.m) < 0) return x;
  else { var r = nbi(); x.copyTo(r); this.reduce(r); return r; }
}

function barrettRevert(x) { return x; }

// x = x mod m (HAC 14.42)
function barrettReduce(x) {
  x.drShiftTo(this.m.t-1,this.r2);
  if(x.t > this.m.t+1) { x.t = this.m.t+1; x.clamp(); }
  this.mu.multiplyUpperTo(this.r2,this.m.t+1,this.q3);
  this.m.multiplyLowerTo(this.q3,this.m.t+1,this.r2);
  while(x.compareTo(this.r2) < 0) x.dAddOffset(1,this.m.t+1);
  x.subTo(this.r2,x);
  while(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
}

// r = x^2 mod m; x != r
function barrettSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

// r = x*y mod m; x,y != r
function barrettMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

Barrett.prototype.convert = barrettConvert;
Barrett.prototype.revert = barrettRevert;
Barrett.prototype.reduce = barrettReduce;
Barrett.prototype.mulTo = barrettMulTo;
Barrett.prototype.sqrTo = barrettSqrTo;

// (public) this^e % m (HAC 14.85)
function bnModPow(e,m) {
  var i = e.bitLength(), k, r = nbv(1), z;
  if(i <= 0) return r;
  else if(i < 18) k = 1;
  else if(i < 48) k = 3;
  else if(i < 144) k = 4;
  else if(i < 768) k = 5;
  else k = 6;
  if(i < 8)
    z = new Classic(m);
  else if(m.isEven())
    z = new Barrett(m);
  else
    z = new Montgomery(m);

  // precomputation
  var g = new Array(), n = 3, k1 = k-1, km = (1<<k)-1;
  g[1] = z.convert(this);
  if(k > 1) {
    var g2 = nbi();
    z.sqrTo(g[1],g2);
    while(n <= km) {
      g[n] = nbi();
      z.mulTo(g2,g[n-2],g[n]);
      n += 2;
    }
  }

  var j = e.t-1, w, is1 = true, r2 = nbi(), t;
  i = nbits(e[j])-1;
  while(j >= 0) {
    if(i >= k1) w = (e[j]>>(i-k1))&km;
    else {
      w = (e[j]&((1<<(i+1))-1))<<(k1-i);
      if(j > 0) w |= e[j-1]>>(this.DB+i-k1);
    }

    n = k;
    while((w&1) == 0) { w >>= 1; --n; }
    if((i -= n) < 0) { i += this.DB; --j; }
    if(is1) {	// ret == 1, don't bother squaring or multiplying it
      g[w].copyTo(r);
      is1 = false;
    }
    else {
      while(n > 1) { z.sqrTo(r,r2); z.sqrTo(r2,r); n -= 2; }
      if(n > 0) z.sqrTo(r,r2); else { t = r; r = r2; r2 = t; }
      z.mulTo(r2,g[w],r);
    }

    while(j >= 0 && (e[j]&(1<<i)) == 0) {
      z.sqrTo(r,r2); t = r; r = r2; r2 = t;
      if(--i < 0) { i = this.DB-1; --j; }
    }
  }
  return z.revert(r);
}

// (public) gcd(this,a) (HAC 14.54)
function bnGCD(a) {
  var x = (this.s<0)?this.negate():this.clone();
  var y = (a.s<0)?a.negate():a.clone();
  if(x.compareTo(y) < 0) { var t = x; x = y; y = t; }
  var i = x.getLowestSetBit(), g = y.getLowestSetBit();
  if(g < 0) return x;
  if(i < g) g = i;
  if(g > 0) {
    x.rShiftTo(g,x);
    y.rShiftTo(g,y);
  }
  while(x.signum() > 0) {
    if((i = x.getLowestSetBit()) > 0) x.rShiftTo(i,x);
    if((i = y.getLowestSetBit()) > 0) y.rShiftTo(i,y);
    if(x.compareTo(y) >= 0) {
      x.subTo(y,x);
      x.rShiftTo(1,x);
    }
    else {
      y.subTo(x,y);
      y.rShiftTo(1,y);
    }
  }
  if(g > 0) y.lShiftTo(g,y);
  return y;
}

// (protected) this % n, n < 2^26
function bnpModInt(n) {
  if(n <= 0) return 0;
  var d = this.DV%n, r = (this.s<0)?n-1:0;
  if(this.t > 0)
    if(d == 0) r = this[0]%n;
    else for(var i = this.t-1; i >= 0; --i) r = (d*r+this[i])%n;
  return r;
}

// (public) 1/this % m (HAC 14.61)
function bnModInverse(m) {
  var ac = m.isEven();
  if((this.isEven() && ac) || m.signum() == 0) return BigInteger.ZERO;
  var u = m.clone(), v = this.clone();
  var a = nbv(1), b = nbv(0), c = nbv(0), d = nbv(1);
  while(u.signum() != 0) {
    while(u.isEven()) {
      u.rShiftTo(1,u);
      if(ac) {
        if(!a.isEven() || !b.isEven()) { a.addTo(this,a); b.subTo(m,b); }
        a.rShiftTo(1,a);
      }
      else if(!b.isEven()) b.subTo(m,b);
      b.rShiftTo(1,b);
    }
    while(v.isEven()) {
      v.rShiftTo(1,v);
      if(ac) {
        if(!c.isEven() || !d.isEven()) { c.addTo(this,c); d.subTo(m,d); }
        c.rShiftTo(1,c);
      }
      else if(!d.isEven()) d.subTo(m,d);
      d.rShiftTo(1,d);
    }
    if(u.compareTo(v) >= 0) {
      u.subTo(v,u);
      if(ac) a.subTo(c,a);
      b.subTo(d,b);
    }
    else {
      v.subTo(u,v);
      if(ac) c.subTo(a,c);
      d.subTo(b,d);
    }
  }
  if(v.compareTo(BigInteger.ONE) != 0) return BigInteger.ZERO;
  if(d.compareTo(m) >= 0) return d.subtract(m);
  if(d.signum() < 0) d.addTo(m,d); else return d;
  if(d.signum() < 0) return d.add(m); else return d;
}

var lowprimes = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257,263,269,271,277,281,283,293,307,311,313,317,331,337,347,349,353,359,367,373,379,383,389,397,401,409,419,421,431,433,439,443,449,457,461,463,467,479,487,491,499,503,509,521,523,541,547,557,563,569,571,577,587,593,599,601,607,613,617,619,631,641,643,647,653,659,661,673,677,683,691,701,709,719,727,733,739,743,751,757,761,769,773,787,797,809,811,821,823,827,829,839,853,857,859,863,877,881,883,887,907,911,919,929,937,941,947,953,967,971,977,983,991,997];
var lplim = (1<<26)/lowprimes[lowprimes.length-1];

// (public) test primality with certainty >= 1-.5^t
function bnIsProbablePrime(t) {
  var i, x = this.abs();
  if(x.t == 1 && x[0] <= lowprimes[lowprimes.length-1]) {
    for(i = 0; i < lowprimes.length; ++i)
      if(x[0] == lowprimes[i]) return true;
    return false;
  }
  if(x.isEven()) return false;
  i = 1;
  while(i < lowprimes.length) {
    var m = lowprimes[i], j = i+1;
    while(j < lowprimes.length && m < lplim) m *= lowprimes[j++];
    m = x.modInt(m);
    while(i < j) if(m%lowprimes[i++] == 0) return false;
  }
  return x.millerRabin(t);
}

// (protected) true if probably prime (HAC 4.24, Miller-Rabin)
function bnpMillerRabin(t) {
  var n1 = this.subtract(BigInteger.ONE);
  var k = n1.getLowestSetBit();
  if(k <= 0) return false;
  var r = n1.shiftRight(k);
  t = (t+1)>>1;
  if(t > lowprimes.length) t = lowprimes.length;
  var a = nbi();
  for(var i = 0; i < t; ++i) {
    //Pick bases at random, instead of starting at 2
    a.fromInt(lowprimes[Math.floor(Math.random()*lowprimes.length)]);
    var y = a.modPow(r,this);
    if(y.compareTo(BigInteger.ONE) != 0 && y.compareTo(n1) != 0) {
      var j = 1;
      while(j++ < k && y.compareTo(n1) != 0) {
        y = y.modPowInt(2,this);
        if(y.compareTo(BigInteger.ONE) == 0) return false;
      }
      if(y.compareTo(n1) != 0) return false;
    }
  }
  return true;
}

// protected
BigInteger.prototype.chunkSize = bnpChunkSize;
BigInteger.prototype.toRadix = bnpToRadix;
BigInteger.prototype.fromRadix = bnpFromRadix;
BigInteger.prototype.fromNumber = bnpFromNumber;
BigInteger.prototype.bitwiseTo = bnpBitwiseTo;
BigInteger.prototype.changeBit = bnpChangeBit;
BigInteger.prototype.addTo = bnpAddTo;
BigInteger.prototype.dMultiply = bnpDMultiply;
BigInteger.prototype.dAddOffset = bnpDAddOffset;
BigInteger.prototype.multiplyLowerTo = bnpMultiplyLowerTo;
BigInteger.prototype.multiplyUpperTo = bnpMultiplyUpperTo;
BigInteger.prototype.modInt = bnpModInt;
BigInteger.prototype.millerRabin = bnpMillerRabin;

// public
BigInteger.prototype.clone = bnClone;
BigInteger.prototype.intValue = bnIntValue;
BigInteger.prototype.byteValue = bnByteValue;
BigInteger.prototype.shortValue = bnShortValue;
BigInteger.prototype.signum = bnSigNum;
BigInteger.prototype.toByteArray = bnToByteArray;
BigInteger.prototype.equals = bnEquals;
BigInteger.prototype.min = bnMin;
BigInteger.prototype.max = bnMax;
BigInteger.prototype.and = bnAnd;
BigInteger.prototype.or = bnOr;
BigInteger.prototype.xor = bnXor;
BigInteger.prototype.andNot = bnAndNot;
BigInteger.prototype.not = bnNot;
BigInteger.prototype.shiftLeft = bnShiftLeft;
BigInteger.prototype.shiftRight = bnShiftRight;
BigInteger.prototype.getLowestSetBit = bnGetLowestSetBit;
BigInteger.prototype.bitCount = bnBitCount;
BigInteger.prototype.testBit = bnTestBit;
BigInteger.prototype.setBit = bnSetBit;
BigInteger.prototype.clearBit = bnClearBit;
BigInteger.prototype.flipBit = bnFlipBit;
BigInteger.prototype.add = bnAdd;
BigInteger.prototype.subtract = bnSubtract;
BigInteger.prototype.multiply = bnMultiply;
BigInteger.prototype.divide = bnDivide;
BigInteger.prototype.remainder = bnRemainder;
BigInteger.prototype.divideAndRemainder = bnDivideAndRemainder;
BigInteger.prototype.modPow = bnModPow;
BigInteger.prototype.modInverse = bnModInverse;
BigInteger.prototype.pow = bnPow;
BigInteger.prototype.gcd = bnGCD;
BigInteger.prototype.isProbablePrime = bnIsProbablePrime;

// JSBN-specific extension
BigInteger.prototype.square = bnSquare;

// BigInteger interfaces not implemented in jsbn:

// BigInteger(int signum, byte[] magnitude)
// double doubleValue()
// float floatValue()
// int hashCode()
// long longValue()
// static BigInteger valueOf(long val)

/*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
 */
// prng4.js - uses Arcfour as a PRNG

function Arcfour() {
  this.i = 0;
  this.j = 0;
  this.S = new Array();
}

// Initialize arcfour context from key, an array of ints, each from [0..255]
function ARC4init(key) {
  var i, j, t;
  for(i = 0; i < 256; ++i)
    this.S[i] = i;
  j = 0;
  for(i = 0; i < 256; ++i) {
    j = (j + this.S[i] + key[i % key.length]) & 255;
    t = this.S[i];
    this.S[i] = this.S[j];
    this.S[j] = t;
  }
  this.i = 0;
  this.j = 0;
}

function ARC4next() {
  var t;
  this.i = (this.i + 1) & 255;
  this.j = (this.j + this.S[this.i]) & 255;
  t = this.S[this.i];
  this.S[this.i] = this.S[this.j];
  this.S[this.j] = t;
  return this.S[(t + this.S[this.i]) & 255];
}

Arcfour.prototype.init = ARC4init;
Arcfour.prototype.next = ARC4next;

// Plug in your RNG constructor here
function prng_newstate() {
  return new Arcfour();
}

// Pool size must be a multiple of 4 and greater than 32.
// An array of bytes the size of the pool will be passed to init()
var rng_psize = 256;

/*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
 */
// Random number generator - requires a PRNG backend, e.g. prng4.js

// For best results, put code like
// <body onClick='rng_seed_time();' onKeyPress='rng_seed_time();'>
// in your main HTML document.

var rng_state;
var rng_pool;
var rng_pptr;

// Mix in a 32-bit integer into the pool
function rng_seed_int(x) {
  rng_pool[rng_pptr++] ^= x & 255;
  rng_pool[rng_pptr++] ^= (x >> 8) & 255;
  rng_pool[rng_pptr++] ^= (x >> 16) & 255;
  rng_pool[rng_pptr++] ^= (x >> 24) & 255;
  if(rng_pptr >= rng_psize) rng_pptr -= rng_psize;
}

// Mix in the current time (w/milliseconds) into the pool
function rng_seed_time() {
  rng_seed_int(new Date().getTime());
}

// Initialize the pool with junk if needed.
if(rng_pool == null) {
  rng_pool = new Array();
  rng_pptr = 0;
  var t;
  if(navigator.appName == "Netscape" && navigator.appVersion < "5" && window.crypto) {
    // Extract entropy (256 bits) from NS4 RNG if available
    var z = window.crypto.random(32);
    for(t = 0; t < z.length; ++t)
      rng_pool[rng_pptr++] = z.charCodeAt(t) & 255;
  }  
  while(rng_pptr < rng_psize) {  // extract some randomness from Math.random()
    t = Math.floor(65536 * Math.random());
    rng_pool[rng_pptr++] = t >>> 8;
    rng_pool[rng_pptr++] = t & 255;
  }
  rng_pptr = 0;
  rng_seed_time();
  //rng_seed_int(window.screenX);
  //rng_seed_int(window.screenY);
}

function rng_get_byte() {
  if(rng_state == null) {
    rng_seed_time();
    rng_state = prng_newstate();
    rng_state.init(rng_pool);
    for(rng_pptr = 0; rng_pptr < rng_pool.length; ++rng_pptr)
      rng_pool[rng_pptr] = 0;
    rng_pptr = 0;
    //rng_pool = null;
  }
  // TODO: allow reseeding after first request
  return rng_state.next();
}

function rng_get_bytes(ba) {
  var i;
  for(i = 0; i < ba.length; ++i) ba[i] = rng_get_byte();
}

function SecureRandom() {}

SecureRandom.prototype.nextBytes = rng_get_bytes;

/*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
 */
// Depends on jsbn.js and rng.js

// Version 1.1: support utf-8 encoding in pkcs1pad2

// convert a (hex) string to a bignum object
function parseBigInt(str,r) {
  return new BigInteger(str,r);
}

function linebrk(s,n) {
  var ret = "";
  var i = 0;
  while(i + n < s.length) {
    ret += s.substring(i,i+n) + "\n";
    i += n;
  }
  return ret + s.substring(i,s.length);
}

function byte2Hex(b) {
  if(b < 0x10)
    return "0" + b.toString(16);
  else
    return b.toString(16);
}

// PKCS#1 (type 2, random) pad input string s to n bytes, and return a bigint
function pkcs1pad2(s,n) {
  if(n < s.length + 11) { // TODO: fix for utf-8
    alert("Message too long for RSA");
    return null;
  }
  var ba = new Array();
  var i = s.length - 1;
  while(i >= 0 && n > 0) {
    var c = s.charCodeAt(i--);
    if(c < 128) { // encode using utf-8
      ba[--n] = c;
    }
    else if((c > 127) && (c < 2048)) {
      ba[--n] = (c & 63) | 128;
      ba[--n] = (c >> 6) | 192;
    }
    else {
      ba[--n] = (c & 63) | 128;
      ba[--n] = ((c >> 6) & 63) | 128;
      ba[--n] = (c >> 12) | 224;
    }
  }
  ba[--n] = 0;
  var rng = new SecureRandom();
  var x = new Array();
  while(n > 2) { // random non-zero pad
    x[0] = 0;
    while(x[0] == 0) rng.nextBytes(x);
    ba[--n] = x[0];
  }
  ba[--n] = 2;
  ba[--n] = 0;
  return new BigInteger(ba);
}

// PKCS#1 (OAEP) mask generation function
function oaep_mgf1_arr(seed, len, hash)
{
    var mask = '', i = 0;

    while (mask.length < len)
    {
        mask += hash(String.fromCharCode.apply(String, seed.concat([
                (i & 0xff000000) >> 24,
                (i & 0x00ff0000) >> 16,
                (i & 0x0000ff00) >> 8,
                i & 0x000000ff])));
        i += 1;
    }

    return mask;
}

var SHA1_SIZE = 20;

// PKCS#1 (OAEP) pad input string s to n bytes, and return a bigint
function oaep_pad(s, n, hash)
{
    if (s.length + 2 * SHA1_SIZE + 2 > n)
    {
        throw "Message too long for RSA";
    }

    var PS = '', i;

    for (i = 0; i < n - s.length - 2 * SHA1_SIZE - 2; i += 1)
    {
        PS += '\x00';
    }

    var DB = rstr_sha1('') + PS + '\x01' + s;
    var seed = new Array(SHA1_SIZE);
    new SecureRandom().nextBytes(seed);
    
    var dbMask = oaep_mgf1_arr(seed, DB.length, hash || rstr_sha1);
    var maskedDB = [];

    for (i = 0; i < DB.length; i += 1)
    {
        maskedDB[i] = DB.charCodeAt(i) ^ dbMask.charCodeAt(i);
    }

    var seedMask = oaep_mgf1_arr(maskedDB, seed.length, rstr_sha1);
    var maskedSeed = [0];

    for (i = 0; i < seed.length; i += 1)
    {
        maskedSeed[i + 1] = seed[i] ^ seedMask.charCodeAt(i);
    }

    return new BigInteger(maskedSeed.concat(maskedDB));
}

// "empty" RSA key constructor
function RSAKey() {
  this.n = null;
  this.e = 0;
  this.d = null;
  this.p = null;
  this.q = null;
  this.dmp1 = null;
  this.dmq1 = null;
  this.coeff = null;
}

// Set the public key fields N and e from hex strings
function RSASetPublic(N,E) {
  this.isPublic = true;
  if (typeof N !== "string") 
  {
    this.n = N;
    this.e = E;
  }
  else if(N != null && E != null && N.length > 0 && E.length > 0) {
    this.n = parseBigInt(N,16);
    this.e = parseInt(E,16);
  }
  else
    alert("Invalid RSA public key");
}

// Perform raw public operation on "x": return x^e (mod n)
function RSADoPublic(x) {
  return x.modPowInt(this.e, this.n);
}

// Return the PKCS#1 RSA encryption of "text" as an even-length hex string
function RSAEncrypt(text) {
  var m = pkcs1pad2(text,(this.n.bitLength()+7)>>3);
  if(m == null) return null;
  var c = this.doPublic(m);
  if(c == null) return null;
  var h = c.toString(16);
  if((h.length & 1) == 0) return h; else return "0" + h;
}

// Return the PKCS#1 OAEP RSA encryption of "text" as an even-length hex string
function RSAEncryptOAEP(text, hash) {
  var m = oaep_pad(text, (this.n.bitLength()+7)>>3, hash);
  if(m == null) return null;
  var c = this.doPublic(m);
  if(c == null) return null;
  var h = c.toString(16);
  if((h.length & 1) == 0) return h; else return "0" + h;
}

// Return the PKCS#1 RSA encryption of "text" as a Base64-encoded string
//function RSAEncryptB64(text) {
//  var h = this.encrypt(text);
//  if(h) return hex2b64(h); else return null;
//}

// protected
RSAKey.prototype.doPublic = RSADoPublic;

// public
RSAKey.prototype.setPublic = RSASetPublic;
RSAKey.prototype.encrypt = RSAEncrypt;
RSAKey.prototype.encryptOAEP = RSAEncryptOAEP;
//RSAKey.prototype.encrypt_b64 = RSAEncryptB64;

RSAKey.prototype.type = "RSA";

/*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
 */
// Depends on rsa.js and jsbn2.js

// Version 1.1: support utf-8 decoding in pkcs1unpad2

// Undo PKCS#1 (type 2, random) padding and, if valid, return the plaintext
function pkcs1unpad2(d,n) {
  var b = d.toByteArray();
  var i = 0;
  while(i < b.length && b[i] == 0) ++i;
  if(b.length-i != n-1 || b[i] != 2)
    return null;
  ++i;
  while(b[i] != 0)
    if(++i >= b.length) return null;
  var ret = "";
  while(++i < b.length) {
    var c = b[i] & 255;
    if(c < 128) { // utf-8 decode
      ret += String.fromCharCode(c);
    }
    else if((c > 191) && (c < 224)) {
      ret += String.fromCharCode(((c & 31) << 6) | (b[i+1] & 63));
      ++i;
    }
    else {
      ret += String.fromCharCode(((c & 15) << 12) | ((b[i+1] & 63) << 6) | (b[i+2] & 63));
      i += 2;
    }
  }
  return ret;
}

// PKCS#1 (OAEP) mask generation function
function oaep_mgf1_str(seed, len, hash)
{
    var mask = '', i = 0;

    while (mask.length < len)
    {
        mask += hash(seed + String.fromCharCode.apply(String, [
                (i & 0xff000000) >> 24,
                (i & 0x00ff0000) >> 16,
                (i & 0x0000ff00) >> 8,
                i & 0x000000ff]));
        i += 1;
    }

    return mask;
}

var SHA1_SIZE = 20;

// Undo PKCS#1 (OAEP) padding and, if valid, return the plaintext
function oaep_unpad(d, n, hash)
{
    d = d.toByteArray();

    var i;

    for (i = 0; i < d.length; i += 1)
    {
        d[i] &= 0xff;
    }

    while (d.length < n)
    {
        d.unshift(0);
    }

    d = String.fromCharCode.apply(String, d);

    if (d.length < 2 * SHA1_SIZE + 2)
    {
        throw "Cipher too short";
    }

    var maskedSeed = d.substr(1, SHA1_SIZE)
    var maskedDB = d.substr(SHA1_SIZE + 1);

    var seedMask = oaep_mgf1_str(maskedDB, SHA1_SIZE, hash || rstr_sha1);
    var seed = [], i;

    for (i = 0; i < maskedSeed.length; i += 1)
    {
        seed[i] = maskedSeed.charCodeAt(i) ^ seedMask.charCodeAt(i);
    }

    var dbMask = oaep_mgf1_str(String.fromCharCode.apply(String, seed),
                           d.length - SHA1_SIZE, rstr_sha1);

    var DB = [];

    for (i = 0; i < maskedDB.length; i += 1)
    {
        DB[i] = maskedDB.charCodeAt(i) ^ dbMask.charCodeAt(i);
    }

    DB = String.fromCharCode.apply(String, DB);

    if (DB.substr(0, SHA1_SIZE) !== rstr_sha1(''))
    {
        throw "Hash mismatch";
    }

    DB = DB.substr(SHA1_SIZE);

    var first_one = DB.indexOf('\x01');
    var last_zero = (first_one != -1) ? DB.substr(0, first_one).lastIndexOf('\x00') : -1;

    if (last_zero + 1 != first_one)
    {
        throw "Malformed data";
    }

    return DB.substr(first_one + 1);
}

// Set the private key fields N, e, and d from hex strings
function RSASetPrivate(N,E,D) {
  this.isPrivate = true;
  if (typeof N !== "string")
  {
    this.n = N;
    this.e = E;
    this.d = D;
  }
  else if(N != null && E != null && N.length > 0 && E.length > 0) {
    this.n = parseBigInt(N,16);
    this.e = parseInt(E,16);
    this.d = parseBigInt(D,16);
  }
  else
    alert("Invalid RSA private key");
}

// Set the private key fields N, e, d and CRT params from hex strings
function RSASetPrivateEx(N,E,D,P,Q,DP,DQ,C) {
  this.isPrivate = true;
  if (N == null) throw "RSASetPrivateEx N == null";
  if (E == null) throw "RSASetPrivateEx E == null";
  if (N.length == 0) throw "RSASetPrivateEx N.length == 0";
  if (E.length == 0) throw "RSASetPrivateEx E.length == 0";

  if (N != null && E != null && N.length > 0 && E.length > 0) {
    this.n = parseBigInt(N,16);
    this.e = parseInt(E,16);
    this.d = parseBigInt(D,16);
    this.p = parseBigInt(P,16);
    this.q = parseBigInt(Q,16);
    this.dmp1 = parseBigInt(DP,16);
    this.dmq1 = parseBigInt(DQ,16);
    this.coeff = parseBigInt(C,16);
  } else {
    alert("Invalid RSA private key in RSASetPrivateEx");
  }
}

// Generate a new random private key B bits long, using public expt E
function RSAGenerate(B,E) {
  var rng = new SecureRandom();
  var qs = B>>1;
  this.e = parseInt(E,16);
  var ee = new BigInteger(E,16);
  for(;;) {
    for(;;) {
      this.p = new BigInteger(B-qs,1,rng);
      if(this.p.subtract(BigInteger.ONE).gcd(ee).compareTo(BigInteger.ONE) == 0 && this.p.isProbablePrime(10)) break;
    }
    for(;;) {
      this.q = new BigInteger(qs,1,rng);
      if(this.q.subtract(BigInteger.ONE).gcd(ee).compareTo(BigInteger.ONE) == 0 && this.q.isProbablePrime(10)) break;
    }
    if(this.p.compareTo(this.q) <= 0) {
      var t = this.p;
      this.p = this.q;
      this.q = t;
    }
    var p1 = this.p.subtract(BigInteger.ONE);	// p1 = p - 1
    var q1 = this.q.subtract(BigInteger.ONE);	// q1 = q - 1
    var phi = p1.multiply(q1);
    if(phi.gcd(ee).compareTo(BigInteger.ONE) == 0) {
      this.n = this.p.multiply(this.q);	// this.n = p * q
      this.d = ee.modInverse(phi);	// this.d = 
      this.dmp1 = this.d.mod(p1);	// this.dmp1 = d mod (p - 1)
      this.dmq1 = this.d.mod(q1);	// this.dmq1 = d mod (q - 1)
      this.coeff = this.q.modInverse(this.p);	// this.coeff = (q ^ -1) mod p
      break;
    }
  }
}

// Perform raw private operation on "x": return x^d (mod n)
function RSADoPrivate(x) {
  if(this.p == null || this.q == null)
    return x.modPow(this.d, this.n);

  // TODO: re-calculate any missing CRT params
  var xp = x.mod(this.p).modPow(this.dmp1, this.p); // xp=cp?
  var xq = x.mod(this.q).modPow(this.dmq1, this.q); // xq=cq?

  while(xp.compareTo(xq) < 0)
    xp = xp.add(this.p);
  // NOTE:
  // xp.subtract(xq) => cp -cq
  // xp.subtract(xq).multiply(this.coeff).mod(this.p) => (cp - cq) * u mod p = h
  // xp.subtract(xq).multiply(this.coeff).mod(this.p).multiply(this.q).add(xq) => cq + (h * q) = M
  return xp.subtract(xq).multiply(this.coeff).mod(this.p).multiply(this.q).add(xq);
}

// Return the PKCS#1 RSA decryption of "ctext".
// "ctext" is an even-length hex string and the output is a plain string.
function RSADecrypt(ctext) {
  var c = parseBigInt(ctext, 16);
  var m = this.doPrivate(c);
  if(m == null) return null;
  return pkcs1unpad2(m, (this.n.bitLength()+7)>>3);
}

// Return the PKCS#1 OAEP RSA decryption of "ctext".
// "ctext" is an even-length hex string and the output is a plain string.
function RSADecryptOAEP(ctext, hash) {
  var c = parseBigInt(ctext, 16);
  var m = this.doPrivate(c);
  if(m == null) return null;
  return oaep_unpad(m, (this.n.bitLength()+7)>>3, hash);
}

// Return the PKCS#1 RSA decryption of "ctext".
// "ctext" is a Base64-encoded string and the output is a plain string.
//function RSAB64Decrypt(ctext) {
//  var h = b64tohex(ctext);
//  if(h) return this.decrypt(h); else return null;
//}

// protected
RSAKey.prototype.doPrivate = RSADoPrivate;

// public
RSAKey.prototype.setPrivate = RSASetPrivate;
RSAKey.prototype.setPrivateEx = RSASetPrivateEx;
RSAKey.prototype.generate = RSAGenerate;
RSAKey.prototype.decrypt = RSADecrypt;
RSAKey.prototype.decryptOAEP = RSADecryptOAEP;
//RSAKey.prototype.b64_decrypt = RSAB64Decrypt;

/*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
 */
var b64map="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var b64pad="=";

function hex2b64(h) {
  var i;
  var c;
  var ret = "";
  for(i = 0; i+3 <= h.length; i+=3) {
    c = parseInt(h.substring(i,i+3),16);
    ret += b64map.charAt(c >> 6) + b64map.charAt(c & 63);
  }
  if(i+1 == h.length) {
    c = parseInt(h.substring(i,i+1),16);
    ret += b64map.charAt(c << 2);
  }
  else if(i+2 == h.length) {
    c = parseInt(h.substring(i,i+2),16);
    ret += b64map.charAt(c >> 2) + b64map.charAt((c & 3) << 4);
  }
  if (b64pad) while((ret.length & 3) > 0) ret += b64pad;
  return ret;
}

// convert a base64 string to hex
function b64tohex(s) {
  var ret = ""
  var i;
  var k = 0; // b64 state, 0-3
  var slop;
  var v;
  for(i = 0; i < s.length; ++i) {
    if(s.charAt(i) == b64pad) break;
    v = b64map.indexOf(s.charAt(i));
    if(v < 0) continue;
    if(k == 0) {
      ret += int2char(v >> 2);
      slop = v & 3;
      k = 1;
    }
    else if(k == 1) {
      ret += int2char((slop << 2) | (v >> 4));
      slop = v & 0xf;
      k = 2;
    }
    else if(k == 2) {
      ret += int2char(slop);
      ret += int2char(v >> 2);
      slop = v & 3;
      k = 3;
    }
    else {
      ret += int2char((slop << 2) | (v >> 4));
      ret += int2char(v & 0xf);
      k = 0;
    }
  }
  if(k == 1)
    ret += int2char(slop << 2);
  return ret;
}

// convert a base64 string to a byte/number array
function b64toBA(s) {
  //piggyback on b64tohex for now, optimize later
  var h = b64tohex(s);
  var i;
  var a = new Array();
  for(i = 0; 2*i < h.length; ++i) {
    a[i] = parseInt(h.substring(2*i,2*i+2),16);
  }
  return a;
}

/*! asn1hex-1.1.4.js (c) 2012-2013 Kenji Urushima | kjur.github.com/jsrsasign/license
 */
/*
 * asn1hex.js - Hexadecimal represented ASN.1 string library
 *
 * Copyright (c) 2010-2013 Kenji Urushima (kenji.urushima@gmail.com)
 *
 * This software is licensed under the terms of the MIT License.
 * http://kjur.github.com/jsrsasign/license/
 *
 * The above copyright and license notice shall be 
 * included in all copies or substantial portions of the Software.
 */

/**
 * @fileOverview
 * @name asn1hex-1.1.js
 * @author Kenji Urushima kenji.urushima@gmail.com
 * @version asn1hex 1.1.4 (2013-Oct-02)
 * @license <a href="http://kjur.github.io/jsrsasign/license/">MIT License</a>
 */

/*
 * MEMO:
 *   f('3082025b02...', 2) ... 82025b ... 3bytes
 *   f('020100', 2) ... 01 ... 1byte
 *   f('0203001...', 2) ... 03 ... 1byte
 *   f('02818003...', 2) ... 8180 ... 2bytes
 *   f('3080....0000', 2) ... 80 ... -1
 *
 *   Requirements:
 *   - ASN.1 type octet length MUST be 1. 
 *     (i.e. ASN.1 primitives like SET, SEQUENCE, INTEGER, OCTETSTRING ...)
 */

/**
 * ASN.1 DER encoded hexadecimal string utility class
 * @name ASN1HEX
 * @class ASN.1 DER encoded hexadecimal string utility class
 * @since jsrsasign 1.1
 */
var ASN1HEX = new function() {
    /**
     * get byte length for ASN.1 L(length) bytes
     * @name getByteLengthOfL_AtObj
     * @memberOf ASN1HEX
     * @function
     * @param {String} s hexadecimal string of ASN.1 DER encoded data
     * @param {Number} pos string index
     * @return byte length for ASN.1 L(length) bytes
     */
    this.getByteLengthOfL_AtObj = function(s, pos) {
	if (s.substring(pos + 2, pos + 3) != '8') return 1;
	var i = parseInt(s.substring(pos + 3, pos + 4));
	if (i == 0) return -1; 		// length octet '80' indefinite length
	if (0 < i && i < 10) return i + 1;	// including '8?' octet;
	return -2;				// malformed format
    };

    /**
     * get hexadecimal string for ASN.1 L(length) bytes
     * @name getHexOfL_AtObj
     * @memberOf ASN1HEX
     * @function
     * @param {String} s hexadecimal string of ASN.1 DER encoded data
     * @param {Number} pos string index
     * @return {String} hexadecimal string for ASN.1 L(length) bytes
     */
    this.getHexOfL_AtObj = function(s, pos) {
	var len = this.getByteLengthOfL_AtObj(s, pos);
	if (len < 1) return '';
	return s.substring(pos + 2, pos + 2 + len * 2);
    };

    //   getting ASN.1 length value at the position 'idx' of
    //   hexa decimal string 's'.
    //
    //   f('3082025b02...', 0) ... 82025b ... ???
    //   f('020100', 0) ... 01 ... 1
    //   f('0203001...', 0) ... 03 ... 3
    //   f('02818003...', 0) ... 8180 ... 128
    /**
     * get integer value of ASN.1 length for ASN.1 data
     * @name getIntOfL_AtObj
     * @memberOf ASN1HEX
     * @function
     * @param {String} s hexadecimal string of ASN.1 DER encoded data
     * @param {Number} pos string index
     * @return ASN.1 L(length) integer value
     */
    this.getIntOfL_AtObj = function(s, pos) {
	var hLength = this.getHexOfL_AtObj(s, pos);
	if (hLength == '') return -1;
	var bi;
	if (parseInt(hLength.substring(0, 1)) < 8) {
	    bi = new BigInteger(hLength, 16);
	} else {
	    bi = new BigInteger(hLength.substring(2), 16);
	}
	return bi.intValue();
    };

    /**
     * get ASN.1 value starting string position for ASN.1 object refered by index 'idx'.
     * @name getStartPosOfV_AtObj
     * @memberOf ASN1HEX
     * @function
     * @param {String} s hexadecimal string of ASN.1 DER encoded data
     * @param {Number} pos string index
     */
    this.getStartPosOfV_AtObj = function(s, pos) {
	var l_len = this.getByteLengthOfL_AtObj(s, pos);
	if (l_len < 0) return l_len;
	return pos + (l_len + 1) * 2;
    };

    /**
     * get hexadecimal string of ASN.1 V(value)
     * @name getHexOfV_AtObj
     * @memberOf ASN1HEX
     * @function
     * @param {String} s hexadecimal string of ASN.1 DER encoded data
     * @param {Number} pos string index
     * @return {String} hexadecimal string of ASN.1 value.
     */
    this.getHexOfV_AtObj = function(s, pos) {
	var pos1 = this.getStartPosOfV_AtObj(s, pos);
	var len = this.getIntOfL_AtObj(s, pos);
	return s.substring(pos1, pos1 + len * 2);
    };

    /**
     * get hexadecimal string of ASN.1 TLV at
     * @name getHexOfTLV_AtObj
     * @memberOf ASN1HEX
     * @function
     * @param {String} s hexadecimal string of ASN.1 DER encoded data
     * @param {Number} pos string index
     * @return {String} hexadecimal string of ASN.1 TLV.
     * @since 1.1
     */
    this.getHexOfTLV_AtObj = function(s, pos) {
	var hT = s.substr(pos, 2);
	var hL = this.getHexOfL_AtObj(s, pos);
	var hV = this.getHexOfV_AtObj(s, pos);
	return hT + hL + hV;
    };

    /**
     * get next sibling starting index for ASN.1 object string
     * @name getPosOfNextSibling_AtObj
     * @memberOf ASN1HEX
     * @function
     * @param {String} s hexadecimal string of ASN.1 DER encoded data
     * @param {Number} pos string index
     * @return next sibling starting index for ASN.1 object string
     */
    this.getPosOfNextSibling_AtObj = function(s, pos) {
	var pos1 = this.getStartPosOfV_AtObj(s, pos);
	var len = this.getIntOfL_AtObj(s, pos);
	return pos1 + len * 2;
    };

    /**
     * get array of indexes of child ASN.1 objects
     * @name getPosArrayOfChildren_AtObj
     * @memberOf ASN1HEX
     * @function
     * @param {String} s hexadecimal string of ASN.1 DER encoded data
     * @param {Number} start string index of ASN.1 object
     * @return {Array of Number} array of indexes for childen of ASN.1 objects
     */
    this.getPosArrayOfChildren_AtObj = function(h, pos) {
	var a = new Array();
	var p0 = this.getStartPosOfV_AtObj(h, pos);
	a.push(p0);

	var len = this.getIntOfL_AtObj(h, pos);
	var p = p0;
	var k = 0;
	while (1) {
	    var pNext = this.getPosOfNextSibling_AtObj(h, p);
	    if (pNext == null || (pNext - p0  >= (len * 2))) break;
	    if (k >= 200) break;
	    
	    a.push(pNext);
	    p = pNext;
	    
	    k++;
	}
	
	return a;
    };

    /**
     * get string index of nth child object of ASN.1 object refered by h, idx
     * @name getNthChildIndex_AtObj
     * @memberOf ASN1HEX
     * @function
     * @param {String} h hexadecimal string of ASN.1 DER encoded data
     * @param {Number} idx start string index of ASN.1 object
     * @param {Number} nth for child
     * @return {Number} string index of nth child.
     * @since 1.1
     */
    this.getNthChildIndex_AtObj = function(h, idx, nth) {
	var a = this.getPosArrayOfChildren_AtObj(h, idx);
	return a[nth];
    };

    // ========== decendant methods ==============================
    /**
     * get string index of nth child object of ASN.1 object refered by h, idx
     * @name getDecendantIndexByNthList
     * @memberOf ASN1HEX
     * @function
     * @param {String} h hexadecimal string of ASN.1 DER encoded data
     * @param {Number} currentIndex start string index of ASN.1 object
     * @param {Array of Number} nthList array list of nth
     * @return {Number} string index refered by nthList
     * @since 1.1
     * @example
     * The "nthList" is a index list of structured ASN.1 object
     * reference. Here is a sample structure and "nthList"s which
     * refers each objects.
     *
     * SQUENCE               - [0]
     *   SEQUENCE            - [0, 0]
     *     IA5STRING 000     - [0, 0, 0]
     *     UTF8STRING 001    - [0, 0, 1]
     *   SET                 - [0, 1]
     *     IA5STRING 010     - [0, 1, 0]
     *     UTF8STRING 011    - [0, 1, 1]
     */
    this.getDecendantIndexByNthList = function(h, currentIndex, nthList) {
	if (nthList.length == 0) {
	    return currentIndex;
	}
	var firstNth = nthList.shift();
	var a = this.getPosArrayOfChildren_AtObj(h, currentIndex);
	return this.getDecendantIndexByNthList(h, a[firstNth], nthList);
    };

    /**
     * get hexadecimal string of ASN.1 TLV refered by current index and nth index list.
     * @name getDecendantHexTLVByNthList
     * @memberOf ASN1HEX
     * @function
     * @param {String} h hexadecimal string of ASN.1 DER encoded data
     * @param {Number} currentIndex start string index of ASN.1 object
     * @param {Array of Number} nthList array list of nth
     * @return {Number} hexadecimal string of ASN.1 TLV refered by nthList
     * @since 1.1
     */
    this.getDecendantHexTLVByNthList = function(h, currentIndex, nthList) {
	var idx = this.getDecendantIndexByNthList(h, currentIndex, nthList);
	return this.getHexOfTLV_AtObj(h, idx);
    };

    /**
     * get hexadecimal string of ASN.1 V refered by current index and nth index list.
     * @name getDecendantHexVByNthList
     * @memberOf ASN1HEX
     * @function
     * @param {String} h hexadecimal string of ASN.1 DER encoded data
     * @param {Number} currentIndex start string index of ASN.1 object
     * @param {Array of Number} nthList array list of nth
     * @return {Number} hexadecimal string of ASN.1 V refered by nthList
     * @since 1.1
     */
    this.getDecendantHexVByNthList = function(h, currentIndex, nthList) {
	var idx = this.getDecendantIndexByNthList(h, currentIndex, nthList);
	return this.getHexOfV_AtObj(h, idx);
    };
};

/*
 * @since asn1hex 1.1.4
 */
ASN1HEX.getVbyList = function(h, currentIndex, nthList, checkingTag) {
    var idx = this.getDecendantIndexByNthList(h, currentIndex, nthList);
    if (idx === undefined) {
	throw "can't find nthList object";
    }
    if (checkingTag !== undefined) {
	if (h.substr(idx, 2) != checkingTag) {
	    throw "checking tag doesn't match: " + h.substr(idx,2) + "!=" + checkingTag;
	}
    }
    return this.getHexOfV_AtObj(h, idx);
};


/*! rsapem-1.1.js (c) 2012 Kenji Urushima | kjur.github.com/jsrsasign/license
 */
//
// rsa-pem.js - adding function for reading/writing PKCS#1 PEM private key
//              to RSAKey class.
//
// version: 1.1.1 (2013-Apr-12)
//
// Copyright (c) 2010-2013 Kenji Urushima (kenji.urushima@gmail.com)
//
// This software is licensed under the terms of the MIT License.
// http://kjur.github.com/jsrsasign/license/
//
// The above copyright and license notice shall be 
// included in all copies or substantial portions of the Software.
// 
//
// Depends on:
//
//
//
// _RSApem_pemToBase64(sPEM)
//
//   removing PEM header, PEM footer and space characters including
//   new lines from PEM formatted RSA private key string.
//

/**
 * @fileOverview
 * @name rsapem-1.1.js
 * @author Kenji Urushima kenji.urushima@gmail.com
 * @version 1.1
 * @license <a href="http://kjur.github.io/jsrsasign/license/">MIT License</a>
 */
function _rsapem_pemToBase64(sPEMPrivateKey) {
  var s = sPEMPrivateKey;
  s = s.replace("-----BEGIN RSA PRIVATE KEY-----", "");
  s = s.replace("-----END RSA PRIVATE KEY-----", "");
  s = s.replace(/[ \n]+/g, "");
  return s;
}

function _rsapem_getPosArrayOfChildrenFromHex(hPrivateKey) {
  var a = new Array();
  var v1 = ASN1HEX.getStartPosOfV_AtObj(hPrivateKey, 0);
  var n1 = ASN1HEX.getPosOfNextSibling_AtObj(hPrivateKey, v1);
  var e1 = ASN1HEX.getPosOfNextSibling_AtObj(hPrivateKey, n1);
  var d1 = ASN1HEX.getPosOfNextSibling_AtObj(hPrivateKey, e1);
  var p1 = ASN1HEX.getPosOfNextSibling_AtObj(hPrivateKey, d1);
  var q1 = ASN1HEX.getPosOfNextSibling_AtObj(hPrivateKey, p1);
  var dp1 = ASN1HEX.getPosOfNextSibling_AtObj(hPrivateKey, q1);
  var dq1 = ASN1HEX.getPosOfNextSibling_AtObj(hPrivateKey, dp1);
  var co1 = ASN1HEX.getPosOfNextSibling_AtObj(hPrivateKey, dq1);
  a.push(v1, n1, e1, d1, p1, q1, dp1, dq1, co1);
  return a;
}

function _rsapem_getHexValueArrayOfChildrenFromHex(hPrivateKey) {
  var posArray = _rsapem_getPosArrayOfChildrenFromHex(hPrivateKey);
  var v =  ASN1HEX.getHexOfV_AtObj(hPrivateKey, posArray[0]);
  var n =  ASN1HEX.getHexOfV_AtObj(hPrivateKey, posArray[1]);
  var e =  ASN1HEX.getHexOfV_AtObj(hPrivateKey, posArray[2]);
  var d =  ASN1HEX.getHexOfV_AtObj(hPrivateKey, posArray[3]);
  var p =  ASN1HEX.getHexOfV_AtObj(hPrivateKey, posArray[4]);
  var q =  ASN1HEX.getHexOfV_AtObj(hPrivateKey, posArray[5]);
  var dp = ASN1HEX.getHexOfV_AtObj(hPrivateKey, posArray[6]);
  var dq = ASN1HEX.getHexOfV_AtObj(hPrivateKey, posArray[7]);
  var co = ASN1HEX.getHexOfV_AtObj(hPrivateKey, posArray[8]);
  var a = new Array();
  a.push(v, n, e, d, p, q, dp, dq, co);
  return a;
}

/**
 * read RSA private key from a ASN.1 hexadecimal string
 * @name readPrivateKeyFromASN1HexString
 * @memberOf RSAKey#
 * @function
 * @param {String} keyHex ASN.1 hexadecimal string of PKCS#1 private key.
 * @since 1.1.1
 */
function _rsapem_readPrivateKeyFromASN1HexString(keyHex) {
  var a = _rsapem_getHexValueArrayOfChildrenFromHex(keyHex);
  this.setPrivateEx(a[1],a[2],a[3],a[4],a[5],a[6],a[7],a[8]);
}

/**
 * read PKCS#1 private key from a string
 * @name readPrivateKeyFromPEMString
 * @memberOf RSAKey#
 * @function
 * @param {String} keyPEM string of PKCS#1 private key.
 */
function _rsapem_readPrivateKeyFromPEMString(keyPEM) {
  var keyB64 = _rsapem_pemToBase64(keyPEM);
  var keyHex = b64tohex(keyB64) // depends base64.js
  var a = _rsapem_getHexValueArrayOfChildrenFromHex(keyHex);
  this.setPrivateEx(a[1],a[2],a[3],a[4],a[5],a[6],a[7],a[8]);
}

RSAKey.prototype.readPrivateKeyFromPEMString = _rsapem_readPrivateKeyFromPEMString;
RSAKey.prototype.readPrivateKeyFromASN1HexString = _rsapem_readPrivateKeyFromASN1HexString;

/*! rsasign-1.2.7.js (c) 2012 Kenji Urushima | kjur.github.com/jsrsasign/license
 */
/*
 * rsa-sign.js - adding signing functions to RSAKey class.
 *
 * version: 1.2.7 (2013 Aug 25)
 *
 * Copyright (c) 2010-2013 Kenji Urushima (kenji.urushima@gmail.com)
 *
 * This software is licensed under the terms of the MIT License.
 * http://kjur.github.com/jsrsasign/license/
 *
 * The above copyright and license notice shall be 
 * included in all copies or substantial portions of the Software.
 */

/**
 * @fileOverview
 * @name rsasign-1.2.js
 * @author Kenji Urushima kenji.urushima@gmail.com
 * @version rsasign 1.2.7
 * @license <a href="http://kjur.github.io/jsrsasign/license/">MIT License</a>
 */

var _RE_HEXDECONLY = new RegExp("");
_RE_HEXDECONLY.compile("[^0-9a-f]", "gi");

// ========================================================================
// Signature Generation
// ========================================================================

function _rsasign_getHexPaddedDigestInfoForString(s, keySize, hashAlg) {
    var hashFunc = function(s) { return KJUR.crypto.Util.hashString(s, hashAlg); };
    var sHashHex = hashFunc(s);

    return KJUR.crypto.Util.getPaddedDigestInfoHex(sHashHex, hashAlg, keySize);
}

function _zeroPaddingOfSignature(hex, bitLength) {
    var s = "";
    var nZero = bitLength / 4 - hex.length;
    for (var i = 0; i < nZero; i++) {
	s = s + "0";
    }
    return s + hex;
}

/**
 * sign for a message string with RSA private key.<br/>
 * @name signString
 * @memberOf RSAKey
 * @function
 * @param {String} s message string to be signed.
 * @param {String} hashAlg hash algorithm name for signing.<br/>
 * @return returns hexadecimal string of signature value.
 */
function _rsasign_signString(s, hashAlg) {
    var hashFunc = function(s) { return KJUR.crypto.Util.hashString(s, hashAlg); };
    var sHashHex = hashFunc(s);

    return this.signWithMessageHash(sHashHex, hashAlg);
}

/**
 * sign hash value of message to be signed with RSA private key.<br/>
 * @name signWithMessageHash
 * @memberOf RSAKey
 * @function
 * @param {String} sHashHex hexadecimal string of hash value of message to be signed.
 * @param {String} hashAlg hash algorithm name for signing.<br/>
 * @return returns hexadecimal string of signature value.
 * @since rsasign 1.2.6
 */
function _rsasign_signWithMessageHash(sHashHex, hashAlg) {
    var hPM = KJUR.crypto.Util.getPaddedDigestInfoHex(sHashHex, hashAlg, this.n.bitLength());
    var biPaddedMessage = parseBigInt(hPM, 16);
    var biSign = this.doPrivate(biPaddedMessage);
    var hexSign = biSign.toString(16);
    return _zeroPaddingOfSignature(hexSign, this.n.bitLength());
}

function _rsasign_signStringWithSHA1(s) {
    return _rsasign_signString.call(this, s, 'sha1');
}

function _rsasign_signStringWithSHA256(s) {
    return _rsasign_signString.call(this, s, 'sha256');
}

// PKCS#1 (PSS) mask generation function
function pss_mgf1_str(seed, len, hash) {
    var mask = '', i = 0;

    while (mask.length < len) {
        mask += hextorstr(hash(rstrtohex(seed + String.fromCharCode.apply(String, [
                (i & 0xff000000) >> 24,
                (i & 0x00ff0000) >> 16,
                (i & 0x0000ff00) >> 8,
                i & 0x000000ff]))));
        i += 1;
    }

    return mask;
}

/**
 * sign for a message string with RSA private key by PKCS#1 PSS signing.<br/>
 * @name signStringPSS
 * @memberOf RSAKey
 * @function
 * @param {String} s message string to be signed.
 * @param {String} hashAlg hash algorithm name for signing.
 * @param {Integer} sLen salt byte length from 0 to (keybytelen - hashbytelen - 2).
 *        There are two special values:
 *        <ul>
 *        <li>-1: sets the salt length to the digest length</li>
 *        <li>-2: sets the salt length to maximum permissible value
 *           (i.e. keybytelen - hashbytelen - 2)</li>
 *        </ul>
 *        DEFAULT is -1. (NOTE: OpenSSL's default is -2.)
 * @return returns hexadecimal string of signature value.
 */
function _rsasign_signStringPSS(s, hashAlg, sLen) {
    var hashFunc = function(sHex) { return KJUR.crypto.Util.hashHex(sHex, hashAlg); } 
    var hHash = hashFunc(rstrtohex(s));

    if (sLen === undefined) sLen = -1;
    return this.signWithMessageHashPSS(hHash, hashAlg, sLen);
}

/**
 * sign hash value of message with RSA private key by PKCS#1 PSS signing.<br/>
 * @name signWithMessageHashPSS
 * @memberOf RSAKey
 * @function
 * @param {String} hHash hexadecimal hash value of message to be signed.
 * @param {String} hashAlg hash algorithm name for signing.
 * @param {Integer} sLen salt byte length from 0 to (keybytelen - hashbytelen - 2).
 *        There are two special values:
 *        <ul>
 *        <li>-1: sets the salt length to the digest length</li>
 *        <li>-2: sets the salt length to maximum permissible value
 *           (i.e. keybytelen - hashbytelen - 2)</li>
 *        </ul>
 *        DEFAULT is -1. (NOTE: OpenSSL's default is -2.)
 * @return returns hexadecimal string of signature value.
 * @since rsasign 1.2.6
 */
function _rsasign_signWithMessageHashPSS(hHash, hashAlg, sLen) {
    var mHash = hextorstr(hHash);
    var hLen = mHash.length;
    var emBits = this.n.bitLength() - 1;
    var emLen = Math.ceil(emBits / 8);
    var i;
    var hashFunc = function(sHex) { return KJUR.crypto.Util.hashHex(sHex, hashAlg); } 

    if (sLen === -1 || sLen === undefined) {
        sLen = hLen; // same as hash length
    } else if (sLen === -2) {
        sLen = emLen - hLen - 2; // maximum
    } else if (sLen < -2) {
        throw "invalid salt length";
    }

    if (emLen < (hLen + sLen + 2)) {
        throw "data too long";
    }

    var salt = '';

    if (sLen > 0) {
        salt = new Array(sLen);
        new SecureRandom().nextBytes(salt);
        salt = String.fromCharCode.apply(String, salt);
    }

    var H = hextorstr(hashFunc(rstrtohex('\x00\x00\x00\x00\x00\x00\x00\x00' + mHash + salt)));
    var PS = [];

    for (i = 0; i < emLen - sLen - hLen - 2; i += 1) {
        PS[i] = 0x00;
    }

    var DB = String.fromCharCode.apply(String, PS) + '\x01' + salt;
    var dbMask = pss_mgf1_str(H, DB.length, hashFunc);
    var maskedDB = [];

    for (i = 0; i < DB.length; i += 1) {
        maskedDB[i] = DB.charCodeAt(i) ^ dbMask.charCodeAt(i);
    }

    var mask = (0xff00 >> (8 * emLen - emBits)) & 0xff;
    maskedDB[0] &= ~mask;

    for (i = 0; i < hLen; i++) {
        maskedDB.push(H.charCodeAt(i));
    }

    maskedDB.push(0xbc);

    return _zeroPaddingOfSignature(this.doPrivate(new BigInteger(maskedDB)).toString(16),
				   this.n.bitLength());
}

// ========================================================================
// Signature Verification
// ========================================================================

function _rsasign_getDecryptSignatureBI(biSig, hN, hE) {
    var rsa = new RSAKey();
    rsa.setPublic(hN, hE);
    var biDecryptedSig = rsa.doPublic(biSig);
    return biDecryptedSig;
}

function _rsasign_getHexDigestInfoFromSig(biSig, hN, hE) {
    var biDecryptedSig = _rsasign_getDecryptSignatureBI(biSig, hN, hE);
    var hDigestInfo = biDecryptedSig.toString(16).replace(/^1f+00/, '');
    return hDigestInfo;
}

function _rsasign_getAlgNameAndHashFromHexDisgestInfo(hDigestInfo) {
    for (var algName in KJUR.crypto.Util.DIGESTINFOHEAD) {
	var head = KJUR.crypto.Util.DIGESTINFOHEAD[algName];
	var len = head.length;
	if (hDigestInfo.substring(0, len) == head) {
	    var a = [algName, hDigestInfo.substring(len)];
	    return a;
	}
    }
    return [];
}

function _rsasign_verifySignatureWithArgs(sMsg, biSig, hN, hE) {
    var hDigestInfo = _rsasign_getHexDigestInfoFromSig(biSig, hN, hE);
    var digestInfoAry = _rsasign_getAlgNameAndHashFromHexDisgestInfo(hDigestInfo);
    if (digestInfoAry.length == 0) return false;
    var algName = digestInfoAry[0];
    var diHashValue = digestInfoAry[1];
    var ff = function(s) { return KJUR.crypto.Util.hashString(s, algName); };
    var msgHashValue = ff(sMsg);
    return (diHashValue == msgHashValue);
}

function _rsasign_verifyHexSignatureForMessage(hSig, sMsg) {
    var biSig = parseBigInt(hSig, 16);
    var result = _rsasign_verifySignatureWithArgs(sMsg, biSig,
						  this.n.toString(16),
						  this.e.toString(16));
    return result;
}

/**
 * verifies a sigature for a message string with RSA public key.<br/>
 * @name verifyString
 * @memberOf RSAKey#
 * @function
 * @param {String} sMsg message string to be verified.
 * @param {String} hSig hexadecimal string of siganture.<br/>
 *                 non-hexadecimal charactors including new lines will be ignored.
 * @return returns 1 if valid, otherwise 0
 */
function _rsasign_verifyString(sMsg, hSig) {
    hSig = hSig.replace(_RE_HEXDECONLY, '');
    hSig = hSig.replace(/[ \n]+/g, "");
    var biSig = parseBigInt(hSig, 16);
    if (biSig.bitLength() > this.n.bitLength()) return 0;
    var biDecryptedSig = this.doPublic(biSig);
    var hDigestInfo = biDecryptedSig.toString(16).replace(/^1f+00/, '');
    var digestInfoAry = _rsasign_getAlgNameAndHashFromHexDisgestInfo(hDigestInfo);
  
    if (digestInfoAry.length == 0) return false;
    var algName = digestInfoAry[0];
    var diHashValue = digestInfoAry[1];
    var ff = function(s) { return KJUR.crypto.Util.hashString(s, algName); };
    var msgHashValue = ff(sMsg);
    return (diHashValue == msgHashValue);
}

/**
 * verifies a sigature for a message string with RSA public key.<br/>
 * @name verifyWithMessageHash
 * @memberOf RSAKey
 * @function
 * @param {String} sHashHex hexadecimal hash value of message to be verified.
 * @param {String} hSig hexadecimal string of siganture.<br/>
 *                 non-hexadecimal charactors including new lines will be ignored.
 * @return returns 1 if valid, otherwise 0
 * @since rsasign 1.2.6
 */
function _rsasign_verifyWithMessageHash(sHashHex, hSig) {
    hSig = hSig.replace(_RE_HEXDECONLY, '');
    hSig = hSig.replace(/[ \n]+/g, "");
    var biSig = parseBigInt(hSig, 16);
    if (biSig.bitLength() > this.n.bitLength()) return 0;
    var biDecryptedSig = this.doPublic(biSig);
    var hDigestInfo = biDecryptedSig.toString(16).replace(/^1f+00/, '');
    var digestInfoAry = _rsasign_getAlgNameAndHashFromHexDisgestInfo(hDigestInfo);
  
    if (digestInfoAry.length == 0) return false;
    var algName = digestInfoAry[0];
    var diHashValue = digestInfoAry[1];
    return (diHashValue == sHashHex);
}

/**
 * verifies a sigature for a message string with RSA public key by PKCS#1 PSS sign.<br/>
 * @name verifyStringPSS
 * @memberOf RSAKey
 * @function
 * @param {String} sMsg message string to be verified.
 * @param {String} hSig hexadecimal string of signature value
 * @param {String} hashAlg hash algorithm name
 * @param {Integer} sLen salt byte length from 0 to (keybytelen - hashbytelen - 2).
 *        There are two special values:
 *        <ul>
 *        <li>-1: sets the salt length to the digest length</li>
 *        <li>-2: sets the salt length to maximum permissible value
 *           (i.e. keybytelen - hashbytelen - 2)</li>
 *        </ul>
 *        DEFAULT is -1. (NOTE: OpenSSL's default is -2.)
 * @return returns true if valid, otherwise false
 */
function _rsasign_verifyStringPSS(sMsg, hSig, hashAlg, sLen) {
    var hashFunc = function(sHex) { return KJUR.crypto.Util.hashHex(sHex, hashAlg); };
    var hHash = hashFunc(rstrtohex(sMsg));

    if (sLen === undefined) sLen = -1;
    return this.verifyWithMessageHashPSS(hHash, hSig, hashAlg, sLen);
}

/**
 * verifies a sigature for a hash value of message string with RSA public key by PKCS#1 PSS sign.<br/>
 * @name verifyWithMessageHashPSS
 * @memberOf RSAKey
 * @function
 * @param {String} hHash hexadecimal hash value of message string to be verified.
 * @param {String} hSig hexadecimal string of signature value
 * @param {String} hashAlg hash algorithm name
 * @param {Integer} sLen salt byte length from 0 to (keybytelen - hashbytelen - 2).
 *        There are two special values:
 *        <ul>
 *        <li>-1: sets the salt length to the digest length</li>
 *        <li>-2: sets the salt length to maximum permissible value
 *           (i.e. keybytelen - hashbytelen - 2)</li>
 *        </ul>
 *        DEFAULT is -1 (NOTE: OpenSSL's default is -2.)
 * @return returns true if valid, otherwise false
 * @since rsasign 1.2.6
 */
function _rsasign_verifyWithMessageHashPSS(hHash, hSig, hashAlg, sLen) {
    var biSig = new BigInteger(hSig, 16);

    if (biSig.bitLength() > this.n.bitLength()) {
        return false;
    }

    var hashFunc = function(sHex) { return KJUR.crypto.Util.hashHex(sHex, hashAlg); };
    var mHash = hextorstr(hHash);
    var hLen = mHash.length;
    var emBits = this.n.bitLength() - 1;
    var emLen = Math.ceil(emBits / 8);
    var i;

    if (sLen === -1 || sLen === undefined) {
        sLen = hLen; // same as hash length
    } else if (sLen === -2) {
        sLen = emLen - hLen - 2; // recover
    } else if (sLen < -2) {
        throw "invalid salt length";
    }

    if (emLen < (hLen + sLen + 2)) {
        throw "data too long";
    }

    var em = this.doPublic(biSig).toByteArray();

    for (i = 0; i < em.length; i += 1) {
        em[i] &= 0xff;
    }

    while (em.length < emLen) {
        em.unshift(0);
    }

    if (em[emLen -1] !== 0xbc) {
        throw "encoded message does not end in 0xbc";
    }

    em = String.fromCharCode.apply(String, em);

    var maskedDB = em.substr(0, emLen - hLen - 1);
    var H = em.substr(maskedDB.length, hLen);

    var mask = (0xff00 >> (8 * emLen - emBits)) & 0xff;

    if ((maskedDB.charCodeAt(0) & mask) !== 0) {
        throw "bits beyond keysize not zero";
    }

    var dbMask = pss_mgf1_str(H, maskedDB.length, hashFunc);
    var DB = [];

    for (i = 0; i < maskedDB.length; i += 1) {
        DB[i] = maskedDB.charCodeAt(i) ^ dbMask.charCodeAt(i);
    }

    DB[0] &= ~mask;

    var checkLen = emLen - hLen - sLen - 2;

    for (i = 0; i < checkLen; i += 1) {
        if (DB[i] !== 0x00) {
            throw "leftmost octets not zero";
        }
    }

    if (DB[checkLen] !== 0x01) {
        throw "0x01 marker not found";
    }

    return H === hextorstr(hashFunc(rstrtohex('\x00\x00\x00\x00\x00\x00\x00\x00' + mHash +
				     String.fromCharCode.apply(String, DB.slice(-sLen)))));
}

RSAKey.prototype.signWithMessageHash = _rsasign_signWithMessageHash;
RSAKey.prototype.signString = _rsasign_signString;
RSAKey.prototype.signStringWithSHA1 = _rsasign_signStringWithSHA1;
RSAKey.prototype.signStringWithSHA256 = _rsasign_signStringWithSHA256;
RSAKey.prototype.sign = _rsasign_signString;
RSAKey.prototype.signWithSHA1 = _rsasign_signStringWithSHA1;
RSAKey.prototype.signWithSHA256 = _rsasign_signStringWithSHA256;

RSAKey.prototype.signWithMessageHashPSS = _rsasign_signWithMessageHashPSS;
RSAKey.prototype.signStringPSS = _rsasign_signStringPSS;
RSAKey.prototype.signPSS = _rsasign_signStringPSS;
RSAKey.SALT_LEN_HLEN = -1;
RSAKey.SALT_LEN_MAX = -2;

RSAKey.prototype.verifyWithMessageHash = _rsasign_verifyWithMessageHash;
RSAKey.prototype.verifyString = _rsasign_verifyString;
RSAKey.prototype.verifyHexSignatureForMessage = _rsasign_verifyHexSignatureForMessage;
RSAKey.prototype.verify = _rsasign_verifyString;
RSAKey.prototype.verifyHexSignatureForByteArrayMessage = _rsasign_verifyHexSignatureForMessage;

RSAKey.prototype.verifyWithMessageHashPSS = _rsasign_verifyWithMessageHashPSS;
RSAKey.prototype.verifyStringPSS = _rsasign_verifyStringPSS;
RSAKey.prototype.verifyPSS = _rsasign_verifyStringPSS;
RSAKey.SALT_LEN_RECOVER = -2;

/**
 * @name RSAKey
 * @class key of RSA public key algorithm
 * @description Tom Wu's RSA Key class and extension
 */

/*! x509-1.1.2.js (c) 2012 Kenji Urushima | kjur.github.com/jsrsasign/license
 */
/* 
 * x509.js - X509 class to read subject public key from certificate.
 *
 * Copyright (c) 2010-2013 Kenji Urushima (kenji.urushima@gmail.com)
 *
 * This software is licensed under the terms of the MIT License.
 * http://kjur.github.com/jsrsasign/license
 *
 * The above copyright and license notice shall be 
 * included in all copies or substantial portions of the Software.
 */

/**
 * @fileOverview
 * @name x509-1.1.js
 * @author Kenji Urushima kenji.urushima@gmail.com
 * @version x509 1.1.2 (2013-Oct-06)
 * @since jsrsasign 1.x.x
 * @license <a href="http://kjur.github.io/jsrsasign/license/">MIT License</a>
 */

/*
 * Depends:
 *   base64.js
 *   rsa.js
 *   asn1hex.js
 */

/**
 * X.509 certificate class.<br/>
 * @class X.509 certificate class
 * @property {RSAKey} subjectPublicKeyRSA Tom Wu's RSAKey object
 * @property {String} subjectPublicKeyRSA_hN hexadecimal string for modulus of RSA public key
 * @property {String} subjectPublicKeyRSA_hE hexadecimal string for public exponent of RSA public key
 * @property {String} hex hexacedimal string for X.509 certificate.
 * @author Kenji Urushima
 * @version 1.0.1 (08 May 2012)
 * @see <a href="http://kjur.github.com/jsrsasigns/">'jwrsasign'(RSA Sign JavaScript Library) home page http://kjur.github.com/jsrsasign/</a>
 */
function X509() {
    this.subjectPublicKeyRSA = null;
    this.subjectPublicKeyRSA_hN = null;
    this.subjectPublicKeyRSA_hE = null;
    this.hex = null;

    // ===== get basic fields from hex =====================================

    /**
     * get hexadecimal string of serialNumber field of certificate.<br/>
     * @name getSerialNumberHex
     * @memberOf X509#
     * @function
     */
    this.getSerialNumberHex = function() {
	return ASN1HEX.getDecendantHexVByNthList(this.hex, 0, [0, 1]);
    };

    /**
     * get hexadecimal string of issuer field of certificate.<br/>
     * @name getIssuerHex
     * @memberOf X509#
     * @function
     */
    this.getIssuerHex = function() {
	return ASN1HEX.getDecendantHexTLVByNthList(this.hex, 0, [0, 3]);
    };

    /**
     * get string of issuer field of certificate.<br/>
     * @name getIssuerString
     * @memberOf X509#
     * @function
     */
    this.getIssuerString = function() {
	return X509.hex2dn(ASN1HEX.getDecendantHexTLVByNthList(this.hex, 0, [0, 3]));
    };

    /**
     * get hexadecimal string of subject field of certificate.<br/>
     * @name getSubjectHex
     * @memberOf X509#
     * @function
     */
    this.getSubjectHex = function() {
	return ASN1HEX.getDecendantHexTLVByNthList(this.hex, 0, [0, 5]);
    };

    /**
     * get string of subject field of certificate.<br/>
     * @name getSubjectString
     * @memberOf X509#
     * @function
     */
    this.getSubjectString = function() {
	return X509.hex2dn(ASN1HEX.getDecendantHexTLVByNthList(this.hex, 0, [0, 5]));
    };

    /**
     * get notBefore field string of certificate.<br/>
     * @name getNotBefore
     * @memberOf X509#
     * @function
     */
    this.getNotBefore = function() {
	var s = ASN1HEX.getDecendantHexVByNthList(this.hex, 0, [0, 4, 0]);
	s = s.replace(/(..)/g, "%$1");
	s = decodeURIComponent(s);
	return s;
    };

    /**
     * get notAfter field string of certificate.<br/>
     * @name getNotAfter
     * @memberOf X509#
     * @function
     */
    this.getNotAfter = function() {
	var s = ASN1HEX.getDecendantHexVByNthList(this.hex, 0, [0, 4, 1]);
	s = s.replace(/(..)/g, "%$1");
	s = decodeURIComponent(s);
	return s;
    };

    // ===== read certificate public key ==========================

    // ===== read certificate =====================================
    /**
     * read PEM formatted X.509 certificate from string.<br/>
     * @name readCertPEM
     * @memberOf X509#
     * @function
     * @param {String} sCertPEM string for PEM formatted X.509 certificate
     */
    this.readCertPEM = function(sCertPEM) {
	var hCert = X509.pemToHex(sCertPEM);
	var a = X509.getPublicKeyHexArrayFromCertHex(hCert);
	var rsa = new RSAKey();
	rsa.setPublic(a[0], a[1]);
	this.subjectPublicKeyRSA = rsa;
	this.subjectPublicKeyRSA_hN = a[0];
	this.subjectPublicKeyRSA_hE = a[1];
	this.hex = hCert;
    };

    this.readCertPEMWithoutRSAInit = function(sCertPEM) {
	var hCert = X509.pemToHex(sCertPEM);
	var a = X509.getPublicKeyHexArrayFromCertHex(hCert);
	this.subjectPublicKeyRSA.setPublic(a[0], a[1]);
	this.subjectPublicKeyRSA_hN = a[0];
	this.subjectPublicKeyRSA_hE = a[1];
	this.hex = hCert;
    };
};

X509.pemToBase64 = function(sCertPEM) {
    var s = sCertPEM;
    s = s.replace("-----BEGIN CERTIFICATE-----", "");
    s = s.replace("-----END CERTIFICATE-----", "");
    s = s.replace(/[ \n]+/g, "");
    return s;
};

X509.pemToHex = function(sCertPEM) {
    var b64Cert = X509.pemToBase64(sCertPEM);
    var hCert = b64tohex(b64Cert);
    return hCert;
};

// NOTE: Without BITSTRING encapsulation.
X509.getSubjectPublicKeyPosFromCertHex = function(hCert) {
    var pInfo = X509.getSubjectPublicKeyInfoPosFromCertHex(hCert);
    if (pInfo == -1) return -1;    
    var a = ASN1HEX.getPosArrayOfChildren_AtObj(hCert, pInfo); 
    if (a.length != 2) return -1;
    var pBitString = a[1];
    if (hCert.substring(pBitString, pBitString + 2) != '03') return -1;
    var pBitStringV = ASN1HEX.getStartPosOfV_AtObj(hCert, pBitString);
    
    if (hCert.substring(pBitStringV, pBitStringV + 2) != '00') return -1;
    return pBitStringV + 2;
};

// NOTE: privateKeyUsagePeriod field of X509v2 not supported.
// NOTE: v1 and v3 supported
X509.getSubjectPublicKeyInfoPosFromCertHex = function(hCert) {
    var pTbsCert = ASN1HEX.getStartPosOfV_AtObj(hCert, 0);
    var a = ASN1HEX.getPosArrayOfChildren_AtObj(hCert, pTbsCert); 
    if (a.length < 1) return -1;
    if (hCert.substring(a[0], a[0] + 10) == "a003020102") { // v3
	if (a.length < 6) return -1;
	return a[6];
    } else {
	if (a.length < 5) return -1;
	return a[5];
    }
};

X509.getPublicKeyHexArrayFromCertHex = function(hCert) {
    var p = X509.getSubjectPublicKeyPosFromCertHex(hCert);
    var a = ASN1HEX.getPosArrayOfChildren_AtObj(hCert, p); 
    if (a.length != 2) return [];
    var hN = ASN1HEX.getHexOfV_AtObj(hCert, a[0]);
    var hE = ASN1HEX.getHexOfV_AtObj(hCert, a[1]);
    if (hN != null && hE != null) {
	return [hN, hE];
    } else {
	return [];
    }
};

X509.getHexTbsCertificateFromCert = function(hCert) {
    var pTbsCert = ASN1HEX.getStartPosOfV_AtObj(hCert, 0);
    return pTbsCert;
};

X509.getPublicKeyHexArrayFromCertPEM = function(sCertPEM) {
    var hCert = X509.pemToHex(sCertPEM);
    var a = X509.getPublicKeyHexArrayFromCertHex(hCert);
    return a;
};

X509.hex2dn = function(hDN) {
    var s = "";
    var a = ASN1HEX.getPosArrayOfChildren_AtObj(hDN, 0);
    for (var i = 0; i < a.length; i++) {
	var hRDN = ASN1HEX.getHexOfTLV_AtObj(hDN, a[i]);
	s = s + "/" + X509.hex2rdn(hRDN);
    }
    return s;
};

X509.hex2rdn = function(hRDN) {
    var hType = ASN1HEX.getDecendantHexTLVByNthList(hRDN, 0, [0, 0]);
    var hValue = ASN1HEX.getDecendantHexVByNthList(hRDN, 0, [0, 1]);
    var type = "";
    try { type = X509.DN_ATTRHEX[hType]; } catch (ex) { type = hType; }
    hValue = hValue.replace(/(..)/g, "%$1");
    var value = decodeURIComponent(hValue);
    return type + "=" + value;
};

X509.DN_ATTRHEX = {
    "0603550406": "C",
    "060355040a": "O",
    "060355040b": "OU",
    "0603550403": "CN",
    "0603550405": "SN",
    "0603550408": "ST",
    "0603550407": "L",
};

/**
 * get RSAKey/ECDSA public key object from PEM certificate string
 * @name getPublicKeyFromCertPEM
 * @memberOf X509
 * @function
 * @param {String} sCertPEM PEM formatted RSA/ECDSA/DSA X.509 certificate
 * @return returns RSAKey/KJUR.crypto.{ECDSA,DSA} object of public key
 * @since x509 1.1.1
 * @description
 * NOTE: DSA is also supported since x509 1.1.2.
 */
X509.getPublicKeyFromCertPEM = function(sCertPEM) {
    var info = X509.getPublicKeyInfoPropOfCertPEM(sCertPEM);

    if (info.algoid == "2a864886f70d010101") { // RSA
	var aRSA = KEYUTIL.parsePublicRawRSAKeyHex(info.keyhex);
	var key = new RSAKey();
	key.setPublic(aRSA.n, aRSA.e);
	return key;
    } else if (info.algoid == "2a8648ce3d0201") { // ECC
	var curveName = KJUR.crypto.OID.oidhex2name[info.algparam];
	var key = new KJUR.crypto.ECDSA({'curve': curveName, 'info': info.keyhex});
        key.setPublicKeyHex(info.keyhex);
	return key;
    } else if (info.algoid == "2a8648ce380401") { // DSA 1.2.840.10040.4.1
	var p = ASN1HEX.getVbyList(info.algparam, 0, [0], "02");
	var q = ASN1HEX.getVbyList(info.algparam, 0, [1], "02");
	var g = ASN1HEX.getVbyList(info.algparam, 0, [2], "02");
	var y = ASN1HEX.getHexOfV_AtObj(info.keyhex, 0);
	y = y.substr(2);
	var key = new KJUR.crypto.DSA();
	key.setPublic(new BigInteger(p, 16),
		      new BigInteger(q, 16),
		      new BigInteger(g, 16),
		      new BigInteger(y, 16));
	return key;
    } else {
	throw "unsupported key";
    }
};

/**
 * get public key information from PEM certificate
 * @name getPublicKeyInfoPropOfCertPEM
 * @memberOf X509
 * @function
 * @param {String} sCertPEM string of PEM formatted certificate
 * @return {Hash} hash of information for public key
 * @since x509 1.1.1
 * @description
 * Resulted associative array has following properties:
 * <ul>
 * <li>algoid - hexadecimal string of OID of asymmetric key algorithm</li>
 * <li>algparam - hexadecimal string of OID of ECC curve name or null</li>
 * <li>keyhex - hexadecimal string of key in the certificate</li>
 * </ul>
 * @since x509 1.1.1
 */
X509.getPublicKeyInfoPropOfCertPEM = function(sCertPEM) {
    var result = {};
    result.algparam = null;
    var hCert = X509.pemToHex(sCertPEM);

    // 1. Certificate ASN.1
    var a1 = ASN1HEX.getPosArrayOfChildren_AtObj(hCert, 0); 
    if (a1.length != 3)
	throw "malformed X.509 certificate PEM (code:001)"; // not 3 item of seq Cert

    // 2. tbsCertificate
    if (hCert.substr(a1[0], 2) != "30")
	throw "malformed X.509 certificate PEM (code:002)"; // tbsCert not seq 

    var a2 = ASN1HEX.getPosArrayOfChildren_AtObj(hCert, a1[0]); 

    // 3. subjectPublicKeyInfo
    if (a2.length < 7)
	throw "malformed X.509 certificate PEM (code:003)"; // no subjPubKeyInfo

    var a3 = ASN1HEX.getPosArrayOfChildren_AtObj(hCert, a2[6]); 

    if (a3.length != 2)
	throw "malformed X.509 certificate PEM (code:004)"; // not AlgId and PubKey

    // 4. AlgId
    var a4 = ASN1HEX.getPosArrayOfChildren_AtObj(hCert, a3[0]); 

    if (a4.length != 2)
	throw "malformed X.509 certificate PEM (code:005)"; // not 2 item in AlgId

    result.algoid = ASN1HEX.getHexOfV_AtObj(hCert, a4[0]);

    if (hCert.substr(a4[1], 2) == "06") { // EC
	result.algparam = ASN1HEX.getHexOfV_AtObj(hCert, a4[1]);
    } else if (hCert.substr(a4[1], 2) == "30") { // DSA
	result.algparam = ASN1HEX.getHexOfTLV_AtObj(hCert, a4[1]);
    }

    // 5. Public Key Hex
    if (hCert.substr(a3[1], 02) != "03")
	throw "malformed X.509 certificate PEM (code:006)"; // not bitstring

    var unusedBitAndKeyHex = ASN1HEX.getHexOfV_AtObj(hCert, a3[1]);
    result.keyhex = unusedBitAndKeyHex.substr(2);

    return result;
};

/*
X509.prototype.readCertPEM = _x509_readCertPEM;
X509.prototype.readCertPEMWithoutRSAInit = _x509_readCertPEMWithoutRSAInit;
X509.prototype.getSerialNumberHex = _x509_getSerialNumberHex;
X509.prototype.getIssuerHex = _x509_getIssuerHex;
X509.prototype.getSubjectHex = _x509_getSubjectHex;
X509.prototype.getIssuerString = _x509_getIssuerString;
X509.prototype.getSubjectString = _x509_getSubjectString;
X509.prototype.getNotBefore = _x509_getNotBefore;
X509.prototype.getNotAfter = _x509_getNotAfter;
*/

/*! pkcs5pkey-1.0.5.js (c) 2013 Kenji Urushima | kjur.github.com/jsrsasign/license
 */
/*
 * pkcs5pkey.js - reading passcode protected PKCS#5 PEM formatted RSA private key
 *
 * Copyright (c) 2013 Kenji Urushima (kenji.urushima@gmail.com)
 *
 * This software is licensed under the terms of the MIT License.
 * http://kjur.github.com/jsrsasign/license
 *
 * The above copyright and license notice shall be 
 * included in all copies or substantial portions of the Software.
 */
/**
 * @fileOverview
 * @name pkcs5pkey-1.0.js
 * @author Kenji Urushima kenji.urushima@gmail.com
 * @version pkcs5pkey 1.0.5 (2013-Aug-20)
 * @since jsrsasign 2.0.0
 * @license <a href="http://kjur.github.io/jsrsasign/license/">MIT License</a>
 */

/**
 * @name PKCS5PKEY
 * @class class for PKCS#5 and PKCS#8 private key 
 * @deprecated Since jsrsasign 4.1.3. Please use KEYUTIL class.
 * @description 
 * <br/>
 * {@link PKCS5PKEY} class has following features:
 * <ul>
 * <li>read and parse PEM formatted encrypted PKCS#5 private key
 * <li>generate PEM formatted encrypted PKCS#5 private key
 * <li>read and parse PEM formatted plain PKCS#8 private key
 * <li>read and parse PEM formatted encrypted PKCS#8 private key by PBKDF2/HmacSHA1/3DES
 * </ul>
 * Currently supports only RSA private key and
 * following symmetric key algorithms to protect private key.
 * <ul>
 * <li>DES-EDE3-CBC</li>
 * <li>AES-256-CBC</li>
 * <li>AES-192-CBC</li>
 * <li>AES-128-CBC</li>
 * </ul>
 * 
 * <h5>METHOD SUMMARY</h5>
 * <dl>
 * <dt><b>PKCS8 PRIVATE KEY METHODS</b><dd>
 * <ul>
 * <li>{@link PKCS5PKEY.getRSAKeyFromPlainPKCS8PEM} - convert plain PKCS8 PEM to RSAKey object</li>
 * <li>{@link PKCS5PKEY.getRSAKeyFromPlainPKCS8Hex} - convert plain PKCS8 hexadecimal data to RSAKey object</li>
 * <li>{@link PKCS5PKEY.getRSAKeyFromEncryptedPKCS8PEM} - convert encrypted PKCS8 PEM to RSAKey object</li>
 * <li>{@link PKCS5PKEY.getPlainPKCS8HexFromEncryptedPKCS8PEM} - convert encrypted PKCS8 PEM to plain PKCS8 Hex</li>
 * </ul>
 * <dt><b>PKCS5 PRIVATE KEY METHODS</b><dd>
 * <ul>
 * <li>{@link PKCS5PKEY.getRSAKeyFromEncryptedPKCS5PEM} - convert encrypted PKCS5 PEM to RSAKey object</li>
 * <li>{@link PKCS5PKEY.getEncryptedPKCS5PEMFromRSAKey} - convert RSAKey object to encryped PKCS5 PEM</li>
 * <li>{@link PKCS5PKEY.newEncryptedPKCS5PEM} - generate RSAKey and its encrypted PKCS5 PEM</li>
 * </ul>
 * <dt><b>PKCS8 PUBLIC KEY METHODS</b><dd>
 * <ul>
 * <li>{@link PKCS5PKEY.getKeyFromPublicPKCS8PEM} - convert encrypted PKCS8 PEM to RSAKey/ECDSA object</li>
 * <li>{@link PKCS5PKEY.getKeyFromPublicPKCS8Hex} - convert encrypted PKCS8 Hex to RSAKey/ECDSA object</li>
 * <li>{@link PKCS5PKEY.getRSAKeyFromPublicPKCS8PEM} - convert encrypted PKCS8 PEM to RSAKey object</li>
 * <li>{@link PKCS5PKEY.getRSAKeyFromPublicPKCS8Hex} - convert encrypted PKCS8 Hex to RSAKey object</li>
 * </ul>
 * <dt><b>UTITILIY METHODS</b><dd>
 * <ul>
 * <li>{@link PKCS5PKEY.getHexFromPEM} - convert PEM string to hexadecimal data</li>
 * <li>{@link PKCS5PKEY.getDecryptedKeyHexByKeyIV} - decrypt key by sharedKey and IV</li>
 * </ul>
 * </dl>
 * 
 * @example
 * Here is an example of PEM formatted encrypted PKCS#5 private key.
 * -----BEGIN RSA PRIVATE KEY-----
 * Proc-Type: 4,ENCRYPTED
 * DEK-Info: AES-256-CBC,40555967F759530864FE022E257DE34E
 *
 * jV7uXajRw4cccDaliagcqiLOiQEUCe19l761pXRxzgQP+DH4rCi12T4puTdZyy6l
 *          ...(snip)...
 * qxLS+BASmyGm4DME6m+kltZ12LXwPgNU6+d+XQ4NXSA=
 *-----END RSA PRIVATE KEY-----
 */
var PKCS5PKEY = function() {
    // *****************************************************************
    // *** PRIVATE PROPERTIES AND METHODS *******************************
    // *****************************************************************
    // shared key decryption ------------------------------------------
    var decryptAES = function(dataHex, keyHex, ivHex) {
	return decryptGeneral(CryptoJS.AES, dataHex, keyHex, ivHex);
    };

    var decrypt3DES = function(dataHex, keyHex, ivHex) {
	return decryptGeneral(CryptoJS.TripleDES, dataHex, keyHex, ivHex);
    };

    var decryptGeneral = function(f, dataHex, keyHex, ivHex) {
	var data = CryptoJS.enc.Hex.parse(dataHex);
	var key = CryptoJS.enc.Hex.parse(keyHex);
	var iv = CryptoJS.enc.Hex.parse(ivHex);
	var encrypted = {};
	encrypted.key = key;
	encrypted.iv = iv;
	encrypted.ciphertext = data;
	var decrypted = f.decrypt(encrypted, key, { iv: iv });
	return CryptoJS.enc.Hex.stringify(decrypted);
    };

    // shared key decryption ------------------------------------------
    var encryptAES = function(dataHex, keyHex, ivHex) {
	return encryptGeneral(CryptoJS.AES, dataHex, keyHex, ivHex);
    };

    var encrypt3DES = function(dataHex, keyHex, ivHex) {
	return encryptGeneral(CryptoJS.TripleDES, dataHex, keyHex, ivHex);
    };

    var encryptGeneral = function(f, dataHex, keyHex, ivHex) {
	var data = CryptoJS.enc.Hex.parse(dataHex);
	var key = CryptoJS.enc.Hex.parse(keyHex);
	var iv = CryptoJS.enc.Hex.parse(ivHex);
	var msg = {};
	var encryptedHex = f.encrypt(data, key, { iv: iv });
        var encryptedWA = CryptoJS.enc.Hex.parse(encryptedHex.toString());
        var encryptedB64 = CryptoJS.enc.Base64.stringify(encryptedWA);
	return encryptedB64;
    };

    // other methods and properties ----------------------------------------
    var ALGLIST = {
	'AES-256-CBC': { 'proc': decryptAES, 'eproc': encryptAES, keylen: 32, ivlen: 16 },
	'AES-192-CBC': { 'proc': decryptAES, 'eproc': encryptAES, keylen: 24, ivlen: 16 },
	'AES-128-CBC': { 'proc': decryptAES, 'eproc': encryptAES, keylen: 16, ivlen: 16 },
	'DES-EDE3-CBC': { 'proc': decrypt3DES, 'eproc': encrypt3DES, keylen: 24, ivlen: 8 }
    };

    var getFuncByName = function(algName) {
	return ALGLIST[algName]['proc'];
    };

    var _generateIvSaltHex = function(numBytes) {
	var wa = CryptoJS.lib.WordArray.random(numBytes);
	var hex = CryptoJS.enc.Hex.stringify(wa);
	return hex;
    };

    var _parsePKCS5PEM = function(sPKCS5PEM) {
	var info = {};
	if (sPKCS5PEM.match(new RegExp("DEK-Info: ([^,]+),([0-9A-Fa-f]+)", "m"))) {
	    info.cipher = RegExp.$1;
	    info.ivsalt = RegExp.$2;
	}
	if (sPKCS5PEM.match(new RegExp("-----BEGIN ([A-Z]+) PRIVATE KEY-----"))) {
	    info.type = RegExp.$1;
	}
	var i1 = -1;
	var lenNEWLINE = 0;
	if (sPKCS5PEM.indexOf("\r\n\r\n") != -1) {
	    i1 = sPKCS5PEM.indexOf("\r\n\r\n");
	    lenNEWLINE = 2;
	}
	if (sPKCS5PEM.indexOf("\n\n") != -1) {
	    i1 = sPKCS5PEM.indexOf("\n\n");
	    lenNEWLINE = 1;
	}
	var i2 = sPKCS5PEM.indexOf("-----END");
	if (i1 != -1 && i2 != -1) {
	    var s = sPKCS5PEM.substring(i1 + lenNEWLINE * 2, i2 - lenNEWLINE);
	    s = s.replace(/\s+/g, '');
	    info.data = s;
	}
	return info;
    };

    var _getKeyAndUnusedIvByPasscodeAndIvsalt = function(algName, passcode, ivsaltHex) {
	//alert("ivsaltHex(2) = " + ivsaltHex);
	var saltHex = ivsaltHex.substring(0, 16);
	//alert("salt = " + saltHex);
	    
	var salt = CryptoJS.enc.Hex.parse(saltHex);
	var data = CryptoJS.enc.Utf8.parse(passcode);
	//alert("salt = " + salt);
	//alert("data = " + data);

	var nRequiredBytes = ALGLIST[algName]['keylen'] + ALGLIST[algName]['ivlen'];
	var hHexValueJoined = '';
	var hLastValue = null;
	//alert("nRequiredBytes = " + nRequiredBytes);
	for (;;) {
	    var h = CryptoJS.algo.MD5.create();
	    if (hLastValue != null) {
		h.update(hLastValue);
	    }
	    h.update(data);
	    h.update(salt);
	    hLastValue = h.finalize();
	    hHexValueJoined = hHexValueJoined + CryptoJS.enc.Hex.stringify(hLastValue);
	    //alert("joined = " + hHexValueJoined);
	    if (hHexValueJoined.length >= nRequiredBytes * 2) {
		break;
	    }
	}
	var result = {};
	result.keyhex = hHexValueJoined.substr(0, ALGLIST[algName]['keylen'] * 2);
	result.ivhex = hHexValueJoined.substr(ALGLIST[algName]['keylen'] * 2, ALGLIST[algName]['ivlen'] * 2);
	return result;
    };

    /*
     * @param {String} privateKeyB64 base64 string of encrypted private key
     * @param {String} sharedKeyAlgName algorithm name of shared key encryption
     * @param {String} sharedKeyHex hexadecimal string of shared key to encrypt
     * @param {String} ivsaltHex hexadecimal string of IV and salt
     * @param {String} hexadecimal string of decrypted private key
     */
    var _decryptKeyB64 = function(privateKeyB64, sharedKeyAlgName, sharedKeyHex, ivsaltHex) {
	var privateKeyWA = CryptoJS.enc.Base64.parse(privateKeyB64);
	var privateKeyHex = CryptoJS.enc.Hex.stringify(privateKeyWA);
	var f = ALGLIST[sharedKeyAlgName]['proc'];
	var decryptedKeyHex = f(privateKeyHex, sharedKeyHex, ivsaltHex);
	return decryptedKeyHex;
    };
    
    /*
     * @param {String} privateKeyHex hexadecimal string of private key
     * @param {String} sharedKeyAlgName algorithm name of shared key encryption
     * @param {String} sharedKeyHex hexadecimal string of shared key to encrypt
     * @param {String} ivsaltHex hexadecimal string of IV and salt
     * @param {String} base64 string of encrypted private key
     */
    var _encryptKeyHex = function(privateKeyHex, sharedKeyAlgName, sharedKeyHex, ivsaltHex) {
	var f = ALGLIST[sharedKeyAlgName]['eproc'];
	var encryptedKeyB64 = f(privateKeyHex, sharedKeyHex, ivsaltHex);
	return encryptedKeyB64;
    };

    // *****************************************************************
    // *** PUBLIC PROPERTIES AND METHODS *******************************
    // *****************************************************************
    return {
        // -- UTILITY METHODS ------------------------------------------------------------
	/**
         * decrypt private key by shared key
	 * @name version
	 * @memberOf PKCS5PKEY
	 * @property {String} version
	 * @description version string of PKCS5PKEY class
	 */
	version: "1.0.5",

	/**
         * get hexacedimal string of PEM format
	 * @name getHexFromPEM
	 * @memberOf PKCS5PKEY
	 * @function
	 * @param {String} sPEM PEM formatted string
	 * @param {String} sHead PEM header string without BEGIN/END
	 * @return {String} hexadecimal string data of PEM contents
	 * @since pkcs5pkey 1.0.5
	 */
        getHexFromPEM: function(sPEM, sHead) {
	    var s = sPEM;
	    if (s.indexOf("BEGIN " + sHead) == -1) {
		throw "can't find PEM header: " + sHead;
	    }
	    s = s.replace("-----BEGIN " + sHead + "-----", "");
	    s = s.replace("-----END " + sHead + "-----", "");
	    var sB64 = s.replace(/\s+/g, '');
            var dataHex = b64tohex(sB64);
	    return dataHex;
	},

	/**
         * decrypt private key by shared key
	 * @name getDecryptedKeyHexByKeyIV
	 * @memberOf PKCS5PKEY
	 * @function
	 * @param {String} encryptedKeyHex hexadecimal string of encrypted private key
	 * @param {String} algName name of symmetric key algorithm (ex. 'DES-EBE3-CBC')
	 * @param {String} sharedKeyHex hexadecimal string of symmetric key
	 * @param {String} ivHex hexadecimal string of initial vector(IV).
	 * @return {String} hexadecimal string of decrypted privated key
	 */
	getDecryptedKeyHexByKeyIV: function(encryptedKeyHex, algName, sharedKeyHex, ivHex) {
	    var f1 = getFuncByName(algName);
	    return f1(encryptedKeyHex, sharedKeyHex, ivHex);
	},

	/**
         * parse PEM formatted passcode protected PKCS#5 private key
	 * @name parsePKCS5PEM
	 * @memberOf PKCS5PKEY
	 * @function
	 * @param {String} sEncryptedPEM PEM formatted protected passcode protected PKCS#5 private key
	 * @return {Hash} hash of key information
	 * @description
         * Resulted hash has following attributes.
	 * <ul>
	 * <li>cipher - symmetric key algorithm name (ex. 'DES-EBE3-CBC', 'AES-256-CBC')</li>
	 * <li>ivsalt - IV used for decrypt. Its heading 8 bytes will be used for passcode salt.</li>
	 * <li>type - asymmetric key algorithm name of private key described in PEM header.</li>
	 * <li>data - base64 encoded encrypted private key.</li>
	 * </ul>
         *
	 */
        parsePKCS5PEM: function(sPKCS5PEM) {
	    return _parsePKCS5PEM(sPKCS5PEM);
	},

	/**
         * the same function as OpenSSL EVP_BytsToKey to generate shared key and IV
	 * @name getKeyAndUnusedIvByPasscodeAndIvsalt
	 * @memberOf PKCS5PKEY
	 * @function
	 * @param {String} algName name of symmetric key algorithm (ex. 'DES-EBE3-CBC')
	 * @param {String} passcode passcode to decrypt private key (ex. 'password')
	 * @param {String} hexadecimal string of IV. heading 8 bytes will be used for passcode salt
	 * @return {Hash} hash of key and unused IV (ex. {keyhex:2fe3..., ivhex:3fad..})
	 */
	getKeyAndUnusedIvByPasscodeAndIvsalt: function(algName, passcode, ivsaltHex) {
	    return _getKeyAndUnusedIvByPasscodeAndIvsalt(algName, passcode, ivsaltHex);
	},

        decryptKeyB64: function(privateKeyB64, sharedKeyAlgName, sharedKeyHex, ivsaltHex) {
	    return _decryptKeyB64(privateKeyB64, sharedKeyAlgName, sharedKeyHex, ivsaltHex);
        },

	/**
         * decrypt PEM formatted protected PKCS#5 private key with passcode
	 * @name getDecryptedKeyHex
	 * @memberOf PKCS5PKEY
	 * @function
	 * @param {String} sEncryptedPEM PEM formatted protected passcode protected PKCS#5 private key
	 * @param {String} passcode passcode to decrypt private key (ex. 'password')
	 * @return {String} hexadecimal string of decrypted RSA priavte key
	 */
	getDecryptedKeyHex: function(sEncryptedPEM, passcode) {
	    // 1. parse pem
	    var info = _parsePKCS5PEM(sEncryptedPEM);
	    var publicKeyAlgName = info.type;
	    var sharedKeyAlgName = info.cipher;
	    var ivsaltHex = info.ivsalt;
	    var privateKeyB64 = info.data;
	    //alert("ivsaltHex = " + ivsaltHex);

	    // 2. generate shared key
	    var sharedKeyInfo = _getKeyAndUnusedIvByPasscodeAndIvsalt(sharedKeyAlgName, passcode, ivsaltHex);
	    var sharedKeyHex = sharedKeyInfo.keyhex;
	    //alert("sharedKeyHex = " + sharedKeyHex);

	    // 3. decrypt private key
            var decryptedKey = _decryptKeyB64(privateKeyB64, sharedKeyAlgName, sharedKeyHex, ivsaltHex);
	    return decryptedKey;
	},

	/**
         * read PEM formatted encrypted PKCS#5 private key and returns RSAKey object
	 * @name getRSAKeyFromEncryptedPKCS5PEM
	 * @memberOf PKCS5PKEY
	 * @function
	 * @param {String} sEncryptedP5PEM PEM formatted encrypted PKCS#5 private key
	 * @param {String} passcode passcode to decrypt private key
	 * @return {RSAKey} loaded RSAKey object of RSA private key
         * @since pkcs5pkey 1.0.2
	 */
	getRSAKeyFromEncryptedPKCS5PEM: function(sEncryptedP5PEM, passcode) {
	    var hPKey = this.getDecryptedKeyHex(sEncryptedP5PEM, passcode);
	    var rsaKey = new RSAKey();
	    rsaKey.readPrivateKeyFromASN1HexString(hPKey);
	    return rsaKey;
	},

	/**
         * get PEM formatted encrypted PKCS#5 private key from hexadecimal string of plain private key
	 * @name getEryptedPKCS5PEMFromPrvKeyHex
	 * @memberOf PKCS5PKEY
	 * @function
	 * @param {String} hPrvKey hexadecimal string of plain private key
	 * @param {String} passcode pass code to protect private key (ex. password)
	 * @param {String} sharedKeyAlgName algorithm name to protect private key (ex. AES-256-CBC)
	 * @param {String} ivsaltHex hexadecimal string of IV and salt
	 * @return {String} string of PEM formatted encrypted PKCS#5 private key
         * @since pkcs5pkey 1.0.2
	 * @description
	 * <br/>
	 * generate PEM formatted encrypted PKCS#5 private key by hexadecimal string encoded
	 * ASN.1 object of plain RSA private key.
	 * Following arguments can be omitted.
	 * <ul>
	 * <li>alg - AES-256-CBC will be used if omitted.</li>
	 * <li>ivsaltHex - automatically generate IV and salt which length depends on algorithm</li>
	 * </ul>
	 * @example
	 * var pem = 
         *   PKCS5PKEY.getEryptedPKCS5PEMFromPrvKeyHex(plainKeyHex, "password");
	 * var pem2 = 
         *   PKCS5PKEY.getEryptedPKCS5PEMFromPrvKeyHex(plainKeyHex, "password", "AES-128-CBC");
	 * var pem3 = 
         *   PKCS5PKEY.getEryptedPKCS5PEMFromPrvKeyHex(plainKeyHex, "password", "AES-128-CBC", "1f3d02...");
	 */
	getEryptedPKCS5PEMFromPrvKeyHex: function(hPrvKey, passcode, sharedKeyAlgName, ivsaltHex) {
	    var sPEM = "";

	    // 1. set sharedKeyAlgName if undefined (default AES-256-CBC)
	    if (typeof sharedKeyAlgName == "undefined" || sharedKeyAlgName == null) {
		sharedKeyAlgName = "AES-256-CBC";
	    }
	    if (typeof ALGLIST[sharedKeyAlgName] == "undefined")
		throw "PKCS5PKEY unsupported algorithm: " + sharedKeyAlgName;

	    // 2. set ivsaltHex if undefined
	    if (typeof ivsaltHex == "undefined" || ivsaltHex == null) {
		var ivlen = ALGLIST[sharedKeyAlgName]['ivlen'];
		var randIV = _generateIvSaltHex(ivlen);
		ivsaltHex = randIV.toUpperCase();
	    }

	    // 3. get shared key
            //alert("ivsalthex=" + ivsaltHex);
	    var sharedKeyInfo = _getKeyAndUnusedIvByPasscodeAndIvsalt(sharedKeyAlgName, passcode, ivsaltHex);
	    var sharedKeyHex = sharedKeyInfo.keyhex;
	    // alert("sharedKeyHex = " + sharedKeyHex);

            // 3. get encrypted Key in Base64
            var encryptedKeyB64 = _encryptKeyHex(hPrvKey, sharedKeyAlgName, sharedKeyHex, ivsaltHex);

	    var pemBody = encryptedKeyB64.replace(/(.{64})/g, "$1\r\n");
	    var sPEM = "-----BEGIN RSA PRIVATE KEY-----\r\n";
	    sPEM += "Proc-Type: 4,ENCRYPTED\r\n";
	    sPEM += "DEK-Info: " + sharedKeyAlgName + "," + ivsaltHex + "\r\n";
	    sPEM += "\r\n";
	    sPEM += pemBody;
	    sPEM += "\r\n-----END RSA PRIVATE KEY-----\r\n";

	    return sPEM;
        },

	/**
         * get PEM formatted encrypted PKCS#5 private key from RSAKey object of private key
	 * @name getEryptedPKCS5PEMFromRSAKey
	 * @memberOf PKCS5PKEY
	 * @function
	 * @param {RSAKey} pKey RSAKey object of private key
	 * @param {String} passcode pass code to protect private key (ex. password)
	 * @param {String} alg algorithm name to protect private key (default AES-256-CBC)
	 * @param {String} ivsaltHex hexadecimal string of IV and salt (default generated random IV)
	 * @return {String} string of PEM formatted encrypted PKCS#5 private key
         * @since pkcs5pkey 1.0.2
	 * @description
	 * <br/>
	 * generate PEM formatted encrypted PKCS#5 private key by
	 * {@link RSAKey} object of RSA private key and passcode.
	 * Following argument can be omitted.
	 * <ul>
	 * <li>alg - AES-256-CBC will be used if omitted.</li>
	 * <li>ivsaltHex - automatically generate IV and salt which length depends on algorithm</li>
	 * </ul>
	 * @example
	 * var pkey = new RSAKey();
	 * pkey.generate(1024, '10001'); // generate 1024bit RSA private key with public exponent 'x010001'
	 * var pem = PKCS5PKEY.getEryptedPKCS5PEMFromRSAKey(pkey, "password");
	 */
        getEryptedPKCS5PEMFromRSAKey: function(pKey, passcode, alg, ivsaltHex) {
	    var version = new KJUR.asn1.DERInteger({'int': 0});
	    var n = new KJUR.asn1.DERInteger({'bigint': pKey.n});
	    var e = new KJUR.asn1.DERInteger({'int': pKey.e});
	    var d = new KJUR.asn1.DERInteger({'bigint': pKey.d});
	    var p = new KJUR.asn1.DERInteger({'bigint': pKey.p});
	    var q = new KJUR.asn1.DERInteger({'bigint': pKey.q});
	    var dmp1 = new KJUR.asn1.DERInteger({'bigint': pKey.dmp1});
	    var dmq1 = new KJUR.asn1.DERInteger({'bigint': pKey.dmq1});
	    var coeff = new KJUR.asn1.DERInteger({'bigint': pKey.coeff});
	    var seq = new KJUR.asn1.DERSequence({'array': [version, n, e, d, p, q, dmp1, dmq1, coeff]});
	    var hex = seq.getEncodedHex();
	    return this.getEryptedPKCS5PEMFromPrvKeyHex(hex, passcode, alg, ivsaltHex);
        },

	/**
         * generate RSAKey and PEM formatted encrypted PKCS#5 private key
	 * @name newEncryptedPKCS5PEM
	 * @memberOf PKCS5PKEY
	 * @function
	 * @param {String} passcode pass code to protect private key (ex. password)
	 * @param {Integer} keyLen key bit length of RSA key to be generated. (default 1024)
	 * @param {String} hPublicExponent hexadecimal string of public exponent (default 10001)
	 * @param {String} alg shared key algorithm to encrypt private key (default AES-258-CBC)
	 * @return {String} string of PEM formatted encrypted PKCS#5 private key
         * @since pkcs5pkey 1.0.2
	 * @example
	 * var pem1 = PKCS5PKEY.newEncryptedPKCS5PEM("password");           // RSA1024bit/10001/AES-256-CBC
	 * var pem2 = PKCS5PKEY.newEncryptedPKCS5PEM("password", 512);      // RSA 512bit/10001/AES-256-CBC
	 * var pem3 = PKCS5PKEY.newEncryptedPKCS5PEM("password", 512, '3'); // RSA 512bit/    3/AES-256-CBC
	 */
	newEncryptedPKCS5PEM: function(passcode, keyLen, hPublicExponent, alg) {
	    if (typeof keyLen == "undefined" || keyLen == null) {
		keyLen = 1024;
	    }
	    if (typeof hPublicExponent == "undefined" || hPublicExponent == null) {
		hPublicExponent = '10001';
	    }
	    var pKey = new RSAKey();
	    pKey.generate(keyLen, hPublicExponent);
	    var pem = null;
	    if (typeof alg == "undefined" || alg == null) {
		pem = this.getEncryptedPKCS5PEMFromRSAKey(pkey, passcode);
	    } else {
		pem = this.getEncryptedPKCS5PEMFromRSAKey(pkey, passcode, alg);
	    }
	    return pem;
        },

	// === PKCS8 ===============================================================

	/**
         * read PEM formatted unencrypted PKCS#8 private key and returns RSAKey object
	 * @name getRSAKeyFromPlainPKCS8PEM
	 * @memberOf PKCS5PKEY
	 * @function
	 * @param {String} pkcs8PEM PEM formatted unencrypted PKCS#8 private key
	 * @return {RSAKey} loaded RSAKey object of RSA private key
         * @since pkcs5pkey 1.0.1
	 */
        getRSAKeyFromPlainPKCS8PEM: function(pkcs8PEM) {
            if (pkcs8PEM.match(/ENCRYPTED/))
                throw "pem shall be not ENCRYPTED";
            var prvKeyHex = this.getHexFromPEM(pkcs8PEM, "PRIVATE KEY");
            var rsaKey = this.getRSAKeyFromPlainPKCS8Hex(prvKeyHex);
	    return rsaKey;
        },

	/**
         * provide hexadecimal string of unencrypted PKCS#8 private key and returns RSAKey object
	 * @name getRSAKeyFromPlainPKCS8Hex
	 * @memberOf PKCS5PKEY
	 * @function
	 * @param {String} prvKeyHex hexadecimal string of unencrypted PKCS#8 private key
	 * @return {RSAKey} loaded RSAKey object of RSA private key
         * @since pkcs5pkey 1.0.3
	 */
        getRSAKeyFromPlainPKCS8Hex: function(prvKeyHex) {
	    var a1 = ASN1HEX.getPosArrayOfChildren_AtObj(prvKeyHex, 0);
	    if (a1.length != 3)
		throw "outer DERSequence shall have 3 elements: " + a1.length;
            var algIdTLV =ASN1HEX.getHexOfTLV_AtObj(prvKeyHex, a1[1]);
	    if (algIdTLV != "300d06092a864886f70d0101010500") // AlgId rsaEncryption
		throw "PKCS8 AlgorithmIdentifier is not rsaEnc: " + algIdTLV;
            var algIdTLV = ASN1HEX.getHexOfTLV_AtObj(prvKeyHex, a1[1]);
	    var octetStr = ASN1HEX.getHexOfTLV_AtObj(prvKeyHex, a1[2]);
	    var p5KeyHex = ASN1HEX.getHexOfV_AtObj(octetStr, 0);
            //alert(p5KeyHex);
	    var rsaKey = new RSAKey();
	    rsaKey.readPrivateKeyFromASN1HexString(p5KeyHex);
	    return rsaKey;
        },

	/**
         * generate PBKDF2 key hexstring with specified passcode and information
	 * @name parseHexOfEncryptedPKCS8
	 * @memberOf PKCS5PKEY
	 * @function
	 * @param {String} passcode passcode to decrypto private key
	 * @return {Array} info associative array of PKCS#8 parameters
         * @since pkcs5pkey 1.0.3
	 * @description
	 * The associative array which is returned by this method has following properties:
	 * <ul>
	 * <li>info.pbkdf2Salt - hexadecimal string of PBKDF2 salt</li>
	 * <li>info.pkbdf2Iter - iteration count</li>
	 * <li>info.ciphertext - hexadecimal string of encrypted private key</li>
	 * <li>info.encryptionSchemeAlg - encryption algorithm name (currently TripleDES only)</li>
	 * <li>info.encryptionSchemeIV - initial vector for encryption algorithm</li>
	 * </ul>
	 * Currently, this method only supports PKCS#5v2.0 with PBES2/PBDKF2 of HmacSHA1 and TripleDES.
	 * <ul>
	 * <li>keyDerivationFunc = pkcs5PBKDF2 with HmacSHA1</li>
	 * <li>encryptionScheme = des-EDE3-CBC(i.e. TripleDES</li>
	 * </ul>
	 * @example
	 * // to convert plain PKCS#5 private key to encrypted PKCS#8 private
	 * // key with PBKDF2 with TripleDES
	 * % openssl pkcs8 -in plain_p5.pem -topk8 -v2 -des3 -out encrypted_p8.pem
	 */
        parseHexOfEncryptedPKCS8: function(sHEX) {
            var info = {};
	    
	    var a0 = ASN1HEX.getPosArrayOfChildren_AtObj(sHEX, 0);
	    if (a0.length != 2)
		throw "malformed format: SEQUENCE(0).items != 2: " + a0.length;

	    // 1. ciphertext
	    info.ciphertext = ASN1HEX.getHexOfV_AtObj(sHEX, a0[1]);

	    // 2. pkcs5PBES2
	    var a0_0 = ASN1HEX.getPosArrayOfChildren_AtObj(sHEX, a0[0]); 
	    if (a0_0.length != 2)
		throw "malformed format: SEQUENCE(0.0).items != 2: " + a0_0.length;

	    // 2.1 check if pkcs5PBES2(1 2 840 113549 1 5 13)
	    if (ASN1HEX.getHexOfV_AtObj(sHEX, a0_0[0]) != "2a864886f70d01050d")
		throw "this only supports pkcs5PBES2";

	    // 2.2 pkcs5PBES2 param
            var a0_0_1 = ASN1HEX.getPosArrayOfChildren_AtObj(sHEX, a0_0[1]); 
	    if (a0_0.length != 2)
		throw "malformed format: SEQUENCE(0.0.1).items != 2: " + a0_0_1.length;

	    // 2.2.1 encryptionScheme
	    var a0_0_1_1 = ASN1HEX.getPosArrayOfChildren_AtObj(sHEX, a0_0_1[1]); 
	    if (a0_0_1_1.length != 2)
		throw "malformed format: SEQUENCE(0.0.1.1).items != 2: " + a0_0_1_1.length;
	    if (ASN1HEX.getHexOfV_AtObj(sHEX, a0_0_1_1[0]) != "2a864886f70d0307")
		throw "this only supports TripleDES";
	    info.encryptionSchemeAlg = "TripleDES";

	    // 2.2.1.1 IV of encryptionScheme
	    info.encryptionSchemeIV = ASN1HEX.getHexOfV_AtObj(sHEX, a0_0_1_1[1]);

	    // 2.2.2 keyDerivationFunc
	    var a0_0_1_0 = ASN1HEX.getPosArrayOfChildren_AtObj(sHEX, a0_0_1[0]); 
	    if (a0_0_1_0.length != 2)
		throw "malformed format: SEQUENCE(0.0.1.0).items != 2: " + a0_0_1_0.length;
	    if (ASN1HEX.getHexOfV_AtObj(sHEX, a0_0_1_0[0]) != "2a864886f70d01050c")
		throw "this only supports pkcs5PBKDF2";

	    // 2.2.2.1 pkcs5PBKDF2 param
	    var a0_0_1_0_1 = ASN1HEX.getPosArrayOfChildren_AtObj(sHEX, a0_0_1_0[1]); 
	    if (a0_0_1_0_1.length < 2)
		throw "malformed format: SEQUENCE(0.0.1.0.1).items < 2: " + a0_0_1_0_1.length;

	    // 2.2.2.1.1 PBKDF2 salt
	    info.pbkdf2Salt = ASN1HEX.getHexOfV_AtObj(sHEX, a0_0_1_0_1[0]);

	    // 2.2.2.1.2 PBKDF2 iter
	    var iterNumHex = ASN1HEX.getHexOfV_AtObj(sHEX, a0_0_1_0_1[1]);
	    try {
		info.pbkdf2Iter = parseInt(iterNumHex, 16);
	    } catch(ex) {
		throw "malformed format pbkdf2Iter: " + iterNumHex;
	    }

	    return info;
	},

	/**
         * generate PBKDF2 key hexstring with specified passcode and information
	 * @name getPBKDF2KeyHexFromParam
	 * @memberOf PKCS5PKEY
	 * @function
	 * @param {Array} info result of {@link parseHexOfEncryptedPKCS8} which has preference of PKCS#8 file
	 * @param {String} passcode passcode to decrypto private key
	 * @return {String} hexadecimal string of PBKDF2 key
         * @since pkcs5pkey 1.0.3
	 * @description
	 * As for info, this uses following properties:
	 * <ul>
	 * <li>info.pbkdf2Salt - hexadecimal string of PBKDF2 salt</li>
	 * <li>info.pkbdf2Iter - iteration count</li>
	 * </ul>
	 * Currently, this method only supports PKCS#5v2.0 with PBES2/PBDKF2 of HmacSHA1 and TripleDES.
	 * <ul>
	 * <li>keyDerivationFunc = pkcs5PBKDF2 with HmacSHA1</li>
	 * <li>encryptionScheme = des-EDE3-CBC(i.e. TripleDES</li>
	 * </ul>
	 * @example
	 * // to convert plain PKCS#5 private key to encrypted PKCS#8 private
	 * // key with PBKDF2 with TripleDES
	 * % openssl pkcs8 -in plain_p5.pem -topk8 -v2 -des3 -out encrypted_p8.pem
	 */
	getPBKDF2KeyHexFromParam: function(info, passcode) {
	    var pbkdf2SaltWS = CryptoJS.enc.Hex.parse(info.pbkdf2Salt);
	    var pbkdf2Iter = info.pbkdf2Iter;
	    var pbkdf2KeyWS = CryptoJS.PBKDF2(passcode, 
					      pbkdf2SaltWS, 
					      { keySize: 192/32, iterations: pbkdf2Iter });
	    var pbkdf2KeyHex = CryptoJS.enc.Hex.stringify(pbkdf2KeyWS);
	    return pbkdf2KeyHex;
	},

	/**
         * read PEM formatted encrypted PKCS#8 private key and returns hexadecimal string of plain PKCS#8 private key
	 * @name getPlainPKCS8HexFromEncryptedPKCS8PEM
	 * @memberOf PKCS5PKEY
	 * @function
	 * @param {String} pkcs8PEM PEM formatted encrypted PKCS#8 private key
	 * @param {String} passcode passcode to decrypto private key
	 * @return {String} hexadecimal string of plain PKCS#8 private key
         * @since pkcs5pkey 1.0.3
	 * @description
	 * Currently, this method only supports PKCS#5v2.0 with PBES2/PBDKF2 of HmacSHA1 and TripleDES.
	 * <ul>
	 * <li>keyDerivationFunc = pkcs5PBKDF2 with HmacSHA1</li>
	 * <li>encryptionScheme = des-EDE3-CBC(i.e. TripleDES</li>
	 * </ul>
	 * @example
	 * // to convert plain PKCS#5 private key to encrypted PKCS#8 private
	 * // key with PBKDF2 with TripleDES
	 * % openssl pkcs8 -in plain_p5.pem -topk8 -v2 -des3 -out encrypted_p8.pem
	 */
	getPlainPKCS8HexFromEncryptedPKCS8PEM: function(pkcs8PEM, passcode) {
	    // 1. derHex - PKCS#8 private key encrypted by PBKDF2
            var derHex = this.getHexFromPEM(pkcs8PEM, "ENCRYPTED PRIVATE KEY");
	    // 2. info - PKCS#5 PBES info
	    var info = this.parseHexOfEncryptedPKCS8(derHex);
	    // 3. hKey - PBKDF2 key
	    var pbkdf2KeyHex = PKCS5PKEY.getPBKDF2KeyHexFromParam(info, passcode);
	    // 4. decrypt ciphertext by PBKDF2 key
	    var encrypted = {};
	    encrypted.ciphertext = CryptoJS.enc.Hex.parse(info.ciphertext);
	    var pbkdf2KeyWS = CryptoJS.enc.Hex.parse(pbkdf2KeyHex);
	    var des3IVWS = CryptoJS.enc.Hex.parse(info.encryptionSchemeIV);
	    var decWS = CryptoJS.TripleDES.decrypt(encrypted, pbkdf2KeyWS, { iv: des3IVWS });
	    var decHex = CryptoJS.enc.Hex.stringify(decWS);
	    return decHex;
	},

	/**
         * read PEM formatted encrypted PKCS#8 private key and returns RSAKey object
	 * @name getRSAKeyFromEncryptedPKCS8PEM
	 * @memberOf PKCS5PKEY
	 * @function
	 * @param {String} pkcs8PEM PEM formatted encrypted PKCS#8 private key
	 * @param {String} passcode passcode to decrypto private key
	 * @return {RSAKey} loaded RSAKey object of RSA private key
         * @since pkcs5pkey 1.0.3
	 * @description
	 * Currently, this method only supports PKCS#5v2.0 with PBES2/PBDKF2 of HmacSHA1 and TripleDES.
	 * <ul>
	 * <li>keyDerivationFunc = pkcs5PBKDF2 with HmacSHA1</li>
	 * <li>encryptionScheme = des-EDE3-CBC(i.e. TripleDES</li>
	 * </ul>
	 * @example
	 * // to convert plain PKCS#5 private key to encrypted PKCS#8 private
	 * // key with PBKDF2 with TripleDES
	 * % openssl pkcs8 -in plain_p5.pem -topk8 -v2 -des3 -out encrypted_p8.pem
	 */
        getRSAKeyFromEncryptedPKCS8PEM: function(pkcs8PEM, passcode) {
	    var prvKeyHex = this.getPlainPKCS8HexFromEncryptedPKCS8PEM(pkcs8PEM, passcode);
	    var rsaKey = this.getRSAKeyFromPlainPKCS8Hex(prvKeyHex);
	    return rsaKey;
        },

	/**
         * get RSAKey/ECDSA private key object from encrypted PEM PKCS#8 private key
	 * @name getKeyFromEncryptedPKCS8PEM
	 * @memberOf PKCS5PKEY
	 * @function
	 * @param {String} pkcs8PEM string of PEM formatted PKCS#8 private key
	 * @param {String} passcode passcode string to decrypt key
	 * @return {Object} RSAKey or KJUR.crypto.ECDSA private key object
	 * @since pkcs5pkey 1.0.5
	 */
        getKeyFromEncryptedPKCS8PEM: function(pkcs8PEM, passcode) {
	    var prvKeyHex = this.getPlainPKCS8HexFromEncryptedPKCS8PEM(pkcs8PEM, passcode);
	    var key = this.getKeyFromPlainPrivatePKCS8Hex(prvKeyHex);
	    return key;
        },

	/**
         * parse hexadecimal string of plain PKCS#8 private key
	 * @name parsePlainPrivatePKCS8Hex
	 * @memberOf PKCS5PKEY
	 * @function
	 * @param {String} pkcs8PrvHex hexadecimal string of PKCS#8 plain private key
	 * @return {Array} associative array of parsed key
	 * @since pkcs5pkey 1.0.5
	 * @description
	 * Resulted associative array has following properties:
	 * <ul>
	 * <li>algoid - hexadecimal string of OID of asymmetric key algorithm</li>
	 * <li>algparam - hexadecimal string of OID of ECC curve name or null</li>
	 * <li>keyidx - string starting index of key in pkcs8PrvHex</li>
	 * </ul>
	 */
	parsePlainPrivatePKCS8Hex: function(pkcs8PrvHex) {
	    var result = {};
	    result.algparam = null;

	    // 1. sequence
	    if (pkcs8PrvHex.substr(0, 2) != "30")
		throw "malformed plain PKCS8 private key(code:001)"; // not sequence

	    var a1 = ASN1HEX.getPosArrayOfChildren_AtObj(pkcs8PrvHex, 0);
	    if (a1.length != 3)
		throw "malformed plain PKCS8 private key(code:002)";

	    // 2. AlgID
            if (pkcs8PrvHex.substr(a1[1], 2) != "30")
                throw "malformed PKCS8 private key(code:003)"; // AlgId not sequence

            var a2 = ASN1HEX.getPosArrayOfChildren_AtObj(pkcs8PrvHex, a1[1]);
            if (a2.length != 2)
                throw "malformed PKCS8 private key(code:004)"; // AlgId not have two elements

	    // 2.1. AlgID OID
	    if (pkcs8PrvHex.substr(a2[0], 2) != "06")
		throw "malformed PKCS8 private key(code:005)"; // AlgId.oid is not OID

	    result.algoid = ASN1HEX.getHexOfV_AtObj(pkcs8PrvHex, a2[0]);

	    // 2.2. AlgID param
	    if (pkcs8PrvHex.substr(a2[1], 2) == "06") {
		result.algparam = ASN1HEX.getHexOfV_AtObj(pkcs8PrvHex, a2[1]);
	    }

	    // 3. Key index
	    if (pkcs8PrvHex.substr(a1[2], 2) != "04")
		throw "malformed PKCS8 private key(code:006)"; // not octet string

	    result.keyidx = ASN1HEX.getStartPosOfV_AtObj(pkcs8PrvHex, a1[2]);

	    return result;
        },

	/**
         * get RSAKey/ECDSA private key object from PEM plain PEM PKCS#8 private key
	 * @name getKeyFromPlainPrivatePKCS8PEM
	 * @memberOf PKCS5PKEY
	 * @function
	 * @param {String} pkcs8PEM string of plain PEM formatted PKCS#8 private key
	 * @return {Object} RSAKey or KJUR.crypto.ECDSA private key object
	 * @since pkcs5pkey 1.0.5
	 */
	getKeyFromPlainPrivatePKCS8PEM: function(prvKeyPEM) {
	    var prvKeyHex = this.getHexFromPEM(prvKeyPEM, "PRIVATE KEY");
	    var key = this.getKeyFromPlainPrivatePKCS8Hex(prvKeyHex);
	    return key;
	},

	/**
         * get RSAKey/ECDSA private key object from HEX plain PEM PKCS#8 private key
	 * @name getKeyFromPlainPrivatePKCS8Hex
	 * @memberOf PKCS5PKEY
	 * @function
	 * @param {String} prvKeyHex hexadecimal string of plain PKCS#8 private key
	 * @return {Object} RSAKey or KJUR.crypto.ECDSA private key object
	 * @since pkcs5pkey 1.0.5
	 */
	getKeyFromPlainPrivatePKCS8Hex: function(prvKeyHex) {
	    var p8 = this.parsePlainPrivatePKCS8Hex(prvKeyHex);
	    
	    if (p8.algoid == "2a864886f70d010101") { // RSA
		this.parsePrivateRawRSAKeyHexAtObj(prvKeyHex, p8);
		var k = p8.key;
		var key = new RSAKey();
		key.setPrivateEx(k.n, k.e, k.d, k.p, k.q, k.dp, k.dq, k.co);
		return key;
	    } else if (p8.algoid == "2a8648ce3d0201") { // ECC
		this.parsePrivateRawECKeyHexAtObj(prvKeyHex, p8);
		if (KJUR.crypto.OID.oidhex2name[p8.algparam] === undefined)
		    throw "KJUR.crypto.OID.oidhex2name undefined: " + p8.algparam;
		var curveName = KJUR.crypto.OID.oidhex2name[p8.algparam];
		var key = new KJUR.crypto.ECDSA({'curve': curveName, 'prv': p8.key});
		return key;
	    } else {
		throw "unsupported private key algorithm";
	    }
	},

	// === PKCS8 RSA Public Key ================================================
	/**
         * read PEM formatted PKCS#8 public key and returns RSAKey object
	 * @name getRSAKeyFromPublicPKCS8PEM
	 * @memberOf PKCS5PKEY
	 * @function
	 * @param {String} pkcs8PubPEM PEM formatted PKCS#8 public key
	 * @return {RSAKey} loaded RSAKey object of RSA public key
         * @since pkcs5pkey 1.0.4
	 */
        getRSAKeyFromPublicPKCS8PEM: function(pkcs8PubPEM) {
            var pubKeyHex = this.getHexFromPEM(pkcs8PubPEM, "PUBLIC KEY");
            var rsaKey = this.getRSAKeyFromPublicPKCS8Hex(pubKeyHex);
	    return rsaKey;
	},

	/**
         * get RSAKey/ECDSA public key object from PEM PKCS#8 public key
	 * @name getKeyFromPublicPKCS8PEM
	 * @memberOf PKCS5PKEY
	 * @function
	 * @param {String} pkcsPub8PEM string of PEM formatted PKCS#8 public key
	 * @return {Object} RSAKey or KJUR.crypto.ECDSA private key object
	 * @since pkcs5pkey 1.0.5
	 */
        getKeyFromPublicPKCS8PEM: function(pkcs8PubPEM) {
            var pubKeyHex = this.getHexFromPEM(pkcs8PubPEM, "PUBLIC KEY");
            var key = this.getKeyFromPublicPKCS8Hex(pubKeyHex);
	    return key;
	},

	/**
         * get RSAKey/ECDSA public key object from hexadecimal string of PKCS#8 public key
	 * @name getKeyFromPublicPKCS8Hex
	 * @memberOf PKCS5PKEY
	 * @function
	 * @param {String} pkcsPub8Hex hexadecimal string of PKCS#8 public key
	 * @return {Object} RSAKey or KJUR.crypto.ECDSA private key object
	 * @since pkcs5pkey 1.0.5
	 */
        getKeyFromPublicPKCS8Hex: function(pkcs8PubHex) {
	    var p8 = this.parsePublicPKCS8Hex(pkcs8PubHex);
	    
	    if (p8.algoid == "2a864886f70d010101") { // RSA
		var aRSA = this.parsePublicRawRSAKeyHex(p8.key);
		var key = new RSAKey();
		key.setPublic(aRSA.n, aRSA.e);
		return key;
	    } else if (p8.algoid == "2a8648ce3d0201") { // ECC
		if (KJUR.crypto.OID.oidhex2name[p8.algparam] === undefined)
		    throw "KJUR.crypto.OID.oidhex2name undefined: " + p8.algparam;
		var curveName = KJUR.crypto.OID.oidhex2name[p8.algparam];
		var key = new KJUR.crypto.ECDSA({'curve': curveName, 'pub': p8.key});
		return key;
	    } else {
		throw "unsupported public key algorithm";
	    }
	},

	/**
         * parse hexadecimal string of plain PKCS#8 private key
	 * @name parsePublicRawRSAKeyHex
	 * @memberOf PKCS5PKEY
	 * @function
	 * @param {String} pubRawRSAHex hexadecimal string of ASN.1 encoded PKCS#8 public key
	 * @return {Array} associative array of parsed key
	 * @since pkcs5pkey 1.0.5
	 * @description
	 * Resulted associative array has following properties:
	 * <ul>
	 * <li>n - hexadecimal string of public key
	 * <li>e - hexadecimal string of public exponent
	 * </ul>
	 */
	parsePublicRawRSAKeyHex: function(pubRawRSAHex) {
	    var result = {};
	    
	    // 1. Sequence
	    if (pubRawRSAHex.substr(0, 2) != "30")
		throw "malformed RSA key(code:001)"; // not sequence
	    
	    var a1 = ASN1HEX.getPosArrayOfChildren_AtObj(pubRawRSAHex, 0);
	    if (a1.length != 2)
		throw "malformed RSA key(code:002)"; // not 2 items in seq

	    // 2. public key "N"
	    if (pubRawRSAHex.substr(a1[0], 2) != "02")
		throw "malformed RSA key(code:003)"; // 1st item is not integer

	    result.n = ASN1HEX.getHexOfV_AtObj(pubRawRSAHex, a1[0]);

	    // 3. public key "E"
	    if (pubRawRSAHex.substr(a1[1], 2) != "02")
		throw "malformed RSA key(code:004)"; // 2nd item is not integer

	    result.e = ASN1HEX.getHexOfV_AtObj(pubRawRSAHex, a1[1]);

	    return result;
	},

	/**
         * parse hexadecimal string of RSA private key
	 * @name parsePrivateRawRSAKeyHexAtObj
	 * @memberOf PKCS5PKEY
	 * @function
	 * @param {String} pkcs8PrvHex hexadecimal string of PKCS#8 private key concluding RSA private key
	 * @return {Array} info associative array to add parsed RSA private key information
	 * @since pkcs5pkey 1.0.5
	 * @description
	 * Following properties are added to associative array 'info'
	 * <ul>
	 * <li>n - hexadecimal string of public key
	 * <li>e - hexadecimal string of public exponent
	 * <li>d - hexadecimal string of private key
	 * <li>p - hexadecimal string
	 * <li>q - hexadecimal string
	 * <li>dp - hexadecimal string
	 * <li>dq - hexadecimal string
	 * <li>co - hexadecimal string
	 * </ul>
	 */
	parsePrivateRawRSAKeyHexAtObj: function(pkcs8PrvHex, info) {
	    var keyIdx = info.keyidx;
	    
	    // 1. sequence
	    if (pkcs8PrvHex.substr(keyIdx, 2) != "30")
		throw "malformed RSA private key(code:001)"; // not sequence

	    var a1 = ASN1HEX.getPosArrayOfChildren_AtObj(pkcs8PrvHex, keyIdx);
	    if (a1.length != 9)
		throw "malformed RSA private key(code:002)"; // not sequence

	    // 2. RSA key
	    info.key = {};
	    info.key.n = ASN1HEX.getHexOfV_AtObj(pkcs8PrvHex, a1[1]);
	    info.key.e = ASN1HEX.getHexOfV_AtObj(pkcs8PrvHex, a1[2]);
	    info.key.d = ASN1HEX.getHexOfV_AtObj(pkcs8PrvHex, a1[3]);
	    info.key.p = ASN1HEX.getHexOfV_AtObj(pkcs8PrvHex, a1[4]);
	    info.key.q = ASN1HEX.getHexOfV_AtObj(pkcs8PrvHex, a1[5]);
	    info.key.dp = ASN1HEX.getHexOfV_AtObj(pkcs8PrvHex, a1[6]);
	    info.key.dq = ASN1HEX.getHexOfV_AtObj(pkcs8PrvHex, a1[7]);
	    info.key.co = ASN1HEX.getHexOfV_AtObj(pkcs8PrvHex, a1[8]);
	},

	/**
         * parse hexadecimal string of ECC private key
	 * @name parsePrivateRawECKeyHexAtObj
	 * @memberOf PKCS5PKEY
	 * @function
	 * @param {String} pkcs8PrvHex hexadecimal string of PKCS#8 private key concluding EC private key
	 * @return {Array} info associative array to add parsed ECC private key information
	 * @since pkcs5pkey 1.0.5
	 * @description
	 * Following properties are added to associative array 'info'
	 * <ul>
	 * <li>key - hexadecimal string of ECC private key
	 * </ul>
	 */
	parsePrivateRawECKeyHexAtObj: function(pkcs8PrvHex, info) {
	    var keyIdx = info.keyidx;
	    
	    // 1. sequence
	    if (pkcs8PrvHex.substr(keyIdx, 2) != "30")
		throw "malformed ECC private key(code:001)"; // not sequence

	    var a1 = ASN1HEX.getPosArrayOfChildren_AtObj(pkcs8PrvHex, keyIdx);
	    if (a1.length != 3)
		throw "malformed ECC private key(code:002)"; // not sequence

	    // 2. EC private key
	    if (pkcs8PrvHex.substr(a1[1], 2) != "04")
		throw "malformed ECC private key(code:003)"; // not octetstring

	    info.key = ASN1HEX.getHexOfV_AtObj(pkcs8PrvHex, a1[1]);
	},

	/**
         * parse hexadecimal string of PKCS#8 public key
	 * @name parsePublicPKCS8Hex
	 * @memberOf PKCS5PKEY
	 * @function
	 * @param {String} pkcs8PubHex hexadecimal string of PKCS#8 public key
	 * @return {Hash} hash of key information
	 * @description
         * Resulted hash has following attributes.
	 * <ul>
	 * <li>algoid - hexadecimal string of OID of asymmetric key algorithm</li>
	 * <li>algparam - hexadecimal string of OID of ECC curve name or null</li>
	 * <li>key - hexadecimal string of public key</li>
	 * </ul>
	 */
        parsePublicPKCS8Hex: function(pkcs8PubHex) {
	    var result = {};
	    result.algparam = null;

            // 1. AlgID and Key bit string
	    var a1 = ASN1HEX.getPosArrayOfChildren_AtObj(pkcs8PubHex, 0);
	    if (a1.length != 2)
		throw "outer DERSequence shall have 2 elements: " + a1.length;

            // 2. AlgID
            var idxAlgIdTLV = a1[0];
            if (pkcs8PubHex.substr(idxAlgIdTLV, 2) != "30")
                throw "malformed PKCS8 public key(code:001)"; // AlgId not sequence

            var a2 = ASN1HEX.getPosArrayOfChildren_AtObj(pkcs8PubHex, idxAlgIdTLV);
            if (a2.length != 2)
                throw "malformed PKCS8 public key(code:002)"; // AlgId not have two elements

	    // 2.1. AlgID OID
	    if (pkcs8PubHex.substr(a2[0], 2) != "06")
		throw "malformed PKCS8 public key(code:003)"; // AlgId.oid is not OID

	    result.algoid = ASN1HEX.getHexOfV_AtObj(pkcs8PubHex, a2[0]);

	    // 2.2. AlgID param
	    if (pkcs8PubHex.substr(a2[1], 2) == "06") {
		result.algparam = ASN1HEX.getHexOfV_AtObj(pkcs8PubHex, a2[1]);
	    }

	    // 3. Key
	    if (pkcs8PubHex.substr(a1[1], 2) != "03")
		throw "malformed PKCS8 public key(code:004)"; // Key is not bit string

	    result.key = ASN1HEX.getHexOfV_AtObj(pkcs8PubHex, a1[1]).substr(2);
            
	    // 4. return result assoc array
	    return result;
        },

	/**
         * provide hexadecimal string of unencrypted PKCS#8 private key and returns RSAKey object
	 * @name getRSAKeyFromPublicPKCS8Hex
	 * @memberOf PKCS5PKEY
	 * @function
	 * @param {String} pkcs8PubHex hexadecimal string of unencrypted PKCS#8 public key
	 * @return {RSAKey} loaded RSAKey object of RSA public key
         * @since pkcs5pkey 1.0.4
	 */
        getRSAKeyFromPublicPKCS8Hex: function(pkcs8PubHex) {
	    var a1 = ASN1HEX.getPosArrayOfChildren_AtObj(pkcs8PubHex, 0);
	    if (a1.length != 2)
		throw "outer DERSequence shall have 2 elements: " + a1.length;

            var algIdTLV =ASN1HEX.getHexOfTLV_AtObj(pkcs8PubHex, a1[0]);
	    if (algIdTLV != "300d06092a864886f70d0101010500") // AlgId rsaEncryption
		throw "PKCS8 AlgorithmId is not rsaEncryption";
	    
	    if (pkcs8PubHex.substr(a1[1], 2) != "03")
		throw "PKCS8 Public Key is not BITSTRING encapslated.";

	    var idxPub = ASN1HEX.getStartPosOfV_AtObj(pkcs8PubHex, a1[1]) + 2; // 2 for unused bit
	    
	    if (pkcs8PubHex.substr(idxPub, 2) != "30")
		throw "PKCS8 Public Key is not SEQUENCE.";

	    var a2 = ASN1HEX.getPosArrayOfChildren_AtObj(pkcs8PubHex, idxPub);
	    if (a2.length != 2)
		throw "inner DERSequence shall have 2 elements: " + a2.length;

	    if (pkcs8PubHex.substr(a2[0], 2) != "02") 
		throw "N is not ASN.1 INTEGER";
	    if (pkcs8PubHex.substr(a2[1], 2) != "02") 
		throw "E is not ASN.1 INTEGER";
		
	    var hN = ASN1HEX.getHexOfV_AtObj(pkcs8PubHex, a2[0]);
	    var hE = ASN1HEX.getHexOfV_AtObj(pkcs8PubHex, a2[1]);

	    var pubKey = new RSAKey();
	    pubKey.setPublic(hN, hE);
	    
	    return pubKey;
	},

	//addAlgorithm: function(functionObject, algName, keyLen, ivLen) {
	//}
    };
}();

/*! asn1-1.0.4.js (c) 2013 Kenji Urushima | kjur.github.com/jsrsasign/license
 */
/*
 * asn1.js - ASN.1 DER encoder classes
 *
 * Copyright (c) 2013 Kenji Urushima (kenji.urushima@gmail.com)
 *
 * This software is licensed under the terms of the MIT License.
 * http://kjur.github.com/jsrsasign/license
 *
 * The above copyright and license notice shall be 
 * included in all copies or substantial portions of the Software.
 */

/**
 * @fileOverview
 * @name asn1-1.0.js
 * @author Kenji Urushima kenji.urushima@gmail.com
 * @version asn1 1.0.4 (2013-Oct-02)
 * @since jsrsasign 2.1
 * @license <a href="http://kjur.github.io/jsrsasign/license/">MIT License</a>
 */

/** 
 * kjur's class library name space
 * <p>
 * This name space provides following name spaces:
 * <ul>
 * <li>{@link KJUR.asn1} - ASN.1 primitive hexadecimal encoder</li>
 * <li>{@link KJUR.asn1.x509} - ASN.1 structure for X.509 certificate and CRL</li>
 * <li>{@link KJUR.crypto} - Java Cryptographic Extension(JCE) style MessageDigest/Signature 
 * class and utilities</li>
 * </ul>
 * </p> 
 * NOTE: Please ignore method summary and document of this namespace. This caused by a bug of jsdoc2.
  * @name KJUR
 * @namespace kjur's class library name space
 */
if (typeof KJUR == "undefined" || !KJUR) KJUR = {};

/**
 * kjur's ASN.1 class library name space
 * <p>
 * This is ITU-T X.690 ASN.1 DER encoder class library and
 * class structure and methods is very similar to 
 * org.bouncycastle.asn1 package of 
 * well known BouncyCaslte Cryptography Library.
 *
 * <h4>PROVIDING ASN.1 PRIMITIVES</h4>
 * Here are ASN.1 DER primitive classes.
 * <ul>
 * <li>0x01 {@link KJUR.asn1.DERBoolean}</li>
 * <li>0x02 {@link KJUR.asn1.DERInteger}</li>
 * <li>0x03 {@link KJUR.asn1.DERBitString}</li>
 * <li>0x04 {@link KJUR.asn1.DEROctetString}</li>
 * <li>0x05 {@link KJUR.asn1.DERNull}</li>
 * <li>0x06 {@link KJUR.asn1.DERObjectIdentifier}</li>
 * <li>0x0c {@link KJUR.asn1.DERUTF8String}</li>
 * <li>0x12 {@link KJUR.asn1.DERNumericString}</li>
 * <li>0x13 {@link KJUR.asn1.DERPrintableString}</li>
 * <li>0x14 {@link KJUR.asn1.DERTeletexString}</li>
 * <li>0x16 {@link KJUR.asn1.DERIA5String}</li>
 * <li>0x17 {@link KJUR.asn1.DERUTCTime}</li>
 * <li>0x18 {@link KJUR.asn1.DERGeneralizedTime}</li>
 * <li>0x30 {@link KJUR.asn1.DERSequence}</li>
 * <li>0x31 {@link KJUR.asn1.DERSet}</li>
 * </ul>
 *
 * <h4>OTHER ASN.1 CLASSES</h4>
 * <ul>
 * <li>{@link KJUR.asn1.ASN1Object}</li>
 * <li>{@link KJUR.asn1.DERAbstractString}</li>
 * <li>{@link KJUR.asn1.DERAbstractTime}</li>
 * <li>{@link KJUR.asn1.DERAbstractStructured}</li>
 * <li>{@link KJUR.asn1.DERTaggedObject}</li>
 * </ul>
 * </p>
 * NOTE: Please ignore method summary and document of this namespace. This caused by a bug of jsdoc2.
 * @name KJUR.asn1
 * @namespace
 */
if (typeof KJUR.asn1 == "undefined" || !KJUR.asn1) KJUR.asn1 = {};

/**
 * ASN1 utilities class
 * @name KJUR.asn1.ASN1Util
 * @class ASN1 utilities class
 * @since asn1 1.0.2
 */
KJUR.asn1.ASN1Util = new function() {
    this.integerToByteHex = function(i) {
	var h = i.toString(16);
	if ((h.length % 2) == 1) h = '0' + h;
	return h;
    };
    this.bigIntToMinTwosComplementsHex = function(bigIntegerValue) {
	var h = bigIntegerValue.toString(16);
	if (h.substr(0, 1) != '-') {
	    if (h.length % 2 == 1) {
		h = '0' + h;
	    } else {
		if (! h.match(/^[0-7]/)) {
		    h = '00' + h;
		}
	    }
	} else {
	    var hPos = h.substr(1);
	    var xorLen = hPos.length;
	    if (xorLen % 2 == 1) {
		xorLen += 1;
	    } else {
		if (! h.match(/^[0-7]/)) {
		    xorLen += 2;
		}
	    }
	    var hMask = '';
	    for (var i = 0; i < xorLen; i++) {
		hMask += 'f';
	    }
	    var biMask = new BigInteger(hMask, 16);
	    var biNeg = biMask.xor(bigIntegerValue).add(BigInteger.ONE);
	    h = biNeg.toString(16).replace(/^-/, '');
	}
	return h;
    };
    /**
     * get PEM string from hexadecimal data and header string
     * @name getPEMStringFromHex
     * @memberOf KJUR.asn1.ASN1Util
     * @function
     * @param {String} dataHex hexadecimal string of PEM body
     * @param {String} pemHeader PEM header string (ex. 'RSA PRIVATE KEY')
     * @return {String} PEM formatted string of input data
     * @description
     * @example
     * var pem  = KJUR.asn1.ASN1Util.getPEMStringFromHex('616161', 'RSA PRIVATE KEY');
     * // value of pem will be:
     * -----BEGIN PRIVATE KEY-----
     * YWFh
     * -----END PRIVATE KEY-----
     */
    this.getPEMStringFromHex = function(dataHex, pemHeader) {
	var ns1 = KJUR.asn1;
	var dataWA = CryptoJS.enc.Hex.parse(dataHex);
	var dataB64 = CryptoJS.enc.Base64.stringify(dataWA);
	var pemBody = dataB64.replace(/(.{64})/g, "$1\r\n");
        pemBody = pemBody.replace(/\r\n$/, '');
	return "-----BEGIN " + pemHeader + "-----\r\n" + 
               pemBody + 
               "\r\n-----END " + pemHeader + "-----\r\n";
    };

    /**
     * generate ASN1Object specifed by JSON parameters
     * @name newObject
     * @memberOf KJUR.asn1.ASN1Util
     * @function
     * @param {Array} param JSON parameter to generate ASN1Object
     * @return {KJUR.asn1.ASN1Object} generated object
     * @since asn1 1.0.3
     * @description
     * generate any ASN1Object specified by JSON param
     * including ASN.1 primitive or structured.
     * Generally 'param' can be described as follows:
     * <blockquote>
     * {TYPE-OF-ASNOBJ: ASN1OBJ-PARAMETER}
     * </blockquote>
     * 'TYPE-OF-ASN1OBJ' can be one of following symbols:
     * <ul>
     * <li>'bool' - DERBoolean</li>
     * <li>'int' - DERInteger</li>
     * <li>'bitstr' - DERBitString</li>
     * <li>'octstr' - DEROctetString</li>
     * <li>'null' - DERNull</li>
     * <li>'oid' - DERObjectIdentifier</li>
     * <li>'utf8str' - DERUTF8String</li>
     * <li>'numstr' - DERNumericString</li>
     * <li>'prnstr' - DERPrintableString</li>
     * <li>'telstr' - DERTeletexString</li>
     * <li>'ia5str' - DERIA5String</li>
     * <li>'utctime' - DERUTCTime</li>
     * <li>'gentime' - DERGeneralizedTime</li>
     * <li>'seq' - DERSequence</li>
     * <li>'set' - DERSet</li>
     * <li>'tag' - DERTaggedObject</li>
     * </ul>
     * @example
     * newObject({'prnstr': 'aaa'});
     * newObject({'seq': [{'int': 3}, {'prnstr': 'aaa'}]})
     * // ASN.1 Tagged Object
     * newObject({'tag': {'tag': 'a1', 
     *                    'explicit': true,
     *                    'obj': {'seq': [{'int': 3}, {'prnstr': 'aaa'}]}}});
     * // more simple representation of ASN.1 Tagged Object
     * newObject({'tag': ['a1',
     *                    true,
     *                    {'seq': [
     *                      {'int': 3}, 
     *                      {'prnstr': 'aaa'}]}
     *                   ]});
     */
    this.newObject = function(param) {
	var ns1 = KJUR.asn1;
	var keys = Object.keys(param);
	if (keys.length != 1)
	    throw "key of param shall be only one.";
	var key = keys[0];

	if (":bool:int:bitstr:octstr:null:oid:utf8str:numstr:prnstr:telstr:ia5str:utctime:gentime:seq:set:tag:".indexOf(":" + key + ":") == -1)
	    throw "undefined key: " + key;

	if (key == "bool")    return new ns1.DERBoolean(param[key]);
	if (key == "int")     return new ns1.DERInteger(param[key]);
	if (key == "bitstr")  return new ns1.DERBitString(param[key]);
	if (key == "octstr")  return new ns1.DEROctetString(param[key]);
	if (key == "null")    return new ns1.DERNull(param[key]);
	if (key == "oid")     return new ns1.DERObjectIdentifier(param[key]);
	if (key == "utf8str") return new ns1.DERUTF8String(param[key]);
	if (key == "numstr")  return new ns1.DERNumericString(param[key]);
	if (key == "prnstr")  return new ns1.DERPrintableString(param[key]);
	if (key == "telstr")  return new ns1.DERTeletexString(param[key]);
	if (key == "ia5str")  return new ns1.DERIA5String(param[key]);
	if (key == "utctime") return new ns1.DERUTCTime(param[key]);
	if (key == "gentime") return new ns1.DERGeneralizedTime(param[key]);

	if (key == "seq") {
	    var paramList = param[key];
	    var a = [];
	    for (var i = 0; i < paramList.length; i++) {
		var asn1Obj = ns1.ASN1Util.newObject(paramList[i]);
		a.push(asn1Obj);
	    }
	    return new ns1.DERSequence({'array': a});
	}

	if (key == "set") {
	    var paramList = param[key];
	    var a = [];
	    for (var i = 0; i < paramList.length; i++) {
		var asn1Obj = ns1.ASN1Util.newObject(paramList[i]);
		a.push(asn1Obj);
	    }
	    return new ns1.DERSet({'array': a});
	}

	if (key == "tag") {
	    var tagParam = param[key];
	    if (Object.prototype.toString.call(tagParam) === '[object Array]' &&
		tagParam.length == 3) {
		var obj = ns1.ASN1Util.newObject(tagParam[2]);
		return new ns1.DERTaggedObject({tag: tagParam[0], explicit: tagParam[1], obj: obj});
	    } else {
		var newParam = {};
		if (tagParam.explicit !== undefined)
		    newParam.explicit = tagParam.explicit;
		if (tagParam.tag !== undefined)
		    newParam.tag = tagParam.tag;
		if (tagParam.obj === undefined)
		    throw "obj shall be specified for 'tag'.";
		newParam.obj = ns1.ASN1Util.newObject(tagParam.obj);
		return new ns1.DERTaggedObject(newParam);
	    }
	}
    };

    /**
     * get encoded hexadecimal string of ASN1Object specifed by JSON parameters
     * @name jsonToASN1HEX
     * @memberOf KJUR.asn1.ASN1Util
     * @function
     * @param {Array} param JSON parameter to generate ASN1Object
     * @return hexadecimal string of ASN1Object
     * @since asn1 1.0.4
     * @description
     * As for ASN.1 object representation of JSON object,
     * please see {@link newObject}.
     * @example
     * jsonToASN1HEX({'prnstr': 'aaa'}); 
     */
    this.jsonToASN1HEX = function(param) {
	var asn1Obj = this.newObject(param);
	return asn1Obj.getEncodedHex();
    };
};

// ********************************************************************
//  Abstract ASN.1 Classes
// ********************************************************************

// ********************************************************************

/**
 * base class for ASN.1 DER encoder object
 * @name KJUR.asn1.ASN1Object
 * @class base class for ASN.1 DER encoder object
 * @property {Boolean} isModified flag whether internal data was changed
 * @property {String} hTLV hexadecimal string of ASN.1 TLV
 * @property {String} hT hexadecimal string of ASN.1 TLV tag(T)
 * @property {String} hL hexadecimal string of ASN.1 TLV length(L)
 * @property {String} hV hexadecimal string of ASN.1 TLV value(V)
 * @description
 */
KJUR.asn1.ASN1Object = function() {
    var isModified = true;
    var hTLV = null;
    var hT = '00';
    var hL = '00';
    var hV = '';

    /**
     * get hexadecimal ASN.1 TLV length(L) bytes from TLV value(V)
     * @name getLengthHexFromValue
     * @memberOf KJUR.asn1.ASN1Object
     * @function
     * @return {String} hexadecimal string of ASN.1 TLV length(L)
     */
    this.getLengthHexFromValue = function() {
	if (typeof this.hV == "undefined" || this.hV == null) {
	    throw "this.hV is null or undefined.";
	}
	if (this.hV.length % 2 == 1) {
	    throw "value hex must be even length: n=" + hV.length + ",v=" + this.hV;
	}
	var n = this.hV.length / 2;
	var hN = n.toString(16);
	if (hN.length % 2 == 1) {
	    hN = "0" + hN;
	}
	if (n < 128) {
	    return hN;
	} else {
	    var hNlen = hN.length / 2;
	    if (hNlen > 15) {
		throw "ASN.1 length too long to represent by 8x: n = " + n.toString(16);
	    }
	    var head = 128 + hNlen;
	    return head.toString(16) + hN;
	}
    };

    /**
     * get hexadecimal string of ASN.1 TLV bytes
     * @name getEncodedHex
     * @memberOf KJUR.asn1.ASN1Object
     * @function
     * @return {String} hexadecimal string of ASN.1 TLV
     */
    this.getEncodedHex = function() {
	if (this.hTLV == null || this.isModified) {
	    this.hV = this.getFreshValueHex();
	    this.hL = this.getLengthHexFromValue();
	    this.hTLV = this.hT + this.hL + this.hV;
	    this.isModified = false;
	    //alert("first time: " + this.hTLV);
	}
	return this.hTLV;
    };

    /**
     * get hexadecimal string of ASN.1 TLV value(V) bytes
     * @name getValueHex
     * @memberOf KJUR.asn1.ASN1Object
     * @function
     * @return {String} hexadecimal string of ASN.1 TLV value(V) bytes
     */
    this.getValueHex = function() {
	this.getEncodedHex();
	return this.hV;
    }

    this.getFreshValueHex = function() {
	return '';
    };
};

// == BEGIN DERAbstractString ================================================
/**
 * base class for ASN.1 DER string classes
 * @name KJUR.asn1.DERAbstractString
 * @class base class for ASN.1 DER string classes
 * @param {Array} params associative array of parameters (ex. {'str': 'aaa'})
 * @property {String} s internal string of value
 * @extends KJUR.asn1.ASN1Object
 * @description
 * <br/>
 * As for argument 'params' for constructor, you can specify one of
 * following properties:
 * <ul>
 * <li>str - specify initial ASN.1 value(V) by a string</li>
 * <li>hex - specify initial ASN.1 value(V) by a hexadecimal string</li>
 * </ul>
 * NOTE: 'params' can be omitted.
 */
KJUR.asn1.DERAbstractString = function(params) {
    KJUR.asn1.DERAbstractString.superclass.constructor.call(this);
    var s = null;
    var hV = null;

    /**
     * get string value of this string object
     * @name getString
     * @memberOf KJUR.asn1.DERAbstractString
     * @function
     * @return {String} string value of this string object
     */
    this.getString = function() {
	return this.s;
    };

    /**
     * set value by a string
     * @name setString
     * @memberOf KJUR.asn1.DERAbstractString
     * @function
     * @param {String} newS value by a string to set
     */
    this.setString = function(newS) {
	this.hTLV = null;
	this.isModified = true;
	this.s = newS;
	this.hV = stohex(this.s);
    };

    /**
     * set value by a hexadecimal string
     * @name setStringHex
     * @memberOf KJUR.asn1.DERAbstractString
     * @function
     * @param {String} newHexString value by a hexadecimal string to set
     */
    this.setStringHex = function(newHexString) {
	this.hTLV = null;
	this.isModified = true;
	this.s = null;
	this.hV = newHexString;
    };

    this.getFreshValueHex = function() {
	return this.hV;
    };

    if (typeof params != "undefined") {
	if (typeof params == "string") {
	    this.setString(params);
	} else if (typeof params['str'] != "undefined") {
	    this.setString(params['str']);
	} else if (typeof params['hex'] != "undefined") {
	    this.setStringHex(params['hex']);
	}
    }
};
YAHOO.lang.extend(KJUR.asn1.DERAbstractString, KJUR.asn1.ASN1Object);
// == END   DERAbstractString ================================================

// == BEGIN DERAbstractTime ==================================================
/**
 * base class for ASN.1 DER Generalized/UTCTime class
 * @name KJUR.asn1.DERAbstractTime
 * @class base class for ASN.1 DER Generalized/UTCTime class
 * @param {Array} params associative array of parameters (ex. {'str': '130430235959Z'})
 * @extends KJUR.asn1.ASN1Object
 * @description
 * @see KJUR.asn1.ASN1Object - superclass
 */
KJUR.asn1.DERAbstractTime = function(params) {
    KJUR.asn1.DERAbstractTime.superclass.constructor.call(this);
    var s = null;
    var date = null;

    // --- PRIVATE METHODS --------------------
    this.localDateToUTC = function(d) {
	utc = d.getTime() + (d.getTimezoneOffset() * 60000);
	var utcDate = new Date(utc);
	return utcDate;
    };

    this.formatDate = function(dateObject, type) {
	var pad = this.zeroPadding;
	var d = this.localDateToUTC(dateObject);
	var year = String(d.getFullYear());
	if (type == 'utc') year = year.substr(2, 2);
	var month = pad(String(d.getMonth() + 1), 2);
	var day = pad(String(d.getDate()), 2);
	var hour = pad(String(d.getHours()), 2);
	var min = pad(String(d.getMinutes()), 2);
	var sec = pad(String(d.getSeconds()), 2);
	return year + month + day + hour + min + sec + 'Z';
    };

    this.zeroPadding = function(s, len) {
	if (s.length >= len) return s;
	return new Array(len - s.length + 1).join('0') + s;
    };

    // --- PUBLIC METHODS --------------------
    /**
     * get string value of this string object
     * @name getString
     * @memberOf KJUR.asn1.DERAbstractTime
     * @function
     * @return {String} string value of this time object
     */
    this.getString = function() {
	return this.s;
    };

    /**
     * set value by a string
     * @name setString
     * @memberOf KJUR.asn1.DERAbstractTime
     * @function
     * @param {String} newS value by a string to set such like "130430235959Z"
     */
    this.setString = function(newS) {
	this.hTLV = null;
	this.isModified = true;
	this.s = newS;
	this.hV = stohex(newS);
    };

    /**
     * set value by a Date object
     * @name setByDateValue
     * @memberOf KJUR.asn1.DERAbstractTime
     * @function
     * @param {Integer} year year of date (ex. 2013)
     * @param {Integer} month month of date between 1 and 12 (ex. 12)
     * @param {Integer} day day of month
     * @param {Integer} hour hours of date
     * @param {Integer} min minutes of date
     * @param {Integer} sec seconds of date
     */
    this.setByDateValue = function(year, month, day, hour, min, sec) {
	var dateObject = new Date(Date.UTC(year, month - 1, day, hour, min, sec, 0));
	this.setByDate(dateObject);
    };

    this.getFreshValueHex = function() {
	return this.hV;
    };
};
YAHOO.lang.extend(KJUR.asn1.DERAbstractTime, KJUR.asn1.ASN1Object);
// == END   DERAbstractTime ==================================================

// == BEGIN DERAbstractStructured ============================================
/**
 * base class for ASN.1 DER structured class
 * @name KJUR.asn1.DERAbstractStructured
 * @class base class for ASN.1 DER structured class
 * @property {Array} asn1Array internal array of ASN1Object
 * @extends KJUR.asn1.ASN1Object
 * @description
 * @see KJUR.asn1.ASN1Object - superclass
 */
KJUR.asn1.DERAbstractStructured = function(params) {
    KJUR.asn1.DERAbstractString.superclass.constructor.call(this);
    var asn1Array = null;

    /**
     * set value by array of ASN1Object
     * @name setByASN1ObjectArray
     * @memberOf KJUR.asn1.DERAbstractStructured
     * @function
     * @param {array} asn1ObjectArray array of ASN1Object to set
     */
    this.setByASN1ObjectArray = function(asn1ObjectArray) {
	this.hTLV = null;
	this.isModified = true;
	this.asn1Array = asn1ObjectArray;
    };

    /**
     * append an ASN1Object to internal array
     * @name appendASN1Object
     * @memberOf KJUR.asn1.DERAbstractStructured
     * @function
     * @param {ASN1Object} asn1Object to add
     */
    this.appendASN1Object = function(asn1Object) {
	this.hTLV = null;
	this.isModified = true;
	this.asn1Array.push(asn1Object);
    };

    this.asn1Array = new Array();
    if (typeof params != "undefined") {
	if (typeof params['array'] != "undefined") {
	    this.asn1Array = params['array'];
	}
    }
};
YAHOO.lang.extend(KJUR.asn1.DERAbstractStructured, KJUR.asn1.ASN1Object);


// ********************************************************************
//  ASN.1 Object Classes
// ********************************************************************

// ********************************************************************
/**
 * class for ASN.1 DER Boolean
 * @name KJUR.asn1.DERBoolean
 * @class class for ASN.1 DER Boolean
 * @extends KJUR.asn1.ASN1Object
 * @description
 * @see KJUR.asn1.ASN1Object - superclass
 */
KJUR.asn1.DERBoolean = function() {
    KJUR.asn1.DERBoolean.superclass.constructor.call(this);
    this.hT = "01";
    this.hTLV = "0101ff";
};
YAHOO.lang.extend(KJUR.asn1.DERBoolean, KJUR.asn1.ASN1Object);

// ********************************************************************
/**
 * class for ASN.1 DER Integer
 * @name KJUR.asn1.DERInteger
 * @class class for ASN.1 DER Integer
 * @extends KJUR.asn1.ASN1Object
 * @description
 * <br/>
 * As for argument 'params' for constructor, you can specify one of
 * following properties:
 * <ul>
 * <li>int - specify initial ASN.1 value(V) by integer value</li>
 * <li>bigint - specify initial ASN.1 value(V) by BigInteger object</li>
 * <li>hex - specify initial ASN.1 value(V) by a hexadecimal string</li>
 * </ul>
 * NOTE: 'params' can be omitted.
 */
KJUR.asn1.DERInteger = function(params) {
    KJUR.asn1.DERInteger.superclass.constructor.call(this);
    this.hT = "02";

    /**
     * set value by Tom Wu's BigInteger object
     * @name setByBigInteger
     * @memberOf KJUR.asn1.DERInteger
     * @function
     * @param {BigInteger} bigIntegerValue to set
     */
    this.setByBigInteger = function(bigIntegerValue) {
	this.hTLV = null;
	this.isModified = true;
	this.hV = KJUR.asn1.ASN1Util.bigIntToMinTwosComplementsHex(bigIntegerValue);
    };

    /**
     * set value by integer value
     * @name setByInteger
     * @memberOf KJUR.asn1.DERInteger
     * @function
     * @param {Integer} integer value to set
     */
    this.setByInteger = function(intValue) {
	var bi = new BigInteger(String(intValue), 10);
	this.setByBigInteger(bi);
    };

    /**
     * set value by integer value
     * @name setValueHex
     * @memberOf KJUR.asn1.DERInteger
     * @function
     * @param {String} hexadecimal string of integer value
     * @description
     * <br/>
     * NOTE: Value shall be represented by minimum octet length of
     * two's complement representation.
     * @example
     * new KJUR.asn1.DERInteger(123);
     * new KJUR.asn1.DERInteger({'int': 123});
     * new KJUR.asn1.DERInteger({'hex': '1fad'});
     */
    this.setValueHex = function(newHexString) {
	this.hV = newHexString;
    };

    this.getFreshValueHex = function() {
	return this.hV;
    };

    if (typeof params != "undefined") {
	if (typeof params['bigint'] != "undefined") {
	    this.setByBigInteger(params['bigint']);
	} else if (typeof params['int'] != "undefined") {
	    this.setByInteger(params['int']);
	} else if (typeof params == "number") {
	    this.setByInteger(params);
	} else if (typeof params['hex'] != "undefined") {
	    this.setValueHex(params['hex']);
	}
    }
};
YAHOO.lang.extend(KJUR.asn1.DERInteger, KJUR.asn1.ASN1Object);

// ********************************************************************
/**
 * class for ASN.1 DER encoded BitString primitive
 * @name KJUR.asn1.DERBitString
 * @class class for ASN.1 DER encoded BitString primitive
 * @extends KJUR.asn1.ASN1Object
 * @description 
 * <br/>
 * As for argument 'params' for constructor, you can specify one of
 * following properties:
 * <ul>
 * <li>bin - specify binary string (ex. '10111')</li>
 * <li>array - specify array of boolean (ex. [true,false,true,true])</li>
 * <li>hex - specify hexadecimal string of ASN.1 value(V) including unused bits</li>
 * </ul>
 * NOTE: 'params' can be omitted.
 */
KJUR.asn1.DERBitString = function(params) {
    KJUR.asn1.DERBitString.superclass.constructor.call(this);
    this.hT = "03";

    /**
     * set ASN.1 value(V) by a hexadecimal string including unused bits
     * @name setHexValueIncludingUnusedBits
     * @memberOf KJUR.asn1.DERBitString
     * @function
     * @param {String} newHexStringIncludingUnusedBits
     */
    this.setHexValueIncludingUnusedBits = function(newHexStringIncludingUnusedBits) {
	this.hTLV = null;
	this.isModified = true;
	this.hV = newHexStringIncludingUnusedBits;
    };

    /**
     * set ASN.1 value(V) by unused bit and hexadecimal string of value
     * @name setUnusedBitsAndHexValue
     * @memberOf KJUR.asn1.DERBitString
     * @function
     * @param {Integer} unusedBits
     * @param {String} hValue
     */
    this.setUnusedBitsAndHexValue = function(unusedBits, hValue) {
	if (unusedBits < 0 || 7 < unusedBits) {
	    throw "unused bits shall be from 0 to 7: u = " + unusedBits;
	}
	var hUnusedBits = "0" + unusedBits;
	this.hTLV = null;
	this.isModified = true;
	this.hV = hUnusedBits + hValue;
    };

    /**
     * set ASN.1 DER BitString by binary string
     * @name setByBinaryString
     * @memberOf KJUR.asn1.DERBitString
     * @function
     * @param {String} binaryString binary value string (i.e. '10111')
     * @description
     * Its unused bits will be calculated automatically by length of 
     * 'binaryValue'. <br/>
     * NOTE: Trailing zeros '0' will be ignored.
     */
    this.setByBinaryString = function(binaryString) {
	binaryString = binaryString.replace(/0+$/, '');
	var unusedBits = 8 - binaryString.length % 8;
	if (unusedBits == 8) unusedBits = 0;
	for (var i = 0; i <= unusedBits; i++) {
	    binaryString += '0';
	}
	var h = '';
	for (var i = 0; i < binaryString.length - 1; i += 8) {
	    var b = binaryString.substr(i, 8);
	    var x = parseInt(b, 2).toString(16);
	    if (x.length == 1) x = '0' + x;
	    h += x;  
	}
	this.hTLV = null;
	this.isModified = true;
	this.hV = '0' + unusedBits + h;
    };

    /**
     * set ASN.1 TLV value(V) by an array of boolean
     * @name setByBooleanArray
     * @memberOf KJUR.asn1.DERBitString
     * @function
     * @param {array} booleanArray array of boolean (ex. [true, false, true])
     * @description
     * NOTE: Trailing falses will be ignored.
     */
    this.setByBooleanArray = function(booleanArray) {
	var s = '';
	for (var i = 0; i < booleanArray.length; i++) {
	    if (booleanArray[i] == true) {
		s += '1';
	    } else {
		s += '0';
	    }
	}
	this.setByBinaryString(s);
    };

    /**
     * generate an array of false with specified length
     * @name newFalseArray
     * @memberOf KJUR.asn1.DERBitString
     * @function
     * @param {Integer} nLength length of array to generate
     * @return {array} array of boolean faluse
     * @description
     * This static method may be useful to initialize boolean array.
     */
    this.newFalseArray = function(nLength) {
	var a = new Array(nLength);
	for (var i = 0; i < nLength; i++) {
	    a[i] = false;
	}
	return a;
    };

    this.getFreshValueHex = function() {
	return this.hV;
    };

    if (typeof params != "undefined") {
	if (typeof params == "string" && params.toLowerCase().match(/^[0-9a-f]+$/)) {
	    this.setHexValueIncludingUnusedBits(params);
        } else if (typeof params['hex'] != "undefined") {
	    this.setHexValueIncludingUnusedBits(params['hex']);
	} else if (typeof params['bin'] != "undefined") {
	    this.setByBinaryString(params['bin']);
	} else if (typeof params['array'] != "undefined") {
	    this.setByBooleanArray(params['array']);
	}
    }
};
YAHOO.lang.extend(KJUR.asn1.DERBitString, KJUR.asn1.ASN1Object);

// ********************************************************************
/**
 * class for ASN.1 DER OctetString
 * @name KJUR.asn1.DEROctetString
 * @class class for ASN.1 DER OctetString
 * @param {Array} params associative array of parameters (ex. {'str': 'aaa'})
 * @extends KJUR.asn1.DERAbstractString
 * @description
 * @see KJUR.asn1.DERAbstractString - superclass
 */
KJUR.asn1.DEROctetString = function(params) {
    KJUR.asn1.DEROctetString.superclass.constructor.call(this, params);
    this.hT = "04";
};
YAHOO.lang.extend(KJUR.asn1.DEROctetString, KJUR.asn1.DERAbstractString);

// ********************************************************************
/**
 * class for ASN.1 DER Null
 * @name KJUR.asn1.DERNull
 * @class class for ASN.1 DER Null
 * @extends KJUR.asn1.ASN1Object
 * @description
 * @see KJUR.asn1.ASN1Object - superclass
 */
KJUR.asn1.DERNull = function() {
    KJUR.asn1.DERNull.superclass.constructor.call(this);
    this.hT = "05";
    this.hTLV = "0500";
};
YAHOO.lang.extend(KJUR.asn1.DERNull, KJUR.asn1.ASN1Object);

// ********************************************************************
/**
 * class for ASN.1 DER ObjectIdentifier
 * @name KJUR.asn1.DERObjectIdentifier
 * @class class for ASN.1 DER ObjectIdentifier
 * @param {Array} params associative array of parameters (ex. {'oid': '2.5.4.5'})
 * @extends KJUR.asn1.ASN1Object
 * @description
 * <br/>
 * As for argument 'params' for constructor, you can specify one of
 * following properties:
 * <ul>
 * <li>oid - specify initial ASN.1 value(V) by a oid string (ex. 2.5.4.13)</li>
 * <li>hex - specify initial ASN.1 value(V) by a hexadecimal string</li>
 * </ul>
 * NOTE: 'params' can be omitted.
 */
KJUR.asn1.DERObjectIdentifier = function(params) {
    var itox = function(i) {
	var h = i.toString(16);
	if (h.length == 1) h = '0' + h;
	return h;
    };
    var roidtox = function(roid) {
	var h = '';
	var bi = new BigInteger(roid, 10);
	var b = bi.toString(2);
	var padLen = 7 - b.length % 7;
	if (padLen == 7) padLen = 0;
	var bPad = '';
	for (var i = 0; i < padLen; i++) bPad += '0';
	b = bPad + b;
	for (var i = 0; i < b.length - 1; i += 7) {
	    var b8 = b.substr(i, 7);
	    if (i != b.length - 7) b8 = '1' + b8;
	    h += itox(parseInt(b8, 2));
	}
	return h;
    }

    KJUR.asn1.DERObjectIdentifier.superclass.constructor.call(this);
    this.hT = "06";

    /**
     * set value by a hexadecimal string
     * @name setValueHex
     * @memberOf KJUR.asn1.DERObjectIdentifier
     * @function
     * @param {String} newHexString hexadecimal value of OID bytes
     */
    this.setValueHex = function(newHexString) {
	this.hTLV = null;
	this.isModified = true;
	this.s = null;
	this.hV = newHexString;
    };

    /**
     * set value by a OID string
     * @name setValueOidString
     * @memberOf KJUR.asn1.DERObjectIdentifier
     * @function
     * @param {String} oidString OID string (ex. 2.5.4.13)
     */
    this.setValueOidString = function(oidString) {
	if (! oidString.match(/^[0-9.]+$/)) {
	    throw "malformed oid string: " + oidString;
	}
	var h = '';
	var a = oidString.split('.');
	var i0 = parseInt(a[0]) * 40 + parseInt(a[1]);
	h += itox(i0);
	a.splice(0, 2);
	for (var i = 0; i < a.length; i++) {
	    h += roidtox(a[i]);
	}
	this.hTLV = null;
	this.isModified = true;
	this.s = null;
	this.hV = h;
    };

    /**
     * set value by a OID name
     * @name setValueName
     * @memberOf KJUR.asn1.DERObjectIdentifier
     * @function
     * @param {String} oidName OID name (ex. 'serverAuth')
     * @since 1.0.1
     * @description
     * OID name shall be defined in 'KJUR.asn1.x509.OID.name2oidList'.
     * Otherwise raise error.
     */
    this.setValueName = function(oidName) {
	if (typeof KJUR.asn1.x509.OID.name2oidList[oidName] != "undefined") {
	    var oid = KJUR.asn1.x509.OID.name2oidList[oidName];
	    this.setValueOidString(oid);
	} else {
	    throw "DERObjectIdentifier oidName undefined: " + oidName;
	}
    };

    this.getFreshValueHex = function() {
	return this.hV;
    };

    if (typeof params != "undefined") {
	if (typeof params == "string" && params.match(/^[0-2].[0-9.]+$/)) {
	    this.setValueOidString(params);
	} else if (KJUR.asn1.x509.OID.name2oidList[params] !== undefined) {
	    this.setValueOidString(KJUR.asn1.x509.OID.name2oidList[params]);
	} else if (typeof params['oid'] != "undefined") {
	    this.setValueOidString(params['oid']);
	} else if (typeof params['hex'] != "undefined") {
	    this.setValueHex(params['hex']);
	} else if (typeof params['name'] != "undefined") {
	    this.setValueName(params['name']);
	}
    }
};
YAHOO.lang.extend(KJUR.asn1.DERObjectIdentifier, KJUR.asn1.ASN1Object);

// ********************************************************************
/**
 * class for ASN.1 DER UTF8String
 * @name KJUR.asn1.DERUTF8String
 * @class class for ASN.1 DER UTF8String
 * @param {Array} params associative array of parameters (ex. {'str': 'aaa'})
 * @extends KJUR.asn1.DERAbstractString
 * @description
 * @see KJUR.asn1.DERAbstractString - superclass
 */
KJUR.asn1.DERUTF8String = function(params) {
    KJUR.asn1.DERUTF8String.superclass.constructor.call(this, params);
    this.hT = "0c";
};
YAHOO.lang.extend(KJUR.asn1.DERUTF8String, KJUR.asn1.DERAbstractString);

// ********************************************************************
/**
 * class for ASN.1 DER NumericString
 * @name KJUR.asn1.DERNumericString
 * @class class for ASN.1 DER NumericString
 * @param {Array} params associative array of parameters (ex. {'str': 'aaa'})
 * @extends KJUR.asn1.DERAbstractString
 * @description
 * @see KJUR.asn1.DERAbstractString - superclass
 */
KJUR.asn1.DERNumericString = function(params) {
    KJUR.asn1.DERNumericString.superclass.constructor.call(this, params);
    this.hT = "12";
};
YAHOO.lang.extend(KJUR.asn1.DERNumericString, KJUR.asn1.DERAbstractString);

// ********************************************************************
/**
 * class for ASN.1 DER PrintableString
 * @name KJUR.asn1.DERPrintableString
 * @class class for ASN.1 DER PrintableString
 * @param {Array} params associative array of parameters (ex. {'str': 'aaa'})
 * @extends KJUR.asn1.DERAbstractString
 * @description
 * @see KJUR.asn1.DERAbstractString - superclass
 */
KJUR.asn1.DERPrintableString = function(params) {
    KJUR.asn1.DERPrintableString.superclass.constructor.call(this, params);
    this.hT = "13";
};
YAHOO.lang.extend(KJUR.asn1.DERPrintableString, KJUR.asn1.DERAbstractString);

// ********************************************************************
/**
 * class for ASN.1 DER TeletexString
 * @name KJUR.asn1.DERTeletexString
 * @class class for ASN.1 DER TeletexString
 * @param {Array} params associative array of parameters (ex. {'str': 'aaa'})
 * @extends KJUR.asn1.DERAbstractString
 * @description
 * @see KJUR.asn1.DERAbstractString - superclass
 */
KJUR.asn1.DERTeletexString = function(params) {
    KJUR.asn1.DERTeletexString.superclass.constructor.call(this, params);
    this.hT = "14";
};
YAHOO.lang.extend(KJUR.asn1.DERTeletexString, KJUR.asn1.DERAbstractString);

// ********************************************************************
/**
 * class for ASN.1 DER IA5String
 * @name KJUR.asn1.DERIA5String
 * @class class for ASN.1 DER IA5String
 * @param {Array} params associative array of parameters (ex. {'str': 'aaa'})
 * @extends KJUR.asn1.DERAbstractString
 * @description
 * @see KJUR.asn1.DERAbstractString - superclass
 */
KJUR.asn1.DERIA5String = function(params) {
    KJUR.asn1.DERIA5String.superclass.constructor.call(this, params);
    this.hT = "16";
};
YAHOO.lang.extend(KJUR.asn1.DERIA5String, KJUR.asn1.DERAbstractString);

// ********************************************************************
/**
 * class for ASN.1 DER UTCTime
 * @name KJUR.asn1.DERUTCTime
 * @class class for ASN.1 DER UTCTime
 * @param {Array} params associative array of parameters (ex. {'str': '130430235959Z'})
 * @extends KJUR.asn1.DERAbstractTime
 * @description
 * <br/>
 * As for argument 'params' for constructor, you can specify one of
 * following properties:
 * <ul>
 * <li>str - specify initial ASN.1 value(V) by a string (ex.'130430235959Z')</li>
 * <li>hex - specify initial ASN.1 value(V) by a hexadecimal string</li>
 * <li>date - specify Date object.</li>
 * </ul>
 * NOTE: 'params' can be omitted.
 * <h4>EXAMPLES</h4>
 * @example
 * var d1 = new KJUR.asn1.DERUTCTime();
 * d1.setString('130430125959Z');
 *
 * var d2 = new KJUR.asn1.DERUTCTime({'str': '130430125959Z'});
 * var d3 = new KJUR.asn1.DERUTCTime({'date': new Date(Date.UTC(2015, 0, 31, 0, 0, 0, 0))});
 * var d4 = new KJUR.asn1.DERUTCTime('130430125959Z');
 */
KJUR.asn1.DERUTCTime = function(params) {
    KJUR.asn1.DERUTCTime.superclass.constructor.call(this, params);
    this.hT = "17";

    /**
     * set value by a Date object
     * @name setByDate
     * @memberOf KJUR.asn1.DERUTCTime
     * @function
     * @param {Date} dateObject Date object to set ASN.1 value(V)
     */
    this.setByDate = function(dateObject) {
	this.hTLV = null;
	this.isModified = true;
	this.date = dateObject;
	this.s = this.formatDate(this.date, 'utc');
	this.hV = stohex(this.s);
    };

    if (typeof params != "undefined") {
	if (typeof params['str'] != "undefined") {
	    this.setString(params['str']);
	} else if (typeof params == "string" && params.match(/^[0-9]{12}Z$/)) {
	    this.setString(params);
	} else if (typeof params['hex'] != "undefined") {
	    this.setStringHex(params['hex']);
	} else if (typeof params['date'] != "undefined") {
	    this.setByDate(params['date']);
	}
    }
};
YAHOO.lang.extend(KJUR.asn1.DERUTCTime, KJUR.asn1.DERAbstractTime);

// ********************************************************************
/**
 * class for ASN.1 DER GeneralizedTime
 * @name KJUR.asn1.DERGeneralizedTime
 * @class class for ASN.1 DER GeneralizedTime
 * @param {Array} params associative array of parameters (ex. {'str': '20130430235959Z'})
 * @extends KJUR.asn1.DERAbstractTime
 * @description
 * <br/>
 * As for argument 'params' for constructor, you can specify one of
 * following properties:
 * <ul>
 * <li>str - specify initial ASN.1 value(V) by a string (ex.'20130430235959Z')</li>
 * <li>hex - specify initial ASN.1 value(V) by a hexadecimal string</li>
 * <li>date - specify Date object.</li>
 * </ul>
 * NOTE: 'params' can be omitted.
 */
KJUR.asn1.DERGeneralizedTime = function(params) {
    KJUR.asn1.DERGeneralizedTime.superclass.constructor.call(this, params);
    this.hT = "18";

    /**
     * set value by a Date object
     * @name setByDate
     * @memberOf KJUR.asn1.DERGeneralizedTime
     * @function
     * @param {Date} dateObject Date object to set ASN.1 value(V)
     * @example
     * When you specify UTC time, use 'Date.UTC' method like this:<br/>
     * var o = new DERUTCTime();
     * var date = new Date(Date.UTC(2015, 0, 31, 23, 59, 59, 0)); #2015JAN31 23:59:59
     * o.setByDate(date);
     */
    this.setByDate = function(dateObject) {
	this.hTLV = null;
	this.isModified = true;
	this.date = dateObject;
	this.s = this.formatDate(this.date, 'gen');
	this.hV = stohex(this.s);
    };

    if (typeof params != "undefined") {
	if (typeof params['str'] != "undefined") {
	    this.setString(params['str']);
	} else if (typeof params == "string" && params.match(/^[0-9]{14}Z$/)) {
	    this.setString(params);
	} else if (typeof params['hex'] != "undefined") {
	    this.setStringHex(params['hex']);
	} else if (typeof params['date'] != "undefined") {
	    this.setByDate(params['date']);
	}
    }
};
YAHOO.lang.extend(KJUR.asn1.DERGeneralizedTime, KJUR.asn1.DERAbstractTime);

// ********************************************************************
/**
 * class for ASN.1 DER Sequence
 * @name KJUR.asn1.DERSequence
 * @class class for ASN.1 DER Sequence
 * @extends KJUR.asn1.DERAbstractStructured
 * @description
 * <br/>
 * As for argument 'params' for constructor, you can specify one of
 * following properties:
 * <ul>
 * <li>array - specify array of ASN1Object to set elements of content</li>
 * </ul>
 * NOTE: 'params' can be omitted.
 */
KJUR.asn1.DERSequence = function(params) {
    KJUR.asn1.DERSequence.superclass.constructor.call(this, params);
    this.hT = "30";
    this.getFreshValueHex = function() {
	var h = '';
	for (var i = 0; i < this.asn1Array.length; i++) {
	    var asn1Obj = this.asn1Array[i];
	    h += asn1Obj.getEncodedHex();
	}
	this.hV = h;
	return this.hV;
    };
};
YAHOO.lang.extend(KJUR.asn1.DERSequence, KJUR.asn1.DERAbstractStructured);

// ********************************************************************
/**
 * class for ASN.1 DER Set
 * @name KJUR.asn1.DERSet
 * @class class for ASN.1 DER Set
 * @extends KJUR.asn1.DERAbstractStructured
 * @description
 * <br/>
 * As for argument 'params' for constructor, you can specify one of
 * following properties:
 * <ul>
 * <li>array - specify array of ASN1Object to set elements of content</li>
 * </ul>
 * NOTE: 'params' can be omitted.
 */
KJUR.asn1.DERSet = function(params) {
    KJUR.asn1.DERSet.superclass.constructor.call(this, params);
    this.hT = "31";
    this.getFreshValueHex = function() {
	var a = new Array();
	for (var i = 0; i < this.asn1Array.length; i++) {
	    var asn1Obj = this.asn1Array[i];
	    a.push(asn1Obj.getEncodedHex());
	}
	a.sort();
	this.hV = a.join('');
	return this.hV;
    };
};
YAHOO.lang.extend(KJUR.asn1.DERSet, KJUR.asn1.DERAbstractStructured);

// ********************************************************************
/**
 * class for ASN.1 DER TaggedObject
 * @name KJUR.asn1.DERTaggedObject
 * @class class for ASN.1 DER TaggedObject
 * @extends KJUR.asn1.ASN1Object
 * @description
 * <br/>
 * Parameter 'tagNoNex' is ASN.1 tag(T) value for this object.
 * For example, if you find '[1]' tag in a ASN.1 dump, 
 * 'tagNoHex' will be 'a1'.
 * <br/>
 * As for optional argument 'params' for constructor, you can specify *ANY* of
 * following properties:
 * <ul>
 * <li>explicit - specify true if this is explicit tag otherwise false 
 *     (default is 'true').</li>
 * <li>tag - specify tag (default is 'a0' which means [0])</li>
 * <li>obj - specify ASN1Object which is tagged</li>
 * </ul>
 * @example
 * d1 = new KJUR.asn1.DERUTF8String({'str':'a'});
 * d2 = new KJUR.asn1.DERTaggedObject({'obj': d1});
 * hex = d2.getEncodedHex();
 */
KJUR.asn1.DERTaggedObject = function(params) {
    KJUR.asn1.DERTaggedObject.superclass.constructor.call(this);
    this.hT = "a0";
    this.hV = '';
    this.isExplicit = true;
    this.asn1Object = null;

    /**
     * set value by an ASN1Object
     * @name setString
     * @memberOf KJUR.asn1.DERTaggedObject
     * @function
     * @param {Boolean} isExplicitFlag flag for explicit/implicit tag
     * @param {Integer} tagNoHex hexadecimal string of ASN.1 tag
     * @param {ASN1Object} asn1Object ASN.1 to encapsulate
     */
    this.setASN1Object = function(isExplicitFlag, tagNoHex, asn1Object) {
	this.hT = tagNoHex;
	this.isExplicit = isExplicitFlag;
	this.asn1Object = asn1Object;
	if (this.isExplicit) {
	    this.hV = this.asn1Object.getEncodedHex();
	    this.hTLV = null;
	    this.isModified = true;
	} else {
	    this.hV = null;
	    this.hTLV = asn1Object.getEncodedHex();
	    this.hTLV = this.hTLV.replace(/^../, tagNoHex);
	    this.isModified = false;
	}
    };

    this.getFreshValueHex = function() {
	return this.hV;
    };

    if (typeof params != "undefined") {
	if (typeof params['tag'] != "undefined") {
	    this.hT = params['tag'];
	}
	if (typeof params['explicit'] != "undefined") {
	    this.isExplicit = params['explicit'];
	}
	if (typeof params['obj'] != "undefined") {
	    this.asn1Object = params['obj'];
	    this.setASN1Object(this.isExplicit, this.hT, this.asn1Object);
	}
    }
};
YAHOO.lang.extend(KJUR.asn1.DERTaggedObject, KJUR.asn1.ASN1Object);

/*! asn1x509-1.0.7.js (c) 2013 Kenji Urushima | kjur.github.com/jsrsasign/license
 */
/*
 * asn1x509.js - ASN.1 DER encoder classes for X.509 certificate
 *
 * Copyright (c) 2013 Kenji Urushima (kenji.urushima@gmail.com)
 *
 * This software is licensed under the terms of the MIT License.
 * http://kjur.github.com/jsrsasign/license
 *
 * The above copyright and license notice shall be 
 * included in all copies or substantial portions of the Software.
 */

/**
 * @fileOverview
 * @name asn1x509-1.0.js
 * @author Kenji Urushima kenji.urushima@gmail.com
 * @version 1.0.7 (2013-Oct-11)
 * @since jsrsasign 2.1
 * @license <a href="http://kjur.github.io/jsrsasign/license/">MIT License</a>
 */

/** 
 * kjur's class library name space
 * // already documented in asn1-1.0.js
 * @name KJUR
 * @namespace kjur's class library name space
 */
if (typeof KJUR == "undefined" || !KJUR) KJUR = {};

/**
 * kjur's ASN.1 class library name space
 * // already documented in asn1-1.0.js
 * @name KJUR.asn1
 * @namespace
 */
if (typeof KJUR.asn1 == "undefined" || !KJUR.asn1) KJUR.asn1 = {};

/**
 * kjur's ASN.1 class for X.509 certificate library name space
 * <p>
 * <h4>FEATURES</h4>
 * <ul>
 * <li>easily issue any kind of certificate</li>
 * <li>APIs are very similar to BouncyCastle library ASN.1 classes. So easy to learn.</li>
 * </ul>
 * </p>
 * <h4>PROVIDED CLASSES</h4>
 * <ul>
 * <li>{@link KJUR.asn1.x509.Certificate}</li>
 * <li>{@link KJUR.asn1.x509.TBSCertificate}</li>
 * <li>{@link KJUR.asn1.x509.Extension}</li>
 * <li>{@link KJUR.asn1.x509.X500Name}</li>
 * <li>{@link KJUR.asn1.x509.RDN}</li>
 * <li>{@link KJUR.asn1.x509.AttributeTypeAndValue}</li>
 * <li>{@link KJUR.asn1.x509.SubjectPublicKeyInfo}</li>
 * <li>{@link KJUR.asn1.x509.AlgorithmIdentifier}</li>
 * <li>{@link KJUR.asn1.x509.GeneralName}</li>
 * <li>{@link KJUR.asn1.x509.GeneralNames}</li>
 * <li>{@link KJUR.asn1.x509.DistributionPointName}</li>
 * <li>{@link KJUR.asn1.x509.DistributionPoint}</li>
 * <li>{@link KJUR.asn1.x509.CRL}</li>
 * <li>{@link KJUR.asn1.x509.TBSCertList}</li>
 * <li>{@link KJUR.asn1.x509.CRLEntry}</li>
 * <li>{@link KJUR.asn1.x509.OID}</li>
 * </ul>
 * <h4>SUPPORTED EXTENSIONS</h4>
 * <ul>
 * <li>{@link KJUR.asn1.x509.BasicConstraints}</li>
 * <li>{@link KJUR.asn1.x509.KeyUsage}</li>
 * <li>{@link KJUR.asn1.x509.CRLDistributionPoints}</li>
 * <li>{@link KJUR.asn1.x509.ExtKeyUsage}</li>
 * </ul>
 * NOTE: Please ignore method summary and document of this namespace. This caused by a bug of jsdoc2.
 * @name KJUR.asn1.x509
 * @namespace
 */
if (typeof KJUR.asn1.x509 == "undefined" || !KJUR.asn1.x509) KJUR.asn1.x509 = {};

// === BEGIN Certificate ===================================================

/**
 * X.509 Certificate class to sign and generate hex encoded certificate
 * @name KJUR.asn1.x509.Certificate
 * @class X.509 Certificate class to sign and generate hex encoded certificate
 * @param {Array} params associative array of parameters (ex. {'tbscertobj': obj, 'prvkeyobj': key})
 * @extends KJUR.asn1.ASN1Object
 * @description
 * <br/>
 * As for argument 'params' for constructor, you can specify one of
 * following properties:
 * <ul>
 * <li>tbscertobj - specify {@link KJUR.asn1.x509.TBSCertificate} object</li>
 * <li>prvkeyobj - specify {@link RSAKey}, {@link KJUR.crypto.ECDSA} or {@link KJUR.crypto.DSA} object for CA private key to sign the certificate</li>
 * <li>(DEPRECATED)rsaprvkey - specify {@link RSAKey} object CA private key</li>
 * <li>(DEPRECATED)rsaprvpem - specify PEM string of RSA CA private key</li>
 * </ul>
 * NOTE1: 'params' can be omitted.<br/>
 * NOTE2: DSA/ECDSA is also supported for CA signging key from asn1x509 1.0.6.
 * @example
 * var caKey = KEYUTIL.getKey(caKeyPEM); // CA's private key
 * var cert = new KJUR.asn1x509.Certificate({'tbscertobj': tbs, 'prvkeyobj': caKey});
 * cert.sign(); // issue certificate by CA's private key
 * var certPEM = cert.getPEMString();
 *
 * // Certificate  ::=  SEQUENCE  {
 * //     tbsCertificate       TBSCertificate,
 * //     signatureAlgorithm   AlgorithmIdentifier,
 * //     signature            BIT STRING  }	    
 */
KJUR.asn1.x509.Certificate = function(params) {
    KJUR.asn1.x509.Certificate.superclass.constructor.call(this);
    var asn1TBSCert = null;
    var asn1SignatureAlg = null;
    var asn1Sig = null;
    var hexSig = null;
    var prvKey = null;
    var rsaPrvKey = null; // DEPRECATED

    
    /**
     * set PKCS#5 encrypted RSA PEM private key as CA key
     * @name setRsaPrvKeyByPEMandPass
     * @memberOf KJUR.asn1.x509.Certificate
     * @function
     * @param {String} rsaPEM string of PKCS#5 encrypted RSA PEM private key
     * @param {String} passPEM passcode string to decrypt private key
     * @since 1.0.1
     * @description
     * <br/>
     * <h4>EXAMPLES</h4>
     * @example
     * var cert = new KJUR.asn1.x509.Certificate({'tbscertobj': tbs});
     * cert.setRsaPrvKeyByPEMandPass("-----BEGIN RSA PRIVATE..(snip)", "password");
     */
    this.setRsaPrvKeyByPEMandPass = function(rsaPEM, passPEM) {
	var caKeyHex = PKCS5PKEY.getDecryptedKeyHex(rsaPEM, passPEM);
	var caKey = new RSAKey();
	caKey.readPrivateKeyFromASN1HexString(caKeyHex);  
	this.prvKey = caKey;
    };

    /**
     * sign TBSCertificate and set signature value internally
     * @name sign
     * @memberOf KJUR.asn1.x509.Certificate
     * @function
     * @description
     * @example
     * var cert = new KJUR.asn1.x509.Certificate({'tbscertobj': tbs, 'rsaprvkey': prvKey});
     * cert.sign();
     */
    this.sign = function() {
	this.asn1SignatureAlg = this.asn1TBSCert.asn1SignatureAlg;

	sig = new KJUR.crypto.Signature({'alg': 'SHA1withRSA'});
	sig.init(this.prvKey);
	sig.updateHex(this.asn1TBSCert.getEncodedHex());
	this.hexSig = sig.sign();

	this.asn1Sig = new KJUR.asn1.DERBitString({'hex': '00' + this.hexSig});
	
	var seq = new KJUR.asn1.DERSequence({'array': [this.asn1TBSCert,
						       this.asn1SignatureAlg,
						       this.asn1Sig]});
	this.hTLV = seq.getEncodedHex();
	this.isModified = false;
    };

    this.getEncodedHex = function() {
	if (this.isModified == false && this.hTLV != null) return this.hTLV;
	throw "not signed yet";
    };

    /**
     * get PEM formatted certificate string after signed
     * @name getPEMString
     * @memberOf KJUR.asn1.x509.Certificate
     * @function
     * @return PEM formatted string of certificate
     * @description
     * @example
     * var cert = new KJUR.asn1.x509.Certificate({'tbscertobj': tbs, 'rsaprvkey': prvKey});
     * cert.sign();
     * var sPEM =  cert.getPEMString();
     */
    this.getPEMString = function() {
	var hCert = this.getEncodedHex();
	var wCert = CryptoJS.enc.Hex.parse(hCert);
	var b64Cert = CryptoJS.enc.Base64.stringify(wCert);
	var pemBody = b64Cert.replace(/(.{64})/g, "$1\r\n");
	return "-----BEGIN CERTIFICATE-----\r\n" + pemBody + "\r\n-----END CERTIFICATE-----\r\n";
    };

    if (typeof params != "undefined") {
	if (typeof params['tbscertobj'] != "undefined") {
	    this.asn1TBSCert = params['tbscertobj'];
	}
	if (typeof params['prvkeyobj'] != "undefined") {
	    this.prvKey = params['prvkeyobj'];
	} else if (typeof params['rsaprvkey'] != "undefined") {
	    this.prvKey = params['rsaprvkey'];
        } else if ((typeof params['rsaprvpem'] != "undefined") &&
	    (typeof params['rsaprvpas'] != "undefined")) {
	    this.setRsaPrvKeyByPEMandPass(params['rsaprvpem'], params['rsaprvpas']);
	}
    }
};
YAHOO.lang.extend(KJUR.asn1.x509.Certificate, KJUR.asn1.ASN1Object);

/**
 * ASN.1 TBSCertificate structure class
 * @name KJUR.asn1.x509.TBSCertificate
 * @class ASN.1 TBSCertificate structure class
 * @param {Array} params associative array of parameters (ex. {})
 * @extends KJUR.asn1.ASN1Object
 * @description
 * <br/>
 * <h4>EXAMPLE</h4>
 * @example
 *  var o = new KJUR.asn1.x509.TBSCertificate();
 *  o.setSerialNumberByParam({'int': 4});
 *  o.setSignatureAlgByParam({'name': 'SHA1withRSA'});
 *  o.setIssuerByParam({'str': '/C=US/O=a'});
 *  o.setNotBeforeByParam({'str': '130504235959Z'});
 *  o.setNotAfterByParam({'str': '140504235959Z'});
 *  o.setSubjectByParam({'str': '/C=US/CN=b'});
 *  o.setSubjectPublicKeyByParam({'rsakey': rsaKey});
 *  o.appendExtension(new KJUR.asn1.x509.BasicConstraints({'cA':true}));
 *  o.appendExtension(new KJUR.asn1.x509.KeyUsage({'bin':'11'}));
 */
KJUR.asn1.x509.TBSCertificate = function(params) {
    KJUR.asn1.x509.TBSCertificate.superclass.constructor.call(this);

    this._initialize = function() {
	this.asn1Array = new Array();

	this.asn1Version = 
	    new KJUR.asn1.DERTaggedObject({'obj': new KJUR.asn1.DERInteger({'int': 2})});
	this.asn1SerialNumber = null;
	this.asn1SignatureAlg = null;
	this.asn1Issuer = null;
	this.asn1NotBefore = null;
	this.asn1NotAfter = null;
	this.asn1Subject = null;
	this.asn1SubjPKey = null;
	this.extensionsArray = new Array();
    };

    /**
     * set serial number field by parameter
     * @name setSerialNumberByParam
     * @memberOf KJUR.asn1.x509.TBSCertificate
     * @function
     * @param {Array} intParam DERInteger param
     * @description
     * @example
     * tbsc.setSerialNumberByParam({'int': 3});
     */
    this.setSerialNumberByParam = function(intParam) {
	this.asn1SerialNumber = new KJUR.asn1.DERInteger(intParam);
    };

    /**
     * set signature algorithm field by parameter
     * @name setSignatureAlgByParam
     * @memberOf KJUR.asn1.x509.TBSCertificate
     * @function
     * @param {Array} algIdParam AlgorithmIdentifier parameter
     * @description
     * @example
     * tbsc.setSignatureAlgByParam({'name': 'SHA1withRSA'});
     */
    this.setSignatureAlgByParam = function(algIdParam) {
	this.asn1SignatureAlg = new KJUR.asn1.x509.AlgorithmIdentifier(algIdParam);
    };

    /**
     * set issuer name field by parameter
     * @name setIssuerByParam
     * @memberOf KJUR.asn1.x509.TBSCertificate
     * @function
     * @param {Array} x500NameParam X500Name parameter
     * @description
     * @example
     * tbsc.setIssuerParam({'str': '/C=US/CN=b'});
     * @see KJUR.asn1.x509.X500Name
     */
    this.setIssuerByParam = function(x500NameParam) {
	this.asn1Issuer = new KJUR.asn1.x509.X500Name(x500NameParam);
    };

    /**
     * set notBefore field by parameter
     * @name setNotBeforeByParam
     * @memberOf KJUR.asn1.x509.TBSCertificate
     * @function
     * @param {Array} timeParam Time parameter
     * @description
     * @example
     * tbsc.setNotBeforeByParam({'str': '130508235959Z'});
     * @see KJUR.asn1.x509.Time
     */
    this.setNotBeforeByParam = function(timeParam) {
	this.asn1NotBefore = new KJUR.asn1.x509.Time(timeParam);
    };
    
    /**
     * set notAfter field by parameter
     * @name setNotAfterByParam
     * @memberOf KJUR.asn1.x509.TBSCertificate
     * @function
     * @param {Array} timeParam Time parameter
     * @description
     * @example
     * tbsc.setNotAfterByParam({'str': '130508235959Z'});
     * @see KJUR.asn1.x509.Time
     */
    this.setNotAfterByParam = function(timeParam) {
	this.asn1NotAfter = new KJUR.asn1.x509.Time(timeParam);
    };

    /**
     * set subject name field by parameter
     * @name setSubjectByParam
     * @memberOf KJUR.asn1.x509.TBSCertificate
     * @function
     * @param {Array} x500NameParam X500Name parameter
     * @description
     * @example
     * tbsc.setSubjectParam({'str': '/C=US/CN=b'});
     * @see KJUR.asn1.x509.X500Name
     */
    this.setSubjectByParam = function(x500NameParam) {
	this.asn1Subject = new KJUR.asn1.x509.X500Name(x500NameParam);
    };

    /**
     * (DEPRECATED) set subject public key info field by RSA key parameter
     * @name setSubjectPublicKeyByParam
     * @memberOf KJUR.asn1.x509.TBSCertificate
     * @function
     * @param {Array} subjPKeyParam SubjectPublicKeyInfo parameter of RSA
     * @deprecated
     * @description
     * @example
     * tbsc.setSubjectPublicKeyByParam({'rsakey': pubKey});
     * @see KJUR.asn1.x509.SubjectPublicKeyInfo
     */
    this.setSubjectPublicKeyByParam = function(subjPKeyParam) {
	this.asn1SubjPKey = new KJUR.asn1.x509.SubjectPublicKeyInfo(subjPKeyParam);
    };

    /**
     * set subject public key info by RSA/ECDSA/DSA key parameter
     * @name setSubjectPublicKeyByGetKey
     * @memberOf KJUR.asn1.x509.TBSCertificate
     * @function
     * @param {Object} keyParam public key parameter which passed to {@link KEYUTIL.getKey} argument
     * @description
     * @example
     * tbsc.setSubjectPublicKeyByGetKeyParam(certPEMString); // or 
     * tbsc.setSubjectPublicKeyByGetKeyParam(pkcs8PublicKeyPEMString); // or 
     * tbsc.setSubjectPublicKeyByGetKeyParam(kjurCryptoECDSAKeyObject); // et.al.
     * @see KJUR.asn1.x509.SubjectPublicKeyInfo
     * @see KEYUTIL.getKey
     * @since asn1x509 1.0.6
     */
    this.setSubjectPublicKeyByGetKey = function(keyParam) {
	var keyObj = KEYUTIL.getKey(keyParam);
	this.asn1SubjPKey = new KJUR.asn1.x509.SubjectPublicKeyInfo(keyObj);
    };

    /**
     * append X.509v3 extension to this object
     * @name appendExtension
     * @memberOf KJUR.asn1.x509.TBSCertificate
     * @function
     * @param {Extension} extObj X.509v3 Extension object
     * @description
     * @example
     * tbsc.appendExtension(new KJUR.asn1.x509.BasicConstraints({'cA':true, 'critical': true}));
     * tbsc.appendExtension(new KJUR.asn1.x509.KeyUsage({'bin':'11'}));
     * @see KJUR.asn1.x509.Extension
     */
    this.appendExtension = function(extObj) {
	this.extensionsArray.push(extObj);
    };

    /**
     * append X.509v3 extension to this object by name and parameters
     * @name appendExtensionByName
     * @memberOf KJUR.asn1.x509.TBSCertificate
     * @function
     * @param {name} name name of X.509v3 Extension object
     * @param {Array} extParams parameters as argument of Extension constructor.
     * @description
     * @example
     * tbsc.appendExtensionByName('BasicConstraints', {'cA':true, 'critical': true});
     * tbsc.appendExtensionByName('KeyUsage', {'bin':'11'});
     * tbsc.appendExtensionByName('CRLDistributionPoints', {uri: 'http://aaa.com/a.crl'});
     * tbsc.appendExtensionByName('ExtKeyUsage', {array: [{name: 'clientAuth'}]});
     * @see KJUR.asn1.x509.Extension
     */
    this.appendExtensionByName = function(name, extParams) {
	if (name.toLowerCase() == "basicconstraints") {
	    var extObj = new KJUR.asn1.x509.BasicConstraints(extParams);
	    this.appendExtension(extObj);
	} else if (name.toLowerCase() == "keyusage") {
	    var extObj = new KJUR.asn1.x509.KeyUsage(extParams);
	    this.appendExtension(extObj);
	} else if (name.toLowerCase() == "crldistributionpoints") {
	    var extObj = new KJUR.asn1.x509.CRLDistributionPoints(extParams);
	    this.appendExtension(extObj);
	} else if (name.toLowerCase() == "extkeyusage") {
	    var extObj = new KJUR.asn1.x509.ExtKeyUsage(extParams);
	    this.appendExtension(extObj);
	} else {
	    throw "unsupported extension name: " + name;
	}
    };

    this.getEncodedHex = function() {
	if (this.asn1NotBefore == null || this.asn1NotAfter == null)
	    throw "notBefore and/or notAfter not set";
	var asn1Validity = 
	    new KJUR.asn1.DERSequence({'array':[this.asn1NotBefore, this.asn1NotAfter]});

	this.asn1Array = new Array();

	this.asn1Array.push(this.asn1Version);
	this.asn1Array.push(this.asn1SerialNumber);
	this.asn1Array.push(this.asn1SignatureAlg);
	this.asn1Array.push(this.asn1Issuer);
	this.asn1Array.push(asn1Validity);
	this.asn1Array.push(this.asn1Subject);
	this.asn1Array.push(this.asn1SubjPKey);

	if (this.extensionsArray.length > 0) {
	    var extSeq = new KJUR.asn1.DERSequence({"array": this.extensionsArray});
	    var extTagObj = new KJUR.asn1.DERTaggedObject({'explicit': true,
							   'tag': 'a3',
							   'obj': extSeq});
	    this.asn1Array.push(extTagObj);
	}

	var o = new KJUR.asn1.DERSequence({"array": this.asn1Array});
	this.hTLV = o.getEncodedHex();
	this.isModified = false;
	return this.hTLV;
    };

    this._initialize();
};
YAHOO.lang.extend(KJUR.asn1.x509.TBSCertificate, KJUR.asn1.ASN1Object);

// === END   TBSCertificate ===================================================

// === BEGIN X.509v3 Extensions Related =======================================

/**
 * base Extension ASN.1 structure class
 * @name KJUR.asn1.x509.Extension
 * @class base Extension ASN.1 structure class
 * @param {Array} params associative array of parameters (ex. {'critical': true})
 * @extends KJUR.asn1.ASN1Object
 * @description
 * @example
 * // Extension  ::=  SEQUENCE  {
 * //     extnID      OBJECT IDENTIFIER,
 * //     critical    BOOLEAN DEFAULT FALSE,
 * //     extnValue   OCTET STRING  }
 */
KJUR.asn1.x509.Extension = function(params) {
    KJUR.asn1.x509.Extension.superclass.constructor.call(this);
    var asn1ExtnValue = null;

    this.getEncodedHex = function() {
	var asn1Oid = new KJUR.asn1.DERObjectIdentifier({'oid': this.oid});
	var asn1EncapExtnValue = 
	    new KJUR.asn1.DEROctetString({'hex': this.getExtnValueHex()});

	var asn1Array = new Array();
	asn1Array.push(asn1Oid);
	if (this.critical) asn1Array.push(new KJUR.asn1.DERBoolean());
	asn1Array.push(asn1EncapExtnValue);

	var asn1Seq = new KJUR.asn1.DERSequence({'array': asn1Array});
	return asn1Seq.getEncodedHex();
    };

    this.critical = false;
    if (typeof params != "undefined") {
	if (typeof params['critical'] != "undefined") {
	    this.critical = params['critical'];
	}
    }
};
YAHOO.lang.extend(KJUR.asn1.x509.Extension, KJUR.asn1.ASN1Object);

/**
 * KeyUsage ASN.1 structure class
 * @name KJUR.asn1.x509.KeyUsage
 * @class KeyUsage ASN.1 structure class
 * @param {Array} params associative array of parameters (ex. {'bin': '11', 'critical': true})
 * @extends KJUR.asn1.x509.Extension
 * @description
 * @example
 */
KJUR.asn1.x509.KeyUsage = function(params) {
    KJUR.asn1.x509.KeyUsage.superclass.constructor.call(this, params);

    this.getExtnValueHex = function() {
	return this.asn1ExtnValue.getEncodedHex();
    };

    this.oid = "2.5.29.15";
    if (typeof params != "undefined") {
	if (typeof params['bin'] != "undefined") {
	    this.asn1ExtnValue = new KJUR.asn1.DERBitString(params);
	}
    }
};
YAHOO.lang.extend(KJUR.asn1.x509.KeyUsage, KJUR.asn1.x509.Extension);

/**
 * BasicConstraints ASN.1 structure class
 * @name KJUR.asn1.x509.BasicConstraints
 * @class BasicConstraints ASN.1 structure class
 * @param {Array} params associative array of parameters (ex. {'cA': true, 'critical': true})
 * @extends KJUR.asn1.x509.Extension
 * @description
 * @example
 */
KJUR.asn1.x509.BasicConstraints = function(params) {
    KJUR.asn1.x509.BasicConstraints.superclass.constructor.call(this, params);
    var cA = false;
    var pathLen = -1;

    this.getExtnValueHex = function() {
	var asn1Array = new Array();
	if (this.cA) asn1Array.push(new KJUR.asn1.DERBoolean());
	if (this.pathLen > -1) 
	    asn1Array.push(new KJUR.asn1.DERInteger({'int': this.pathLen}));
	var asn1Seq = new KJUR.asn1.DERSequence({'array': asn1Array});
	this.asn1ExtnValue = asn1Seq;
	return this.asn1ExtnValue.getEncodedHex();
    };

    this.oid = "2.5.29.19";
    this.cA = false;
    this.pathLen = -1;
    if (typeof params != "undefined") {
	if (typeof params['cA'] != "undefined") {
	    this.cA = params['cA'];
	}
	if (typeof params['pathLen'] != "undefined") {
	    this.pathLen = params['pathLen'];
	}
    }
};
YAHOO.lang.extend(KJUR.asn1.x509.BasicConstraints, KJUR.asn1.x509.Extension);

/**
 * CRLDistributionPoints ASN.1 structure class
 * @name KJUR.asn1.x509.CRLDistributionPoints
 * @class CRLDistributionPoints ASN.1 structure class
 * @param {Array} params associative array of parameters (ex. {'uri': 'http://a.com/', 'critical': true})
 * @extends KJUR.asn1.x509.Extension
 * @description
 * @example
 */
KJUR.asn1.x509.CRLDistributionPoints = function(params) {
    KJUR.asn1.x509.CRLDistributionPoints.superclass.constructor.call(this, params);

    this.getExtnValueHex = function() {
	return this.asn1ExtnValue.getEncodedHex();
    };

    this.setByDPArray = function(dpArray) {
	this.asn1ExtnValue = new KJUR.asn1.DERSequence({'array': dpArray});
    };

    this.setByOneURI = function(uri) {
	var gn1 = new KJUR.asn1.x509.GeneralNames([{'uri': uri}]);
	var dpn1 = new KJUR.asn1.x509.DistributionPointName(gn1);
	var dp1 = new KJUR.asn1.x509.DistributionPoint({'dpobj': dpn1});
	this.setByDPArray([dp1]);
    };

    this.oid = "2.5.29.31";
    if (typeof params != "undefined") {
	if (typeof params['array'] != "undefined") {
	    this.setByDPArray(params['array']);
	} else if (typeof params['uri'] != "undefined") {
	    this.setByOneURI(params['uri']);
	}
    }
};
YAHOO.lang.extend(KJUR.asn1.x509.CRLDistributionPoints, KJUR.asn1.x509.Extension);

/**
 * KeyUsage ASN.1 structure class
 * @name KJUR.asn1.x509.ExtKeyUsage
 * @class ExtKeyUsage ASN.1 structure class
 * @param {Array} params associative array of parameters
 * @extends KJUR.asn1.x509.Extension
 * @description
 * @example
 * var e1 = 
 *     new KJUR.asn1.x509.ExtKeyUsage({'critical': true,
 *                                     'array':
 *                                     [{'oid': '2.5.29.37.0',  // anyExtendedKeyUsage
 *                                       'name': 'clientAuth'}]});
 *
 * // id-ce-extKeyUsage OBJECT IDENTIFIER ::= { id-ce 37 }
 * // ExtKeyUsageSyntax ::= SEQUENCE SIZE (1..MAX) OF KeyPurposeId
 * // KeyPurposeId ::= OBJECT IDENTIFIER
 */
KJUR.asn1.x509.ExtKeyUsage = function(params) {
    KJUR.asn1.x509.ExtKeyUsage.superclass.constructor.call(this, params);

    this.setPurposeArray = function(purposeArray) {
	this.asn1ExtnValue = new KJUR.asn1.DERSequence();
	for (var i = 0; i < purposeArray.length; i++) {
	    var o = new KJUR.asn1.DERObjectIdentifier(purposeArray[i]);
	    this.asn1ExtnValue.appendASN1Object(o);
	}
    };

    this.getExtnValueHex = function() {
	return this.asn1ExtnValue.getEncodedHex();
    };

    this.oid = "2.5.29.37";
    if (typeof params != "undefined") {
	if (typeof params['array'] != "undefined") {
            this.setPurposeArray(params['array']);
	}
    }
};
YAHOO.lang.extend(KJUR.asn1.x509.ExtKeyUsage, KJUR.asn1.x509.Extension);


// === END   X.509v3 Extensions Related =======================================

// === BEGIN CRL Related ===================================================
/**
 * X.509 CRL class to sign and generate hex encoded CRL
 * @name KJUR.asn1.x509.CRL
 * @class X.509 CRL class to sign and generate hex encoded certificate
 * @param {Array} params associative array of parameters (ex. {'tbsobj': obj, 'rsaprvkey': key})
 * @extends KJUR.asn1.ASN1Object
 * @since 1.0.3
 * @description
 * <br/>
 * As for argument 'params' for constructor, you can specify one of
 * following properties:
 * <ul>
 * <li>tbsobj - specify {@link KJUR.asn1.x509.TBSCertList} object to be signed</li>
 * <li>rsaprvkey - specify {@link RSAKey} object CA private key</li>
 * </ul>
 * NOTE: 'params' can be omitted.
 * <h4>EXAMPLE</h4>
 * @example
 * var prvKey = new RSAKey(); // CA's private key
 * prvKey.readPrivateKeyFromASN1HexString("3080...");
 * var crl = new KJUR.asn1x509.CRL({'tbsobj': tbs, 'rsaprvkey': prvKey});
 * crl.sign(); // issue CRL by CA's private key
 * var hCRL = crl.getEncodedHex();
 *
 * // CertificateList  ::=  SEQUENCE  {
 * //     tbsCertList          TBSCertList,
 * //     signatureAlgorithm   AlgorithmIdentifier,
 * //     signatureValue       BIT STRING  }
 */
KJUR.asn1.x509.CRL = function(params) {
    KJUR.asn1.x509.CRL.superclass.constructor.call(this);

    var asn1TBSCertList = null;
    var asn1SignatureAlg = null;
    var asn1Sig = null;
    var hexSig = null;
    var rsaPrvKey = null;
    
    /**
     * set PKCS#5 encrypted RSA PEM private key as CA key
     * @name setRsaPrvKeyByPEMandPass
     * @memberOf KJUR.asn1.x509.CRL
     * @function
     * @param {String} rsaPEM string of PKCS#5 encrypted RSA PEM private key
     * @param {String} passPEM passcode string to decrypt private key
     * @description
     * <br/>
     * <h4>EXAMPLES</h4>
     * @example
     */
    this.setRsaPrvKeyByPEMandPass = function(rsaPEM, passPEM) {
	var caKeyHex = PKCS5PKEY.getDecryptedKeyHex(rsaPEM, passPEM);
	var caKey = new RSAKey();
	caKey.readPrivateKeyFromASN1HexString(caKeyHex);  
	this.rsaPrvKey = caKey;
    };

    /**
     * sign TBSCertList and set signature value internally
     * @name sign
     * @memberOf KJUR.asn1.x509.CRL
     * @function
     * @description
     * @example
     * var cert = new KJUR.asn1.x509.CRL({'tbsobj': tbs, 'rsaprvkey': prvKey});
     * cert.sign();
     */
    this.sign = function() {
	this.asn1SignatureAlg = this.asn1TBSCertList.asn1SignatureAlg;

	sig = new KJUR.crypto.Signature({'alg': 'SHA1withRSA', 'prov': 'cryptojs/jsrsa'});
	sig.initSign(this.rsaPrvKey);
	sig.updateHex(this.asn1TBSCertList.getEncodedHex());
	this.hexSig = sig.sign();

	this.asn1Sig = new KJUR.asn1.DERBitString({'hex': '00' + this.hexSig});
	
	var seq = new KJUR.asn1.DERSequence({'array': [this.asn1TBSCertList,
						       this.asn1SignatureAlg,
						       this.asn1Sig]});
	this.hTLV = seq.getEncodedHex();
	this.isModified = false;
    };

    this.getEncodedHex = function() {
	if (this.isModified == false && this.hTLV != null) return this.hTLV;
	throw "not signed yet";
    };

    /**
     * get PEM formatted CRL string after signed
     * @name getPEMString
     * @memberOf KJUR.asn1.x509.CRL
     * @function
     * @return PEM formatted string of certificate
     * @description
     * @example
     * var cert = new KJUR.asn1.x509.CRL({'tbsobj': tbs, 'rsaprvkey': prvKey});
     * cert.sign();
     * var sPEM =  cert.getPEMString();
     */
    this.getPEMString = function() {
	var hCert = this.getEncodedHex();
	var wCert = CryptoJS.enc.Hex.parse(hCert);
	var b64Cert = CryptoJS.enc.Base64.stringify(wCert);
	var pemBody = b64Cert.replace(/(.{64})/g, "$1\r\n");
	return "-----BEGIN X509 CRL-----\r\n" + pemBody + "\r\n-----END X509 CRL-----\r\n";
    };

    if (typeof params != "undefined") {
	if (typeof params['tbsobj'] != "undefined") {
	    this.asn1TBSCertList = params['tbsobj'];
	}
	if (typeof params['rsaprvkey'] != "undefined") {
	    this.rsaPrvKey = params['rsaprvkey'];
	}
	if ((typeof params['rsaprvpem'] != "undefined") &&
	    (typeof params['rsaprvpas'] != "undefined")) {
	    this.setRsaPrvKeyByPEMandPass(params['rsaprvpem'], params['rsaprvpas']);
	}
    }
};
YAHOO.lang.extend(KJUR.asn1.x509.CRL, KJUR.asn1.ASN1Object);

/**
 * ASN.1 TBSCertList structure class for CRL
 * @name KJUR.asn1.x509.TBSCertList
 * @class ASN.1 TBSCertList structure class for CRL
 * @param {Array} params associative array of parameters (ex. {})
 * @extends KJUR.asn1.ASN1Object
 * @since 1.0.3
 * @description
 * <br/>
 * <h4>EXAMPLE</h4>
 * @example
 *  var o = new KJUR.asn1.x509.TBSCertList();
 *  o.setSignatureAlgByParam({'name': 'SHA1withRSA'});
 *  o.setIssuerByParam({'str': '/C=US/O=a'});
 *  o.setNotThisUpdateByParam({'str': '130504235959Z'});
 *  o.setNotNextUpdateByParam({'str': '140504235959Z'});
 *  o.addRevokedCert({'int': 4}, {'str':'130514235959Z'}));
 *  o.addRevokedCert({'hex': '0f34dd'}, {'str':'130514235959Z'}));
 * 
 * // TBSCertList  ::=  SEQUENCE  {
 * //        version                 Version OPTIONAL,
 * //                                     -- if present, MUST be v2
 * //        signature               AlgorithmIdentifier,
 * //        issuer                  Name,
 * //        thisUpdate              Time,
 * //        nextUpdate              Time OPTIONAL,
 * //        revokedCertificates     SEQUENCE OF SEQUENCE  {
 * //             userCertificate         CertificateSerialNumber,
 * //             revocationDate          Time,
 * //             crlEntryExtensions      Extensions OPTIONAL
 * //                                      -- if present, version MUST be v2
 * //                                  }  OPTIONAL,
 * //        crlExtensions           [0]  EXPLICIT Extensions OPTIONAL
 */
KJUR.asn1.x509.TBSCertList = function(params) {
    KJUR.asn1.x509.TBSCertList.superclass.constructor.call(this);
    var aRevokedCert = null;

    /**
     * set signature algorithm field by parameter
     * @name setSignatureAlgByParam
     * @memberOf KJUR.asn1.x509.TBSCertList
     * @function
     * @param {Array} algIdParam AlgorithmIdentifier parameter
     * @description
     * @example
     * tbsc.setSignatureAlgByParam({'name': 'SHA1withRSA'});
     */
    this.setSignatureAlgByParam = function(algIdParam) {
	this.asn1SignatureAlg = new KJUR.asn1.x509.AlgorithmIdentifier(algIdParam);
    };

    /**
     * set issuer name field by parameter
     * @name setIssuerByParam
     * @memberOf KJUR.asn1.x509.TBSCertList
     * @function
     * @param {Array} x500NameParam X500Name parameter
     * @description
     * @example
     * tbsc.setIssuerParam({'str': '/C=US/CN=b'});
     * @see KJUR.asn1.x509.X500Name
     */
    this.setIssuerByParam = function(x500NameParam) {
	this.asn1Issuer = new KJUR.asn1.x509.X500Name(x500NameParam);
    };

    /**
     * set thisUpdate field by parameter
     * @name setThisUpdateByParam
     * @memberOf KJUR.asn1.x509.TBSCertList
     * @function
     * @param {Array} timeParam Time parameter
     * @description
     * @example
     * tbsc.setThisUpdateByParam({'str': '130508235959Z'});
     * @see KJUR.asn1.x509.Time
     */
    this.setThisUpdateByParam = function(timeParam) {
	this.asn1ThisUpdate = new KJUR.asn1.x509.Time(timeParam);
    };

    /**
     * set nextUpdate field by parameter
     * @name setNextUpdateByParam
     * @memberOf KJUR.asn1.x509.TBSCertList
     * @function
     * @param {Array} timeParam Time parameter
     * @description
     * @example
     * tbsc.setNextUpdateByParam({'str': '130508235959Z'});
     * @see KJUR.asn1.x509.Time
     */
    this.setNextUpdateByParam = function(timeParam) {
	this.asn1NextUpdate = new KJUR.asn1.x509.Time(timeParam);
    };

    /**
     * add revoked certficate by parameter
     * @name addRevokedCert
     * @memberOf KJUR.asn1.x509.TBSCertList
     * @function
     * @param {Array} snParam DERInteger parameter for certificate serial number
     * @param {Array} timeParam Time parameter for revocation date
     * @description
     * @example
     * tbsc.addRevokedCert({'int': 3}, {'str': '130508235959Z'});
     * @see KJUR.asn1.x509.Time
     */
    this.addRevokedCert = function(snParam, timeParam) {
	var param = {};
	if (snParam != undefined && snParam != null) param['sn'] = snParam;
	if (timeParam != undefined && timeParam != null) param['time'] = timeParam;
	var o = new KJUR.asn1.x509.CRLEntry(param);
	this.aRevokedCert.push(o);
    };

    this.getEncodedHex = function() {
	this.asn1Array = new Array();

	if (this.asn1Version != null) this.asn1Array.push(this.asn1Version);
	this.asn1Array.push(this.asn1SignatureAlg);
	this.asn1Array.push(this.asn1Issuer);
	this.asn1Array.push(this.asn1ThisUpdate);
	if (this.asn1NextUpdate != null) this.asn1Array.push(this.asn1NextUpdate);

	if (this.aRevokedCert.length > 0) {
	    var seq = new KJUR.asn1.DERSequence({'array': this.aRevokedCert});
	    this.asn1Array.push(seq);
	}

	var o = new KJUR.asn1.DERSequence({"array": this.asn1Array});
	this.hTLV = o.getEncodedHex();
	this.isModified = false;
	return this.hTLV;
    };

    this._initialize = function() {
	this.asn1Version = null;
	this.asn1SignatureAlg = null;
	this.asn1Issuer = null;
	this.asn1ThisUpdate = null;
	this.asn1NextUpdate = null;
	this.aRevokedCert = new Array();
    };

    this._initialize();
};
YAHOO.lang.extend(KJUR.asn1.x509.TBSCertList, KJUR.asn1.ASN1Object);

/**
 * ASN.1 CRLEntry structure class for CRL
 * @name KJUR.asn1.x509.CRLEntry
 * @class ASN.1 CRLEntry structure class for CRL
 * @param {Array} params associative array of parameters (ex. {})
 * @extends KJUR.asn1.ASN1Object
 * @since 1.0.3
 * @description
 * @example
 * var e = new KJUR.asn1.x509.CRLEntry({'time': {'str': '130514235959Z'}, 'sn': {'int': 234}});
 * 
 * // revokedCertificates     SEQUENCE OF SEQUENCE  {
 * //     userCertificate         CertificateSerialNumber,
 * //     revocationDate          Time,
 * //     crlEntryExtensions      Extensions OPTIONAL
 * //                             -- if present, version MUST be v2 }
 */
KJUR.asn1.x509.CRLEntry = function(params) {
    KJUR.asn1.x509.CRLEntry.superclass.constructor.call(this);
    var sn = null;
    var time = null;

    /**
     * set DERInteger parameter for serial number of revoked certificate 
     * @name setCertSerial
     * @memberOf KJUR.asn1.x509.CRLEntry
     * @function
     * @param {Array} intParam DERInteger parameter for certificate serial number
     * @description
     * @example
     * entry.setCertSerial({'int': 3});
     */
    this.setCertSerial = function(intParam) {
	this.sn = new KJUR.asn1.DERInteger(intParam);
    };

    /**
     * set Time parameter for revocation date
     * @name setRevocationDate
     * @memberOf KJUR.asn1.x509.CRLEntry
     * @function
     * @param {Array} timeParam Time parameter for revocation date
     * @description
     * @example
     * entry.setRevocationDate({'str': '130508235959Z'});
     */
    this.setRevocationDate = function(timeParam) {
	this.time = new KJUR.asn1.x509.Time(timeParam);
    };

    this.getEncodedHex = function() {
	var o = new KJUR.asn1.DERSequence({"array": [this.sn, this.time]});
	this.TLV = o.getEncodedHex();
	return this.TLV;
    };
    
    if (typeof params != "undefined") {
	if (typeof params['time'] != "undefined") {
	    this.setRevocationDate(params['time']);
	}
	if (typeof params['sn'] != "undefined") {
	    this.setCertSerial(params['sn']);
	}
    }
};
YAHOO.lang.extend(KJUR.asn1.x509.CRLEntry, KJUR.asn1.ASN1Object);

// === END   CRL Related ===================================================

// === BEGIN X500Name Related =================================================
/**
 * X500Name ASN.1 structure class
 * @name KJUR.asn1.x509.X500Name
 * @class X500Name ASN.1 structure class
 * @param {Array} params associative array of parameters (ex. {'str': '/C=US/O=a'})
 * @extends KJUR.asn1.ASN1Object
 * @description
 * @example
 */
KJUR.asn1.x509.X500Name = function(params) {
    KJUR.asn1.x509.X500Name.superclass.constructor.call(this);
    this.asn1Array = new Array();

    this.setByString = function(dnStr) {
	var a = dnStr.split('/');
	a.shift();
	for (var i = 0; i < a.length; i++) {
	    this.asn1Array.push(new KJUR.asn1.x509.RDN({'str':a[i]}));
	}
    };

    this.getEncodedHex = function() {
	var o = new KJUR.asn1.DERSequence({"array": this.asn1Array});
	this.TLV = o.getEncodedHex();
	return this.TLV;
    };

    if (typeof params != "undefined") {
	if (typeof params['str'] != "undefined") {
	    this.setByString(params['str']);
	}
    }

};
YAHOO.lang.extend(KJUR.asn1.x509.X500Name, KJUR.asn1.ASN1Object);

/**
 * RDN (Relative Distinguish Name) ASN.1 structure class
 * @name KJUR.asn1.x509.RDN
 * @class RDN (Relative Distinguish Name) ASN.1 structure class
 * @param {Array} params associative array of parameters (ex. {'str': 'C=US'})
 * @extends KJUR.asn1.ASN1Object
 * @description
 * @example
 */
KJUR.asn1.x509.RDN = function(params) {
    KJUR.asn1.x509.RDN.superclass.constructor.call(this);
    this.asn1Array = new Array();

    this.addByString = function(rdnStr) {
	this.asn1Array.push(new KJUR.asn1.x509.AttributeTypeAndValue({'str':rdnStr}));
    };

    this.getEncodedHex = function() {
	var o = new KJUR.asn1.DERSet({"array": this.asn1Array});
	this.TLV = o.getEncodedHex();
	return this.TLV;
    };

    if (typeof params != "undefined") {
	if (typeof params['str'] != "undefined") {
	    this.addByString(params['str']);
	}
    }
};
YAHOO.lang.extend(KJUR.asn1.x509.RDN, KJUR.asn1.ASN1Object);

/**
 * AttributeTypeAndValue ASN.1 structure class
 * @name KJUR.asn1.x509.AttributeTypeAndValue
 * @class AttributeTypeAndValue ASN.1 structure class
 * @param {Array} params associative array of parameters (ex. {'str': 'C=US'})
 * @extends KJUR.asn1.ASN1Object
 * @description
 * @example
 */
KJUR.asn1.x509.AttributeTypeAndValue = function(params) {
    KJUR.asn1.x509.AttributeTypeAndValue.superclass.constructor.call(this);
    var typeObj = null;
    var valueObj = null;
    var defaultDSType = "utf8";

    this.setByString = function(attrTypeAndValueStr) {
	if (attrTypeAndValueStr.match(/^([^=]+)=(.+)$/)) {
	    this.setByAttrTypeAndValueStr(RegExp.$1, RegExp.$2);
	} else {
	    throw "malformed attrTypeAndValueStr: " + attrTypeAndValueStr;
	}
    };

    this.setByAttrTypeAndValueStr = function(shortAttrType, valueStr) {
	this.typeObj = KJUR.asn1.x509.OID.atype2obj(shortAttrType);
	var dsType = defaultDSType;
	if (shortAttrType == "C") dsType = "prn";
	this.valueObj = this.getValueObj(dsType, valueStr);
    };

    this.getValueObj = function(dsType, valueStr) {
	if (dsType == "utf8")	return new KJUR.asn1.DERUTF8String({"str": valueStr});
	if (dsType == "prn")	return new KJUR.asn1.DERPrintableString({"str": valueStr});
	if (dsType == "tel")	return new KJUR.asn1.DERTeletexString({"str": valueStr});
	if (dsType == "ia5")	return new KJUR.asn1.DERIA5String({"str": valueStr});
	throw "unsupported directory string type: type=" + dsType + " value=" + valueStr;
    };

    this.getEncodedHex = function() {
	var o = new KJUR.asn1.DERSequence({"array": [this.typeObj, this.valueObj]});
	this.TLV = o.getEncodedHex();
	return this.TLV;
    };

    if (typeof params != "undefined") {
	if (typeof params['str'] != "undefined") {
	    this.setByString(params['str']);
	}
    }
};
YAHOO.lang.extend(KJUR.asn1.x509.AttributeTypeAndValue, KJUR.asn1.ASN1Object);

// === END   X500Name Related =================================================

// === BEGIN Other ASN1 structure class  ======================================

/**
 * SubjectPublicKeyInfo ASN.1 structure class
 * @name KJUR.asn1.x509.SubjectPublicKeyInfo
 * @class SubjectPublicKeyInfo ASN.1 structure class
 * @param {Object} params parameter for subject public key
 * @extends KJUR.asn1.ASN1Object
 * @description
 * <br/>
 * As for argument 'params' for constructor, you can specify one of
 * following properties:
 * <ul>
 * <li>{@link RSAKey} object</li>
 * <li>{@link KJUR.crypto.ECDSA} object</li>
 * <li>{@link KJUR.crypto.DSA} object</li>
 * <li>(DEPRECATED)rsakey - specify {@link RSAKey} object of subject public key</li>
 * <li>(DEPRECATED)rsapem - specify a string of PEM public key of RSA key</li>
 * </ul>
 * NOTE1: 'params' can be omitted.<br/>
 * NOTE2: DSA/ECDSA key object is also supported since asn1x509 1.0.6.<br/>
 * <h4>EXAMPLE</h4>
 * @example
 * var spki = new KJUR.asn1.x509.SubjectPublicKeyInfo(RSAKey_object);
 * var spki = new KJUR.asn1.x509.SubjectPublicKeyInfo(KJURcryptoECDSA_object);
 * var spki = new KJUR.asn1.x509.SubjectPublicKeyInfo(KJURcryptoDSA_object);
 */
KJUR.asn1.x509.SubjectPublicKeyInfo = function(params) {
    KJUR.asn1.x509.SubjectPublicKeyInfo.superclass.constructor.call(this);
    var asn1AlgId = null;
    var asn1SubjPKey = null;
    var rsaKey = null;

    /**
     * (DEPRECATED) set RSAKey object as subject public key
     * @name setRSAKey
     * @memberOf KJUR.asn1.x509.SubjectPublicKeyInfo
     * @function
     * @param {RSAKey} rsaKey {@link RSAKey} object for RSA public key
     * @description
     * @deprecated
     * @example
     * spki.setRSAKey(rsaKey);
     */
    this.setRSAKey = function(rsaKey) {
	if (! RSAKey.prototype.isPrototypeOf(rsaKey))
	    throw "argument is not RSAKey instance";
        this.rsaKey = rsaKey;
	var asn1RsaN = new KJUR.asn1.DERInteger({'bigint': rsaKey.n});
	var asn1RsaE = new KJUR.asn1.DERInteger({'int': rsaKey.e});
	var asn1RsaPub = new KJUR.asn1.DERSequence({'array': [asn1RsaN, asn1RsaE]});
	var rsaKeyHex = asn1RsaPub.getEncodedHex();
	this.asn1AlgId = new KJUR.asn1.x509.AlgorithmIdentifier({'name':'rsaEncryption'});
	this.asn1SubjPKey = new KJUR.asn1.DERBitString({'hex':'00'+rsaKeyHex});
    };

    /**
     * (DEPRECATED) set a PEM formatted RSA public key string as RSA public key
     * @name setRSAPEM
     * @memberOf KJUR.asn1.x509.SubjectPublicKeyInfo
     * @function
     * @param {String} rsaPubPEM PEM formatted RSA public key string
     * @deprecated
     * @description
     * @example
     * spki.setRSAPEM(rsaPubPEM);
     */
    this.setRSAPEM = function(rsaPubPEM) {
	if (rsaPubPEM.match(/-----BEGIN PUBLIC KEY-----/)) {
	    var s = rsaPubPEM;
	    s = s.replace(/^-----[^-]+-----/, '');
	    s = s.replace(/-----[^-]+-----\s*$/, '');
	    var rsaB64 = s.replace(/\s+/g, '');
	    var rsaWA = CryptoJS.enc.Base64.parse(rsaB64);
	    var rsaP8Hex = CryptoJS.enc.Hex.stringify(rsaWA);
	    var a = _rsapem_getHexValueArrayOfChildrenFromHex(rsaP8Hex);
	    var hBitStrVal = a[1];
	    var rsaHex = hBitStrVal.substr(2);
	    var a3 = _rsapem_getHexValueArrayOfChildrenFromHex(rsaHex);
	    var rsaKey = new RSAKey();
	    rsaKey.setPublic(a3[0], a3[1]);
	    this.setRSAKey(rsaKey);
	} else {
	    throw "key not supported";
	}
    };

    /*
     * @since asn1x509 1.0.7
     */
    this.getASN1Object = function() {
	if (this.asn1AlgId == null || this.asn1SubjPKey == null)
	    throw "algId and/or subjPubKey not set";
	var o = new KJUR.asn1.DERSequence({'array':
					   [this.asn1AlgId, this.asn1SubjPKey]});
	return o;
    };

    this.getEncodedHex = function() {
	var o = this.getASN1Object();
	this.hTLV = o.getEncodedHex();
	return this.hTLV;
    };

    this._setRSAKey = function(key) {
	var asn1RsaPub = KJUR.asn1.ASN1Util.newObject({
		'seq': [{'int': {'bigint': key.n}}, {'int': {'int': key.e}}]
	    });
	var rsaKeyHex = asn1RsaPub.getEncodedHex();
	this.asn1AlgId = new KJUR.asn1.x509.AlgorithmIdentifier({'name':'rsaEncryption'});
	this.asn1SubjPKey = new KJUR.asn1.DERBitString({'hex':'00'+rsaKeyHex});
    };

    this._setEC = function(key) {
	var asn1Params = new KJUR.asn1.DERObjectIdentifier({'name': key.curveName});
	this.asn1AlgId = 
	    new KJUR.asn1.x509.AlgorithmIdentifier({'name': 'ecPublicKey',
						    'asn1params': asn1Params});
	this.asn1SubjPKey = new KJUR.asn1.DERBitString({'hex': '00' + key.pubKeyHex});
    };

    this._setDSA = function(key) {
	var asn1Params = new KJUR.asn1.ASN1Util.newObject({
		'seq': [{'int': {'bigint': key.p}},
	                {'int': {'bigint': key.q}},
	                {'int': {'bigint': key.g}}]
	    });
	this.asn1AlgId = 
	    new KJUR.asn1.x509.AlgorithmIdentifier({'name': 'dsa',
						    'asn1params': asn1Params});
	var pubInt = new KJUR.asn1.DERInteger({'bigint': key.y});
	this.asn1SubjPKey = new KJUR.asn1.DERBitString({'hex': '00' + pubInt.getEncodedHex()});
    };

    if (typeof params != "undefined") {
	if (typeof RSAKey != 'undefined' && params instanceof RSAKey) {
	    this._setRSAKey(params);
	} else if (typeof KJUR.crypto.ECDSA != 'undefined' &&
		   params instanceof KJUR.crypto.ECDSA) {
	    this._setEC(params);
	} else if (typeof KJUR.crypto.DSA != 'undefined' &&
		   params instanceof KJUR.crypto.DSA) {
	    this._setDSA(params);
	} else if (typeof params['rsakey'] != "undefined") {
	    this.setRSAKey(params['rsakey']);
	} else if (typeof params['rsapem'] != "undefined") {
	    this.setRSAPEM(params['rsapem']);
	}
    }
};
YAHOO.lang.extend(KJUR.asn1.x509.SubjectPublicKeyInfo, KJUR.asn1.ASN1Object);

/**
 * Time ASN.1 structure class
 * @name KJUR.asn1.x509.Time
 * @class Time ASN.1 structure class
 * @param {Array} params associative array of parameters (ex. {'str': '130508235959Z'})
 * @extends KJUR.asn1.ASN1Object
 * @description
 * <br/>
 * <h4>EXAMPLES</h4>
 * @example
 * var t1 = new KJUR.asn1.x509.Time{'str': '130508235959Z'} // UTCTime by default
 * var t2 = new KJUR.asn1.x509.Time{'type': 'gen',  'str': '20130508235959Z'} // GeneralizedTime
 */
KJUR.asn1.x509.Time = function(params) {
    KJUR.asn1.x509.Time.superclass.constructor.call(this);
    var type = null;
    var timeParams = null;

    this.setTimeParams = function(timeParams) {
	this.timeParams = timeParams;
    }

    this.getEncodedHex = function() {
	if (this.timeParams == null) {
	    throw "timeParams shall be specified. ({'str':'130403235959Z'}}";
	}
	var o = null;
	if (this.type == "utc") {
	    o = new KJUR.asn1.DERUTCTime(this.timeParams);
	} else {
	    o = new KJUR.asn1.DERGeneralizedTime(this.timeParams);
	}
	this.TLV = o.getEncodedHex();
	return this.TLV;
    };
 
    this.type = "utc";
    if (typeof params != "undefined") {
	if (typeof params['type'] != "undefined") {
	    this.type = params['type'];
	}
	this.timeParams = params;
    }
};
YAHOO.lang.extend(KJUR.asn1.x509.Time, KJUR.asn1.ASN1Object);

/**
 * AlgorithmIdentifier ASN.1 structure class
 * @name KJUR.asn1.x509.AlgorithmIdentifier
 * @class AlgorithmIdentifier ASN.1 structure class
 * @param {Array} params associative array of parameters (ex. {'name': 'SHA1withRSA'})
 * @extends KJUR.asn1.ASN1Object
 * @description
 * @example
 */
KJUR.asn1.x509.AlgorithmIdentifier = function(params) {
    KJUR.asn1.x509.AlgorithmIdentifier.superclass.constructor.call(this);
    var nameAlg = null;
    var asn1Alg = null;
    var asn1Params = null;
    var paramEmpty = false;

    this.getEncodedHex = function() {
	if (this.nameAlg == null && this.asn1Alg == null) {
	    throw "algorithm not specified";
	}
	if (this.nameAlg != null && this.asn1Alg == null) {
	    this.asn1Alg = KJUR.asn1.x509.OID.name2obj(this.nameAlg);
	}
	var a = [this.asn1Alg];
	if (! this.paramEmpty) a.push(this.asn1Params);
	var o = new KJUR.asn1.DERSequence({'array': a});
	this.hTLV = o.getEncodedHex();
	return this.hTLV;
    };

    if (typeof params != "undefined") {
	if (typeof params['name'] != "undefined") {
	    this.nameAlg = params['name'];
	}
	if (typeof params['asn1params'] != "undefined") {
	    this.asn1Params = params['asn1params'];
	}
	if (typeof params['paramempty'] != "undefined") {
	    this.paramEmpty = params['paramempty'];
	}
    }
    if (this.asn1Params == null) {
	this.asn1Params = new KJUR.asn1.DERNull();
    }
};
YAHOO.lang.extend(KJUR.asn1.x509.AlgorithmIdentifier, KJUR.asn1.ASN1Object);

/**
 * GeneralName ASN.1 structure class
 * @name KJUR.asn1.x509.GeneralName
 * @class GeneralName ASN.1 structure class
 * @description
 * <br/>
 * As for argument 'params' for constructor, you can specify one of
 * following properties:
 * <ul>
 * <li>rfc822 - rfc822Name[1] (ex. user1@foo.com)</li>
 * <li>dns - dNSName[2] (ex. foo.com)</li>
 * <li>uri - uniformResourceIdentifier[6] (ex. http://foo.com/)</li>
 * </ul>
 * NOTE: Currently this only supports 'uniformResourceIdentifier'.
 * <h4>EXAMPLE AND ASN.1 SYNTAX</h4>
 * @example
 * var gn = new KJUR.asn1.x509.GeneralName({'uri': 'http://aaa.com/'});
 *
 * GeneralName ::= CHOICE {
 *         otherName                       [0]     OtherName,
 *         rfc822Name                      [1]     IA5String,
 *         dNSName                         [2]     IA5String,
 *         x400Address                     [3]     ORAddress,
 *         directoryName                   [4]     Name,
 *         ediPartyName                    [5]     EDIPartyName,
 *         uniformResourceIdentifier       [6]     IA5String,
 *         iPAddress                       [7]     OCTET STRING,
 *         registeredID                    [8]     OBJECT IDENTIFIER } 
 */
KJUR.asn1.x509.GeneralName = function(params) {
    KJUR.asn1.x509.GeneralName.superclass.constructor.call(this);
    var asn1Obj = null;
    var type = null;
    var pTag = {'rfc822': '81', 'dns': '82', 'uri': '86'};

    this.setByParam = function(params) {
	var str = null;
	var v = null;

	if (typeof params['rfc822'] != "undefined") {
	    this.type = 'rfc822';
	    v = new KJUR.asn1.DERIA5String({'str': params[this.type]});
	}
	if (typeof params['dns'] != "undefined") {
	    this.type = 'dns';
	    v = new KJUR.asn1.DERIA5String({'str': params[this.type]});
	}
	if (typeof params['uri'] != "undefined") {
	    this.type = 'uri';
	    v = new KJUR.asn1.DERIA5String({'str': params[this.type]});
	}

	if (this.type == null)
	    throw "unsupported type in params=" + params;
        this.asn1Obj = new KJUR.asn1.DERTaggedObject({'explicit': false,
						      'tag': pTag[this.type],
						      'obj': v});
    };

    this.getEncodedHex = function() {
	return this.asn1Obj.getEncodedHex();
    }

    if (typeof params != "undefined") {
	this.setByParam(params);
    }

};
YAHOO.lang.extend(KJUR.asn1.x509.GeneralName, KJUR.asn1.ASN1Object);

/**
 * GeneralNames ASN.1 structure class
 * @name KJUR.asn1.x509.GeneralNames
 * @class GeneralNames ASN.1 structure class
 * @description
 * <br/>
 * <h4>EXAMPLE AND ASN.1 SYNTAX</h4>
 * @example
 * var gns = new KJUR.asn1.x509.GeneralNames([{'uri': 'http://aaa.com/'}, {'uri': 'http://bbb.com/'}]); 
 *
 * GeneralNames ::= SEQUENCE SIZE (1..MAX) OF GeneralName
 */
KJUR.asn1.x509.GeneralNames = function(paramsArray) {
    KJUR.asn1.x509.GeneralNames.superclass.constructor.call(this);
    var asn1Array = null;

    /**
     * set a array of {@link KJUR.asn1.x509.GeneralName} parameters
     * @name setByParamArray
     * @memberOf KJUR.asn1.x509.GeneralNames
     * @function
     * @param {Array} paramsArray Array of {@link KJUR.asn1.x509.GeneralNames}
     * @description
     * <br/>
     * <h4>EXAMPLES</h4>
     * @example
     * var gns = new KJUR.asn1.x509.GeneralNames();
     * gns.setByParamArray([{'uri': 'http://aaa.com/'}, {'uri': 'http://bbb.com/'}]);
     */
    this.setByParamArray = function(paramsArray) {
	for (var i = 0; i < paramsArray.length; i++) {
	    var o = new KJUR.asn1.x509.GeneralName(paramsArray[i]);
	    this.asn1Array.push(o);
	}
    };

    this.getEncodedHex = function() {
	var o = new KJUR.asn1.DERSequence({'array': this.asn1Array});
	return o.getEncodedHex();
    };

    this.asn1Array = new Array();
    if (typeof paramsArray != "undefined") {
	this.setByParamArray(paramsArray);
    }
};
YAHOO.lang.extend(KJUR.asn1.x509.GeneralNames, KJUR.asn1.ASN1Object);

/**
 * DistributionPointName ASN.1 structure class
 * @name KJUR.asn1.x509.DistributionPointName
 * @class DistributionPointName ASN.1 structure class
 * @description
 * @example
 */
KJUR.asn1.x509.DistributionPointName = function(gnOrRdn) {
    KJUR.asn1.x509.DistributionPointName.superclass.constructor.call(this);
    var asn1Obj = null;
    var type = null;
    var tag = null;
    var asn1V = null;

    this.getEncodedHex = function() {
	if (this.type != "full")
	    throw "currently type shall be 'full': " + this.type;
	this.asn1Obj = new KJUR.asn1.DERTaggedObject({'explicit': false,
						      'tag': this.tag,
						      'obj': this.asn1V});
	this.hTLV = this.asn1Obj.getEncodedHex();
	return this.hTLV;
    };

    if (typeof gnOrRdn != "undefined") {
	if (KJUR.asn1.x509.GeneralNames.prototype.isPrototypeOf(gnOrRdn)) {
	    this.type = "full";
	    this.tag = "a0";
	    this.asn1V = gnOrRdn;
	} else {
	    throw "This class supports GeneralNames only as argument";
	}
    }
};
YAHOO.lang.extend(KJUR.asn1.x509.DistributionPointName, KJUR.asn1.ASN1Object);

/**
 * DistributionPoint ASN.1 structure class
 * @name KJUR.asn1.x509.DistributionPoint
 * @class DistributionPoint ASN.1 structure class
 * @description
 * @example
 */
KJUR.asn1.x509.DistributionPoint = function(params) {
    KJUR.asn1.x509.DistributionPoint.superclass.constructor.call(this);
    var asn1DP = null;

    this.getEncodedHex = function() {
	var seq = new KJUR.asn1.DERSequence();
	if (this.asn1DP != null) {
	    var o1 = new KJUR.asn1.DERTaggedObject({'explicit': true,
						    'tag': 'a0',
						    'obj': this.asn1DP});
	    seq.appendASN1Object(o1);
	}
	this.hTLV = seq.getEncodedHex();
	return this.hTLV;
    };

    if (typeof params != "undefined") {
	if (typeof params['dpobj'] != "undefined") {
	    this.asn1DP = params['dpobj'];
	}
    }
};
YAHOO.lang.extend(KJUR.asn1.x509.DistributionPoint, KJUR.asn1.ASN1Object);

/**
 * static object for OID
 * @name KJUR.asn1.x509.OID
 * @class static object for OID
 * @property {Assoc Array} atype2oidList for short attribyte type name and oid (i.e. 'C' and '2.5.4.6')
 * @property {Assoc Array} name2oidList for oid name and oid (i.e. 'keyUsage' and '2.5.29.15')
 * @property {Assoc Array} objCache for caching name and DERObjectIdentifier object 
 * @description
 * <dl>
 * <dt><b>atype2oidList</b>
 * <dd>currently supports 'C', 'O', 'OU', 'ST', 'L' and 'CN' only.
 * <dt><b>name2oidList</b>
 * <dd>currently supports 'SHA1withRSA', 'rsaEncryption' and some extension OIDs
 * </dl>
 * @example
 */
KJUR.asn1.x509.OID = new function(params) {
    this.atype2oidList = {
	'C':	'2.5.4.6',
	'O':	'2.5.4.10',
	'OU':	'2.5.4.11',
	'ST':	'2.5.4.8',
	'L':	'2.5.4.7',
	'CN':	'2.5.4.3',
    };
    this.name2oidList = {
	'sha384':			'2.16.840.1.101.3.4.2.2',
	'sha224':			'2.16.840.1.101.3.4.2.4',

	'MD2withRSA':			'1.2.840.113549.1.1.2',
	'MD4withRSA':			'1.2.840.113549.1.1.3',
	'MD5withRSA':			'1.2.840.113549.1.1.4',
	'SHA1withRSA':			'1.2.840.113549.1.1.5',
	'SHA224withRSA':		'1.2.840.113549.1.1.14',
	'SHA256withRSA':		'1.2.840.113549.1.1.11',
	'SHA384withRSA':		'1.2.840.113549.1.1.12',
	'SHA512withRSA':		'1.2.840.113549.1.1.13',

	'SHA1withECDSA':		'1.2.840.10045.4.1',
	'SHA224withECDSA':		'1.2.840.10045.4.3.1',
	'SHA256withECDSA':		'1.2.840.10045.4.3.2',
	'SHA384withECDSA':		'1.2.840.10045.4.3.3',
	'SHA512withECDSA':		'1.2.840.10045.4.3.4',

	'dsa':				'1.2.840.10040.4.1',
	'SHA1withDSA':			'1.2.840.10040.4.3',
	'SHA224withDSA':		'2.16.840.1.101.3.4.3.1',
	'SHA256withDSA':		'2.16.840.1.101.3.4.3.2',

        'rsaEncryption':		'1.2.840.113549.1.1.1',
	'subjectKeyIdentifier':		'2.5.29.14',

	'countryName':			'2.5.4.6',
	'organization':			'2.5.4.10',
	'organizationalUnit':		'2.5.4.11',
	'stateOrProvinceName':		'2.5.4.8',
	'locality':			'2.5.4.7',
	'commonName':			'2.5.4.3',

	'keyUsage':			'2.5.29.15',
	'basicConstraints':		'2.5.29.19',
	'cRLDistributionPoints':	'2.5.29.31',
	'certificatePolicies':		'2.5.29.32',
	'authorityKeyIdentifier':	'2.5.29.35',
	'extKeyUsage':			'2.5.29.37',

	'anyExtendedKeyUsage':		'2.5.29.37.0',
	'serverAuth':			'1.3.6.1.5.5.7.3.1',
	'clientAuth':			'1.3.6.1.5.5.7.3.2',
	'codeSigning':			'1.3.6.1.5.5.7.3.3',
	'emailProtection':		'1.3.6.1.5.5.7.3.4',
	'timeStamping':			'1.3.6.1.5.5.7.3.8',
	'ocspSigning':			'1.3.6.1.5.5.7.3.9',

	'ecPublicKey':			'1.2.840.10045.2.1',
	'secp256r1':			'1.2.840.10045.3.1.7',
	'secp256k1':			'1.3.132.0.10',
	'secp384r1':			'1.3.132.0.34',

	'pkcs5PBES2':			'1.2.840.113549.1.5.13',
	'pkcs5PBKDF2':			'1.2.840.113549.1.5.12',

	'des-EDE3-CBC':			'1.2.840.113549.3.7',
    };

    this.objCache = {};

    /**
     * get DERObjectIdentifier by registered OID name
     * @name name2obj
     * @memberOf KJUR.asn1.x509.OID
     * @function
     * @param {String} name OID
     * @description
     * @example
     * var asn1ObjOID = OID.name2obj('SHA1withRSA');
     */
    this.name2obj = function(name) {
	if (typeof this.objCache[name] != "undefined")
	    return this.objCache[name];
	if (typeof this.name2oidList[name] == "undefined")
	    throw "Name of ObjectIdentifier not defined: " + name;
	var oid = this.name2oidList[name];
	var obj = new KJUR.asn1.DERObjectIdentifier({'oid': oid});
	this.objCache[name] = obj;
	return obj;
    };

    /**
     * get DERObjectIdentifier by registered attribyte type name such like 'C' or 'CN'
     * @name atype2obj
     * @memberOf KJUR.asn1.x509.OID
     * @function
     * @param {String} atype short attribute type name such like 'C' or 'CN'
     * @description
     * @example
     * var asn1ObjOID = OID.atype2obj('CN');
     */
    this.atype2obj = function(atype) {
	if (typeof this.objCache[atype] != "undefined")
	    return this.objCache[atype];
	if (typeof this.atype2oidList[atype] == "undefined")
	    throw "AttributeType name undefined: " + atype;
	var oid = this.atype2oidList[atype];
	var obj = new KJUR.asn1.DERObjectIdentifier({'oid': oid});
	this.objCache[atype] = obj;
	return obj;
    };
};

/**
 * X.509 certificate and CRL utilities class
 * @name KJUR.asn1.x509.X509Util
 * @class X.509 certificate and CRL utilities class
 */
KJUR.asn1.x509.X509Util = new function() {
    /**
     * get PKCS#8 PEM public key string from RSAKey object
     * @name getPKCS8PubKeyPEMfromRSAKey
     * @memberOf KJUR.asn1.x509.X509Util
     * @function
     * @param {RSAKey} rsaKey RSA public key of {@link RSAKey} object
     * @description
     * @example
     * var pem = KJUR.asn1.x509.X509Util.getPKCS8PubKeyPEMfromRSAKey(pubKey);
     */
   this.getPKCS8PubKeyPEMfromRSAKey = function(rsaKey) {
       var pem = null;
       var hN = KJUR.asn1.ASN1Util.bigIntToMinTwosComplementsHex(rsaKey.n);
       var hE = KJUR.asn1.ASN1Util.integerToByteHex(rsaKey.e);
       var iN = new KJUR.asn1.DERInteger({hex: hN});
       var iE = new KJUR.asn1.DERInteger({hex: hE});
       var asn1PubKey = new KJUR.asn1.DERSequence({array: [iN, iE]});
       var hPubKey = asn1PubKey.getEncodedHex();
       var o1 = new KJUR.asn1.x509.AlgorithmIdentifier({name: 'rsaEncryption'});
       var o2 = new KJUR.asn1.DERBitString({hex: '00' + hPubKey});
       var seq = new KJUR.asn1.DERSequence({array: [o1, o2]});
       var hP8 = seq.getEncodedHex();
       var pem = KJUR.asn1.ASN1Util.getPEMStringFromHex(hP8, "PUBLIC KEY");
       return pem;
   };
};
/**
 * issue a certificate in PEM format
 * @name newCertPEM
 * @memberOf KJUR.asn1.x509.X509Util
 * @function
 * @param {Array} param parameter to issue a certificate
 * @since asn1x509 1.0.6
 * @description
 * This method can issue a certificate by a simple
 * JSON object.
 * NOTE: When using DSA or ECDSA CA signing key,
 * use 'paramempty' in 'sigalg' to ommit parameter field
 * of AlgorithmIdentifer. In case of RSA, parameter
 * NULL will be specified by default.
 * @example
 * var certPEM = KJUR.asn1.x509.X509Util.newCertPEM(
 * { serial: {int: 4},
 *   sigalg: {name: 'SHA1withECDSA', paramempty: true},
 *   issuer: {str: '/C=US/O=a'},
 *   notbefore: {'str': '130504235959Z'},
 *   notafter: {'str': '140504235959Z'},
 *   subject: {str: '/C=US/O=b'},
 *   sbjpubkey: pubKeyPEM,
 *   ext: [
 *     {basicConstraints: {cA: true, critical: true}},
 *     {keyUsage: {bin: '11'}},
 *   ],
 *   cakey: [prvkey, pass]}
 * );
 */
KJUR.asn1.x509.X509Util.newCertPEM = function(param) {
    var ns1 = KJUR.asn1.x509;
    var o = new ns1.TBSCertificate();

    if (param.serial !== undefined)
	o.setSerialNumberByParam(param.serial);
    else
	throw "serial number undefined.";

    if (typeof param.sigalg.name == 'string')
	o.setSignatureAlgByParam(param.sigalg);
    else 
	throw "unproper signature algorithm name";

    if (param.issuer !== undefined)
	o.setIssuerByParam(param.issuer);
    else
	throw "issuer name undefined.";
    
    if (param.notbefore !== undefined)
	o.setNotBeforeByParam(param.notbefore);
    else
	throw "notbefore undefined.";

    if (param.notafter !== undefined)
	o.setNotAfterByParam(param.notafter);
    else
	throw "notafter undefined.";

    if (param.subject !== undefined)
	o.setSubjectByParam(param.subject);
    else
	throw "subject name undefined.";

    if (param.sbjpubkey !== undefined)
	o.setSubjectPublicKeyByGetKey(param.sbjpubkey);
    else
	throw "subject public key undefined.";

    if (param.ext.length !== undefined) {
	for (var i = 0; i < param.ext.length; i++) {
	    for (key in param.ext[i]) {
		o.appendExtensionByName(key, param.ext[i][key]);
	    }
	}
    }

    var caKey = null;
    if (param.cakey)
	caKey = KEYUTIL.getKey.apply(null, param.cakey);
    else
	throw "ca key undefined";

    var cert = new ns1.Certificate({'tbscertobj': o, 'prvkeyobj': caKey});
    cert.sign();
    return cert.getPEMString();
};

/*
org.bouncycastle.asn1.x500
AttributeTypeAndValue
DirectoryString
RDN
X500Name
X500NameBuilder

org.bouncycastleasn1.x509
TBSCertificate
 */

/*! (c) Tom Wu | http://www-cs-students.stanford.edu/~tjw/jsbn/
 */
// Basic Javascript Elliptic Curve implementation
// Ported loosely from BouncyCastle's Java EC code
// Only Fp curves implemented for now

// Requires jsbn.js and jsbn2.js

// ----------------
// ECFieldElementFp

// constructor
function ECFieldElementFp(q,x) {
    this.x = x;
    // TODO if(x.compareTo(q) >= 0) error
    this.q = q;
}

function feFpEquals(other) {
    if(other == this) return true;
    return (this.q.equals(other.q) && this.x.equals(other.x));
}

function feFpToBigInteger() {
    return this.x;
}

function feFpNegate() {
    return new ECFieldElementFp(this.q, this.x.negate().mod(this.q));
}

function feFpAdd(b) {
    return new ECFieldElementFp(this.q, this.x.add(b.toBigInteger()).mod(this.q));
}

function feFpSubtract(b) {
    return new ECFieldElementFp(this.q, this.x.subtract(b.toBigInteger()).mod(this.q));
}

function feFpMultiply(b) {
    return new ECFieldElementFp(this.q, this.x.multiply(b.toBigInteger()).mod(this.q));
}

function feFpSquare() {
    return new ECFieldElementFp(this.q, this.x.square().mod(this.q));
}

function feFpDivide(b) {
    return new ECFieldElementFp(this.q, this.x.multiply(b.toBigInteger().modInverse(this.q)).mod(this.q));
}

ECFieldElementFp.prototype.equals = feFpEquals;
ECFieldElementFp.prototype.toBigInteger = feFpToBigInteger;
ECFieldElementFp.prototype.negate = feFpNegate;
ECFieldElementFp.prototype.add = feFpAdd;
ECFieldElementFp.prototype.subtract = feFpSubtract;
ECFieldElementFp.prototype.multiply = feFpMultiply;
ECFieldElementFp.prototype.square = feFpSquare;
ECFieldElementFp.prototype.divide = feFpDivide;

// ----------------
// ECPointFp

// constructor
function ECPointFp(curve,x,y,z) {
    this.curve = curve;
    this.x = x;
    this.y = y;
    // Projective coordinates: either zinv == null or z * zinv == 1
    // z and zinv are just BigIntegers, not fieldElements
    if(z == null) {
      this.z = BigInteger.ONE;
    }
    else {
      this.z = z;
    }
    this.zinv = null;
    //TODO: compression flag
}

function pointFpGetX() {
    if(this.zinv == null) {
      this.zinv = this.z.modInverse(this.curve.q);
    }
    return this.curve.fromBigInteger(this.x.toBigInteger().multiply(this.zinv).mod(this.curve.q));
}

function pointFpGetY() {
    if(this.zinv == null) {
      this.zinv = this.z.modInverse(this.curve.q);
    }
    return this.curve.fromBigInteger(this.y.toBigInteger().multiply(this.zinv).mod(this.curve.q));
}

function pointFpEquals(other) {
    if(other == this) return true;
    if(this.isInfinity()) return other.isInfinity();
    if(other.isInfinity()) return this.isInfinity();
    var u, v;
    // u = Y2 * Z1 - Y1 * Z2
    u = other.y.toBigInteger().multiply(this.z).subtract(this.y.toBigInteger().multiply(other.z)).mod(this.curve.q);
    if(!u.equals(BigInteger.ZERO)) return false;
    // v = X2 * Z1 - X1 * Z2
    v = other.x.toBigInteger().multiply(this.z).subtract(this.x.toBigInteger().multiply(other.z)).mod(this.curve.q);
    return v.equals(BigInteger.ZERO);
}

function pointFpIsInfinity() {
    if((this.x == null) && (this.y == null)) return true;
    return this.z.equals(BigInteger.ZERO) && !this.y.toBigInteger().equals(BigInteger.ZERO);
}

function pointFpNegate() {
    return new ECPointFp(this.curve, this.x, this.y.negate(), this.z);
}

function pointFpAdd(b) {
    if(this.isInfinity()) return b;
    if(b.isInfinity()) return this;

    // u = Y2 * Z1 - Y1 * Z2
    var u = b.y.toBigInteger().multiply(this.z).subtract(this.y.toBigInteger().multiply(b.z)).mod(this.curve.q);
    // v = X2 * Z1 - X1 * Z2
    var v = b.x.toBigInteger().multiply(this.z).subtract(this.x.toBigInteger().multiply(b.z)).mod(this.curve.q);

    if(BigInteger.ZERO.equals(v)) {
        if(BigInteger.ZERO.equals(u)) {
            return this.twice(); // this == b, so double
        }
	return this.curve.getInfinity(); // this = -b, so infinity
    }

    var THREE = new BigInteger("3");
    var x1 = this.x.toBigInteger();
    var y1 = this.y.toBigInteger();
    var x2 = b.x.toBigInteger();
    var y2 = b.y.toBigInteger();

    var v2 = v.square();
    var v3 = v2.multiply(v);
    var x1v2 = x1.multiply(v2);
    var zu2 = u.square().multiply(this.z);

    // x3 = v * (z2 * (z1 * u^2 - 2 * x1 * v^2) - v^3)
    var x3 = zu2.subtract(x1v2.shiftLeft(1)).multiply(b.z).subtract(v3).multiply(v).mod(this.curve.q);
    // y3 = z2 * (3 * x1 * u * v^2 - y1 * v^3 - z1 * u^3) + u * v^3
    var y3 = x1v2.multiply(THREE).multiply(u).subtract(y1.multiply(v3)).subtract(zu2.multiply(u)).multiply(b.z).add(u.multiply(v3)).mod(this.curve.q);
    // z3 = v^3 * z1 * z2
    var z3 = v3.multiply(this.z).multiply(b.z).mod(this.curve.q);

    return new ECPointFp(this.curve, this.curve.fromBigInteger(x3), this.curve.fromBigInteger(y3), z3);
}

function pointFpTwice() {
    if(this.isInfinity()) return this;
    if(this.y.toBigInteger().signum() == 0) return this.curve.getInfinity();

    // TODO: optimized handling of constants
    var THREE = new BigInteger("3");
    var x1 = this.x.toBigInteger();
    var y1 = this.y.toBigInteger();

    var y1z1 = y1.multiply(this.z);
    var y1sqz1 = y1z1.multiply(y1).mod(this.curve.q);
    var a = this.curve.a.toBigInteger();

    // w = 3 * x1^2 + a * z1^2
    var w = x1.square().multiply(THREE);
    if(!BigInteger.ZERO.equals(a)) {
      w = w.add(this.z.square().multiply(a));
    }
    w = w.mod(this.curve.q);
    // x3 = 2 * y1 * z1 * (w^2 - 8 * x1 * y1^2 * z1)
    var x3 = w.square().subtract(x1.shiftLeft(3).multiply(y1sqz1)).shiftLeft(1).multiply(y1z1).mod(this.curve.q);
    // y3 = 4 * y1^2 * z1 * (3 * w * x1 - 2 * y1^2 * z1) - w^3
    var y3 = w.multiply(THREE).multiply(x1).subtract(y1sqz1.shiftLeft(1)).shiftLeft(2).multiply(y1sqz1).subtract(w.square().multiply(w)).mod(this.curve.q);
    // z3 = 8 * (y1 * z1)^3
    var z3 = y1z1.square().multiply(y1z1).shiftLeft(3).mod(this.curve.q);

    return new ECPointFp(this.curve, this.curve.fromBigInteger(x3), this.curve.fromBigInteger(y3), z3);
}

// Simple NAF (Non-Adjacent Form) multiplication algorithm
// TODO: modularize the multiplication algorithm
function pointFpMultiply(k) {
    if(this.isInfinity()) return this;
    if(k.signum() == 0) return this.curve.getInfinity();

    var e = k;
    var h = e.multiply(new BigInteger("3"));

    var neg = this.negate();
    var R = this;

    var i;
    for(i = h.bitLength() - 2; i > 0; --i) {
	R = R.twice();

	var hBit = h.testBit(i);
	var eBit = e.testBit(i);

	if (hBit != eBit) {
	    R = R.add(hBit ? this : neg);
	}
    }

    return R;
}

// Compute this*j + x*k (simultaneous multiplication)
function pointFpMultiplyTwo(j,x,k) {
  var i;
  if(j.bitLength() > k.bitLength())
    i = j.bitLength() - 1;
  else
    i = k.bitLength() - 1;

  var R = this.curve.getInfinity();
  var both = this.add(x);
  while(i >= 0) {
    R = R.twice();
    if(j.testBit(i)) {
      if(k.testBit(i)) {
        R = R.add(both);
      }
      else {
        R = R.add(this);
      }
    }
    else {
      if(k.testBit(i)) {
        R = R.add(x);
      }
    }
    --i;
  }

  return R;
}

ECPointFp.prototype.getX = pointFpGetX;
ECPointFp.prototype.getY = pointFpGetY;
ECPointFp.prototype.equals = pointFpEquals;
ECPointFp.prototype.isInfinity = pointFpIsInfinity;
ECPointFp.prototype.negate = pointFpNegate;
ECPointFp.prototype.add = pointFpAdd;
ECPointFp.prototype.twice = pointFpTwice;
ECPointFp.prototype.multiply = pointFpMultiply;
ECPointFp.prototype.multiplyTwo = pointFpMultiplyTwo;

// ----------------
// ECCurveFp

// constructor
function ECCurveFp(q,a,b) {
    this.q = q;
    this.a = this.fromBigInteger(a);
    this.b = this.fromBigInteger(b);
    this.infinity = new ECPointFp(this, null, null);
}

function curveFpGetQ() {
    return this.q;
}

function curveFpGetA() {
    return this.a;
}

function curveFpGetB() {
    return this.b;
}

function curveFpEquals(other) {
    if(other == this) return true;
    return(this.q.equals(other.q) && this.a.equals(other.a) && this.b.equals(other.b));
}

function curveFpGetInfinity() {
    return this.infinity;
}

function curveFpFromBigInteger(x) {
    return new ECFieldElementFp(this.q, x);
}

// for now, work with hex strings because they're easier in JS
function curveFpDecodePointHex(s) {
    switch(parseInt(s.substr(0,2), 16)) { // first byte
    case 0:
	return this.infinity;
    case 2:
    case 3:
	// point compression not supported yet
	return null;
    case 4:
    case 6:
    case 7:
	var len = (s.length - 2) / 2;
	var xHex = s.substr(2, len);
	var yHex = s.substr(len+2, len);

	return new ECPointFp(this,
			     this.fromBigInteger(new BigInteger(xHex, 16)),
			     this.fromBigInteger(new BigInteger(yHex, 16)));

    default: // unsupported
	return null;
    }
}

ECCurveFp.prototype.getQ = curveFpGetQ;
ECCurveFp.prototype.getA = curveFpGetA;
ECCurveFp.prototype.getB = curveFpGetB;
ECCurveFp.prototype.equals = curveFpEquals;
ECCurveFp.prototype.getInfinity = curveFpGetInfinity;
ECCurveFp.prototype.fromBigInteger = curveFpFromBigInteger;
ECCurveFp.prototype.decodePointHex = curveFpDecodePointHex;

/*! (c) Stefan Thomas | https://github.com/bitcoinjs/bitcoinjs-lib
 */
/*
 * splitted from bitcoin-lib/ecdsa.js
 *
 * version 1.0.0 is the original of bitcoin-lib/ecdsa.js
 */
ECFieldElementFp.prototype.getByteLength = function () {
  return Math.floor((this.toBigInteger().bitLength() + 7) / 8);
};

ECPointFp.prototype.getEncoded = function (compressed) {
  var integerToBytes = function(i, len) {
    var bytes = i.toByteArrayUnsigned();

    if (len < bytes.length) {
      bytes = bytes.slice(bytes.length-len);
    } else while (len > bytes.length) {
      bytes.unshift(0);
    }
    return bytes;
  };

  var x = this.getX().toBigInteger();
  var y = this.getY().toBigInteger();

  // Get value as a 32-byte Buffer
  // Fixed length based on a patch by bitaddress.org and Casascius
  var enc = integerToBytes(x, 32);

  if (compressed) {
    if (y.isEven()) {
      // Compressed even pubkey
      // M = 02 || X
      enc.unshift(0x02);
    } else {
      // Compressed uneven pubkey
      // M = 03 || X
      enc.unshift(0x03);
    }
  } else {
    // Uncompressed pubkey
    // M = 04 || X || Y
    enc.unshift(0x04);
    enc = enc.concat(integerToBytes(y, 32));
  }
  return enc;
};

ECPointFp.decodeFrom = function (curve, enc) {
  var type = enc[0];
  var dataLen = enc.length-1;

  // Extract x and y as byte arrays
  var xBa = enc.slice(1, 1 + dataLen/2);
  var yBa = enc.slice(1 + dataLen/2, 1 + dataLen);

  // Prepend zero byte to prevent interpretation as negative integer
  xBa.unshift(0);
  yBa.unshift(0);

  // Convert to BigIntegers
  var x = new BigInteger(xBa);
  var y = new BigInteger(yBa);

  // Return point
  return new ECPointFp(curve, curve.fromBigInteger(x), curve.fromBigInteger(y));
};

/*
 * @since ec-patch.js 1.0.1
 */
ECPointFp.decodeFromHex = function (curve, encHex) {
  var type = encHex.substr(0, 2); // shall be "04"
  var dataLen = encHex.length - 2;

  // Extract x and y as byte arrays
  var xHex = encHex.substr(2, dataLen / 2);
  var yHex = encHex.substr(2 + dataLen / 2, dataLen / 2);

  // Convert to BigIntegers
  var x = new BigInteger(xHex, 16);
  var y = new BigInteger(yHex, 16);

  // Return point
  return new ECPointFp(curve, curve.fromBigInteger(x), curve.fromBigInteger(y));
};

ECPointFp.prototype.add2D = function (b) {
  if(this.isInfinity()) return b;
  if(b.isInfinity()) return this;

  if (this.x.equals(b.x)) {
    if (this.y.equals(b.y)) {
      // this = b, i.e. this must be doubled
      return this.twice();
    }
    // this = -b, i.e. the result is the point at infinity
    return this.curve.getInfinity();
  }

  var x_x = b.x.subtract(this.x);
  var y_y = b.y.subtract(this.y);
  var gamma = y_y.divide(x_x);

  var x3 = gamma.square().subtract(this.x).subtract(b.x);
  var y3 = gamma.multiply(this.x.subtract(x3)).subtract(this.y);

  return new ECPointFp(this.curve, x3, y3);
};

ECPointFp.prototype.twice2D = function () {
  if (this.isInfinity()) return this;
  if (this.y.toBigInteger().signum() == 0) {
    // if y1 == 0, then (x1, y1) == (x1, -y1)
    // and hence this = -this and thus 2(x1, y1) == infinity
    return this.curve.getInfinity();
  }

  var TWO = this.curve.fromBigInteger(BigInteger.valueOf(2));
  var THREE = this.curve.fromBigInteger(BigInteger.valueOf(3));
  var gamma = this.x.square().multiply(THREE).add(this.curve.a).divide(this.y.multiply(TWO));

  var x3 = gamma.square().subtract(this.x.multiply(TWO));
  var y3 = gamma.multiply(this.x.subtract(x3)).subtract(this.y);

  return new ECPointFp(this.curve, x3, y3);
};

ECPointFp.prototype.multiply2D = function (k) {
  if(this.isInfinity()) return this;
  if(k.signum() == 0) return this.curve.getInfinity();

  var e = k;
  var h = e.multiply(new BigInteger("3"));

  var neg = this.negate();
  var R = this;

  var i;
  for (i = h.bitLength() - 2; i > 0; --i) {
    R = R.twice();

    var hBit = h.testBit(i);
    var eBit = e.testBit(i);

    if (hBit != eBit) {
      R = R.add2D(hBit ? this : neg);
    }
  }

  return R;
};

ECPointFp.prototype.isOnCurve = function () {
  var x = this.getX().toBigInteger();
  var y = this.getY().toBigInteger();
  var a = this.curve.getA().toBigInteger();
  var b = this.curve.getB().toBigInteger();
  var n = this.curve.getQ();
  var lhs = y.multiply(y).mod(n);
  var rhs = x.multiply(x).multiply(x)
    .add(a.multiply(x)).add(b).mod(n);
  return lhs.equals(rhs);
};

ECPointFp.prototype.toString = function () {
  return '('+this.getX().toBigInteger().toString()+','+
    this.getY().toBigInteger().toString()+')';
};

/**
 * Validate an elliptic curve point.
 *
 * See SEC 1, section 3.2.2.1: Elliptic Curve Public Key Validation Primitive
 */
ECPointFp.prototype.validate = function () {
  var n = this.curve.getQ();

  // Check Q != O
  if (this.isInfinity()) {
    throw new Error("Point is at infinity.");
  }

  // Check coordinate bounds
  var x = this.getX().toBigInteger();
  var y = this.getY().toBigInteger();
  if (x.compareTo(BigInteger.ONE) < 0 ||
      x.compareTo(n.subtract(BigInteger.ONE)) > 0) {
    throw new Error('x coordinate out of bounds');
  }
  if (y.compareTo(BigInteger.ONE) < 0 ||
      y.compareTo(n.subtract(BigInteger.ONE)) > 0) {
    throw new Error('y coordinate out of bounds');
  }

  // Check y^2 = x^3 + ax + b (mod n)
  if (!this.isOnCurve()) {
    throw new Error("Point is not on the curve.");
  }

  // Check nQ = 0 (Q is a scalar multiple of G)
  if (this.multiply(n).isInfinity()) {
    // TODO: This check doesn't work - fix.
    throw new Error("Point is not a scalar multiple of G.");
  }

  return true;
};

/*! ecdsa-modified-1.0.4.js (c) Stephan Thomas, Kenji Urushima | github.com/bitcoinjs/bitcoinjs-lib/blob/master/LICENSE
 */
/*
 * ecdsa-modified.js - modified Bitcoin.ECDSA class
 * 
 * Copyright (c) 2013 Stefan Thomas (github.com/justmoon)
 *                    Kenji Urushima (kenji.urushima@gmail.com)
 * LICENSE
 *   https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/LICENSE
 */

/**
 * @fileOverview
 * @name ecdsa-modified-1.0.js
 * @author Stefan Thomas (github.com/justmoon) and Kenji Urushima (kenji.urushima@gmail.com)
 * @version 1.0.4 (2013-Oct-06)
 * @since jsrsasign 4.0
 * @license <a href="https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/LICENSE">MIT License</a>
 */

if (typeof KJUR == "undefined" || !KJUR) KJUR = {};
if (typeof KJUR.crypto == "undefined" || !KJUR.crypto) KJUR.crypto = {};

/**
 * class for EC key generation,  ECDSA signing and verifcation
 * @name KJUR.crypto.ECDSA
 * @class class for EC key generation,  ECDSA signing and verifcation
 * @description
 * <p>
 * CAUTION: Most of the case, you don't need to use this class except
 * for generating an EC key pair. Please use {@link KJUR.crypto.Signature} class instead.
 * </p>
 * <p>
 * This class was originally developped by Stefan Thomas for Bitcoin JavaScript library.
 * (See {@link https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/src/ecdsa.js})
 * Currently this class supports following named curves and their aliases.
 * <ul>
 * <li>secp256r1, NIST P-256, P-256, prime256v1 (*)</li>
 * <li>secp256k1 (*)</li>
 * <li>secp384r1, NIST P-384, P-384 (*)</li>
 * </ul>
 * </p>
 */
KJUR.crypto.ECDSA = function(params) {
    var curveName = "secp256r1";	// curve name default
    var ecparams = null;
    var prvKeyHex = null;
    var pubKeyHex = null;

    var rng = new SecureRandom();

    var P_OVER_FOUR = null;

    this.type = "EC";

    function implShamirsTrick(P, k, Q, l) {
	var m = Math.max(k.bitLength(), l.bitLength());
	var Z = P.add2D(Q);
	var R = P.curve.getInfinity();

	for (var i = m - 1; i >= 0; --i) {
	    R = R.twice2D();

	    R.z = BigInteger.ONE;

	    if (k.testBit(i)) {
		if (l.testBit(i)) {
		    R = R.add2D(Z);
		} else {
		    R = R.add2D(P);
		}
	    } else {
		if (l.testBit(i)) {
		    R = R.add2D(Q);
		}
	    }
	}
	
	return R;
    };

    //===========================
    // PUBLIC METHODS
    //===========================
    this.getBigRandom = function (limit) {
	return new BigInteger(limit.bitLength(), rng)
	.mod(limit.subtract(BigInteger.ONE))
	.add(BigInteger.ONE)
	;
    };

    this.setNamedCurve = function(curveName) {
	this.ecparams = KJUR.crypto.ECParameterDB.getByName(curveName);
	this.prvKeyHex = null;
	this.pubKeyHex = null;
	this.curveName = curveName;
    }

    this.setPrivateKeyHex = function(prvKeyHex) {
        this.isPrivate = true;
	this.prvKeyHex = prvKeyHex;
    }

    this.setPublicKeyHex = function(pubKeyHex) {
        this.isPublic = true;
	this.pubKeyHex = pubKeyHex;
    }

    /**
     * generate a EC key pair
     * @name generateKeyPairHex
     * @memberOf KJUR.crypto.ECDSA
     * @function
     * @return {Array} associative array of hexadecimal string of private and public key
     * @since ecdsa-modified 1.0.1
     * @example
     * var ec = KJUR.crypto.ECDSA({'curve': 'secp256r1'});
     * var keypair = ec.generateKeyPairHex();
     * var pubhex = keypair.ecpubhex; // hexadecimal string of EC private key (=d)
     * var prvhex = keypair.ecprvhex; // hexadecimal string of EC public key
     */
    this.generateKeyPairHex = function() {
	var biN = this.ecparams['n'];
	var biPrv = this.getBigRandom(biN);
	var epPub = this.ecparams['G'].multiply(biPrv);
	var biX = epPub.getX().toBigInteger();
	var biY = epPub.getY().toBigInteger();

	var charlen = this.ecparams['keylen'] / 4;
	var hPrv = ("0000000000" + biPrv.toString(16)).slice(- charlen);
	var hX   = ("0000000000" + biX.toString(16)).slice(- charlen);
	var hY   = ("0000000000" + biY.toString(16)).slice(- charlen);
	var hPub = "04" + hX + hY;

	this.setPrivateKeyHex(hPrv);
	this.setPublicKeyHex(hPub);
	return {'ecprvhex': hPrv, 'ecpubhex': hPub};
    };

    this.signWithMessageHash = function(hashHex) {
	return this.signHex(hashHex, this.prvKeyHex);
    };

    /**
     * signing to message hash
     * @name signHex
     * @memberOf KJUR.crypto.ECDSA
     * @function
     * @param {String} hashHex hexadecimal string of hash value of signing message
     * @param {String} privHex hexadecimal string of EC private key
     * @return {String} hexadecimal string of ECDSA signature
     * @since ecdsa-modified 1.0.1
     * @example
     * var ec = KJUR.crypto.ECDSA({'curve': 'secp256r1'});
     * var sigValue = ec.signHex(hash, prvKey);
     */
    this.signHex = function (hashHex, privHex) {
	var d = new BigInteger(privHex, 16);
	var n = this.ecparams['n'];
	var e = new BigInteger(hashHex, 16);

	do {
	    var k = this.getBigRandom(n);
	    var G = this.ecparams['G'];
	    var Q = G.multiply(k);
	    var r = Q.getX().toBigInteger().mod(n);
	} while (r.compareTo(BigInteger.ZERO) <= 0);

	var s = k.modInverse(n).multiply(e.add(d.multiply(r))).mod(n);

	return KJUR.crypto.ECDSA.biRSSigToASN1Sig(r, s);
    };

    this.sign = function (hash, priv) {
	var d = priv;
	var n = this.ecparams['n'];
	var e = BigInteger.fromByteArrayUnsigned(hash);

	do {
	    var k = this.getBigRandom(n);
	    var G = this.ecparams['G'];
	    var Q = G.multiply(k);
	    var r = Q.getX().toBigInteger().mod(n);
	} while (r.compareTo(BigInteger.ZERO) <= 0);

	var s = k.modInverse(n).multiply(e.add(d.multiply(r))).mod(n);
	return this.serializeSig(r, s);
    };

    this.verifyWithMessageHash = function(hashHex, sigHex) {
	return this.verifyHex(hashHex, sigHex, this.pubKeyHex);
    };

    /**
     * verifying signature with message hash and public key
     * @name verifyHex
     * @memberOf KJUR.crypto.ECDSA
     * @function
     * @param {String} hashHex hexadecimal string of hash value of signing message
     * @param {String} sigHex hexadecimal string of signature value
     * @param {String} pubkeyHex hexadecimal string of public key
     * @return {Boolean} true if the signature is valid, otherwise false
     * @since ecdsa-modified 1.0.1
     * @example
     * var ec = KJUR.crypto.ECDSA({'curve': 'secp256r1'});
     * var result = ec.verifyHex(msgHashHex, sigHex, pubkeyHex);
     */
    this.verifyHex = function(hashHex, sigHex, pubkeyHex) {
	var r,s;

	var obj = KJUR.crypto.ECDSA.parseSigHex(sigHex);
	r = obj.r;
	s = obj.s;

	var Q;
	Q = ECPointFp.decodeFromHex(this.ecparams['curve'], pubkeyHex);
	var e = new BigInteger(hashHex, 16);

	return this.verifyRaw(e, r, s, Q);
    };

    this.verify = function (hash, sig, pubkey) {
	var r,s;
	if (Bitcoin.Util.isArray(sig)) {
	    var obj = this.parseSig(sig);
	    r = obj.r;
	    s = obj.s;
	} else if ("object" === typeof sig && sig.r && sig.s) {
	    r = sig.r;
	    s = sig.s;
	} else {
	    throw "Invalid value for signature";
	}

	var Q;
	if (pubkey instanceof ECPointFp) {
	    Q = pubkey;
	} else if (Bitcoin.Util.isArray(pubkey)) {
	    Q = ECPointFp.decodeFrom(this.ecparams['curve'], pubkey);
	} else {
	    throw "Invalid format for pubkey value, must be byte array or ECPointFp";
	}
	var e = BigInteger.fromByteArrayUnsigned(hash);

	return this.verifyRaw(e, r, s, Q);
    };

    this.verifyRaw = function (e, r, s, Q) {
	var n = this.ecparams['n'];
	var G = this.ecparams['G'];

	if (r.compareTo(BigInteger.ONE) < 0 ||
	    r.compareTo(n) >= 0)
	    return false;

	if (s.compareTo(BigInteger.ONE) < 0 ||
	    s.compareTo(n) >= 0)
	    return false;

	var c = s.modInverse(n);

	var u1 = e.multiply(c).mod(n);
	var u2 = r.multiply(c).mod(n);

	// TODO(!!!): For some reason Shamir's trick isn't working with
	// signed message verification!? Probably an implementation
	// error!
	//var point = implShamirsTrick(G, u1, Q, u2);
	var point = G.multiply(u1).add(Q.multiply(u2));

	var v = point.getX().toBigInteger().mod(n);

	return v.equals(r);
    };

    /**
     * Serialize a signature into DER format.
     *
     * Takes two BigIntegers representing r and s and returns a byte array.
     */
    this.serializeSig = function (r, s) {
	var rBa = r.toByteArraySigned();
	var sBa = s.toByteArraySigned();

	var sequence = [];
	sequence.push(0x02); // INTEGER
	sequence.push(rBa.length);
	sequence = sequence.concat(rBa);

	sequence.push(0x02); // INTEGER
	sequence.push(sBa.length);
	sequence = sequence.concat(sBa);

	sequence.unshift(sequence.length);
	sequence.unshift(0x30); // SEQUENCE
	return sequence;
    };

    /**
     * Parses a byte array containing a DER-encoded signature.
     *
     * This function will return an object of the form:
     *
     * {
     *   r: BigInteger,
     *   s: BigInteger
     * }
     */
    this.parseSig = function (sig) {
	var cursor;
	if (sig[0] != 0x30)
	    throw new Error("Signature not a valid DERSequence");

	cursor = 2;
	if (sig[cursor] != 0x02)
	    throw new Error("First element in signature must be a DERInteger");;
	var rBa = sig.slice(cursor+2, cursor+2+sig[cursor+1]);

	cursor += 2+sig[cursor+1];
	if (sig[cursor] != 0x02)
	    throw new Error("Second element in signature must be a DERInteger");
	var sBa = sig.slice(cursor+2, cursor+2+sig[cursor+1]);

	cursor += 2+sig[cursor+1];

	//if (cursor != sig.length)
	//  throw new Error("Extra bytes in signature");

	var r = BigInteger.fromByteArrayUnsigned(rBa);
	var s = BigInteger.fromByteArrayUnsigned(sBa);

	return {r: r, s: s};
    };

    this.parseSigCompact = function (sig) {
	if (sig.length !== 65) {
	    throw "Signature has the wrong length";
	}

	// Signature is prefixed with a type byte storing three bits of
	// information.
	var i = sig[0] - 27;
	if (i < 0 || i > 7) {
	    throw "Invalid signature type";
	}

	var n = this.ecparams['n'];
	var r = BigInteger.fromByteArrayUnsigned(sig.slice(1, 33)).mod(n);
	var s = BigInteger.fromByteArrayUnsigned(sig.slice(33, 65)).mod(n);

	return {r: r, s: s, i: i};
    };

    /*
     * Recover a public key from a signature.
     *
     * See SEC 1: Elliptic Curve Cryptography, section 4.1.6, "Public
     * Key Recovery Operation".
     *
     * http://www.secg.org/download/aid-780/sec1-v2.pdf
     */
    /*
    recoverPubKey: function (r, s, hash, i) {
	// The recovery parameter i has two bits.
	i = i & 3;

	// The less significant bit specifies whether the y coordinate
	// of the compressed point is even or not.
	var isYEven = i & 1;

	// The more significant bit specifies whether we should use the
	// first or second candidate key.
	var isSecondKey = i >> 1;

	var n = this.ecparams['n'];
	var G = this.ecparams['G'];
	var curve = this.ecparams['curve'];
	var p = curve.getQ();
	var a = curve.getA().toBigInteger();
	var b = curve.getB().toBigInteger();

	// We precalculate (p + 1) / 4 where p is if the field order
	if (!P_OVER_FOUR) {
	    P_OVER_FOUR = p.add(BigInteger.ONE).divide(BigInteger.valueOf(4));
	}

	// 1.1 Compute x
	var x = isSecondKey ? r.add(n) : r;

	// 1.3 Convert x to point
	var alpha = x.multiply(x).multiply(x).add(a.multiply(x)).add(b).mod(p);
	var beta = alpha.modPow(P_OVER_FOUR, p);

	var xorOdd = beta.isEven() ? (i % 2) : ((i+1) % 2);
	// If beta is even, but y isn't or vice versa, then convert it,
	// otherwise we're done and y == beta.
	var y = (beta.isEven() ? !isYEven : isYEven) ? beta : p.subtract(beta);

	// 1.4 Check that nR is at infinity
	var R = new ECPointFp(curve,
			      curve.fromBigInteger(x),
			      curve.fromBigInteger(y));
	R.validate();

	// 1.5 Compute e from M
	var e = BigInteger.fromByteArrayUnsigned(hash);
	var eNeg = BigInteger.ZERO.subtract(e).mod(n);

	// 1.6 Compute Q = r^-1 (sR - eG)
	var rInv = r.modInverse(n);
	var Q = implShamirsTrick(R, s, G, eNeg).multiply(rInv);

	Q.validate();
	if (!this.verifyRaw(e, r, s, Q)) {
	    throw "Pubkey recovery unsuccessful";
	}

	var pubKey = new Bitcoin.ECKey();
	pubKey.pub = Q;
	return pubKey;
    },
    */

    /*
     * Calculate pubkey extraction parameter.
     *
     * When extracting a pubkey from a signature, we have to
     * distinguish four different cases. Rather than putting this
     * burden on the verifier, Bitcoin includes a 2-bit value with the
     * signature.
     *
     * This function simply tries all four cases and returns the value
     * that resulted in a successful pubkey recovery.
     */
    /*
    calcPubkeyRecoveryParam: function (address, r, s, hash) {
	for (var i = 0; i < 4; i++) {
	    try {
		var pubkey = Bitcoin.ECDSA.recoverPubKey(r, s, hash, i);
		if (pubkey.getBitcoinAddress().toString() == address) {
		    return i;
		}
	    } catch (e) {}
	}
	throw "Unable to find valid recovery factor";
    }
    */

    if (params !== undefined) {
	if (params['curve'] !== undefined) {
	    this.curveName = params['curve'];
	}
    }
    if (this.curveName === undefined) this.curveName = curveName;
    this.setNamedCurve(this.curveName);
    if (params !== undefined) {
	if (params['prv'] !== undefined) this.setPrivateKeyHex(params['prv']);
	if (params['pub'] !== undefined) this.setPublicKeyHex(params['pub']);
    }
};

/**
 * parse ASN.1 DER encoded ECDSA signature
 * @name parseSigHex
 * @memberOf KJUR.crypto.ECDSA
 * @function
 * @static
 * @param {String} sigHex hexadecimal string of ECDSA signature value
 * @return {Array} associative array of signature field r and s of BigInteger
 * @since ecdsa-modified 1.0.1
 * @example
 * var ec = KJUR.crypto.ECDSA({'curve': 'secp256r1'});
 * var sig = ec.parseSigHex('30...');
 * var biR = sig.r; // BigInteger object for 'r' field of signature.
 * var biS = sig.s; // BigInteger object for 's' field of signature.
 */
KJUR.crypto.ECDSA.parseSigHex = function(sigHex) {
    var p = KJUR.crypto.ECDSA.parseSigHexInHexRS(sigHex);
    var biR = new BigInteger(p.r, 16);
    var biS = new BigInteger(p.s, 16);
    
    return {'r': biR, 's': biS};
};

/**
 * parse ASN.1 DER encoded ECDSA signature
 * @name parseSigHexInHexRS
 * @memberOf KJUR.crypto.ECDSA
 * @function
 * @static
 * @param {String} sigHex hexadecimal string of ECDSA signature value
 * @return {Array} associative array of signature field r and s in hexadecimal
 * @since ecdsa-modified 1.0.3
 * @example
 * var ec = KJUR.crypto.ECDSA({'curve': 'secp256r1'});
 * var sig = ec.parseSigHexInHexRS('30...');
 * var hR = sig.r; // hexadecimal string for 'r' field of signature.
 * var hS = sig.s; // hexadecimal string for 's' field of signature.
 */
KJUR.crypto.ECDSA.parseSigHexInHexRS = function(sigHex) {
    // 1. ASN.1 Sequence Check
    if (sigHex.substr(0, 2) != "30")
	throw "signature is not a ASN.1 sequence";

    // 2. Items of ASN.1 Sequence Check
    var a = ASN1HEX.getPosArrayOfChildren_AtObj(sigHex, 0);
    if (a.length != 2)
	throw "number of signature ASN.1 sequence elements seem wrong";
    
    // 3. Integer check
    var iTLV1 = a[0];
    var iTLV2 = a[1];
    if (sigHex.substr(iTLV1, 2) != "02")
	throw "1st item of sequene of signature is not ASN.1 integer";
    if (sigHex.substr(iTLV2, 2) != "02")
	throw "2nd item of sequene of signature is not ASN.1 integer";

    // 4. getting value
    var hR = ASN1HEX.getHexOfV_AtObj(sigHex, iTLV1);
    var hS = ASN1HEX.getHexOfV_AtObj(sigHex, iTLV2);
    
    return {'r': hR, 's': hS};
};

/**
 * convert hexadecimal ASN.1 encoded signature to concatinated signature
 * @name asn1SigToConcatSig
 * @memberOf KJUR.crypto.ECDSA
 * @function
 * @static
 * @param {String} asn1Hex hexadecimal string of ASN.1 encoded ECDSA signature value
 * @return {String} r-s concatinated format of ECDSA signature value
 * @since ecdsa-modified 1.0.3
 */
KJUR.crypto.ECDSA.asn1SigToConcatSig = function(asn1Sig) {
    var pSig = KJUR.crypto.ECDSA.parseSigHexInHexRS(asn1Sig);
    var hR = pSig.r;
    var hS = pSig.s;

    if (hR.substr(0, 2) == "00" && (((hR.length / 2) * 8) % (16 * 8)) == 8) 
	hR = hR.substr(2);

    if (hS.substr(0, 2) == "00" && (((hS.length / 2) * 8) % (16 * 8)) == 8) 
	hS = hS.substr(2);

    if ((((hR.length / 2) * 8) % (16 * 8)) != 0)
	throw "unknown ECDSA sig r length error";

    if ((((hS.length / 2) * 8) % (16 * 8)) != 0)
	throw "unknown ECDSA sig s length error";

    return hR + hS;
};

/**
 * convert hexadecimal concatinated signature to ASN.1 encoded signature
 * @name concatSigToASN1Sig
 * @memberOf KJUR.crypto.ECDSA
 * @function
 * @static
 * @param {String} concatSig r-s concatinated format of ECDSA signature value
 * @return {String} hexadecimal string of ASN.1 encoded ECDSA signature value
 * @since ecdsa-modified 1.0.3
 */
KJUR.crypto.ECDSA.concatSigToASN1Sig = function(concatSig) {
    if ((((concatSig.length / 2) * 8) % (16 * 8)) != 0)
	throw "unknown ECDSA concatinated r-s sig  length error";

    var hR = concatSig.substr(0, concatSig.length / 2);
    var hS = concatSig.substr(concatSig.length / 2);
    return KJUR.crypto.ECDSA.hexRSSigToASN1Sig(hR, hS);
};

/**
 * convert hexadecimal R and S value of signature to ASN.1 encoded signature
 * @name hexRSSigToASN1Sig
 * @memberOf KJUR.crypto.ECDSA
 * @function
 * @static
 * @param {String} hR hexadecimal string of R field of ECDSA signature value
 * @param {String} hS hexadecimal string of S field of ECDSA signature value
 * @return {String} hexadecimal string of ASN.1 encoded ECDSA signature value
 * @since ecdsa-modified 1.0.3
 */
KJUR.crypto.ECDSA.hexRSSigToASN1Sig = function(hR, hS) {
    var biR = new BigInteger(hR, 16);
    var biS = new BigInteger(hS, 16);
    return KJUR.crypto.ECDSA.biRSSigToASN1Sig(biR, biS);
};

/**
 * convert R and S BigInteger object of signature to ASN.1 encoded signature
 * @name biRSSigToASN1Sig
 * @memberOf KJUR.crypto.ECDSA
 * @function
 * @static
 * @param {BigInteger} biR BigInteger object of R field of ECDSA signature value
 * @param {BigInteger} biS BIgInteger object of S field of ECDSA signature value
 * @return {String} hexadecimal string of ASN.1 encoded ECDSA signature value
 * @since ecdsa-modified 1.0.3
 */
KJUR.crypto.ECDSA.biRSSigToASN1Sig = function(biR, biS) {
    var derR = new KJUR.asn1.DERInteger({'bigint': biR});
    var derS = new KJUR.asn1.DERInteger({'bigint': biS});
    var derSeq = new KJUR.asn1.DERSequence({'array': [derR, derS]});
    return derSeq.getEncodedHex();
};



(function (root, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory)
    } else if (typeof define === 'function' && define.cmd) {
        define(function (require, exports, module) {
            module.exports = factory()
        })
    } else {
        root.jsrsasign = factory();
    }
}(this, function () {
    return {
        SecureRandom: SecureRandom,
        rng_seed_time: rng_seed_time,
        BigInteger: BigInteger,
        RSAKey: RSAKey,
        ECDSA: KJUR.crypto.ECDSA,
        DSA: KJUR.crypto.DSA,
        Signature: KJUR.crypto.Signature,
        MessageDigest: KJUR.crypto.MessageDigest,
        Mac: KJUR.crypto.Mac,
        Cipher: KJUR.crypto.Cipher,
        ASN1HEX: ASN1HEX,
        X509: X509,
        CryptoJS: CryptoJS,

        // ext/base64.js
        b64tohex: b64tohex,
        b64toBA: b64toBA,

        // name spaces
        KJUR: KJUR,
        crypto: KJUR.crypto,
        asn1: KJUR.asn1,
        jws: KJUR.jws,
        lang: KJUR.lang,
    }
}))
/*! crypto-1.1.5.js (c) 2013 Kenji Urushima | kjur.github.com/jsrsasign/license
 */
/*
 * crypto.js - Cryptographic Algorithm Provider class
 *
 * Copyright (c) 2013 Kenji Urushima (kenji.urushima@gmail.com)
 *
 * This software is licensed under the terms of the MIT License.
 * http://kjur.github.com/jsrsasign/license
 *
 * The above copyright and license notice shall be 
 * included in all copies or substantial portions of the Software.
 */

/**
 * @fileOverview
 * @name crypto-1.1.js
 * @author Kenji Urushima kenji.urushima@gmail.com
 * @version 1.1.5 (2013-Oct-06)
 * @since jsrsasign 2.2
 * @license <a href="http://kjur.github.io/jsrsasign/license/">MIT License</a>
 */

/** 
 * kjur's class library name space
 * @name KJUR
 * @namespace kjur's class library name space
 */
if (typeof KJUR == "undefined" || !KJUR) KJUR = {};
/**
 * kjur's cryptographic algorithm provider library name space
 * <p>
 * This namespace privides following crytpgrahic classes.
 * <ul>
 * <li>{@link KJUR.crypto.MessageDigest} - Java JCE(cryptograhic extension) style MessageDigest class</li>
 * <li>{@link KJUR.crypto.Signature} - Java JCE(cryptograhic extension) style Signature class</li>
 * <li>{@link KJUR.crypto.Util} - cryptographic utility functions and properties</li>
 * </ul>
 * NOTE: Please ignore method summary and document of this namespace. This caused by a bug of jsdoc2.
 * </p>
 * @name KJUR.crypto
 * @namespace
 */
if (typeof KJUR.crypto == "undefined" || !KJUR.crypto) KJUR.crypto = {};

/**
 * static object for cryptographic function utilities
 * @name KJUR.crypto.Util
 * @class static object for cryptographic function utilities
 * @property {Array} DIGESTINFOHEAD PKCS#1 DigestInfo heading hexadecimal bytes for each hash algorithms
 * @property {Array} DEFAULTPROVIDER associative array of default provider name for each hash and signature algorithms
 * @description
 */
KJUR.crypto.Util = new function() {
    this.DIGESTINFOHEAD = {
	'sha1':      "3021300906052b0e03021a05000414",
        'sha224':    "302d300d06096086480165030402040500041c",
	'sha256':    "3031300d060960864801650304020105000420",
	'sha384':    "3041300d060960864801650304020205000430",
	'sha512':    "3051300d060960864801650304020305000440",
	'md2':       "3020300c06082a864886f70d020205000410",
	'md5':       "3020300c06082a864886f70d020505000410",
	'ripemd160': "3021300906052b2403020105000414",
    };

    /*
     * @since crypto 1.1.1
     */
    this.DEFAULTPROVIDER = {
	'md5':			'cryptojs',
	'sha1':			'cryptojs',
	'sha224':		'cryptojs',
	'sha256':		'cryptojs',
	'sha384':		'cryptojs',
	'sha512':		'cryptojs',
	'ripemd160':		'cryptojs',
	'hmacmd5':		'cryptojs',
	'hmacsha1':		'cryptojs',
	'hmacsha224':		'cryptojs',
	'hmacsha256':		'cryptojs',
	'hmacsha384':		'cryptojs',
	'hmacsha512':		'cryptojs',
	'hmacripemd160':	'cryptojs',
	'sm3':	            'cryptojs',

	'MD5withRSA':		'cryptojs/jsrsa',
	'SHA1withRSA':		'cryptojs/jsrsa',
	'SHA224withRSA':	'cryptojs/jsrsa',
	'SHA256withRSA':	'cryptojs/jsrsa',
	'SHA384withRSA':	'cryptojs/jsrsa',
	'SHA512withRSA':	'cryptojs/jsrsa',
	'RIPEMD160withRSA':	'cryptojs/jsrsa',

	'MD5withECDSA':		'cryptojs/jsrsa',
	'SHA1withECDSA':	'cryptojs/jsrsa',
	'SHA224withECDSA':	'cryptojs/jsrsa',
	'SHA256withECDSA':	'cryptojs/jsrsa',
	'SHA384withECDSA':	'cryptojs/jsrsa',
	'SHA512withECDSA':	'cryptojs/jsrsa',
	'RIPEMD160withECDSA':	'cryptojs/jsrsa',

	'SHA1withDSA':		'cryptojs/jsrsa',
	'SHA224withDSA':	'cryptojs/jsrsa',
	'SHA256withDSA':	'cryptojs/jsrsa',

	'MD5withRSAandMGF1':		'cryptojs/jsrsa',
	'SHA1withRSAandMGF1':		'cryptojs/jsrsa',
	'SHA224withRSAandMGF1':		'cryptojs/jsrsa',
	'SHA256withRSAandMGF1':		'cryptojs/jsrsa',
	'SHA384withRSAandMGF1':		'cryptojs/jsrsa',
	'SHA512withRSAandMGF1':		'cryptojs/jsrsa',
	'RIPEMD160withRSAandMGF1':	'cryptojs/jsrsa',
    };

    /*
     * @since crypto 1.1.2
     */
    this.CRYPTOJSMESSAGEDIGESTNAME = {
	'md5':		'CryptoJS.algo.MD5',
	'sha1':		'CryptoJS.algo.SHA1',
	'sha224':	'CryptoJS.algo.SHA224',
	'sha256':	'CryptoJS.algo.SHA256',
	'sha384':	'CryptoJS.algo.SHA384',
	'sha512':	'CryptoJS.algo.SHA512',
	'ripemd160':'CryptoJS.algo.RIPEMD160',
	'sm3':      'CryptoJS.algo.SM3'
    };

    /**
     * get hexadecimal DigestInfo
     * @name getDigestInfoHex
     * @memberOf KJUR.crypto.Util
     * @function
     * @param {String} hHash hexadecimal hash value
     * @param {String} alg hash algorithm name (ex. 'sha1')
     * @return {String} hexadecimal string DigestInfo ASN.1 structure
     */
    this.getDigestInfoHex = function(hHash, alg) {
	if (typeof this.DIGESTINFOHEAD[alg] == "undefined")
	    throw "alg not supported in Util.DIGESTINFOHEAD: " + alg;
	return this.DIGESTINFOHEAD[alg] + hHash;
    };

    /**
     * get PKCS#1 padded hexadecimal DigestInfo
     * @name getPaddedDigestInfoHex
     * @memberOf KJUR.crypto.Util
     * @function
     * @param {String} hHash hexadecimal hash value of message to be signed
     * @param {String} alg hash algorithm name (ex. 'sha1')
     * @param {Integer} keySize key bit length (ex. 1024)
     * @return {String} hexadecimal string of PKCS#1 padded DigestInfo
     */
    this.getPaddedDigestInfoHex = function(hHash, alg, keySize) {
	var hDigestInfo = this.getDigestInfoHex(hHash, alg);
	var pmStrLen = keySize / 4; // minimum PM length

	if (hDigestInfo.length + 22 > pmStrLen) // len(0001+ff(*8)+00+hDigestInfo)=22
	    throw "key is too short for SigAlg: keylen=" + keySize + "," + alg;

	var hHead = "0001";
	var hTail = "00" + hDigestInfo;
	var hMid = "";
	var fLen = pmStrLen - hHead.length - hTail.length;
	for (var i = 0; i < fLen; i += 2) {
	    hMid += "ff";
	}
	var hPaddedMessage = hHead + hMid + hTail;
	return hPaddedMessage;
    };

    /**
     * get hexadecimal hash of string with specified algorithm
     * @name hashString
     * @memberOf KJUR.crypto.Util
     * @function
     * @param {String} s input string to be hashed
     * @param {String} alg hash algorithm name
     * @return {String} hexadecimal string of hash value
     * @since 1.1.1
     */
    this.hashString = function(s, alg) {
        var md = new KJUR.crypto.MessageDigest({'alg': alg});
        return md.digestString(s);
    };

    /**
     * get hexadecimal hash of hexadecimal string with specified algorithm
     * @name hashHex
     * @memberOf KJUR.crypto.Util
     * @function
     * @param {String} sHex input hexadecimal string to be hashed
     * @param {String} alg hash algorithm name
     * @return {String} hexadecimal string of hash value
     * @since 1.1.1
     */
    this.hashHex = function(sHex, alg) {
        var md = new KJUR.crypto.MessageDigest({'alg': alg});
        return md.digestHex(sHex);
    };

    /**
     * get hexadecimal SHA1 hash of string
     * @name sha1
     * @memberOf KJUR.crypto.Util
     * @function
     * @param {String} s input string to be hashed
     * @return {String} hexadecimal string of hash value
     * @since 1.0.3
     */
    this.sha1 = function(s) {
        var md = new KJUR.crypto.MessageDigest({'alg':'sha1', 'prov':'cryptojs'});
        return md.digestString(s);
    };

    /**
     * get hexadecimal SHA256 hash of string
     * @name sha256
     * @memberOf KJUR.crypto.Util
     * @function
     * @param {String} s input string to be hashed
     * @return {String} hexadecimal string of hash value
     * @since 1.0.3
     */
    this.sha256 = function(s) {
        var md = new KJUR.crypto.MessageDigest({'alg':'sha256', 'prov':'cryptojs'});
        return md.digestString(s);
    };

    this.sha256Hex = function(s) {
        var md = new KJUR.crypto.MessageDigest({'alg':'sha256', 'prov':'cryptojs'});
        return md.digestHex(s);
    };

    /**
     * get hexadecimal SHA512 hash of string
     * @name sha512
     * @memberOf KJUR.crypto.Util
     * @function
     * @param {String} s input string to be hashed
     * @return {String} hexadecimal string of hash value
     * @since 1.0.3
     */
    this.sha512 = function(s) {
        var md = new KJUR.crypto.MessageDigest({'alg':'sha512', 'prov':'cryptojs'});
        return md.digestString(s);
    };

    this.sha512Hex = function(s) {
        var md = new KJUR.crypto.MessageDigest({'alg':'sha512', 'prov':'cryptojs'});
        return md.digestHex(s);
    };

    /**
     * get hexadecimal MD5 hash of string
     * @name md5
     * @memberOf KJUR.crypto.Util
     * @function
     * @param {String} s input string to be hashed
     * @return {String} hexadecimal string of hash value
     * @since 1.0.3
     */
    this.md5 = function(s) {
        var md = new KJUR.crypto.MessageDigest({'alg':'md5', 'prov':'cryptojs'});
        return md.digestString(s);
    };

    /**
     * get hexadecimal RIPEMD160 hash of string
     * @name ripemd160
     * @memberOf KJUR.crypto.Util
     * @function
     * @param {String} s input string to be hashed
     * @return {String} hexadecimal string of hash value
     * @since 1.0.3
     */
    this.ripemd160 = function(s) {
        var md = new KJUR.crypto.MessageDigest({'alg':'ripemd160', 'prov':'cryptojs'});
        return md.digestString(s);
    };

    /*
     * @since 1.1.2
     */
    this.getCryptoJSMDByName = function(s) {
	
    };
};

/**
 * MessageDigest class which is very similar to java.security.MessageDigest class
 * @name KJUR.crypto.MessageDigest
 * @class MessageDigest class which is very similar to java.security.MessageDigest class
 * @param {Array} params parameters for constructor
 * @description
 * <br/>
 * Currently this supports following algorithm and providers combination:
 * <ul>
 * <li>md5 - cryptojs</li>
 * <li>sha1 - cryptojs</li>
 * <li>sha224 - cryptojs</li>
 * <li>sha256 - cryptojs</li>
 * <li>sha384 - cryptojs</li>
 * <li>sha512 - cryptojs</li>
 * <li>ripemd160 - cryptojs</li>
 * <li>sha256 - sjcl (NEW from crypto.js 1.0.4)</li>
 * </ul>
 * @example
 * // CryptoJS provider sample
 * &lt;script src="http://crypto-js.googlecode.com/svn/tags/3.1.2/build/components/core.js"&gt;&lt;/script&gt;
 * &lt;script src="http://crypto-js.googlecode.com/svn/tags/3.1.2/build/components/sha1.js"&gt;&lt;/script&gt;
 * &lt;script src="crypto-1.0.js"&gt;&lt;/script&gt;
 * var md = new KJUR.crypto.MessageDigest({alg: "sha1", prov: "cryptojs"});
 * md.updateString('aaa')
 * var mdHex = md.digest()
 *
 * // SJCL(Stanford JavaScript Crypto Library) provider sample
 * &lt;script src="http://bitwiseshiftleft.github.io/sjcl/sjcl.js"&gt;&lt;/script&gt;
 * &lt;script src="crypto-1.0.js"&gt;&lt;/script&gt;
 * var md = new KJUR.crypto.MessageDigest({alg: "sha256", prov: "sjcl"}); // sjcl supports sha256 only
 * md.updateString('aaa')
 * var mdHex = md.digest()
 */
KJUR.crypto.MessageDigest = function(params) {
    var md = null;
    var algName = null;
    var provName = null;

    /**
     * set hash algorithm and provider
     * @name setAlgAndProvider
     * @memberOf KJUR.crypto.MessageDigest
     * @function
     * @param {String} alg hash algorithm name
     * @param {String} prov provider name
     * @description
     * @example
     * // for SHA1
     * md.setAlgAndProvider('sha1', 'cryptojs');
     * // for RIPEMD160
     * md.setAlgAndProvider('ripemd160', 'cryptojs');
     */
    this.setAlgAndProvider = function(alg, prov) {
	if (alg != null && prov === undefined) prov = KJUR.crypto.Util.DEFAULTPROVIDER[alg];

	// for cryptojs
	if (':md5:sha1:sha224:sha256:sha384:sha512:ripemd160:sm3:'.indexOf(alg) != -1 &&
	    prov == 'cryptojs') {
	    try {
		this.md = eval(KJUR.crypto.Util.CRYPTOJSMESSAGEDIGESTNAME[alg]).create();
	    } catch (ex) {
		throw "setAlgAndProvider hash alg set fail alg=" + alg + "/" + ex;
	    }
	    this.updateString = function(str) {
		this.md.update(str);
	    };
	    this.updateHex = function(hex) {
		var wHex = CryptoJS.enc.Hex.parse(hex);
		this.md.update(wHex);
	    };
	    this.digest = function() {
		var hash = this.md.finalize();
		return hash.toString(CryptoJS.enc.Hex);
	    };
	    this.digestString = function(str) {
		this.updateString(str);
		return this.digest();
	    };
	    this.digestHex = function(hex) {
		this.updateHex(hex);
		return this.digest();
	    };
	}
	if (':sha256:'.indexOf(alg) != -1 &&
	    prov == 'sjcl') {
	    try {
		this.md = new sjcl.hash.sha256();
	    } catch (ex) {
		throw "setAlgAndProvider hash alg set fail alg=" + alg + "/" + ex;
	    }
	    this.updateString = function(str) {
		this.md.update(str);
	    };
	    this.updateHex = function(hex) {
		var baHex = sjcl.codec.hex.toBits(hex);
		this.md.update(baHex);
	    };
	    this.digest = function() {
		var hash = this.md.finalize();
		return sjcl.codec.hex.fromBits(hash);
	    };
	    this.digestString = function(str) {
		this.updateString(str);
		return this.digest();
	    };
	    this.digestHex = function(hex) {
		this.updateHex(hex);
		return this.digest();
	    };
	}
    };

    /**
     * update digest by specified string
     * @name updateString
     * @memberOf KJUR.crypto.MessageDigest
     * @function
     * @param {String} str string to update
     * @description
     * @example
     * md.updateString('New York');
     */
    this.updateString = function(str) {
	throw "updateString(str) not supported for this alg/prov: " + this.algName + "/" + this.provName;
    };

    /**
     * update digest by specified hexadecimal string
     * @name updateHex
     * @memberOf KJUR.crypto.MessageDigest
     * @function
     * @param {String} hex hexadecimal string to update
     * @description
     * @example
     * md.updateHex('0afe36');
     */
    this.updateHex = function(hex) {
	throw "updateHex(hex) not supported for this alg/prov: " + this.algName + "/" + this.provName;
    };

    /**
     * completes hash calculation and returns hash result
     * @name digest
     * @memberOf KJUR.crypto.MessageDigest
     * @function
     * @description
     * @example
     * md.digest()
     */
    this.digest = function() {
	throw "digest() not supported for this alg/prov: " + this.algName + "/" + this.provName;
    };

    /**
     * performs final update on the digest using string, then completes the digest computation
     * @name digestString
     * @memberOf KJUR.crypto.MessageDigest
     * @function
     * @param {String} str string to final update
     * @description
     * @example
     * md.digestString('aaa')
     */
    this.digestString = function(str) {
	throw "digestString(str) not supported for this alg/prov: " + this.algName + "/" + this.provName;
    };

    /**
     * performs final update on the digest using hexadecimal string, then completes the digest computation
     * @name digestHex
     * @memberOf KJUR.crypto.MessageDigest
     * @function
     * @param {String} hex hexadecimal string to final update
     * @description
     * @example
     * md.digestHex('0f2abd')
     */
    this.digestHex = function(hex) {
	throw "digestHex(hex) not supported for this alg/prov: " + this.algName + "/" + this.provName;
    };

    if (params !== undefined) {
	if (params['alg'] !== undefined) {
	    this.algName = params['alg'];
	    if (params['prov'] === undefined)
		this.provName = KJUR.crypto.Util.DEFAULTPROVIDER[this.algName];
	    this.setAlgAndProvider(this.algName, this.provName);
	}
    }
};

/**
 * Mac(Message Authentication Code) class which is very similar to java.security.Mac class 
 * @name KJUR.crypto.Mac
 * @class Mac class which is very similar to java.security.Mac class
 * @param {Array} params parameters for constructor
 * @description
 * <br/>
 * Currently this supports following algorithm and providers combination:
 * <ul>
 * <li>hmacmd5 - cryptojs</li>
 * <li>hmacsha1 - cryptojs</li>
 * <li>hmacsha224 - cryptojs</li>
 * <li>hmacsha256 - cryptojs</li>
 * <li>hmacsha384 - cryptojs</li>
 * <li>hmacsha512 - cryptojs</li>
 * </ul>
 * NOTE: HmacSHA224 and HmacSHA384 issue was fixed since jsrsasign 4.1.4.
 * Please use 'ext/cryptojs-312-core-fix*.js' instead of 'core.js' of original CryptoJS
 * to avoid those issue.
 * @example
 * var mac = new KJUR.crypto.Mac({alg: "HmacSHA1", prov: "cryptojs", "pass": "pass"});
 * mac.updateString('aaa')
 * var macHex = md.doFinal()
 */
KJUR.crypto.Mac = function(params) {
    var mac = null;
    var pass = null;
    var algName = null;
    var provName = null;
    var algProv = null;

    this.setAlgAndProvider = function(alg, prov) {
	if (alg == null) alg = "hmacsha1";

	alg = alg.toLowerCase();
        if (alg.substr(0, 4) != "hmac") {
	    throw "setAlgAndProvider unsupported HMAC alg: " + alg;
	}

	if (prov === undefined) prov = KJUR.crypto.Util.DEFAULTPROVIDER[alg];
	this.algProv = alg + "/" + prov;

	var hashAlg = alg.substr(4);

	// for cryptojs
	if (':md5:sha1:sha224:sha256:sha384:sha512:ripemd160:'.indexOf(hashAlg) != -1 &&
	    prov == 'cryptojs') {
	    try {
		var mdObj = eval(KJUR.crypto.Util.CRYPTOJSMESSAGEDIGESTNAME[hashAlg]);
		this.mac = CryptoJS.algo.HMAC.create(mdObj, this.pass);
	    } catch (ex) {
		throw "setAlgAndProvider hash alg set fail hashAlg=" + hashAlg + "/" + ex;
	    }
	    this.updateString = function(str) {
		this.mac.update(str);
	    };
	    this.updateHex = function(hex) {
		var wHex = CryptoJS.enc.Hex.parse(hex);
		this.mac.update(wHex);
	    };
	    this.doFinal = function() {
		var hash = this.mac.finalize();
		return hash.toString(CryptoJS.enc.Hex);
	    };
	    this.doFinalString = function(str) {
		this.updateString(str);
		return this.doFinal();
	    };
	    this.doFinalHex = function(hex) {
		this.updateHex(hex);
		return this.doFinal();
	    };
	}
    };

    /**
     * update digest by specified string
     * @name updateString
     * @memberOf KJUR.crypto.Mac
     * @function
     * @param {String} str string to update
     * @description
     * @example
     * md.updateString('New York');
     */
    this.updateString = function(str) {
	throw "updateString(str) not supported for this alg/prov: " + this.algProv;
    };

    /**
     * update digest by specified hexadecimal string
     * @name updateHex
     * @memberOf KJUR.crypto.Mac
     * @function
     * @param {String} hex hexadecimal string to update
     * @description
     * @example
     * md.updateHex('0afe36');
     */
    this.updateHex = function(hex) {
	throw "updateHex(hex) not supported for this alg/prov: " + this.algProv;
    };

    /**
     * completes hash calculation and returns hash result
     * @name doFinal
     * @memberOf KJUR.crypto.Mac
     * @function
     * @description
     * @example
     * md.digest()
     */
    this.doFinal = function() {
	throw "digest() not supported for this alg/prov: " + this.algProv;
    };

    /**
     * performs final update on the digest using string, then completes the digest computation
     * @name doFinalString
     * @memberOf KJUR.crypto.Mac
     * @function
     * @param {String} str string to final update
     * @description
     * @example
     * md.digestString('aaa')
     */
    this.doFinalString = function(str) {
	throw "digestString(str) not supported for this alg/prov: " + this.algProv;
    };

    /**
     * performs final update on the digest using hexadecimal string, 
     * then completes the digest computation
     * @name doFinalHex
     * @memberOf KJUR.crypto.Mac
     * @function
     * @param {String} hex hexadecimal string to final update
     * @description
     * @example
     * md.digestHex('0f2abd')
     */
    this.doFinalHex = function(hex) {
	throw "digestHex(hex) not supported for this alg/prov: " + this.algProv;
    };

    if (params !== undefined) {
	if (params['pass'] !== undefined) {
	    this.pass = params['pass'];
	}
	if (params['alg'] !== undefined) {
	    this.algName = params['alg'];
	    if (params['prov'] === undefined)
		this.provName = KJUR.crypto.Util.DEFAULTPROVIDER[this.algName];
	    this.setAlgAndProvider(this.algName, this.provName);
	}
    }
};

/**
 * Signature class which is very similar to java.security.Signature class
 * @name KJUR.crypto.Signature
 * @class Signature class which is very similar to java.security.Signature class
 * @param {Array} params parameters for constructor
 * @property {String} state Current state of this signature object whether 'SIGN', 'VERIFY' or null
 * @description
 * <br/>
 * As for params of constructor's argument, it can be specify following attributes:
 * <ul>
 * <li>alg - signature algorithm name (ex. {MD5,SHA1,SHA224,SHA256,SHA384,SHA512,RIPEMD160}with{RSA,ECDSA,DSA})</li>
 * <li>provider - currently 'cryptojs/jsrsa' only</li>
 * </ul>
 * <h4>SUPPORTED ALGORITHMS AND PROVIDERS</h4>
 * This Signature class supports following signature algorithm and provider names:
 * <ul>
 * <li>MD5withRSA - cryptojs/jsrsa</li>
 * <li>SHA1withRSA - cryptojs/jsrsa</li>
 * <li>SHA224withRSA - cryptojs/jsrsa</li>
 * <li>SHA256withRSA - cryptojs/jsrsa</li>
 * <li>SHA384withRSA - cryptojs/jsrsa</li>
 * <li>SHA512withRSA - cryptojs/jsrsa</li>
 * <li>RIPEMD160withRSA - cryptojs/jsrsa</li>
 * <li>MD5withECDSA - cryptojs/jsrsa</li>
 * <li>SHA1withECDSA - cryptojs/jsrsa</li>
 * <li>SHA224withECDSA - cryptojs/jsrsa</li>
 * <li>SHA256withECDSA - cryptojs/jsrsa</li>
 * <li>SHA384withECDSA - cryptojs/jsrsa</li>
 * <li>SHA512withECDSA - cryptojs/jsrsa</li>
 * <li>RIPEMD160withECDSA - cryptojs/jsrsa</li>
 * <li>MD5withRSAandMGF1 - cryptojs/jsrsa</li>
 * <li>SHA1withRSAandMGF1 - cryptojs/jsrsa</li>
 * <li>SHA224withRSAandMGF1 - cryptojs/jsrsa</li>
 * <li>SHA256withRSAandMGF1 - cryptojs/jsrsa</li>
 * <li>SHA384withRSAandMGF1 - cryptojs/jsrsa</li>
 * <li>SHA512withRSAandMGF1 - cryptojs/jsrsa</li>
 * <li>RIPEMD160withRSAandMGF1 - cryptojs/jsrsa</li>
 * <li>SHA1withDSA - cryptojs/jsrsa</li>
 * <li>SHA224withDSA - cryptojs/jsrsa</li>
 * <li>SHA256withDSA - cryptojs/jsrsa</li>
 * </ul>
 * Here are supported elliptic cryptographic curve names and their aliases for ECDSA:
 * <ul>
 * <li>secp256k1</li>
 * <li>secp256r1, NIST P-256, P-256, prime256v1</li>
 * <li>secp384r1, NIST P-384, P-384</li>
 * </ul>
 * NOTE1: DSA signing algorithm is also supported since crypto 1.1.5.
 * <h4>EXAMPLES</h4>
 * @example
 * // RSA signature generation
 * var sig = new KJUR.crypto.Signature({"alg": "SHA1withRSA"});
 * sig.init(prvKeyPEM);
 * sig.updateString('aaa');
 * var hSigVal = sig.sign();
 *
 * // DSA signature validation
 * var sig2 = new KJUR.crypto.Signature({"alg": "SHA1withDSA"});
 * sig2.init(certPEM);
 * sig.updateString('aaa');
 * var isValid = sig2.verify(hSigVal);
 * 
 * // ECDSA signing
 * var sig = new KJUR.crypto.Signature({'alg':'SHA1withECDSA'});
 * sig.init(prvKeyPEM);
 * sig.updateString('aaa');
 * var sigValueHex = sig.sign();
 *
 * // ECDSA verifying
 * var sig2 = new KJUR.crypto.Signature({'alg':'SHA1withECDSA'});
 * sig.init(certPEM);
 * sig.updateString('aaa');
 * var isValid = sig.verify(sigValueHex);
 */
KJUR.crypto.Signature = function(params) {
    var prvKey = null; // RSAKey/KJUR.crypto.{ECDSA,DSA} object for signing
    var pubKey = null; // RSAKey/KJUR.crypto.{ECDSA,DSA} object for verifying

    var md = null; // KJUR.crypto.MessageDigest object
    var sig = null;
    var algName = null;
    var provName = null;
    var algProvName = null;
    var mdAlgName = null;
    var pubkeyAlgName = null;	// rsa,ecdsa,rsaandmgf1(=rsapss)
    var state = null;
    var pssSaltLen = -1;
    var initParams = null;

    var sHashHex = null; // hex hash value for hex
    var hDigestInfo = null;
    var hPaddedDigestInfo = null;
    var hSign = null;

    this._setAlgNames = function() {
	if (this.algName.match(/^(.+)with(.+)$/)) {
	    this.mdAlgName = RegExp.$1.toLowerCase();
	    this.pubkeyAlgName = RegExp.$2.toLowerCase();
	}
    };

    this._zeroPaddingOfSignature = function(hex, bitLength) {
	var s = "";
	var nZero = bitLength / 4 - hex.length;
	for (var i = 0; i < nZero; i++) {
	    s = s + "0";
	}
	return s + hex;
    };

    /**
     * set signature algorithm and provider
     * @name setAlgAndProvider
     * @memberOf KJUR.crypto.Signature
     * @function
     * @param {String} alg signature algorithm name
     * @param {String} prov provider name
     * @description
     * @example
     * md.setAlgAndProvider('SHA1withRSA', 'cryptojs/jsrsa');
     */
    this.setAlgAndProvider = function(alg, prov) {
	this._setAlgNames();
	if (prov != 'cryptojs/jsrsa')
	    throw "provider not supported: " + prov;

	if (':md5:sha1:sha224:sha256:sha384:sha512:ripemd160:sm3:'.indexOf(this.mdAlgName) != -1) {
	    try {
		this.md = new KJUR.crypto.MessageDigest({'alg':this.mdAlgName});
	    } catch (ex) {
		throw "setAlgAndProvider hash alg set fail alg=" +
                      this.mdAlgName + "/" + ex;
	    }

	    this.init = function(keyparam, pass) {
		var keyObj = null;
		try {
		    if (pass === undefined) {
			keyObj = KEYUTIL.getKey(keyparam);
		    } else {
			keyObj = KEYUTIL.getKey(keyparam, pass);
		    }
		} catch (ex) {
		    throw "init failed:" + ex;
		}

		if (keyObj.isPrivate === true) {
		    this.prvKey = keyObj;
		    this.state = "SIGN";
		} else if (keyObj.isPublic === true) {
		    this.pubKey = keyObj;
		    this.state = "VERIFY";
		} else {
		    throw "init failed.:" + keyObj;
		}
	    };

	    this.initSign = function(params) {
		if (typeof params['ecprvhex'] == 'string' &&
                    typeof params['eccurvename'] == 'string') {
		    this.ecprvhex = params['ecprvhex'];
		    this.eccurvename = params['eccurvename'];
		} else {
		    this.prvKey = params;
		}
		this.state = "SIGN";
	    };

	    this.initVerifyByPublicKey = function(params) {
		if (typeof params['ecpubhex'] == 'string' &&
		    typeof params['eccurvename'] == 'string') {
		    this.ecpubhex = params['ecpubhex'];
		    this.eccurvename = params['eccurvename'];
		} else if (params instanceof KJUR.crypto.ECDSA) {
		    this.pubKey = params;
		} else if (params instanceof RSAKey) {
		    this.pubKey = params;
		}
		this.state = "VERIFY";
	    };

	    this.initVerifyByCertificatePEM = function(certPEM) {
		var x509 = new X509();
		x509.readCertPEM(certPEM);
		this.pubKey = x509.subjectPublicKeyRSA;
		this.state = "VERIFY";
        };
        
        this.leftPad = function(input, num) {
            if (input.length >= num) return input
            return new Array(num - input.length + 1).join('0') + input
        };

	    this.updateString = function(str) {
		this.md.updateString(str);
	    };
	    this.updateHex = function(hex) {
		this.md.updateHex(hex);
	    };

	    this.sign = function() {
	    
	    if(this.eccurvename != "sm2") {
		    this.sHashHex = this.md.digest();
		}
		
		if (typeof this.ecprvhex != "undefined" &&
		    typeof this.eccurvename != "undefined") {
			if(this.eccurvename == "sm2")
			{
				var ec = new KJUR.crypto.SM3withSM2({curve: this.eccurvename});
				
				var G = ec.ecparams['G'];
				var Q = G.multiply(new BigInteger(this.ecprvhex, 16));
				
				var pubKeyHex = this.leftPad(Q.getX().toBigInteger().toString(16), 64) + this.leftPad(Q.getY().toBigInteger().toString(16), 64);
				
				var smDigest = new SM3Digest();
				
				var z = new SM3Digest().GetZ(G, pubKeyHex);
				var zValue = smDigest.GetWords(smDigest.GetHex(z).toString());
				
				var rawData = CryptoJS.enc.Utf8.stringify(this.md.md._data);
				rawData = CryptoJS.enc.Utf8.parse(rawData).toString();
				rawData = smDigest.GetWords(rawData);
								
                var smHash = new Array(smDigest.GetDigestSize());
                smDigest.BlockUpdate(zValue, 0, zValue.length);
                smDigest.BlockUpdate(rawData, 0, rawData.length);
                smDigest.DoFinal(smHash, 0);

                var hashHex = smDigest.GetHex(smHash).toString();
				
				this.sHashHex = hashHex;
				
		    	this.hSign = ec.signHex(this.sHashHex, this.ecprvhex);
			}else {
		    	var ec = new KJUR.crypto.ECDSA({'curve': this.eccurvename});
		    	this.hSign = ec.signHex(this.sHashHex, this.ecprvhex);
			}
		} else if (this.pubkeyAlgName == "rsaandmgf1") {
		    this.hSign = this.prvKey.signWithMessageHashPSS(this.sHashHex,
								    this.mdAlgName,
								    this.pssSaltLen);
		} else if (this.pubkeyAlgName == "rsa") {
		    this.hSign = this.prvKey.signWithMessageHash(this.sHashHex,
								 this.mdAlgName);
		} else if (this.prvKey instanceof KJUR.crypto.ECDSA) {
		    this.hSign = this.prvKey.signWithMessageHash(this.sHashHex);
		} else if (this.prvKey instanceof KJUR.crypto.DSA) {
		    this.hSign = this.prvKey.signWithMessageHash(this.sHashHex);
		} else {
		    throw "Signature: unsupported public key alg: " + this.pubkeyAlgName;
		}
		return this.hSign;
	    };
	    this.signString = function(str) {
		this.updateString(str);
		this.sign();
	    };
	    this.signHex = function(hex) {
		this.updateHex(hex);
		this.sign();
	    };
	    this.verify = function(hSigVal) {
	    
	    if(this.eccurvename != "sm2") {
	        this.sHashHex = this.md.digest();
	    }
	    
		if (typeof this.ecpubhex != "undefined" &&
		    typeof this.eccurvename != "undefined") {
			if(this.eccurvename == "sm2")
			{
				var ec = new KJUR.crypto.SM3withSM2({curve: this.eccurvename});
				
				var G = ec.ecparams['G'];
								
				var pubKeyHex = this.ecpubhex.substr(2, 128);
				
				var smDigest = new SM3Digest();
				
				var z = new SM3Digest().GetZ(G, pubKeyHex);
				var zValue = smDigest.GetWords(smDigest.GetHex(z).toString());
				
				var rawData = CryptoJS.enc.Utf8.stringify(this.md.md._data);
				rawData = CryptoJS.enc.Utf8.parse(rawData).toString();
				rawData = smDigest.GetWords(rawData);
				
                var smHash = new Array(smDigest.GetDigestSize());
                smDigest.BlockUpdate(zValue, 0, zValue.length);
                smDigest.BlockUpdate(rawData, 0, rawData.length);
                smDigest.DoFinal(smHash, 0);

                var hashHex = smDigest.GetHex(smHash).toString();
				
				this.sHashHex = hashHex;
				
				
		    	return ec.verifyHex(this.sHashHex, hSigVal, this.ecpubhex);
			}else {
		    	var ec = new KJUR.crypto.ECDSA({curve: this.eccurvename});
		    	return ec.verifyHex(this.sHashHex, hSigVal, this.ecpubhex);
			}
		} else if (this.pubkeyAlgName == "rsaandmgf1") {
		    return this.pubKey.verifyWithMessageHashPSS(this.sHashHex, hSigVal, 
								this.mdAlgName,
								this.pssSaltLen);
		} else if (this.pubkeyAlgName == "rsa") {
		    return this.pubKey.verifyWithMessageHash(this.sHashHex, hSigVal);
		} else if (this.pubKey instanceof KJUR.crypto.ECDSA) {
		    return this.pubKey.verifyWithMessageHash(this.sHashHex, hSigVal);
		} else if (this.pubKey instanceof KJUR.crypto.DSA) {
		    return this.pubKey.verifyWithMessageHash(this.sHashHex, hSigVal);
		} else {
		    throw "Signature: unsupported public key alg: " + this.pubkeyAlgName;
		}
	    };
	}
    };

    /**
     * Initialize this object for signing or verifying depends on key
     * @name init
     * @memberOf KJUR.crypto.Signature
     * @function
     * @param {Object} key specifying public or private key as plain/encrypted PKCS#5/8 PEM file, certificate PEM or {@link RSAKey}, {@link KJUR.crypto.DSA} or {@link KJUR.crypto.ECDSA} object
     * @param {String} pass (OPTION) passcode for encrypted private key
     * @since crypto 1.1.3
     * @description
     * This method is very useful initialize method for Signature class since
     * you just specify key then this method will automatically initialize it
     * using {@link KEYUTIL.getKey} method.
     * As for 'key',  following argument type are supported:
     * <h5>signing</h5>
     * <ul>
     * <li>PEM formatted PKCS#8 encrypted RSA/ECDSA private key concluding "BEGIN ENCRYPTED PRIVATE KEY"</li>
     * <li>PEM formatted PKCS#5 encrypted RSA/DSA private key concluding "BEGIN RSA/DSA PRIVATE KEY" and ",ENCRYPTED"</li>
     * <li>PEM formatted PKCS#8 plain RSA/ECDSA private key concluding "BEGIN PRIVATE KEY"</li>
     * <li>PEM formatted PKCS#5 plain RSA/DSA private key concluding "BEGIN RSA/DSA PRIVATE KEY" without ",ENCRYPTED"</li>
     * <li>RSAKey object of private key</li>
     * <li>KJUR.crypto.ECDSA object of private key</li>
     * <li>KJUR.crypto.DSA object of private key</li>
     * </ul>
     * <h5>verification</h5>
     * <ul>
     * <li>PEM formatted PKCS#8 RSA/EC/DSA public key concluding "BEGIN PUBLIC KEY"</li>
     * <li>PEM formatted X.509 certificate with RSA/EC/DSA public key concluding
     *     "BEGIN CERTIFICATE", "BEGIN X509 CERTIFICATE" or "BEGIN TRUSTED CERTIFICATE".</li>
     * <li>RSAKey object of public key</li>
     * <li>KJUR.crypto.ECDSA object of public key</li>
     * <li>KJUR.crypto.DSA object of public key</li>
     * </ul>
     * @example
     * sig.init(sCertPEM)
     */
    this.init = function(key, pass) {
	throw "init(key, pass) not supported for this alg:prov=" +
	      this.algProvName;
    };

    /**
     * Initialize this object for verifying with a public key
     * @name initVerifyByPublicKey
     * @memberOf KJUR.crypto.Signature
     * @function
     * @param {Object} param RSAKey object of public key or associative array for ECDSA
     * @since 1.0.2
     * @deprecated from crypto 1.1.5. please use init() method instead.
     * @description
     * Public key information will be provided as 'param' parameter and the value will be
     * following:
     * <ul>
     * <li>{@link RSAKey} object for RSA verification</li>
     * <li>associative array for ECDSA verification
     *     (ex. <code>{'ecpubhex': '041f..', 'eccurvename': 'secp256r1'}</code>)
     * </li>
     * </ul>
     * @example
     * sig.initVerifyByPublicKey(rsaPrvKey)
     */
    this.initVerifyByPublicKey = function(rsaPubKey) {
	throw "initVerifyByPublicKey(rsaPubKeyy) not supported for this alg:prov=" +
	      this.algProvName;
    };

    /**
     * Initialize this object for verifying with a certficate
     * @name initVerifyByCertificatePEM
     * @memberOf KJUR.crypto.Signature
     * @function
     * @param {String} certPEM PEM formatted string of certificate
     * @since 1.0.2
     * @deprecated from crypto 1.1.5. please use init() method instead.
     * @description
     * @example
     * sig.initVerifyByCertificatePEM(certPEM)
     */
    this.initVerifyByCertificatePEM = function(certPEM) {
	throw "initVerifyByCertificatePEM(certPEM) not supported for this alg:prov=" +
	    this.algProvName;
    };

    /**
     * Initialize this object for signing
     * @name initSign
     * @memberOf KJUR.crypto.Signature
     * @function
     * @param {Object} param RSAKey object of public key or associative array for ECDSA
     * @deprecated from crypto 1.1.5. please use init() method instead.
     * @description
     * Private key information will be provided as 'param' parameter and the value will be
     * following:
     * <ul>
     * <li>{@link RSAKey} object for RSA signing</li>
     * <li>associative array for ECDSA signing
     *     (ex. <code>{'ecprvhex': '1d3f..', 'eccurvename': 'secp256r1'}</code>)</li>
     * </ul>
     * @example
     * sig.initSign(prvKey)
     */
    this.initSign = function(prvKey) {
	throw "initSign(prvKey) not supported for this alg:prov=" + this.algProvName;
    };

    /**
     * Updates the data to be signed or verified by a string
     * @name updateString
     * @memberOf KJUR.crypto.Signature
     * @function
     * @param {String} str string to use for the update
     * @description
     * @example
     * sig.updateString('aaa')
     */
    this.updateString = function(str) {
	throw "updateString(str) not supported for this alg:prov=" + this.algProvName;
    };

    /**
     * Updates the data to be signed or verified by a hexadecimal string
     * @name updateHex
     * @memberOf KJUR.crypto.Signature
     * @function
     * @param {String} hex hexadecimal string to use for the update
     * @description
     * @example
     * sig.updateHex('1f2f3f')
     */
    this.updateHex = function(hex) {
	throw "updateHex(hex) not supported for this alg:prov=" + this.algProvName;
    };

    /**
     * Returns the signature bytes of all data updates as a hexadecimal string
     * @name sign
     * @memberOf KJUR.crypto.Signature
     * @function
     * @return the signature bytes as a hexadecimal string
     * @description
     * @example
     * var hSigValue = sig.sign()
     */
    this.sign = function() {
	throw "sign() not supported for this alg:prov=" + this.algProvName;
    };

    /**
     * performs final update on the sign using string, then returns the signature bytes of all data updates as a hexadecimal string
     * @name signString
     * @memberOf KJUR.crypto.Signature
     * @function
     * @param {String} str string to final update
     * @return the signature bytes of a hexadecimal string
     * @description
     * @example
     * var hSigValue = sig.signString('aaa')
     */
    this.signString = function(str) {
	throw "digestString(str) not supported for this alg:prov=" + this.algProvName;
    };

    /**
     * performs final update on the sign using hexadecimal string, then returns the signature bytes of all data updates as a hexadecimal string
     * @name signHex
     * @memberOf KJUR.crypto.Signature
     * @function
     * @param {String} hex hexadecimal string to final update
     * @return the signature bytes of a hexadecimal string
     * @description
     * @example
     * var hSigValue = sig.signHex('1fdc33')
     */
    this.signHex = function(hex) {
	throw "digestHex(hex) not supported for this alg:prov=" + this.algProvName;
    };

    /**
     * verifies the passed-in signature.
     * @name verify
     * @memberOf KJUR.crypto.Signature
     * @function
     * @param {String} str string to final update
     * @return {Boolean} true if the signature was verified, otherwise false
     * @description
     * @example
     * var isValid = sig.verify('1fbcefdca4823a7(snip)')
     */
    this.verify = function(hSigVal) {
	throw "verify(hSigVal) not supported for this alg:prov=" + this.algProvName;
    };

    this.initParams = params;

    if (params !== undefined) {
	if (params['alg'] !== undefined) {
	    this.algName = params['alg'];
	    if (params['prov'] === undefined) {
		this.provName = KJUR.crypto.Util.DEFAULTPROVIDER[this.algName];
	    } else {
		this.provName = params['prov'];
	    }
	    this.algProvName = this.algName + ":" + this.provName;
	    this.setAlgAndProvider(this.algName, this.provName);
	    this._setAlgNames();
	}

	if (params['psssaltlen'] !== undefined) this.pssSaltLen = params['psssaltlen'];

	if (params['prvkeypem'] !== undefined) {
	    if (params['prvkeypas'] !== undefined) {
		throw "both prvkeypem and prvkeypas parameters not supported";
	    } else {
		try {
		    var prvKey = new RSAKey();
		    prvKey.readPrivateKeyFromPEMString(params['prvkeypem']);
		    this.initSign(prvKey);
		} catch (ex) {
		    throw "fatal error to load pem private key: " + ex;
		}
	    }
	}
    }
};

/**
 * static object for cryptographic function utilities
 * @name KJUR.crypto.OID
 * @class static object for cryptography related OIDs
 * @property {Array} oidhex2name key value of hexadecimal OID and its name
 *           (ex. '2a8648ce3d030107' and 'secp256r1')
 * @since crypto 1.1.3
 * @description
 */


KJUR.crypto.OID = new function() {
    this.oidhex2name = {
	'2a864886f70d010101': 'rsaEncryption',
	'2a8648ce3d0201': 'ecPublicKey',
	'2a8648ce380401': 'dsa',
	'2a8648ce3d030107': 'secp256r1',
	'2b8104001f': 'secp192k1',
	'2b81040021': 'secp224r1',
	'2b8104000a': 'secp256k1',
	'2b81040023': 'secp521r1',
	'2b81040022': 'secp384r1',
	'2a8648ce380403': 'SHA1withDSA', // 1.2.840.10040.4.3
	'608648016503040301': 'SHA224withDSA', // 2.16.840.1.101.3.4.3.1
	'608648016503040302': 'SHA256withDSA', // 2.16.840.1.101.3.4.3.2
    };
};
(function(){var C=CryptoJS;var C_lib=C.lib;var WordArray=C_lib.WordArray;var Hasher=C_lib.Hasher;var C_algo=C.algo;var W=[];var SM3=C_algo.SM3=Hasher.extend({_doReset:function(){this._hash=new WordArray.init([0x7380166f,0x4914b2b9,0x172442d7,0xda8a0600,0xa96f30bc,0x163138aa,0xe38dee4d,0xb0fb0e4e])},_doProcessBlock:function(M,offset){var H=this._hash.words;var a=H[0];var b=H[1];var c=H[2];var d=H[3];var e=H[4];for(var i=0;i<80;i++){if(i<16){W[i]=M[offset+i]|0}else{var n=W[i-3]^W[i-8]^W[i-14]^W[i-16];W[i]=(n<<1)|(n>>>31)}var t=((a<<5)|(a>>>27))+e+W[i];if(i<20){t+=((b&c)|(~b&d))+0x5a827999}else if(i<40){t+=(b^c^d)+0x6ed9eba1}else if(i<60){t+=((b&c)|(b&d)|(c&d))-0x70e44324}else{t+=(b^c^d)-0x359d3e2a}e=d;d=c;c=(b<<30)|(b>>>2);b=a;a=t}H[0]=(H[0]+a)|0;H[1]=(H[1]+b)|0;H[2]=(H[2]+c)|0;H[3]=(H[3]+d)|0;H[4]=(H[4]+e)|0},_doFinalize:function(){var data=this._data;var dataWords=data.words;var nBitsTotal=this._nDataBytes*8;var nBitsLeft=data.sigBytes*8;dataWords[nBitsLeft>>>5]|=0x80<<(24-nBitsLeft%32);dataWords[(((nBitsLeft+64)>>>9)<<4)+14]=Math.floor(nBitsTotal/0x100000000);dataWords[(((nBitsLeft+64)>>>9)<<4)+15]=nBitsTotal;data.sigBytes=dataWords.length*4;this._process();return this._hash},clone:function(){var clone=Hasher.clone.call(this);clone._hash=this._hash.clone();return clone}});C.SM3=Hasher._createHelper(SM3);C.HmacSM3=Hasher._createHmacHelper(SM3)}());function SM3Digest(){this.BYTE_LENGTH=64;this.xBuf=new Array();this.xBufOff=0;this.byteCount=0;this.DIGEST_LENGTH=32;this.v0=[0x7380166f,0x4914b2b9,0x172442d7,0xda8a0600,0xa96f30bc,0x163138aa,0xe38dee4d,0xb0fb0e4e];this.v0=[0x7380166f,0x4914b2b9,0x172442d7,-628488704,-1452330820,0x163138aa,-477237683,-1325724082];this.v=new Array(8);this.v_=new Array(8);this.X0=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];this.X=new Array(68);this.xOff=0;this.T_00_15=0x79cc4519;this.T_16_63=0x7a879d8a;if(arguments.length>0){this.InitDigest(arguments[0])}else{this.Init()}}SM3Digest.prototype={Init:function(){this.xBuf=new Array(4);this.Reset()},InitDigest:function(t){this.xBuf=new Array(t.xBuf.length);Array.Copy(t.xBuf,0,this.xBuf,0,t.xBuf.length);this.xBufOff=t.xBufOff;this.byteCount=t.byteCount;Array.Copy(t.X,0,this.X,0,t.X.length);this.xOff=t.xOff;Array.Copy(t.v,0,this.v,0,t.v.length)},GetDigestSize:function(){return this.DIGEST_LENGTH},Reset:function(){this.byteCount=0;this.xBufOff=0;Array.Clear(this.xBuf,0,this.xBuf.length);Array.Copy(this.v0,0,this.v,0,this.v0.length);this.xOff=0;Array.Copy(this.X0,0,this.X,0,this.X0.length)},GetByteLength:function(){return this.BYTE_LENGTH},ProcessBlock:function(){var i;var ww=this.X;var ww_=new Array(64);for(i=16;i<68;i++){ww[i]=this.P1(ww[i-16]^ww[i-9]^(this.ROTATE(ww[i-3],15)))^(this.ROTATE(ww[i-13],7))^ww[i-6]}for(i=0;i<64;i++){ww_[i]=ww[i]^ww[i+4]}var vv=this.v;var vv_=this.v_;Array.Copy(vv,0,vv_,0,this.v0.length);var SS1,SS2,TT1,TT2,aaa;for(i=0;i<16;i++){aaa=this.ROTATE(vv_[0],12);SS1=Int32.parse(Int32.parse(aaa+vv_[4])+this.ROTATE(this.T_00_15,i));SS1=this.ROTATE(SS1,7);SS2=SS1^aaa;TT1=Int32.parse(Int32.parse(this.FF_00_15(vv_[0],vv_[1],vv_[2])+vv_[3])+SS2)+ww_[i];TT2=Int32.parse(Int32.parse(this.GG_00_15(vv_[4],vv_[5],vv_[6])+vv_[7])+SS1)+ww[i];vv_[3]=vv_[2];vv_[2]=this.ROTATE(vv_[1],9);vv_[1]=vv_[0];vv_[0]=TT1;vv_[7]=vv_[6];vv_[6]=this.ROTATE(vv_[5],19);vv_[5]=vv_[4];vv_[4]=this.P0(TT2)}for(i=16;i<64;i++){aaa=this.ROTATE(vv_[0],12);SS1=Int32.parse(Int32.parse(aaa+vv_[4])+this.ROTATE(this.T_16_63,i));SS1=this.ROTATE(SS1,7);SS2=SS1^aaa;TT1=Int32.parse(Int32.parse(this.FF_16_63(vv_[0],vv_[1],vv_[2])+vv_[3])+SS2)+ww_[i];TT2=Int32.parse(Int32.parse(this.GG_16_63(vv_[4],vv_[5],vv_[6])+vv_[7])+SS1)+ww[i];vv_[3]=vv_[2];vv_[2]=this.ROTATE(vv_[1],9);vv_[1]=vv_[0];vv_[0]=TT1;vv_[7]=vv_[6];vv_[6]=this.ROTATE(vv_[5],19);vv_[5]=vv_[4];vv_[4]=this.P0(TT2)}for(i=0;i<8;i++){vv[i]^=Int32.parse(vv_[i])}this.xOff=0;Array.Copy(this.X0,0,this.X,0,this.X0.length)},ProcessWord:function(in_Renamed,inOff){var n=in_Renamed[inOff]<<24;n|=(in_Renamed[++inOff]&0xff)<<16;n|=(in_Renamed[++inOff]&0xff)<<8;n|=(in_Renamed[++inOff]&0xff);this.X[this.xOff]=n;if(++this.xOff==16){this.ProcessBlock()}},ProcessLength:function(bitLength){if(this.xOff>14){this.ProcessBlock()}this.X[14]=(this.URShiftLong(bitLength,32));this.X[15]=(bitLength&(0xffffffff))},IntToBigEndian:function(n,bs,off){bs[off]=Int32.parseByte(this.URShift(n,24));bs[++off]=Int32.parseByte(this.URShift(n,16));bs[++off]=Int32.parseByte(this.URShift(n,8));bs[++off]=Int32.parseByte(n)},DoFinal:function(out_Renamed,outOff){this.Finish();for(var i=0;i<8;i++){this.IntToBigEndian(this.v[i],out_Renamed,outOff+i*4)}this.Reset();return this.DIGEST_LENGTH},Update:function(input){this.xBuf[this.xBufOff++]=input;if(this.xBufOff==this.xBuf.length){this.ProcessWord(this.xBuf,0);this.xBufOff=0}this.byteCount++},BlockUpdate:function(input,inOff,length){while((this.xBufOff!=0)&&(length>0)){this.Update(input[inOff]);inOff++;length--}while(length>this.xBuf.length){this.ProcessWord(input,inOff);inOff+=this.xBuf.length;length-=this.xBuf.length;this.byteCount+=this.xBuf.length}while(length>0){this.Update(input[inOff]);inOff++;length--}},Finish:function(){var bitLength=(this.byteCount<<3);this.Update((128));while(this.xBufOff!=0)this.Update((0));this.ProcessLength(bitLength);this.ProcessBlock()},ROTATE:function(x,n){return(x<<n)|(this.URShift(x,(32-n)))},P0:function(X){return((X)^this.ROTATE((X),9)^this.ROTATE((X),17))},P1:function(X){return((X)^this.ROTATE((X),15)^this.ROTATE((X),23))},FF_00_15:function(X,Y,Z){return(X^Y^Z)},FF_16_63:function(X,Y,Z){return((X&Y)|(X&Z)|(Y&Z))},GG_00_15:function(X,Y,Z){return(X^Y^Z)},GG_16_63:function(X,Y,Z){return((X&Y)|(~X&Z))},URShift:function(number,bits){if(number>Int32.maxValue||number<Int32.minValue){number=Int32.parse(number)}if(number>=0){return number>>bits}else{return(number>>bits)+(2<<~bits)}},URShiftLong:function(number,bits){var returnV;var big=new BigInteger();big.fromInt(number);if(big.signum()>=0){returnV=big.shiftRight(bits).intValue()}else{var bigAdd=new BigInteger();bigAdd.fromInt(2);var shiftLeftBits=~bits;var shiftLeftNumber='';if(shiftLeftBits<0){var shiftRightBits=64+shiftLeftBits;for(var i=0;i<shiftRightBits;i++){shiftLeftNumber+='0'}var shiftLeftNumberBigAdd=new BigInteger();shiftLeftNumberBigAdd.fromInt(number>>bits);var shiftLeftNumberBig=new BigInteger("10"+shiftLeftNumber,2);shiftLeftNumber=shiftLeftNumberBig.toRadix(10);var r=shiftLeftNumberBig.add(shiftLeftNumberBigAdd);returnV=r.toRadix(10)}else{shiftLeftNumber=bigAdd.shiftLeft((~bits)).intValue();returnV=(number>>bits)+shiftLeftNumber}}return returnV},GetZ:function(g,pubKeyHex){var userId=CryptoJS.enc.Utf8.parse("1234567812345678");var len=userId.words.length*4*8;this.Update((len>>8&0x00ff));this.Update((len&0x00ff));var userIdWords=this.GetWords(userId.toString());this.BlockUpdate(userIdWords,0,userIdWords.length);var aWords=this.GetWords(g.curve.a.toBigInteger().toRadix(16));var bWords=this.GetWords(g.curve.b.toBigInteger().toRadix(16));var gxWords=this.GetWords(g.getX().toBigInteger().toRadix(16));var gyWords=this.GetWords(g.getY().toBigInteger().toRadix(16));var pxWords=this.GetWords(pubKeyHex.substr(0,64));var pyWords=this.GetWords(pubKeyHex.substr(64,64));this.BlockUpdate(aWords,0,aWords.length);this.BlockUpdate(bWords,0,bWords.length);this.BlockUpdate(gxWords,0,gxWords.length);this.BlockUpdate(gyWords,0,gyWords.length);this.BlockUpdate(pxWords,0,pxWords.length);this.BlockUpdate(pyWords,0,pyWords.length);var md=new Array(this.GetDigestSize());this.DoFinal(md,0);return md},GetWords:function(hexStr){var words=[];var hexStrLength=hexStr.length;for(var i=0;i<hexStrLength;i+=2){words[words.length]=parseInt(hexStr.substr(i,2),16)}return words},GetHex:function(arr){var words=[];var j=0;for(var i=0;i<arr.length*2;i+=2){words[i>>>3]|=parseInt(arr[j])<<(24-(i%8)*4);j++}var wordArray=new CryptoJS.lib.WordArray.init(words,arr.length);return wordArray}};Array.Clear=function(destinationArray,destinationIndex,length){for(elm in destinationArray){destinationArray[elm]=null}};Array.Copy=function(sourceArray,sourceIndex,destinationArray,destinationIndex,length){var cloneArray=sourceArray.slice(sourceIndex,sourceIndex+length);for(var i=0;i<cloneArray.length;i++){destinationArray[destinationIndex]=cloneArray[i];destinationIndex++}};window.Int32={minValue:-parseInt('10000000000000000000000000000000',2),maxValue:parseInt('1111111111111111111111111111111',2),parse:function(n){if(n<this.minValue){var bigInteger=new Number(-n);var bigIntegerRadix=bigInteger.toString(2);var subBigIntegerRadix=bigIntegerRadix.substr(bigIntegerRadix.length-31,31);var reBigIntegerRadix='';for(var i=0;i<subBigIntegerRadix.length;i++){var subBigIntegerRadixItem=subBigIntegerRadix.substr(i,1);reBigIntegerRadix+=subBigIntegerRadixItem=='0'?'1':'0'}var result=parseInt(reBigIntegerRadix,2);return(result+1)}else if(n>this.maxValue){var bigInteger=Number(n);var bigIntegerRadix=bigInteger.toString(2);var subBigIntegerRadix=bigIntegerRadix.substr(bigIntegerRadix.length-31,31);var reBigIntegerRadix='';for(var i=0;i<subBigIntegerRadix.length;i++){var subBigIntegerRadixItem=subBigIntegerRadix.substr(i,1);reBigIntegerRadix+=subBigIntegerRadixItem=='0'?'1':'0'}var result=parseInt(reBigIntegerRadix,2);return-(result+1)}else{return n}},parseByte:function(n){if(n<0){var bigInteger=new Number(-n);var bigIntegerRadix=bigInteger.toString(2);var subBigIntegerRadix=bigIntegerRadix.substr(bigIntegerRadix.length-8,8);var reBigIntegerRadix='';for(var i=0;i<subBigIntegerRadix.length;i++){var subBigIntegerRadixItem=subBigIntegerRadix.substr(i,1);reBigIntegerRadix+=subBigIntegerRadixItem=='0'?'1':'0'}var result=parseInt(reBigIntegerRadix,2);return(result+1)}else if(n>255){var bigInteger=Number(n);var bigIntegerRadix=bigInteger.toString(2);return parseInt(bigIntegerRadix.substr(bigIntegerRadix.length-8,8),2)}else{return n}}};
/*! sm3-sm2-1.0.js (c) Jonllen Peng | http://www.jonllen.com/
 */
/*
 * sm3-sm2-1.0.js
 * 
 * Copyright (c) 2014 Jonllen Peng (www.jonllen.com)
 */
/**
 * @fileOverview
 * @name sm3-sm2-1.0.js
 * @author Jonllen (www.jonllen.com)
 * @version 1.0.0 (2014-06-18)
 */

if (typeof KJUR == "undefined" || !KJUR) KJUR = {};
if (typeof KJUR.crypto == "undefined" || !KJUR.crypto) KJUR.crypto = {};

/**
 * class for SM2 key generation,  sm3WithSM2 signing and verifcation
 * @name KJUR.crypto.SM3withSM2
 * @class class for SM2 key generation,  SM2 signing and verifcation
 * @description
 * <p>
 * CAUTION: Most of the case, you don't need to use this class except
 * for generating an SM2 key pair. Please use {@link KJUR.crypto.Signature} class instead.
 * </p>
 * <p>
 * This class was originally developped by Stefan Thomas for Bitcoin JavaScript library.
 * Currently this class supports following named curves and their aliases.
 * <ul>
 * <li>secp256r1, NIST P-256, P-256, prime256v1 (*)</li>
 * <li>secp256k1 (*)</li>
 * <li>secp384r1, NIST P-384, P-384 (*)</li>
  * <li>sm2</li>
 * </ul>
 * </p>
 */
KJUR.crypto.SM3withSM2 = function(params) {
    var curveName = "sm2";	// curve name default
    var ecparams = null;
    var prvKeyHex = null;
    var pubKeyHex = null;

    var rng = new SecureRandom();

    var P_OVER_FOUR = null;

    this.type = "SM2";

    function implShamirsTrick(P, k, Q, l) {
	var m = Math.max(k.bitLength(), l.bitLength());
	var Z = P.add2D(Q);
	var R = P.curve.getInfinity();

	for (var i = m - 1; i >= 0; --i) {
	    R = R.twice2D();

	    R.z = BigInteger.ONE;

	    if (k.testBit(i)) {
		if (l.testBit(i)) {
		    R = R.add2D(Z);
		} else {
		    R = R.add2D(P);
		}
	    } else {
		if (l.testBit(i)) {
		    R = R.add2D(Q);
		}
	    }
	}
	
	return R;
    };

    //===========================
    // PUBLIC METHODS
    //===========================
    this.getBigRandom = function (limit) {
	return new BigInteger(limit.bitLength(), rng)
	.mod(limit.subtract(BigInteger.ONE))
	.add(BigInteger.ONE)
	;
    };

    this.setNamedCurve = function(curveName) {
	this.ecparams = KJUR.crypto.ECParameterDB.getByName(curveName);
	this.prvKeyHex = null;
	this.pubKeyHex = null;
	this.curveName = curveName;
    }

    this.setPrivateKeyHex = function(prvKeyHex) {
        this.isPrivate = true;
	this.prvKeyHex = prvKeyHex;
    }

    this.setPublicKeyHex = function(pubKeyHex) {
        this.isPublic = true;
	this.pubKeyHex = pubKeyHex;
    }

    /**
     * generate a EC key pair
     * @name generateKeyPairHex
     * @memberOf KJUR.crypto.ECDSA
     * @function
     * @return {Array} associative array of hexadecimal string of private and public key
     * @since ecdsa-modified 1.0.1
     * @example
     * var ec = KJUR.crypto.ECDSA({'curve': 'sm2'});
     * var keypair = ec.generateKeyPairHex();
     * var pubhex = keypair.ecpubhex; // hexadecimal string of EC private key (=d)
     * var prvhex = keypair.ecprvhex; // hexadecimal string of EC public key
     */
    this.generateKeyPairHex = function() {
	var biN = this.ecparams['n'];
	var biPrv = this.getBigRandom(biN);
	var epPub = this.ecparams['G'].multiply(biPrv);
	var biX = epPub.getX().toBigInteger();
	var biY = epPub.getY().toBigInteger();

	var charlen = this.ecparams['keylen'] / 4;
	var hPrv = ("0000000000" + biPrv.toString(16)).slice(- charlen);
	var hX   = ("0000000000" + biX.toString(16)).slice(- charlen);
	var hY   = ("0000000000" + biY.toString(16)).slice(- charlen);
	var hPub = "04" + hX + hY;

	this.setPrivateKeyHex(hPrv);
	this.setPublicKeyHex(hPub);
	return {'ecprvhex': hPrv, 'ecpubhex': hPub};
    };

    this.signWithMessageHash = function(hashHex) {
	return this.signHex(hashHex, this.prvKeyHex);
    };

    /**
     * signing to message hash
     * @name signHex
     * @memberOf KJUR.crypto.SM3withSM2
     * @function
     * @param {String} hashHex hexadecimal string of hash value of signing message
     * @param {String} privHex hexadecimal string of EC private key
     * @return {String} hexadecimal string of ECDSA signature
     * @since ecdsa-modified 1.0.1
     * @example
     * var ec = KJUR.crypto.SM3withSM2({'curve': 'sm2'});
     * var sigValue = ec.signHex(hash, prvKey);
     */
    this.signHex = function (hashHex, privHex) {
	var d = new BigInteger(privHex, 16);
	var n = this.ecparams['n'];
	var e = new BigInteger(hashHex, 16);
	
	// k BigInteger
    var k = null;
    var kp = null;
    var r = null;
    var s = null;
    var userD = d;
    
    do
    {
        do
        {
			
			var keypair = this.generateKeyPairHex();
			
			k = new BigInteger(keypair.ecprvhex, 16);
			var pubkeyHex = keypair.ecpubhex;
			
  			kp = ECPointFp.decodeFromHex(this.ecparams['curve'], pubkeyHex);

            // r
            r = e.add(kp.getX().toBigInteger());
            r = r.mod(n);
        }
        while (r.equals(BigInteger.ZERO) || r.add(k).equals(n));

        // (1 + dA)~-1
        var da_1 = userD.add(BigInteger.ONE);
        da_1 = da_1.modInverse(n);
        // s
        s = r.multiply(userD);
        s = k.subtract(s).mod(n);
        s = da_1.multiply(s).mod(n);
    }
    while (s.equals(BigInteger.ZERO));
    

	return KJUR.crypto.ECDSA.biRSSigToASN1Sig(r, s);
    };

    this.sign = function (hash, priv) {
	var d = priv;
	var n = this.ecparams['n'];
	var e = BigInteger.fromByteArrayUnsigned(hash);

	do {
	    var k = this.getBigRandom(n);
	    var G = this.ecparams['G'];
	    var Q = G.multiply(k);
	    var r = Q.getX().toBigInteger().mod(n);
	} while (r.compareTo(BigInteger.ZERO) <= 0);

	var s = k.modInverse(n).multiply(e.add(d.multiply(r))).mod(n);
	return this.serializeSig(r, s);
    };

    this.verifyWithMessageHash = function(hashHex, sigHex) {
	return this.verifyHex(hashHex, sigHex, this.pubKeyHex);
    };

    /**
     * verifying signature with message hash and public key
     * @name verifyHex
     * @memberOf KJUR.crypto.SM3withSM2
     * @function
     * @param {String} hashHex hexadecimal string of hash value of signing message
     * @param {String} sigHex hexadecimal string of signature value
     * @param {String} pubkeyHex hexadecimal string of public key
     * @return {Boolean} true if the signature is valid, otherwise false
     * @since ecdsa-modified 1.0.1
     * @example
     * var ec = KJUR.crypto.SM3withSM2({'curve': 'sm2'});
     * var result = ec.verifyHex(msgHashHex, sigHex, pubkeyHex);
     */
    this.verifyHex = function(hashHex, sigHex, pubkeyHex) {
	var r,s;

	var obj = KJUR.crypto.ECDSA.parseSigHex(sigHex);
	r = obj.r;
	s = obj.s;

	var Q;
	Q = ECPointFp.decodeFromHex(this.ecparams['curve'], pubkeyHex);
	var e = new BigInteger(hashHex, 16);

	return this.verifyRaw(e, r, s, Q);
    };

    this.verify = function (hash, sig, pubkey) {
	var r,s;
	if (Bitcoin.Util.isArray(sig)) {
	    var obj = this.parseSig(sig);
	    r = obj.r;
	    s = obj.s;
	} else if ("object" === typeof sig && sig.r && sig.s) {
	    r = sig.r;
	    s = sig.s;
	} else {
	    throw "Invalid value for signature";
	}

	var Q;
	if (pubkey instanceof ECPointFp) {
	    Q = pubkey;
	} else if (Bitcoin.Util.isArray(pubkey)) {
	    Q = ECPointFp.decodeFrom(this.ecparams['curve'], pubkey);
	} else {
	    throw "Invalid format for pubkey value, must be byte array or ECPointFp";
	}
	var e = BigInteger.fromByteArrayUnsigned(hash);

	return this.verifyRaw(e, r, s, Q);
    };

    this.verifyRaw = function (e, r, s, Q) {
	var n = this.ecparams['n'];
	var G = this.ecparams['G'];
	
	var t = r.add(s).mod(n);
    if (t.equals(BigInteger.ZERO))
        return false;
        
    var x1y1 = G.multiply(s);
    x1y1 = x1y1.add(Q.multiply(t));

    var R = e.add(x1y1.getX().toBigInteger()).mod(n);
    return r.equals(R);
    };

    /**
     * Serialize a signature into DER format.
     *
     * Takes two BigIntegers representing r and s and returns a byte array.
     */
    this.serializeSig = function (r, s) {
	var rBa = r.toByteArraySigned();
	var sBa = s.toByteArraySigned();

	var sequence = [];
	sequence.push(0x02); // INTEGER
	sequence.push(rBa.length);
	sequence = sequence.concat(rBa);

	sequence.push(0x02); // INTEGER
	sequence.push(sBa.length);
	sequence = sequence.concat(sBa);

	sequence.unshift(sequence.length);
	sequence.unshift(0x30); // SEQUENCE
	return sequence;
    };

    /**
     * Parses a byte array containing a DER-encoded signature.
     *
     * This function will return an object of the form:
     *
     * {
     *   r: BigInteger,
     *   s: BigInteger
     * }
     */
    this.parseSig = function (sig) {
	var cursor;
	if (sig[0] != 0x30)
	    throw new Error("Signature not a valid DERSequence");

	cursor = 2;
	if (sig[cursor] != 0x02)
	    throw new Error("First element in signature must be a DERInteger");;
	var rBa = sig.slice(cursor+2, cursor+2+sig[cursor+1]);

	cursor += 2+sig[cursor+1];
	if (sig[cursor] != 0x02)
	    throw new Error("Second element in signature must be a DERInteger");
	var sBa = sig.slice(cursor+2, cursor+2+sig[cursor+1]);

	cursor += 2+sig[cursor+1];

	//if (cursor != sig.length)
	//  throw new Error("Extra bytes in signature");

	var r = BigInteger.fromByteArrayUnsigned(rBa);
	var s = BigInteger.fromByteArrayUnsigned(sBa);

	return {r: r, s: s};
    };

    this.parseSigCompact = function (sig) {
	if (sig.length !== 65) {
	    throw "Signature has the wrong length";
	}

	// Signature is prefixed with a type byte storing three bits of
	// information.
	var i = sig[0] - 27;
	if (i < 0 || i > 7) {
	    throw "Invalid signature type";
	}

	var n = this.ecparams['n'];
	var r = BigInteger.fromByteArrayUnsigned(sig.slice(1, 33)).mod(n);
	var s = BigInteger.fromByteArrayUnsigned(sig.slice(33, 65)).mod(n);

	return {r: r, s: s, i: i};
    };

    if (params !== undefined) {
	if (params['curve'] !== undefined) {
	    this.curveName = params['curve'];
	}
    }
    if (this.curveName === undefined) this.curveName = curveName;
    this.setNamedCurve(this.curveName);
    if (params !== undefined) {
	if (params['prv'] !== undefined) this.setPrivateKeyHex(params['prv']);
	if (params['pub'] !== undefined) this.setPublicKeyHex(params['pub']);
    }
};

/*! ecparam-1.0.0.js (c) 2013 Kenji Urushima | kjur.github.com/jsrsasign/license
 */
/*
 * ecparam.js - Elliptic Curve Cryptography Curve Parameter Definition class
 *
 * Copyright (c) 2013 Kenji Urushima (kenji.urushima@gmail.com)
 *
 * This software is licensed under the terms of the MIT License.
 * http://kjur.github.com/jsrsasign/license
 *
 * The above copyright and license notice shall be 
 * included in all copies or substantial portions of the Software.
 */

/**
 * @fileOverview
 * @name ecparam-1.1.js
 * @author Kenji Urushima kenji.urushima@gmail.com
 * @version 1.0.0 (2013-Jul-17)
 * @since jsrsasign 4.0
 * @license <a href="http://kjur.github.io/jsrsasign/license/">MIT License</a>
 */

if (typeof KJUR == "undefined" || !KJUR) KJUR = {};
if (typeof KJUR.crypto == "undefined" || !KJUR.crypto) KJUR.crypto = {};

/**
 * static object for elliptic curve names and parameters
 * @name KJUR.crypto.ECParameterDB
 * @class static object for elliptic curve names and parameters
 * @description
 * This class provides parameters for named elliptic curves.
 * Currently it supoprts following curve names and aliases however 
 * the name marked (*) are available for {@link KJUR.crypto.ECDSA} and
 * {@link KJUR.crypto.Signature} classes.
 * <ul>
 * <li>secp128r1</li>
 * <li>secp160r1</li>
 * <li>secp160k1</li>
 * <li>secp192r1</li>
 * <li>secp192k1</li>
 * <li>secp224r1</li>
 * <li>secp256r1, NIST P-256, P-256, prime256v1 (*)</li>
 * <li>secp256k1 (*)</li>
 * <li>secp384r1, NIST P-384, P-384 (*)</li>
 * <li>secp521r1, NIST P-521, P-521</li>
 * </ul>
 * You can register new curves by using 'register' method.
 */
KJUR.crypto.ECParameterDB = new function() {
    var db = {};
    var aliasDB = {};

    function hex2bi(hex) {
        return new BigInteger(hex, 16);
    }
    
    /**
     * get curve inforamtion associative array for curve name or alias
     * @name getByName
     * @memberOf KJUR.crypto.ECParameterDB
     * @function
     * @param {String} nameOrAlias curve name or alias name
     * @return {Array} associative array of curve parameters
     * @example
     * var param = KJUR.crypto.ECParameterDB.getByName('prime256v1');
     * var keylen = param['keylen'];
     * var n = param['n'];
     */
    this.getByName = function(nameOrAlias) {
	var name = nameOrAlias;
	if (typeof aliasDB[name] != "undefined") {
	    name = aliasDB[nameOrAlias];
        }
	if (typeof db[name] != "undefined") {
	    return db[name];
	}
	throw "unregistered EC curve name: " + name;
    };

    /**
     * register new curve
     * @name regist
     * @memberOf KJUR.crypto.ECParameterDB
     * @function
     * @param {String} name name of curve
     * @param {Integer} keylen key length
     * @param {String} pHex hexadecimal value of p
     * @param {String} aHex hexadecimal value of a
     * @param {String} bHex hexadecimal value of b
     * @param {String} nHex hexadecimal value of n
     * @param {String} hHex hexadecimal value of h
     * @param {String} gxHex hexadecimal value of Gx
     * @param {String} gyHex hexadecimal value of Gy
     * @param {Array} aliasList array of string for curve names aliases
     * @param {String} oid Object Identifier for the curve
     * @param {String} info information string for the curve
     */
    this.regist = function(name, keylen, pHex, aHex, bHex, nHex, hHex, gxHex, gyHex, aliasList, oid, info) {
        db[name] = {};
	var p = hex2bi(pHex);
	var a = hex2bi(aHex);
	var b = hex2bi(bHex);
	var n = hex2bi(nHex);
	var h = hex2bi(hHex);
        var curve = new ECCurveFp(p, a, b);
        var G = curve.decodePointHex("04" + gxHex + gyHex);
	db[name]['name'] = name;
	db[name]['keylen'] = keylen;
        db[name]['curve'] = curve;
        db[name]['G'] = G;
        db[name]['n'] = n;
        db[name]['h'] = h;
        db[name]['oid'] = oid;
        db[name]['info'] = info;

        for (var i = 0; i < aliasList.length; i++) {
	    aliasDB[aliasList[i]] = name;
        }
    };
};

KJUR.crypto.ECParameterDB.regist(
  "secp128r1", // name / p = 2^128 - 2^97 - 1
  128,
  "FFFFFFFDFFFFFFFFFFFFFFFFFFFFFFFF", // p
  "FFFFFFFDFFFFFFFFFFFFFFFFFFFFFFFC", // a
  "E87579C11079F43DD824993C2CEE5ED3", // b
  "FFFFFFFE0000000075A30D1B9038A115", // n
  "1", // h
  "161FF7528B899B2D0C28607CA52C5B86", // gx
  "CF5AC8395BAFEB13C02DA292DDED7A83", // gy
  [], // alias
  "", // oid (underconstruction)
  "secp128r1 : SECG curve over a 128 bit prime field"); // info

KJUR.crypto.ECParameterDB.regist(
  "secp160k1", // name / p = 2^160 - 2^32 - 2^14 - 2^12 - 2^9 - 2^8 - 2^7 - 2^3 - 2^2 - 1
  160,
  "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFAC73", // p
  "0", // a
  "7", // b
  "0100000000000000000001B8FA16DFAB9ACA16B6B3", // n
  "1", // h
  "3B4C382CE37AA192A4019E763036F4F5DD4D7EBB", // gx
  "938CF935318FDCED6BC28286531733C3F03C4FEE", // gy
  [], // alias
  "", // oid
  "secp160k1 : SECG curve over a 160 bit prime field"); // info

KJUR.crypto.ECParameterDB.regist(
  "secp160r1", // name / p = 2^160 - 2^31 - 1
  160,
  "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF7FFFFFFF", // p
  "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF7FFFFFFC", // a
  "1C97BEFC54BD7A8B65ACF89F81D4D4ADC565FA45", // b
  "0100000000000000000001F4C8F927AED3CA752257", // n
  "1", // h
  "4A96B5688EF573284664698968C38BB913CBFC82", // gx
  "23A628553168947D59DCC912042351377AC5FB32", // gy
  [], // alias
  "", // oid
  "secp160r1 : SECG curve over a 160 bit prime field"); // info

KJUR.crypto.ECParameterDB.regist(
  "secp192k1", // name / p = 2^192 - 2^32 - 2^12 - 2^8 - 2^7 - 2^6 - 2^3 - 1
  192,
  "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFEE37", // p
  "0", // a
  "3", // b
  "FFFFFFFFFFFFFFFFFFFFFFFE26F2FC170F69466A74DEFD8D", // n
  "1", // h
  "DB4FF10EC057E9AE26B07D0280B7F4341DA5D1B1EAE06C7D", // gx
  "9B2F2F6D9C5628A7844163D015BE86344082AA88D95E2F9D", // gy
  []); // alias

KJUR.crypto.ECParameterDB.regist(
  "secp192r1", // name / p = 2^192 - 2^64 - 1
  192,
  "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFF", // p
  "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFC", // a
  "64210519E59C80E70FA7E9AB72243049FEB8DEECC146B9B1", // b
  "FFFFFFFFFFFFFFFFFFFFFFFF99DEF836146BC9B1B4D22831", // n
  "1", // h
  "188DA80EB03090F67CBF20EB43A18800F4FF0AFD82FF1012", // gx
  "07192B95FFC8DA78631011ED6B24CDD573F977A11E794811", // gy
  []); // alias

KJUR.crypto.ECParameterDB.regist(
  "secp224r1", // name / p = 2^224 - 2^96 + 1
  224,
  "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF000000000000000000000001", // p
  "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFE", // a
  "B4050A850C04B3ABF54132565044B0B7D7BFD8BA270B39432355FFB4", // b
  "FFFFFFFFFFFFFFFFFFFFFFFFFFFF16A2E0B8F03E13DD29455C5C2A3D", // n
  "1", // h
  "B70E0CBD6BB4BF7F321390B94A03C1D356C21122343280D6115C1D21", // gx
  "BD376388B5F723FB4C22DFE6CD4375A05A07476444D5819985007E34", // gy
  []); // alias

KJUR.crypto.ECParameterDB.regist(
  "secp256k1", // name / p = 2^256 - 2^32 - 2^9 - 2^8 - 2^7 - 2^6 - 2^4 - 1
  256,
  "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F", // p
  "0", // a
  "7", // b
  "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141", // n
  "1", // h
  "79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798", // gx
  "483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8", // gy
  []); // alias

KJUR.crypto.ECParameterDB.regist(
  "secp256r1", // name / p = 2^224 (2^32 - 1) + 2^192 + 2^96 - 1
  256,
  "FFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFF", // p
  "FFFFFFFF00000001000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFC", // a
  "5AC635D8AA3A93E7B3EBBD55769886BC651D06B0CC53B0F63BCE3C3E27D2604B", // b
  "FFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551", // n
  "1", // h
  "6B17D1F2E12C4247F8BCE6E563A440F277037D812DEB33A0F4A13945D898C296", // gx
  "4FE342E2FE1A7F9B8EE7EB4A7C0F9E162BCE33576B315ECECBB6406837BF51F5", // gy
  ["NIST P-256", "P-256", "prime256v1"]); // alias

KJUR.crypto.ECParameterDB.regist(
  "secp384r1", // name
  384,
  "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFF0000000000000000FFFFFFFF", // p
  "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFFFF0000000000000000FFFFFFFC", // a
  "B3312FA7E23EE7E4988E056BE3F82D19181D9C6EFE8141120314088F5013875AC656398D8A2ED19D2A85C8EDD3EC2AEF", // b
  "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC7634D81F4372DDF581A0DB248B0A77AECEC196ACCC52973", // n
  "1", // h
  "AA87CA22BE8B05378EB1C71EF320AD746E1D3B628BA79B9859F741E082542A385502F25DBF55296C3A545E3872760AB7", // gx
  "3617de4a96262c6f5d9e98bf9292dc29f8f41dbd289a147ce9da3113b5f0b8c00a60b1ce1d7e819d7a431d7c90ea0e5f", // gy
  ["NIST P-384", "P-384"]); // alias

KJUR.crypto.ECParameterDB.regist(
  "secp521r1", // name
  521,
  "1FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", // p
  "1FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC", // a
  "051953EB9618E1C9A1F929A21A0B68540EEA2DA725B99B315F3B8B489918EF109E156193951EC7E937B1652C0BD3BB1BF073573DF883D2C34F1EF451FD46B503F00", // b
  "1FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFA51868783BF2F966B7FCC0148F709A5D03BB5C9B8899C47AEBB6FB71E91386409", // n
  "1", // h
  "C6858E06B70404E9CD9E3ECB662395B4429C648139053FB521F828AF606B4D3DBAA14B5E77EFE75928FE1DC127A2FFA8DE3348B3C1856A429BF97E7E31C2E5BD66", // gx
  "011839296a789a3bc0045c8a5fb42c7d1bd998f54449579b446817afbd17273e662c97ee72995ef42640c550b9013fad0761353c7086a272c24088be94769fd16650", // gy
  ["NIST P-521", "P-521"]); // alias

KJUR.crypto.ECParameterDB.regist(
  "sm2", // name
  256,
  "FFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000FFFFFFFFFFFFFFFF", // p
  "FFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000FFFFFFFFFFFFFFFC", // a
  "28E9FA9E9D9F5E344D5A9E4BCF6509A7F39789F515AB8F92DDBCBD414D940E93", // b
  "FFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFF7203DF6B21C6052B53BBF40939D54123", // n
  "1", // h
  "32C4AE2C1F1981195F9904466A39C9948FE30BBFF2660BE1715A4589334C74C7", // gx
  "BC3736A2F4F6779C59BDCEE36B692153D0A9877CC62A474002DF32E52139F0A0", // gy
  ["sm2", "SM2"]); // alias
